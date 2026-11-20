/**
 * Admin Alert System
 * 
 * Monitors for fraud patterns and sends alerts:
 * - Spike in payment failures
 * - Spike in chargebacks/disputes
 * - High risk score frequency
 * - Velocity violations
 * - Suspicious patterns
 */

import { prisma } from '@/lib/db/prisma'
import { getRateLimitStore } from '@/lib/rate-limit/store'

export interface AlertConfig {
  /**
   * Alert type
   */
  type: 'FAILURE_SPIKE' | 'CHARGEBACK_SPIKE' | 'HIGH_RISK_SPIKE' | 'VELOCITY_VIOLATION' | 'SUSPICIOUS_PATTERN'

  /**
   * Threshold to trigger alert
   */
  threshold: number

  /**
   * Time window in seconds
   */
  windowSeconds: number

  /**
   * Alert severity
   */
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

  /**
   * Notification channels
   */
  channels: ('email' | 'slack' | 'sms')[]
}

export interface Alert {
  id: string
  type: string
  severity: string
  message: string
  count: number
  threshold: number
  triggeredAt: Date
  metadata: any
}

/**
 * Default alert configurations
 */
const DEFAULT_ALERTS: AlertConfig[] = [
  // Payment failure spike
  {
    type: 'FAILURE_SPIKE',
    threshold: 10, // 10 failures in 10 minutes
    windowSeconds: 600,
    severity: 'HIGH',
    channels: ['email', 'slack'],
  },

  // Chargeback spike
  {
    type: 'CHARGEBACK_SPIKE',
    threshold: 3, // 3 chargebacks in 24 hours
    windowSeconds: 86400,
    severity: 'CRITICAL',
    channels: ['email', 'slack', 'sms'],
  },

  // High risk score frequency
  {
    type: 'HIGH_RISK_SPIKE',
    threshold: 5, // 5 high-risk scores in 1 hour
    windowSeconds: 3600,
    severity: 'HIGH',
    channels: ['email', 'slack'],
  },

  // Velocity violations
  {
    type: 'VELOCITY_VIOLATION',
    threshold: 3, // 3 violations in 1 hour
    windowSeconds: 3600,
    severity: 'MEDIUM',
    channels: ['email'],
  },
]

/**
 * Check all alert conditions
 * 
 * Run this periodically (e.g., every 5 minutes via cron).
 */
export async function checkAlerts(): Promise<Alert[]> {
  const triggeredAlerts: Alert[] = []

  for (const config of DEFAULT_ALERTS) {
    const alert = await checkAlert(config)
    if (alert) {
      triggeredAlerts.push(alert)
      await recordAlert(alert)
      await sendAlert(alert, config.channels)
    }
  }

  return triggeredAlerts
}

/**
 * Check a single alert condition
 */
async function checkAlert(config: AlertConfig): Promise<Alert | null> {
  const startTime = new Date(Date.now() - config.windowSeconds * 1000)

  let count = 0
  let metadata: any = {}

  switch (config.type) {
    case 'FAILURE_SPIKE':
      count = await prisma.contribution.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: startTime },
        },
      })
      break

    case 'CHARGEBACK_SPIKE':
      count = await prisma.contribution.count({
        where: {
          status: 'DISPUTED',
          createdAt: { gte: startTime },
        },
      })
      break

    case 'HIGH_RISK_SPIKE':
      count = await prisma.fraudEvent.count({
        where: {
          eventType: 'RISK_SCORE_CALCULATED',
          severity: 'HIGH',
          createdAt: { gte: startTime },
        },
      })
      break

    case 'VELOCITY_VIOLATION':
      count = await prisma.fraudEvent.count({
        where: {
          eventType: 'VELOCITY_VIOLATION',
          createdAt: { gte: startTime },
        },
      })

      // Get top IPs with violations
      const violations = await prisma.fraudEvent.findMany({
        where: {
          eventType: 'VELOCITY_VIOLATION',
          createdAt: { gte: startTime },
        },
        select: {
          metadata: true,
        },
        take: 10,
      })

      const ipCounts = new Map<string, number>()
      violations.forEach(v => {
        const ip = (v.metadata as any)?.ipAddress
        if (ip) {
          ipCounts.set(ip, (ipCounts.get(ip) ?? 0) + 1)
        }
      })

      metadata.topIps = Array.from(ipCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ip, count]) => ({ ip, count }))

      break
  }

  // Check if threshold exceeded
  if (count >= config.threshold) {
    // Check if alert already sent recently (cooldown)
    const cooldownSeconds = config.windowSeconds
    const recentAlert = await wasAlertSentRecently(config.type, cooldownSeconds)
    
    if (!recentAlert) {
      return {
        id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: config.type,
        severity: config.severity,
        message: getAlertMessage(config.type, count, config.threshold, config.windowSeconds),
        count,
        threshold: config.threshold,
        triggeredAt: new Date(),
        metadata,
      }
    }
  }

  return null
}

/**
 * Get human-readable alert message
 */
