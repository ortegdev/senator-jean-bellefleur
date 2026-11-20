/**
 * Error tracking and performance monitoring
 * 
 * Integrates with Sentry for error tracking
 * Provides payment funnel monitoring
 */

import { env } from '@/lib/config/env'
import { logger } from './logger'

// Sentry will be initialized in instrumentation.ts
// This file provides helper functions for tracking

interface ErrorContext {
  [key: string]: unknown
}

interface PaymentFunnelEvent {
  step: 'started' | 'form_completed' | 'payment_initiated' | 'payment_completed' | 'payment_failed'
  contributionId?: string
  amountCents?: number
  provider?: string
  errorCode?: string
  errorMessage?: string
  duration?: number
}

class Monitoring {
  /**
   * Track an error with context
   */
  captureError(error: Error, context?: ErrorContext): void {
    // Always log
    logger.error(error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
    })
    
    // Send to Sentry if configured
    if (env.SENTRY_DSN && typeof window !== 'undefined') {
      // Sentry SDK will be available globally
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          extra: context,
        })
      }
    }
  }
  
  /**
   * Track a message (non-error event)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    logger[level === 'warning' ? 'warn' : level](message, context)
    
    if (env.SENTRY_DSN && typeof window !== 'undefined') {
      if (window.Sentry) {
        window.Sentry.captureMessage(message, {
          level,
          extra: context,
        })
      }
    }
  }
  
  /**
   * Track payment funnel event
   */
  trackPaymentFunnel(event: PaymentFunnelEvent): void {
    logger.info(`Payment funnel: ${event.step}`, event)
    
    // Custom metric for alerting
    if (event.step === 'payment_failed') {
      this.captureMessage('Payment failure detected', 'warning', {
        contributionId: event.contributionId,
        errorCode: event.errorCode,
        errorMessage: event.errorMessage,
        provider: event.provider,
      })
    }
    
    // Track conversion rate drops
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'payment_funnel',
        message: `Payment ${event.step}`,
        level: event.step === 'payment_failed' ? 'error' : 'info',
        data: event,
      })
    }
  }
  
  /**
   * Set user context (admin user, not donor)
   */
  setUserContext(user: { id: string; email: string; role: string }): void {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      })
    }
  }
  
  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.setUser(null)
    }
  }
  
  /**
   * Track performance metric
   */
  trackMetric(name: string, value: number, unit: 'ms' | 'count' | 'bytes' = 'ms'): void {
    logger.debug(`Metric: ${name}`, { value, unit })
    
    // Performance API
    if (typeof window !== 'undefined' && window.performance) {
      performance.measure(name, { duration: value })
    }
  }
}

export const monitoring = new Monitoring()

// Type augmentation for window.Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: { extra?: ErrorContext }) => void
      captureMessage: (message: string, context?: { level?: string; extra?: ErrorContext }) => void
      setUser: (user: { id: string; email: string; role: string } | null) => void
      addBreadcrumb: (breadcrumb: {
        category: string
        message: string
        level: string
        data?: unknown
      }) => void
    }
  }
}
