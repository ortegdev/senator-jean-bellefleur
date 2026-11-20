/**
 * Safety Controls
 * 
 * Global kill switch, per-channel pause, auto-pause on high bounce/complaint rates
 * Volume and cost alarms, legal hold support
 */

import { prisma } from '@/lib/db/prisma'
import type { CommunicationChannel, AlertSeverity } from '@prisma/client'

export interface SafetyStatus {
  globalKillSwitch: boolean
  channelPauses: Record<CommunicationChannel, boolean>
  alerts: Array<{
    type: string
    severity: AlertSeverity
    message: string
  }>
}

/**
 * Check if sending is allowed globally
 */
export async function isSendingAllowed(): Promise<{
  allowed: boolean
  reason?: string
}> {
  // Check global kill switch (in LaunchGate)
  const launchGate = await prisma.launchGate.findFirst()
  
  if (launchGate?.killSwitchActive) {
    return {
      allowed: false,
      reason: 'Global kill switch is active',
    }
  }
  
  return { allowed: true }
}

/**
 * Check if sending is allowed for specific channel
 */
export async function isChannelAllowed(
  channel: CommunicationChannel
): Promise<{
  allowed: boolean
  reason?: string
}> {
  // Check global first
  const globalCheck = await isSendingAllowed()
  if (!globalCheck.allowed) {
    return globalCheck
  }
  
  // Check channel pause
  const channelPause = await prisma.channelPause.findUnique({
    where: { channel },
  })
  
  if (channelPause?.paused) {
    return {
      allowed: false,
      reason: channelPause.pauseReason || 'Channel is paused',
    }
  }
  
  // Check channel config
  const channelConfig = await prisma.channelConfig.findUnique({
    where: { channel },
  })
  
  if (!channelConfig?.enabled) {
    return {
      allowed: false,
      reason: 'Channel is not enabled',
    }
  }
  
  return { allowed: true }
}

/**
 * Activate global kill switch
 */
export async function activateKillSwitch(
  reason: string,
  activatedBy: string
): Promise<void> {
  await prisma.launchGate.updateMany({
    data: {
      killSwitchActive: true,
      killSwitchReason: reason,
      killSwitchBy: activatedBy,
      killSwitchAt: new Date(),
    },
  })
  
  // Create critical alert
  await createAlert({
    alertType: 'CHANNEL_DOWN',
    severity: 'CRITICAL',
    message: `Global kill switch activated: ${reason}`,
  })
  
  console.error('[SafetyControls] KILL SWITCH ACTIVATED:', reason, 'by', activatedBy)
}

/**
 * Deactivate global kill switch
 */
export async function deactivateKillSwitch(
  deactivatedBy: string
): Promise<void> {
  await prisma.launchGate.updateMany({
    data: {
      killSwitchActive: false,
      killSwitchReason: null,
    },
  })
  
  console.log('[SafetyControls] Kill switch deactivated by:', deactivatedBy)
}

/**
 * Pause a specific channel
 */
export async function pauseChannel(
  channel: CommunicationChannel,
  reason: string,
  pausedBy: string
): Promise<void> {
  await prisma.channelPause.upsert({
    where: { channel },
    create: {
      channel,
      paused: true,
      pausedBy,
      pausedAt: new Date(),
      pauseReason: reason,
    },
    update: {
      paused: true,
      pausedBy,
      pausedAt: new Date(),
      pauseReason: reason,
    },
  })
  
  // Create warning alert
  await createAlert({
    alertType: 'CHANNEL_DOWN',
    severity: 'WARNING',
    channel,
    message: `Channel ${channel} paused: ${reason}`,
  })
  
  console.warn('[SafetyControls] Channel paused:', channel, reason)
}

/**
 * Resume a paused channel
 */
export async function resumeChannel(
  channel: CommunicationChannel,
  resumedBy: string
): Promise<void> {
  await prisma.channelPause.update({
    where: { channel },
    data: {
      paused: false,
      pauseReason: null,
    },
  })
  
  console.log('[SafetyControls] Channel resumed:', channel, 'by', resumedBy)
}

/**
 * Check bounce rate and auto-pause if threshold exceeded
 * 
 * Default threshold: 5% bounce rate over 24 hours
 */