function getAlertMessage(
  type: string,
  count: number,
  threshold: number,
  windowSeconds: number
): string {
  const windowMinutes = Math.floor(windowSeconds / 60)
  const windowHours = Math.floor(windowSeconds / 3600)

  const timeWindow = 
    windowSeconds < 3600 
      ? `${windowMinutes} minutes`
      : `${windowHours} hours`

  switch (type) {
    case 'FAILURE_SPIKE':
      return `⚠️ ALERT: ${count} payment failures in ${timeWindow} (threshold: ${threshold})`

    case 'CHARGEBACK_SPIKE':
      return `🚨 CRITICAL: ${count} chargebacks in ${timeWindow} (threshold: ${threshold})`

    case 'HIGH_RISK_SPIKE':
      return `⚠️ ALERT: ${count} high-risk donations in ${timeWindow} (threshold: ${threshold})`

    case 'VELOCITY_VIOLATION':
      return `⚠️ ALERT: ${count} velocity violations in ${timeWindow} (threshold: ${threshold})`

    default:
      return `⚠️ ALERT: ${type} triggered (${count}/${threshold} in ${timeWindow})`
  }
}

/**
 * Check if alert was sent recently (cooldown)
 */
async function wasAlertSentRecently(
  type: string,
  cooldownSeconds: number
): Promise<boolean> {
  const store = getRateLimitStore()
  const key = `alert:cooldown:${type}`
  return await store.exists(key)
}

/**
 * Record alert in database
 */
async function recordAlert(alert: Alert): Promise<void> {
  await prisma.fraudEvent.create({
    data: {
      eventType: 'ALERT_TRIGGERED',
      severity: alert.severity as any,
      metadata: {
        alertType: alert.type,
        count: alert.count,
        threshold: alert.threshold,
        message: alert.message,
        ...alert.metadata,
      },
    },
  })

  // Set cooldown
  const store = getRateLimitStore()
  await store.set(`alert:cooldown:${alert.type}`, '1', 3600) // 1 hour cooldown
}

/**
 * Send alert via configured channels
 */
async function sendAlert(alert: Alert, channels: string[]): Promise<void> {
  console.warn(`[FRAUD ALERT] ${alert.message}`)

  // Email
  if (channels.includes('email')) {
    await sendEmailAlert(alert)
  }

  // Slack
  if (channels.includes('slack')) {
    await sendSlackAlert(alert)
  }

  // SMS
  if (channels.includes('sms')) {
    await sendSmsAlert(alert)
  }
}

/**
 * Send email alert
 */
async function sendEmailAlert(alert: Alert): Promise<void> {
  const adminEmails = (process.env.ADMIN_ALERT_EMAILS || '').split(',').filter(Boolean)

  if (adminEmails.length === 0) {
    console.warn('[Alerts] No admin emails configured')
    return
  }

  // TODO: Implement email sending
  console.log(`[Alerts] Would send email to ${adminEmails.join(', ')}:`, alert.message)
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(alert: Alert): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('[Alerts] Slack webhook URL not configured')
    return
  }

  try {
    const color = 
      alert.severity === 'CRITICAL' ? '#ff0000' :
      alert.severity === 'HIGH' ? '#ff9900' :
      alert.severity === 'MEDIUM' ? '#ffcc00' :
      '#00ff00'

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: `Fraud Alert: ${alert.type}`,
          text: alert.message,
          fields: [
            { title: 'Count', value: alert.count.toString(), short: true },
            { title: 'Threshold', value: alert.threshold.toString(), short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Triggered At', value: alert.triggeredAt.toISOString(), short: true },
          ],
          footer: 'Diaspora4Bellefleur Fraud Detection',
          ts: Math.floor(alert.triggeredAt.getTime() / 1000),
        }],
      }),
    })

    console.log('[Alerts] Slack alert sent')
  } catch (error: any) {
    console.error('[Alerts] Failed to send Slack alert:', error)
  }
}

/**
 * Send SMS alert
 */
async function sendSmsAlert(alert: Alert): Promise<void> {
  const adminPhones = (process.env.ADMIN_ALERT_PHONES || '').split(',').filter(Boolean)

  if (adminPhones.length === 0) {
    console.warn('[Alerts] No admin phone numbers configured')
    return
  }

  // TODO: Implement SMS sending (Twilio, etc.)
  console.log(`[Alerts] Would send SMS to ${adminPhones.join(', ')}:`, alert.message)
}

/**
 * Get recent alerts for dashboard
 */
export async function getRecentAlerts(limit = 10): Promise<Alert[]> {
  const events = await prisma.fraudEvent.findMany({
    where: {
      eventType: 'ALERT_TRIGGERED',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return events.map(e => ({
    id: e.id,
    type: (e.metadata as any).alertType,
    severity: e.severity,
    message: (e.metadata as any).message,
    count: (e.metadata as any).count,
    threshold: (e.metadata as any).threshold,
    triggeredAt: e.createdAt,
    metadata: e.metadata,
  }))
}

/**
 * Get alert statistics
 */
export async function getAlertStats(days = 7): Promise<{
  total: number
  bySeverity: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number }
  byType: Record<string, number>
}> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const events = await prisma.fraudEvent.findMany({
    where: {
      eventType: 'ALERT_TRIGGERED',
      createdAt: { gte: startDate },
    },
  })

  const bySeverity = {
    LOW: events.filter(e => e.severity === 'LOW').length,
    MEDIUM: events.filter(e => e.severity === 'MEDIUM').length,
    HIGH: events.filter(e => e.severity === 'HIGH').length,
    CRITICAL: events.filter(e => e.severity === 'CRITICAL').length,
  }

  const byType: Record<string, number> = {}
  events.forEach(e => {
    const type = (e.metadata as any).alertType
    byType[type] = (byType[type] ?? 0) + 1
  })

  return {
    total: events.length,
    bySeverity,
    byType,
  }
}
