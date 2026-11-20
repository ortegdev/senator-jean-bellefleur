/**
 * Mock Payment Provider
 * 
 * In-memory test provider for development and testing.
 * Simulates payment flows without real money movement.
 * 
 * Features:
 * - Configurable success/failure rates
 * - Simulated webhook events
 * - Test card patterns (4242 = success, 4000 = decline)
 * - Instant confirmation (no async processing)
 */

import type {
  PaymentProvider,
  CreateCheckoutParams,
  CheckoutResult,
  ConfirmParams,
  ConfirmResult,
  PaymentDetails,
  RefundParams,
  RefundResult,
  WebhookParams,
  WebhookResult,
  BalanceTransactionsParams,
  BalanceTransaction,
} from '../provider'
import { PaymentProviderError, WebhookVerificationError } from '../provider'

interface MockPaymentIntent {
  id: string
  amountCents: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  paymentMethod?: string
  failureReason?: string
  createdAt: Date
  confirmedAt?: Date
  refundedCents: number
  metadata: Record<string, string>
}

interface MockWebhookEvent {
  id: string
  type: string
  data: any
  createdAt: Date
}

export interface MockProviderConfig {
  /**
   * Auto-fail payments with these card patterns
   * Default: ['4000000000000002'] (card declined)
   */
  declineCards?: string[]
  
  /**
   * Simulate webhook delay (milliseconds)
   * Default: 0 (instant)
   */
  webhookDelayMs?: number
  
  /**
   * Test webhook signing secret
   * Default: 'whsec_test_mock_secret'
   */
  webhookSecret?: string
}

/**
 * Mock Payment Provider
 * 
 * In-memory test provider with deterministic behavior:
 * 
 * Success cards:
 * - 4242424242424242: Successful payment
 * - 5555555555554444: Successful payment (Mastercard)
 * 
 * Decline cards:
 * - 4000000000000002: Card declined
 * - 4000000000009995: Insufficient funds
 * - 4000000000000069: Expired card
 */
export class MockProvider implements PaymentProvider {
  readonly name = 'mock'
  private intents = new Map<string, MockPaymentIntent>()
  private events = new Map<string, MockWebhookEvent>()
  private balanceTransactions: BalanceTransaction[] = []
  private config: Required<MockProviderConfig>

  constructor(config: MockProviderConfig = {}) {
    this.config = {
      declineCards: config.declineCards ?? ['4000000000000002', '4000000000009995', '4000000000000069'],
      webhookDelayMs: config.webhookDelayMs ?? 0,
      webhookSecret: config.webhookSecret ?? 'whsec_test_mock_secret',
    }
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const intentId = `mock_pi_${Date.now()}_${Math.random().toString(36).slice(2)}`
    
    const intent: MockPaymentIntent = {
      id: intentId,
      amountCents: params.amountCents,
      currency: params.currency,
      status: 'pending',
      createdAt: new Date(),
      refundedCents: 0,
      metadata: params.metadata ?? {},
    }

    this.intents.set(intentId, intent)

    return {
      paymentIntentId: intentId,
      clientSecret: `${intentId}_secret_${Math.random().toString(36).slice(2)}`,
      redirectUrl: undefined, // Mock provider doesn't need redirects
    }
  }

