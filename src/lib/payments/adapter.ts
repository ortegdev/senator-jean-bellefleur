/**
 * Payment Provider Adapter Interface
 * 
 * This abstraction allows us to swap payment providers without
 * changing application code.
 */

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  clientSecret?: string
  metadata: Record<string, string>
}

export interface PaymentResult {
  success: boolean
  paymentIntentId: string
  error?: string
}

export interface WebhookEvent {
  type: string
  paymentIntentId: string
  status: string
  data: Record<string, unknown>
}

export interface RefundResult {
  success: boolean
  refundId: string
  amount: number
  error?: string
}

export interface PaymentProvider {
  /**
   * Create a payment intent
   */
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>
  ): Promise<PaymentIntent>

  /**
   * Confirm a payment
   */
  confirmPayment(intentId: string): Promise<PaymentResult>

  /**
   * Handle webhook from provider
   */
  handleWebhook(payload: unknown, signature: string): Promise<WebhookEvent>

  /**
   * Refund a payment
   */
  refund(chargeId: string, amount?: number): Promise<RefundResult>

  /**
   * Check if in test mode
   */
  isTestMode(): boolean
}