export async function checkBounceRate(
  channel: CommunicationChannel
): Promise<void> {
  const threshold = 0.05 // 5%
  const windowHours = 24
  
  const windowStart = new Date()
  windowStart.setHours(windowStart.getHours() - windowHours)
  
  // Count sends and bounces in window
  const [totalSends, totalBounces] = await Promise.all([
    prisma.messageSendRecord.count({
      where: {
        channel,
        queuedAt: { gte: windowStart },
        status: { in: ['SENT', 'DELIVERED', 'BOUNCED'] },
      },
    }),
    prisma.messageSendRecord.count({
      where: {
        channel,
        queuedAt: { gte: windowStart },
        status: 'BOUNCED',
      },
    }),
  ])
  
  if (totalSends === 0) {
    return // No data
  }
  
  const bounceRate = totalBounces / totalSends
  
  if (bounceRate > threshold) {
    // Auto-pause channel
    await pauseChannel(
      channel,
      `Auto-paused: bounce rate ${(bounceRate * 100).toFixed(2)}% exceeds threshold ${(threshold * 100)}%`,
      'SYSTEM'
    )
    
    await prisma.channelPause.update({
      where: { channel },
      data: {
        autoPausedByBounceRate: true,
      },
    })
    
    // Create critical alert
    await createAlert({
      alertType: 'BOUNCE_RATE_SPIKE',
      severity: 'CRITICAL',
      channel,
      metric: 'bounce_rate',
      currentValue: bounceRate.toString(),
      threshold: threshold.toString(),
      message: `Channel ${channel} auto-paused due to high bounce rate: ${(bounceRate * 100).toFixed(2)}%`,
    })
  }
}

/**
 * Check complaint rate and auto-pause if threshold exceeded
 * 
 * Default threshold: 0.1% complaint rate over 24 hours
 */
export async function checkComplaintRate(
  channel: CommunicationChannel
): Promise<void> {
  const threshold = 0.001 // 0.1%
  const windowHours = 24
  
  const windowStart = new Date()
  windowStart.setHours(windowStart.getHours() - windowHours)
  
  // Count sends and complaints in window
  const [totalSends, totalComplaints] = await Promise.all([
    prisma.messageSendRecord.count({
      where: {
        channel,
        queuedAt: { gte: windowStart },
        status: { in: ['SENT', 'DELIVERED', 'COMPLAINED'] },
      },
    }),
    prisma.messageSendRecord.count({
      where: {
        channel,
        queuedAt: { gte: windowStart },
        status: 'COMPLAINED',
      },
    }),
  ])
  
  if (totalSends === 0) {
    return // No data
  }
  
  const complaintRate = totalComplaints / totalSends
  
  if (complaintRate > threshold) {
    // Auto-pause channel
    await pauseChannel(
      channel,
      `Auto-paused: complaint rate ${(complaintRate * 100).toFixed(3)}% exceeds threshold ${(threshold * 100).toFixed(1)}%`,
      'SYSTEM'
    )
    
    await prisma.channelPause.update({
      where: { channel },
      data: {
        autoPausedByComplaintRate: true,
      },
    })
    
    // Create critical alert
    await createAlert({
      alertType: 'COMPLAINT_RATE_SPIKE',
      severity: 'CRITICAL',
      channel,
      metric: 'complaint_rate',
      currentValue: complaintRate.toString(),
      threshold: threshold.toString(),
      message: `Channel ${channel} auto-paused due to high complaint rate: ${(complaintRate * 100).toFixed(3)}%`,
    })
  }
}

/**
 * Create alert
 */
export async function createAlert(data: {
  alertType: any
  severity: AlertSeverity
  channel?: CommunicationChannel
  messageId?: string
  metric?: string
  currentValue?: string
  threshold?: string
  message?: string
}): Promise<void> {
  await prisma.alert.create({
    data: {
      alertType: data.alertType,
      severity: data.severity,
      channel: data.channel,
      messageId: data.messageId,
      metric: data.metric,
      currentValue: data.currentValue,
      threshold: data.threshold,
    },
  })
  
  // TODO: Send alert notification (email, Slack, PagerDuty, etc.)
  console.log('[SafetyControls] Alert created:', data.alertType, data.severity, data.message)
}

/**
 * Get current safety status
 */
export async function getSafetyStatus(): Promise<SafetyStatus> {
  const [launchGate, channelPauses, alerts] = await Promise.all([
    prisma.launchGate.findFirst(),
    prisma.channelPause.findMany(),
    prisma.alert.findMany({
      where: {
        acknowledged: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }),
  ])
  
  const channelPauseMap: Record<CommunicationChannel, boolean> = {
    EMAIL: false,
    SMS: false,
    TELEGRAM: false,
    WEB_PUSH: false,
  }
  
  for (const pause of channelPauses) {
    channelPauseMap[pause.channel] = pause.paused
  }
  
  return {
    globalKillSwitch: launchGate?.killSwitchActive || false,
    channelPauses: channelPauseMap,
    alerts: alerts.map(alert => ({
      type: alert.alertType,
      severity: alert.severity,
      message: alert.metric
        ? `${alert.metric}: ${alert.currentValue} (threshold: ${alert.threshold})`
        : alert.alertType,
    })),
  }
}

/**
 * Monitor safety metrics (called by cron job)
 */
export async function monitorSafetyMetrics(): Promise<void> {
  const channels: CommunicationChannel[] = ['EMAIL', 'SMS', 'TELEGRAM', 'WEB_PUSH']
  
  for (const channel of channels) {
    await checkBounceRate(channel)
    await checkComplaintRate(channel)
  }
}