  async confirm(params: ConfirmParams): Promise<ConfirmResult> {
    const intent = this.intents.get(params.paymentIntentId)
    
    if (!intent) {
      throw new PaymentProviderError(
        'Payment intent not found',
        'PAYMENT_NOT_FOUND',
        { paymentIntentId: params.paymentIntentId }
      )
    }

    if (intent.status !== 'pending') {
      throw new PaymentProviderError(
        `Payment intent already ${intent.status}`,
        'INVALID_STATE',
        { paymentIntentId: params.paymentIntentId, status: intent.status }
      )
    }

    // Check if payment method is a decline card
    const isDeclined = this.config.declineCards.some(card => 
      params.paymentMethodId.includes(card)
    )

    if (isDeclined) {
      intent.status = 'failed'
      intent.failureReason = this.getDeclineReason(params.paymentMethodId)
      intent.paymentMethod = params.paymentMethodId
      intent.confirmedAt = new Date()

      // Create failure webhook event
      await this.createWebhookEvent('payment_intent.payment_failed', {
        id: intent.id,
        amount: intent.amountCents,
        currency: intent.currency,
        status: intent.status,
        failure_reason: intent.failureReason,
      })

      return {
        status: 'failed',
        failureReason: intent.failureReason,
      }
    }

    // Success flow
    intent.status = 'succeeded'
    intent.paymentMethod = params.paymentMethodId
    intent.confirmedAt = new Date()

    // Create balance transaction
    const processingFeeCents = Math.round(intent.amountCents * 0.029 + 30) // 2.9% + 30¢
    this.balanceTransactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'charge',
      amountCents: intent.amountCents,
      currency: intent.currency,
      feeCents: processingFeeCents,
      netCents: intent.amountCents - processingFeeCents,
      createdAt: intent.confirmedAt,
      description: `Payment ${intent.id}`,
      metadata: {
        paymentIntentId: intent.id,
        ...intent.metadata,
      },
    })

    // Create success webhook event
    await this.createWebhookEvent('payment_intent.succeeded', {
      id: intent.id,
      amount: intent.amountCents,
      currency: intent.currency,
      status: intent.status,
      payment_method: intent.paymentMethod,
    })

    return {
      status: 'succeeded',
      confirmedAt: intent.confirmedAt,
    }
  }

  async retrieve(paymentIntentId: string): Promise<PaymentDetails> {
    const intent = this.intents.get(paymentIntentId)
    
    if (!intent) {
      throw new PaymentProviderError(
        'Payment intent not found',
        'PAYMENT_NOT_FOUND',
        { paymentIntentId }
      )
    }

    return {
      id: intent.id,
      amountCents: intent.amountCents,
      currency: intent.currency,
      status: intent.status,
      paymentMethod: intent.paymentMethod,
      failureReason: intent.failureReason,
      createdAt: intent.createdAt,
      confirmedAt: intent.confirmedAt,
      metadata: intent.metadata,
    }
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const intent = this.intents.get(params.paymentIntentId)
    
    if (!intent) {
      throw new PaymentProviderError(
        'Payment intent not found',
        'PAYMENT_NOT_FOUND',
        { paymentIntentId: params.paymentIntentId }
      )
    }

    if (intent.status !== 'succeeded') {
      throw new PaymentProviderError(
        'Can only refund succeeded payments',
        'INVALID_STATE',
        { paymentIntentId: params.paymentIntentId, status: intent.status }
      )
    }

    const refundAmount = params.amountCents ?? (intent.amountCents - intent.refundedCents)
    const availableToRefund = intent.amountCents - intent.refundedCents

    if (refundAmount > availableToRefund) {
      throw new PaymentProviderError(
        'Refund amount exceeds available balance',
        'REFUND_AMOUNT_INVALID',
        { 
          paymentIntentId: params.paymentIntentId, 
          requested: refundAmount,
          available: availableToRefund,
        }
      )
    }

    intent.refundedCents += refundAmount
    
    if (intent.refundedCents === intent.amountCents) {
      intent.status = 'refunded'
    }

    const refundId = `mock_re_${Date.now()}_${Math.random().toString(36).slice(2)}`

    // Create balance transaction for refund
    const refundFeeCents = 0 // Mock provider doesn't charge refund fees
    this.balanceTransactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: 'refund',
      amountCents: -refundAmount, // Negative for refund
      currency: intent.currency,
      feeCents: refundFeeCents,
      netCents: -refundAmount,
      createdAt: new Date(),
      description: `Refund ${refundId} for payment ${intent.id}`,
      metadata: {
        paymentIntentId: intent.id,
        refundId,
        reason: params.reason,
      },
    })

    // Create refund webhook event
    await this.createWebhookEvent('charge.refunded', {
      id: intent.id,
      refund_id: refundId,
      amount_refunded: refundAmount,
      status: intent.status,
      reason: params.reason,
    })

    return {
      refundId,
      status: 'succeeded',
      amountCents: refundAmount,
      refundedAt: new Date(),
    }
  }

  async handleWebhook(params: WebhookParams): Promise<WebhookResult> {
    // Verify signature (simple HMAC check in real implementation)
    if (!params.signature.includes('mock')) {
      throw new WebhookVerificationError(
        'Invalid webhook signature',
        { signature: params.signature }
      )
    }

    let eventData: MockWebhookEvent
    try {
      eventData = JSON.parse(params.payload)
    } catch (error) {
      throw new WebhookVerificationError(
        'Invalid webhook payload JSON',
        { error }
      )
    }

    // Check if we've already processed this event
    if (this.events.has(eventData.id)) {
      return {
        eventId: eventData.id,
        eventType: eventData.type,
        processed: false, // Already processed
        data: eventData.data,
      }
    }

    // Store event
    this.events.set(eventData.id, eventData)

    return {
      eventId: eventData.id,
      eventType: eventData.type,
      processed: true,
      data: eventData.data,
    }
  }

  async getBalanceTransactions(params: BalanceTransactionsParams): Promise<BalanceTransaction[]> {
    let transactions = [...this.balanceTransactions]

    // Filter by date range
    if (params.startDate) {
      transactions = transactions.filter(t => t.createdAt >= params.startDate!)
    }
    if (params.endDate) {
      transactions = transactions.filter(t => t.createdAt <= params.endDate!)
    }

    // Sort by date descending
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Limit
    if (params.limit) {
      transactions = transactions.slice(0, params.limit)
    }

    return transactions
  }

  // Test helpers

  /**
   * Simulate a webhook event
   * Used for testing webhook handling
   */
  private async createWebhookEvent(type: string, data: any): Promise<void> {
    const event: MockWebhookEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type,
      data,
      createdAt: new Date(),
    }

    if (this.config.webhookDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.webhookDelayMs))
    }

    this.events.set(event.id, event)
  }

  /**
   * Get stored webhook events (for testing)
   */
  getWebhookEvents(): MockWebhookEvent[] {
    return Array.from(this.events.values())
  }

  /**
   * Clear all stored data (for testing)
   */
  reset(): void {
    this.intents.clear()
    this.events.clear()
    this.balanceTransactions = []
  }

  /**
   * Map decline card to failure reason
   */
  private getDeclineReason(paymentMethodId: string): string {
    if (paymentMethodId.includes('4000000000000002')) {
      return 'card_declined'
    }
    if (paymentMethodId.includes('4000000000009995')) {
      return 'insufficient_funds'
    }
    if (paymentMethodId.includes('4000000000000069')) {
      return 'expired_card'
    }
    return 'generic_decline'
  }
}
