/**
 * Structured logging with PII scrubbing
 * 
 * Usage:
 *   logger.info('User signed up', { email: 'user@example.com' })
 *   logger.error('Payment failed', { error, contributionId: '123' })
 */

import { env } from '@/lib/config/env'

// PII patterns to scrub from logs
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  
  // Haitian phone patterns
  haitiPhone: /\b(?:\+509|509)?\s?\d{4}\s?\d{4}\b/g,
  
  // IP addresses (optional - consider if truly PII in your context)
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
}

// Fields that should always be scrubbed
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'encryptionKey',
  'sessionSecret',
  'cardNumber',
  'cvv',
  'ssn',
  'taxId',
  'passportNumber',
]

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface StructuredLog {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  environment: string
  service: string
  version?: string
  requestId?: string
}

class Logger {
  private service = 'diaspora4bellefleur'
  private version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'
  
  /**
   * Scrub PII from a string
   */
  private scrubString(text: string): string {
    let scrubbed = text
    
    scrubbed = scrubbed.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]')
    scrubbed = scrubbed.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]')
    scrubbed = scrubbed.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]')
    scrubbed = scrubbed.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]')
    scrubbed = scrubbed.replace(PII_PATTERNS.haitiPhone, '[PHONE_REDACTED]')
    
    return scrubbed
  }
  
  /**
   * Scrub PII from context object
   */
  private scrubContext(context: LogContext): LogContext {
    const scrubbed: LogContext = {}
    
    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase()
      
      // Check if field name indicates sensitive data
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        scrubbed[key] = '[REDACTED]'
        continue
      }
      
      // Scrub string values
      if (typeof value === 'string') {
        scrubbed[key] = this.scrubString(value)
      }
      // Recursively scrub nested objects
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        scrubbed[key] = this.scrubContext(value as LogContext)
      }
      // Scrub arrays
      else if (Array.isArray(value)) {
        scrubbed[key] = value.map(item => 
          typeof item === 'string' ? this.scrubString(item) :
          item && typeof item === 'object' ? this.scrubContext(item as LogContext) :
          item
        )
      }
      // Keep other types as-is
      else {
        scrubbed[key] = value
      }
    }
    
    return scrubbed
  }
  
  /**
   * Create structured log entry
   */
  private createLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
    requestId?: string
  ): StructuredLog {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message: this.scrubString(message),
      environment: env.VERCEL_ENV || 'development',
      service: this.service,
      version: this.version,
    }
    
    if (requestId) {
      log.requestId = requestId
    }
    
    if (context) {
      log.context = this.scrubContext(context)
    }
    
    return log
  }
  
  /**
   * Send log to configured destination
   */
  private send(log: StructuredLog): void {
    const jsonLog = JSON.stringify(log)
    
    // Development: Pretty print to console
    if (env.NODE_ENV === 'development') {
      const color = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      }[log.level]
      
      console.log(`${color}[${log.level.toUpperCase()}]\x1b[0m ${log.message}`)
      if (log.context) {
        console.log(JSON.stringify(log.context, null, 2))
      }
      return
    }
    
    // Production: JSON to stdout (picked up by Vercel/Logtail)
    console.log(jsonLog)
    
    // If Logtail configured, send there
    if (env.LOGTAIL_SOURCE_TOKEN) {
      // Logtail picks up stdout automatically in Vercel
      // No additional client needed
    }
  }
  
  /**
   * Debug level logging (development only)
   */
  debug(message: string, context?: LogContext, requestId?: string): void {
    if (env.LOG_LEVEL === 'debug' || env.NODE_ENV === 'development') {
      const log = this.createLog('debug', message, context, requestId)
      this.send(log)
    }
  }
  
  /**
   * Info level logging
   */
  info(message: string, context?: LogContext, requestId?: string): void {
    const log = this.createLog('info', message, context, requestId)
    this.send(log)
  }
  
  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext, requestId?: string): void {
    const log = this.createLog('warn', message, context, requestId)
    this.send(log)
  }
  
  /**
   * Error level logging
   */
  error(message: string, context?: LogContext, requestId?: string): void {
    const log = this.createLog('error', message, context, requestId)
    this.send(log)
    
    // Also send to error tracking if configured
    if (env.SENTRY_DSN && typeof window !== 'undefined') {
      // Sentry.captureException will be called separately with full context
    }
  }
  
  /**
   * Create child logger with request ID
   */
  child(requestId: string) {
    return {
      debug: (message: string, context?: LogContext) => this.debug(message, context, requestId),
      info: (message: string, context?: LogContext) => this.info(message, context, requestId),
      warn: (message: string, context?: LogContext) => this.warn(message, context, requestId),
      error: (message: string, context?: LogContext) => this.error(message, context, requestId),
    }
  }
}

export const logger = new Logger()
