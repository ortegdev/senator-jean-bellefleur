/**
 * Test Payment Provider (for development)
 * 
 * Simulates payment operations without real money.
 */

import type {
  PaymentProvider,
  PaymentIntent,
  PaymentResult,
  WebhookEvent,
  RefundResult,
} from './adapter'

export class TestPaymentProvider implements PaymentProvider {
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>
  ): Promise<PaymentIntent> {
    const id = `test_pi_${Date.now()}`

    return {
      id,
      amount,
      currency,
      status: 'pending',
      clientSecret: `${id}_secret_test`,
      metadata,
    }
  }

  async confirmPayment(intentId: string): Promise<PaymentResult> {
    // Simulate successful payment
    return {
      success: true,
      paymentIntentId: intentId,
    }
  }

  async handleWebhook(_payload: unknown, _signature: string): Promise<WebhookEvent> {
    // Test webhook event
    return {
      type: 'payment_intent.succeeded',
      paymentIntentId: 'test_pi_123',
      status: 'succeeded',
      data: {},
    }
  }

  async refund(chargeId: string, amount?: number): Promise<RefundResult> {
    return {
      success: true,
      refundId: `test_refund_${Date.now()}`,
      amount: amount || 0,
    }
  }

  isTestMode(): boolean {
    return true
  }
}
