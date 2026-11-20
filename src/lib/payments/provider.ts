/**
 * Payment Provider Adapter Interface
 * 
 * Abstract interface for payment providers (Stripe, PayPal, etc.)
 * Allows swapping providers without changing application code.
 */

export interface PaymentProvider {
  /**
   * Create a new checkout session/payment intent
   * Returns provider-specific ID and client secret
   */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>

  /**
   * Confirm a payment (for card payments requiring confirmation)
   */
  confirm(params: ConfirmParams): Promise<ConfirmResult>

  /**
   * Retrieve payment status
   */
  retrieve(providerIntentId: string): Promise<PaymentDetails>

  /**
   * Process a refund
   */
  refund(params: RefundParams): Promise<RefundResult>

  /**
   * Handle incoming webhook
   * Verifies signature and returns normalized event
   */
  handleWebhook(params: WebhookParams): Promise<WebhookResult>

  /**
   * Get balance transactions for reconciliation
   */
  getBalanceTransactions(params: BalanceTransactionsParams): Promise<BalanceTransaction[]>
}

// Common types

export interface CreateCheckoutParams {
  amountCents: number
  currency: string
  donorEmail: string
  donorName: string
  metadata: {
    complianceCheckId: string
    donorCountry: string
    locale: string
    [key: string]: any
  }
  idempotencyKey: string
}

export interface CheckoutResult {
  providerIntentId: string
  clientSecret?: string // For client-side confirmation
  status: 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded'
  metadata?: Record<string, any>
}

export interface ConfirmParams {
  providerIntentId: string
  paymentMethodId?: string
}

export interface ConfirmResult {
  status: 'processing' | 'succeeded' | 'requires_action' | 'failed'
  requiresAction?: boolean
  actionUrl?: string
  error?: {
    code: string
    message: string
  }
}

export interface PaymentDetails {
  providerIntentId: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  amountCents: number
  amountReceivedCents?: number // Actual amount received (after disputes, etc.)
  currency: string
  paymentMethodType?: string
  cardLast4?: string
  cardBrand?: string
  cardExpMonth?: number
  cardExpYear?: number
  failureCode?: string
  failureMessage?: string
  metadata?: Record<string, any>
}

export interface RefundParams {
  providerIntentId: string
  amountCents?: number // Partial refund amount (omit for full refund)
  reason?: string
  metadata?: Record<string, any>
}

export interface RefundResult {
  refundId: string
  status: 'pending' | 'succeeded' | 'failed'
  amountCents: number
  error?: {
    code: string
    message: string
  }
}

export interface WebhookParams {
  body: string | Buffer
  signature: string
  secret: string
}

export interface WebhookResult {
  eventId: string
  eventType: string
  providerIntentId?: string
  status?: 'succeeded' | 'failed' | 'refunded' | 'disputed'
  data: Record<string, any>
  verified: boolean
}

export interface BalanceTransactionsParams {
  startDate: Date
  endDate: Date
  limit?: number
}

export interface BalanceTransaction {
  id: string
  type: 'charge' | 'refund' | 'adjustment' | 'payout' | 'fee'
  amountCents: number
  feeCents: number
  netCents: number
  currency: string
  createdAt: Date
  description?: string
  sourceId?: string // Related payment intent or transfer
  status: 'available' | 'pending'
}

// Error types

export class PaymentProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public providerError?: any
  ) {
    super(message)
    this.name = 'PaymentProviderError'
  }
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookVerificationError'
  }
}
