/**
 * PII Scrubbing for Logs and Error Reports
 * 
 * Ensures no personally identifiable information leaks into:
 * - Application logs
 * - Error tracking services (Sentry, etc.)
 * - Analytics
 * - Debug output
 * 
 * CRITICAL: This must be applied to ALL logging and error reporting.
 */

/**
 * PII patterns to scrub
 */
const PII_PATTERNS = {
  // Email addresses
  email: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '[EMAIL_REDACTED]',
  },

  // Credit card numbers (various formats)
  creditCard: {
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: '[CARD_REDACTED]',
  },

  // Phone numbers (international and US formats)
  phone: {
    pattern: /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    replacement: '[PHONE_REDACTED]',
  },

  // IP addresses (IPv4 and IPv6)
  ipv4: {
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '[IP_REDACTED]',
  },
  ipv6: {
    pattern: /\b([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
    replacement: '[IP_REDACTED]',
  },

  // Postal codes
  postalCode: {
    pattern: /\b\d{5}(-\d{4})?\b/g, // US ZIP
    replacement: '[POSTAL_CODE_REDACTED]',
  },

  // Street addresses (simple pattern)
  streetAddress: {
    pattern: /\b\d{1,5}\s+[\w\s]{1,40}(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct)\b/gi,
    replacement: '[ADDRESS_REDACTED]',
  },

  // Names (in specific patterns like "Name: John Doe")
  nameLabel: {
    pattern: /\b(name|donor|user):\s*[A-Z][a-z]+\s+[A-Z][a-z]+/gi,
    replacement: '$1: [NAME_REDACTED]',
  },
}

/**
 * Sensitive field names to redact
 */
const SENSITIVE_FIELDS = new Set([
  'name',
  'donorName',
  'donor_name',
  'email',
  'donorEmail',
  'donor_email',
  'phone',
  'phoneNumber',
  'phone_number',
  'address',
  'street',
  'streetAddress',
  'street_address',
  'city',
  'postalCode',
  'postal_code',
  'zipCode',
  'zip_code',
  'ip',
  'ipAddress',
  'ip_address',
  'cardNumber',
  'card_number',
  'cvv',
  'cvc',
  'ssn',
  'social_security_number',
])

/**
 * Scrub PII from string
 */
export function scrubPII(text: string): string {
  if (!text || typeof text !== 'string') {
    return text
  }

  let scrubbed = text

  // Apply all PII patterns
  for (const [key, { pattern, replacement }] of Object.entries(PII_PATTERNS)) {
    scrubbed = scrubbed.replace(pattern, replacement)
  }

  return scrubbed
}

/**
 * Scrub PII from object (recursively)
 */
export function scrubPIIFromObject<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    return scrubPII(obj) as any
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => scrubPIIFromObject(item)) as any
  }

  if (typeof obj === 'object') {
    const scrubbed: any = {}

    for (const [key, value] of Object.entries(obj)) {
      // Check if field name is sensitive
      if (SENSITIVE_FIELDS.has(key)) {
        scrubbed[key] = '[REDACTED]'
      } else {
        scrubbed[key] = scrubPIIFromObject(value)
      }
    }

    return scrubbed
  }

  return obj
}

/**
 * Safe logger that scrubs PII
 */
export const safeLogger = {
  log: (...args: any[]) => {
    const scrubbed = args.map(arg =>
      typeof arg === 'string' ? scrubPII(arg) : scrubPIIFromObject(arg)
    )
    console.log(...scrubbed)
  },

  info: (...args: any[]) => {
    const scrubbed = args.map(arg =>
      typeof arg === 'string' ? scrubPII(arg) : scrubPIIFromObject(arg)
    )
    console.info(...scrubbed)
  },

  warn: (...args: any[]) => {
    const scrubbed = args.map(arg =>
      typeof arg === 'string' ? scrubPII(arg) : scrubPIIFromObject(arg)
    )
    console.warn(...scrubbed)
  },

  error: (...args: any[]) => {
    const scrubbed = args.map(arg =>
      typeof arg === 'string' ? scrubPII(arg) : scrubPIIFromObject(arg)
    )
    console.error(...scrubbed)
  },

  debug: (...args: any[]) => {
    const scrubbed = args.map(arg =>
      typeof arg === 'string' ? scrubPII(arg) : scrubPIIFromObject(arg)
    )
    console.debug(...scrubbed)
  },
}

/**
 * Scrub PII for error tracking (Sentry, etc.)
 */
export function scrubErrorForTracking(error: Error): {
  message: string
  stack?: string
  name: string
} {
  return {
    name: error.name,
    message: scrubPII(error.message),
    stack: error.stack ? scrubPII(error.stack) : undefined,
  }
}

/**
 * Create safe error context for tracking
 * Removes all PII from context object
 */
export function createSafeErrorContext(context: Record<string, any>): Record<string, any> {
  return scrubPIIFromObject(context)
}

/**
 * Safe console override (use in production)
 * Automatically scrubs PII from all console methods
 */
export function enableSafeConsole() {
  const originalConsole = { ...console }

  console.log = (...args: any[]) => originalConsole.log(...args.map(scrubPIIFromObject))
  console.info = (...args: any[]) => originalConsole.info(...args.map(scrubPIIFromObject))
  console.warn = (...args: any[]) => originalConsole.warn(...args.map(scrubPIIFromObject))
  console.error = (...args: any[]) => originalConsole.error(...args.map(scrubPIIFromObject))
  console.debug = (...args: any[]) => originalConsole.debug(...args.map(scrubPIIFromObject))
}

/**
 * Check if string contains potential PII
 */
export function containsPII(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }

  for (const { pattern } of Object.values(PII_PATTERNS)) {
    if (pattern.test(text)) {
      return true
    }
  }

  return false
}

/**
 * Validate that object does not contain PII
 * Throws error if PII detected
 */
export function assertNoPII(obj: any, context: string = 'Object'): void {
  const jsonString = JSON.stringify(obj)

  if (containsPII(jsonString)) {
    throw new Error(`${context} contains PII and cannot be logged or tracked`)
  }

  // Check sensitive field names
  const checkSensitiveFields = (o: any, path: string = ''): void => {
    if (o === null || o === undefined) return

    if (typeof o === 'object') {
      for (const [key, value] of Object.entries(o)) {
        if (SENSITIVE_FIELDS.has(key)) {
          throw new Error(
            `${context} contains sensitive field "${path}${key}" and cannot be logged or tracked`
          )
        }
        checkSensitiveFields(value, `${path}${key}.`)
      }
    }
  }

  checkSensitiveFields(obj)
}
