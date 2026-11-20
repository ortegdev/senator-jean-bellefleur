/**
 * Next.js Instrumentation Hook
 * 
 * Runs once on server startup to initialize observability
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { env } from './src/lib/config/env'

export async function register() {
  // Only initialize Sentry in production and staging
  if (env.SENTRY_DSN && env.NODE_ENV !== 'development') {
    const Sentry = await import('@sentry/nextjs')
    
    Sentry.init({
      dsn: env.SENTRY_DSN,
      
      // Environment
      environment: env.VERCEL_ENV || 'production',
      
      // Release tracking
      release: env.VERCEL_GIT_COMMIT_SHA,
      
      // Performance monitoring
      tracesSampleRate: env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
      
      // Error sampling (capture all errors)
      sampleRate: 1.0,
      
      // Ignore common errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        
        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        
        // Bot/crawler errors
        'ResizeObserver loop limit exceeded',
      ],
      
      // Scrub sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['cookie']
          delete event.request.headers['x-api-key']
        }
        
        // Remove sensitive context
        if (event.extra) {
          const scrubKeys = [
            'password',
            'token',
            'secret',
            'apiKey',
            'cardNumber',
            'cvv',
            'ssn',
          ]
          
          for (const key of scrubKeys) {
            if (key in event.extra) {
              event.extra[key] = '[REDACTED]'
            }
          }
        }
        
        return event
      },
      
      // Integrations
      integrations: [
        // Prisma integration (basic setup)
        Sentry.prismaIntegration(),
        
        // HTTP integration
        Sentry.httpIntegration(),
      ],
    })
    
    console.log(`✓ Sentry initialized (${env.VERCEL_ENV})`)
  }
}
