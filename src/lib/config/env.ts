import { z } from 'zod'

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url(),

  // Application
  SITE_URL: z.string().url(),
  SUPPORT_EMAIL: z.string().email(),

  // Feature flags
  ENABLE_DONATIONS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Payment provider
  PAYMENT_PROVIDER: z.string().default('stripe'),
  PAYMENT_PROVIDER_API_KEY: z.string().optional(),
  PAYMENT_PROVIDER_SECRET: z.string().optional(),
  PAYMENT_PROVIDER_WEBHOOK_SECRET: z.string().optional(),

  // Security
  ENCRYPTION_KEY: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),

  // Compliance
  ALLOWED_COUNTRIES: z.string().default('US,CA,FR'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),
  
  // Vercel (optional, populated automatically on Vercel)
  VERCEL_ENV: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
})

function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    throw new Error('Invalid environment configuration')
  }
}

export const env = validateEnv()

export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test'
}
