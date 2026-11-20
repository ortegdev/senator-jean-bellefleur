/**
 * Payment Provider Factory
 * 
 * Creates and caches payment provider instances.
 * Reads configuration from environment variables.
 */

import type { PaymentProvider } from './provider'
import { StripeProvider } from './providers/stripe'
import { MockProvider } from './providers/mock'

let cachedProvider: PaymentProvider | null = null

export function getPaymentProvider(providerName?: string): PaymentProvider {
  const name = providerName ?? process.env.PAYMENT_PROVIDER ?? 'mock'

  // Return cached provider if same name
  if (cachedProvider && cachedProvider.name === name) {
    return cachedProvider
  }

  // Create new provider
  switch (name.toLowerCase()) {
    case 'stripe':
      const stripeKey = process.env.STRIPE_SECRET_KEY
      if (!stripeKey) {
        throw new Error('STRIPE_SECRET_KEY environment variable is required for Stripe provider')
      }
      cachedProvider = new StripeProvider(stripeKey)
      break

    case 'mock':
      cachedProvider = new MockProvider({
        webhookSecret: process.env.MOCK_WEBHOOK_SECRET,
      })
      break

    default:
      throw new Error(`Unknown payment provider: ${name}`)
  }

  return cachedProvider
}

/**
 * Reset cached provider (for testing)
 */
export function resetProviderCache(): void {
  cachedProvider = null
}
