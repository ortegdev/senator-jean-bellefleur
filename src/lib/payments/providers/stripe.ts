/**
 * Stripe Payment Provider Adapter
 * 
 * TEST MODE ONLY
 * 
 * Implements PaymentProvider interface for Stripe.
 * Uses Stripe SDK for API calls and webhook verification.
 */

import Stripe from 'stripe'
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
  PaymentProviderError,
  WebhookVerificationError,
} from '../provider'

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe

  constructor(apiKey: string, private webhookSecret: string) {
    // Enforce test mode
    if (!apiKey.startsWith('sk_test_')) {
      throw new Error('CRITICAL: Only test mode keys allowed. Production keys are forbidden.')
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: params.amountCents,
          currency: params.currency.toLowerCase(),
          receipt_email: params.donorEmail,
          description: `Contribution from ${params.donorName}`,
          metadata: params.metadata,
          automatic_payment_methods: {
            enabled: true,
          },
        },
        {
          idempotencyKey: params.idempotencyKey,
        }
      )

      return {
        providerIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        status: this.mapStatus(paymentIntent.status),
        metadata: paymentIntent.metadata,
      }
    } catch (error) {
      throw this.handleStripeError(error)
    }
  }

  async confirm(params: ConfirmParams): Promise<ConfirmResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        params.providerIntentId,
        params.paymentMethodId ? { payment_method: params.paymentMethodId } : undefined
      )

      return {
        status: this.mapStatus(paymentIntent.status),
        requiresAction: paymentIntent.status === 'requires_action',
        actionUrl: paymentIntent.next_action?.redirect_to_url?.url,
        error: paymentIntent.last_payment_error
          ? {
              code: paymentIntent.last_payment_error.code || 'unknown',
              message: paymentIntent.last_payment_error.message || 'Payment failed',
            }
          : undefined,
      }
    } catch (error) {
      throw this.handleStripeError(error)
    }
  }

  async retrieve(providerIntentId: string): Promise<PaymentDetails> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(providerIntentId)

      const paymentMethod = paymentIntent.payment_method
        ? await this.stripe.paymentMethods.retrieve(
            typeof paymentIntent.payment_method === 'string'
              ? paymentIntent.payment_method
              : paymentIntent.payment_method.id
          )
        : null

      return {
        providerIntentId: paymentIntent.id,
        status: this.mapStatus(paymentIntent.status),
        amountCents: paymentIntent.amount,
        amountReceivedCents: paymentIntent.amount_received || undefined,
        currency: paymentIntent.currency.toUpperCase(),
        paymentMethodType: paymentMethod?.type,
        cardLast4: paymentMethod?.card?.last4,
        cardBrand: paymentMethod?.card?.brand,
        cardExpMonth: paymentMethod?.card?.exp_month,
        cardExpYear: paymentMethod?.card?.exp_year,
        failureCode: paymentIntent.last_payment_error?.code,
        failureMessage: paymentIntent.last_payment_error?.message,
        metadata: paymentIntent.metadata,
      }
    } catch (error) {
      throw this.handleStripeError(error)
    }
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: params.providerIntentId,
        amount: params.amountCents,
        reason: params.reason as Stripe.RefundCreateParams.Reason,
        metadata: params.metadata,
      })

      return {
        refundId: refund.id,
        status: refund.status === 'succeeded' ? 'succeeded' : refund.status === 'failed' ? 'failed' : 'pending',
        amountCents: refund.amount,
        error: refund.failure_reason
          ? {
              code: refund.failure_reason,
              message: `Refund failed: ${refund.failure_reason}`,
            }
          : undefined,
      }
    } catch (error) {
      throw this.handleStripeError(error)
    }
  }

  async handleWebhook(params: WebhookParams): Promise<WebhookResult> {
    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(
        params.body,
        params.signature,
        params.secret || this.webhookSecret
      )
    } catch (error) {
      throw new WebhookVerificationError(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }

    // Extract payment intent ID from event data
    let providerIntentId: string | undefined
    let status: 'succeeded' | 'failed' | 'refunded' | 'disputed' | undefined

    if (event.type.startsWith('payment_intent.')) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      providerIntentId = paymentIntent.id
      
      if (event.type === 'payment_intent.succeeded') {
        status = 'succeeded'
      } else if (event.type === 'payment_intent.payment_failed') {
        status = 'failed'
      }
    } else if (event.type.startsWith('charge.refunded')) {
      const charge = event.data.object as Stripe.Charge
      providerIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : undefined
      status = 'refunded'
    } else if (event.type.startsWith('charge.dispute')) {
      const dispute = event.data.object as Stripe.Dispute
      providerIntentId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : undefined
      status = 'disputed'
    }

    return {
      eventId: event.id,
      eventType: event.type,
      providerIntentId,
      status,
      data: event.data.object as Record<string, any>,
      verified: true,
    }
  }

  async getBalanceTransactions(params: BalanceTransactionsParams): Promise<BalanceTransaction[]> {
    try {
      const transactions = await this.stripe.balanceTransactions.list({
        created: {
          gte: Math.floor(params.startDate.getTime() / 1000),
          lte: Math.floor(params.endDate.getTime() / 1000),
        },
        limit: params.limit || 100,
      })

      return transactions.data.map((txn) => ({
        id: txn.id,
        type: this.mapTransactionType(txn.type),
        amountCents: txn.amount,
        feeCents: txn.fee,
        netCents: txn.net,
        currency: txn.currency.toUpperCase(),
        createdAt: new Date(txn.created * 1000),
        description: txn.description || undefined,
        sourceId: txn.source || undefined,
        status: txn.status === 'available' ? 'available' : 'pending',
      }))
    } catch (error) {
      throw this.handleStripeError(error)
    }
  }

  private mapStatus(
    status: Stripe.PaymentIntent.Status
  ): 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'failed' | 'pending' | 'cancelled' {
    switch (status) {
      case 'requires_payment_method':
      case 'requires_confirmation':
        return 'requires_confirmation'
      case 'requires_action':
        return 'requires_action'
      case 'processing':
        return 'processing'
      case 'succeeded':
        return 'succeeded'
      case 'canceled':
        return 'cancelled'
      default:
        return 'failed'
    }
  }

  private mapTransactionType(
    type: string
  ): 'charge' | 'refund' | 'adjustment' | 'payout' | 'fee' {
    if (type === 'charge' || type === 'payment') return 'charge'
    if (type === 'refund') return 'refund'
    if (type === 'adjustment') return 'adjustment'
    if (type === 'payout') return 'payout'
    return 'fee'
  }

  private handleStripeError(error: any): PaymentProviderError {
    if (error instanceof Stripe.errors.StripeError) {
      return new PaymentProviderError(
        error.message,
        error.code || 'stripe_error',
        error
      )
    }
    return new PaymentProviderError(
      error instanceof Error ? error.message : 'Unknown Stripe error',
      'unknown_error',
      error
    )
  }
}
