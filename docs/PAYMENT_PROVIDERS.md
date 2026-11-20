# Payment Provider Integration Guide

This document explains how to add a new payment provider to the donation system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Provider Interface](#provider-interface)
3. [Adding a New Provider](#adding-a-new-provider)
4. [Testing Your Provider](#testing-your-provider)
5. [Webhook Integration](#webhook-integration)
6. [Reconciliation](#reconciliation)
7. [Production Checklist](#production-checklist)

---

## Architecture Overview

The payment system uses an **adapter pattern** to abstract payment providers. This allows swapping providers without changing application code.

### Key Components

```
┌─────────────────────────────────────────────────────────┐
│  Payment Orchestrator                                    │
│  (Business logic, compliance, ledger)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  PaymentProvider Interface                               │
│  (createCheckout, confirm, refund, handleWebhook, etc.) │
└─────────────────┬───────────────────────────────────────┘
                  │
       ┌──────────┴──────────┬──────────────┐
       ▼                     ▼              ▼
┌─────────────┐      ┌─────────────┐   ┌─────────────┐
│   Stripe    │      │    Mock     │   │  Your New   │
│   Adapter   │      │   Adapter   │   │   Adapter   │
└─────────────┘      └─────────────┘   └─────────────┘
```

**Benefits:**
- **Single integration point**: Payment logic is centralized
- **Easy testing**: Mock provider for development
- **Simple swaps**: Change providers without touching business logic
- **Provider-specific features**: Each adapter handles its provider's quirks

---

## Provider Interface

All payment providers must implement the `PaymentProvider` interface.

### Required Methods

```typescript
export interface PaymentProvider {
  /**
   * Provider name (e.g., 'stripe', 'paypal', 'mock')
   */
  readonly name: string

  /**
   * Create a payment checkout session
   * 
   * Returns a client secret or redirect URL for frontend.
   */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>

  /**
   * Confirm a payment with payment method
   * 
   * Processes the actual charge.
   */
  confirm(params: ConfirmParams): Promise<ConfirmResult>

  /**
   * Retrieve payment details
   * 
   * Gets current status, amount, fees, etc.
   */
  retrieve(paymentIntentId: string): Promise<PaymentDetails>

  /**
   * Refund a payment (full or partial)
   * 
   * Returns refund ID and status.
   */
  refund(params: RefundParams): Promise<RefundResult>

  /**
   * Handle webhook event from provider
   * 
   * Verifies signature and returns parsed event.
   */
  handleWebhook(params: WebhookParams): Promise<WebhookResult>

  /**
   * Get balance transactions for reconciliation
   * 
   * Returns charges, refunds, fees from provider.
   */
  getBalanceTransactions(params: BalanceTransactionsParams): Promise<BalanceTransaction[]>
}
```

### Type Definitions

See `src/lib/payments/provider.ts` for full type definitions:

- `CreateCheckoutParams`: Amount, currency, metadata, idempotency key
- `CheckoutResult`: Payment intent ID, client secret, redirect URL
- `ConfirmParams`: Payment intent ID, payment method ID
- `ConfirmResult`: Status (succeeded/failed), failure reason
- `PaymentDetails`: Full payment info (status, amount, fees, timestamps)
- `RefundParams`: Payment intent ID, amount (optional for partial), reason
- `RefundResult`: Refund ID, status, amount, timestamp
- `WebhookParams`: Raw payload, signature header
- `WebhookResult`: Event ID, type, processed flag, data
- `BalanceTransactionsParams`: Date range, limit
- `BalanceTransaction`: Type, amount, fees, net, metadata

---

## Adding a New Provider

### Step 1: Create Provider File

Create a new file in `src/lib/payments/providers/<provider-name>.ts`.

**Template:**

```typescript
/**
 * <Provider Name> Payment Provider
 * 
 * Integration with <Provider> API.
 * Docs: https://provider.com/docs
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

export class YourProviderProvider implements PaymentProvider {
  readonly name = 'yourprovider'

  constructor(
    private apiKey: string,
    private webhookSecret: string
  ) {
    // Initialize provider SDK
    // Add test mode enforcement if needed
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // 1. Call provider API to create payment intent/session
    // 2. Handle errors
    // 3. Return paymentIntentId, clientSecret, or redirectUrl
    
    throw new Error('Not implemented')
  }

  async confirm(params: ConfirmParams): Promise<ConfirmResult> {
    // 1. Call provider API to confirm payment
    // 2. Handle success/failure
    // 3. Return status and optional failure reason
    
    throw new Error('Not implemented')
  }

  async retrieve(paymentIntentId: string): Promise<PaymentDetails> {
    // 1. Call provider API to get payment details
    // 2. Map to common PaymentDetails interface
    
    throw new Error('Not implemented')
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    // 1. Call provider API to create refund
    // 2. Return refund ID, status, amount
    
    throw new Error('Not implemented')
  }

  async handleWebhook(params: WebhookParams): Promise<WebhookResult> {
    // 1. Verify webhook signature
    // 2. Parse payload
    // 3. Return event data
    
    throw new Error('Not implemented')
  }

  async getBalanceTransactions(
    params: BalanceTransactionsParams
  ): Promise<BalanceTransaction[]> {
    // 1. Call provider API to get transactions
    // 2. Map to common BalanceTransaction interface
    
    throw new Error('Not implemented')
  }
}
```

### Step 2: Implement createCheckout

This method creates a payment session.

**Stripe Example:**

```typescript
async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
  try {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amountCents,
      currency: params.currency.toLowerCase(),
      metadata: params.metadata ?? {},
    }, {
      idempotencyKey: params.idempotencyKey,
    })

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret ?? undefined,
      redirectUrl: undefined, // Stripe uses client secret, not redirect
    }
  } catch (error: any) {
    throw new PaymentProviderError(
      'Failed to create payment intent',
      'CREATE_CHECKOUT_FAILED',
      { error: error.message }
    )
  }
}
```

**Key Points:**
- Support idempotency keys if provider supports them
- Return client secret for client-side SDKs (Stripe, Square)
- Return redirect URL for redirect-based flows (PayPal, some gateways)
- Store metadata for reconciliation

### Step 3: Implement confirm

This method confirms the payment.

**Stripe Example:**

```typescript
async confirm(params: ConfirmParams): Promise<ConfirmResult> {
  try {
    const paymentIntent = await this.stripe.paymentIntents.confirm(
      params.paymentIntentId,
      { payment_method: params.paymentMethodId }
    )

    if (paymentIntent.status === 'succeeded') {
      return {
        status: 'succeeded',
        confirmedAt: new Date(paymentIntent.created * 1000),
      }
    } else {
      return {
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message ?? 'unknown',
      }
    }
  } catch (error: any) {
    throw new PaymentProviderError(
      'Failed to confirm payment',
      'CONFIRM_FAILED',
      { error: error.message }
    )
  }
}
```

**Key Points:**
- Return `status: 'succeeded'` or `'failed'`
- Include `confirmedAt` timestamp for succeeded
- Include `failureReason` for failed
- Map provider-specific statuses to common interface

### Step 4: Implement retrieve

Get current payment status.

```typescript
async retrieve(paymentIntentId: string): Promise<PaymentDetails> {
  const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)

  return {
    id: paymentIntent.id,
    amountCents: paymentIntent.amount,
    currency: paymentIntent.currency.toUpperCase(),
    status: this.mapStatus(paymentIntent.status),
    paymentMethod: paymentIntent.payment_method as string | undefined,
    failureReason: paymentIntent.last_payment_error?.message,
    createdAt: new Date(paymentIntent.created * 1000),
    confirmedAt: paymentIntent.charges.data[0]?.created 
      ? new Date(paymentIntent.charges.data[0].created * 1000) 
      : undefined,
    metadata: paymentIntent.metadata,
  }
}

private mapStatus(
  stripeStatus: string
): 'pending' | 'succeeded' | 'failed' | 'refunded' {
  switch (stripeStatus) {
    case 'succeeded': return 'succeeded'
    case 'canceled':
    case 'failed': return 'failed'
    case 'processing':
    case 'requires_payment_method':
    case 'requires_confirmation':
    default: return 'pending'
  }
}
```

### Step 5: Implement refund

Process full or partial refunds.

```typescript
async refund(params: RefundParams): Promise<RefundResult> {
  const refund = await this.stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amountCents,
    reason: params.reason as any,
  })

  return {
    refundId: refund.id,
    status: refund.status === 'succeeded' ? 'succeeded' : 'failed',
    amountCents: refund.amount,
    refundedAt: new Date(refund.created * 1000),
  }
}
```

### Step 6: Implement handleWebhook

**CRITICAL**: This must verify webhook signatures to prevent fraud.

```typescript
async handleWebhook(params: WebhookParams): Promise<WebhookResult> {
  // Verify signature
  let event: any
  try {
    event = this.stripe.webhooks.constructEvent(
      params.payload,
      params.signature,
      this.webhookSecret
    )
  } catch (error: any) {
    throw new WebhookVerificationError(
      'Webhook signature verification failed',
      { error: error.message }
    )
  }

  // Return parsed event
  return {
    eventId: event.id,
    eventType: event.type,
    processed: true,
    data: event.data.object,
  }
}
```

**Key Points:**
- ALWAYS verify webhook signature
- Throw `WebhookVerificationError` if signature invalid
- Return `processed: false` for duplicate events (if detectable)
- Map provider event types to common names

### Step 7: Implement getBalanceTransactions

For reconciliation.

```typescript
async getBalanceTransactions(
  params: BalanceTransactionsParams
): Promise<BalanceTransaction[]> {
  const transactions = await this.stripe.balanceTransactions.list({
    created: {
      gte: Math.floor(params.startDate!.getTime() / 1000),
      lte: Math.floor(params.endDate!.getTime() / 1000),
    },
    limit: params.limit ?? 100,
  })

  return transactions.data.map(tx => ({
    id: tx.id,
    type: tx.type === 'charge' ? 'charge' : 
          tx.type === 'refund' ? 'refund' : 'other',
    amountCents: tx.amount,
    currency: tx.currency.toUpperCase(),
    feeCents: tx.fee,
    netCents: tx.net,
    createdAt: new Date(tx.created * 1000),
    description: tx.description ?? '',
    metadata: tx.source?.metadata ?? {},
  }))
}
```

### Step 8: Register in Factory

Add your provider to `src/lib/payments/factory.ts`:

```typescript
export function getPaymentProvider(providerName?: string): PaymentProvider {
  const name = providerName ?? process.env.PAYMENT_PROVIDER ?? 'mock'

  switch (name.toLowerCase()) {
    case 'stripe':
      const stripeKey = process.env.STRIPE_SECRET_KEY
      if (!stripeKey) throw new Error('STRIPE_SECRET_KEY required')
      cachedProvider = new StripeProvider(stripeKey)
      break

    case 'yourprovider':
      const apiKey = process.env.YOURPROVIDER_API_KEY
      const webhookSecret = process.env.YOURPROVIDER_WEBHOOK_SECRET
      if (!apiKey) throw new Error('YOURPROVIDER_API_KEY required')
      if (!webhookSecret) throw new Error('YOURPROVIDER_WEBHOOK_SECRET required')
      cachedProvider = new YourProviderProvider(apiKey, webhookSecret)
      break

    // ... other providers

    default:
      throw new Error(`Unknown payment provider: ${name}`)
  }

  return cachedProvider
}
```

### Step 9: Add Environment Variables

Update `.env.example`:

```env
# Payment Provider Selection
PAYMENT_PROVIDER=yourprovider  # Options: stripe, yourprovider, mock

# Your Provider
YOURPROVIDER_API_KEY=
YOURPROVIDER_WEBHOOK_SECRET=
```

---

## Testing Your Provider

### Unit Tests

Create `tests/unit/lib/payments/yourprovider.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { YourProviderProvider } from '@/lib/payments/providers/yourprovider'

describe('YourProviderProvider', () => {
  let provider: YourProviderProvider

  beforeEach(() => {
    provider = new YourProviderProvider('test_api_key', 'test_webhook_secret')
  })

  describe('createCheckout', () => {
    it('creates a payment intent', async () => {
      const result = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      expect(result.paymentIntentId).toBeDefined()
      expect(result.clientSecret || result.redirectUrl).toBeDefined()
    })
  })

  describe('confirm', () => {
    it('confirms a payment successfully', async () => {
      // Test successful confirmation
    })

    it('handles payment failures', async () => {
      // Test failed payment
    })
  })

  describe('refund', () => {
    it('processes a full refund', async () => {
      // Test full refund
    })

    it('processes a partial refund', async () => {
      // Test partial refund
    })
  })

  describe('handleWebhook', () => {
    it('verifies webhook signature', async () => {
      // Test signature verification
    })

    it('rejects invalid signatures', async () => {
      // Test invalid signature
    })
  })
})
```

### Integration Tests

Test the full flow with your provider's test mode:

```typescript
describe('Payment Flow with YourProvider', () => {
  it('completes a donation end-to-end', async () => {
    // 1. Create payment
    const payment = await createPayment({
      donor: testDonor,
      amountCents: 5000,
      currency: 'USD',
      eligibilityAttestations: testAttestations,
      isAnonymous: false,
    })

    // 2. Confirm payment
    const confirmed = await confirmPayment({
      paymentIntentId: payment.paymentIntentId,
      paymentMethodId: 'test_card_token',
    })

    expect(confirmed.status).toBe('SUCCEEDED')

    // 3. Verify ledger entries
    const entries = await getContributionLedgerEntries(confirmed.contributionId)
    expect(entries.length).toBeGreaterThan(0)

    // 4. Verify balance
    const balance = await getAvailableBalance()
    expect(balance.availableBalanceCents).toBeGreaterThan(0)
  })
})
```

---

## Webhook Integration

### Webhook Endpoint

The webhook endpoint is already built at:
```
POST /api/webhooks/[provider]
```

**Example:** For Stripe, configure webhook URL:
```
https://yourdomain.com/api/webhooks/stripe
```

### Provider Configuration

Configure webhooks in your provider's dashboard:

1. **Stripe**: Dashboard → Developers → Webhooks
2. **PayPal**: Dashboard → Apps & Credentials → Webhooks
3. **Square**: Dashboard → Webhooks → Add Endpoint

**Events to subscribe to:**
- Payment succeeded
- Payment failed
- Payment refunded
- Chargeback created
- Chargeback closed

### Webhook Security

- **Signature verification**: ALWAYS verify signatures
- **HTTPS only**: Never accept webhooks over HTTP
- **Idempotency**: Handle duplicate events gracefully
- **Timeout**: Process webhooks quickly (<30 seconds)

### Testing Webhooks Locally

Use provider CLIs to forward webhooks:

**Stripe:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**PayPal:**
```bash
# Use ngrok for PayPal
ngrok http 3000
# Configure webhook URL in PayPal dashboard
```

---

## Reconciliation

Your provider adapter must implement `getBalanceTransactions` for daily reconciliation.

### Balance Transaction Format

Map your provider's transaction format to:

```typescript
interface BalanceTransaction {
  id: string                       // Provider transaction ID
  type: 'charge' | 'refund' | 'other'
  amountCents: number              // Gross amount (positive for charge, negative for refund)
  currency: string                 // ISO currency code
  feeCents: number                 // Processing fee
  netCents: number                 // Net amount (amount - fee)
  createdAt: Date
  description: string
  metadata: Record<string, string> // MUST include paymentIntentId
}
```

**Key Points:**
- Include `paymentIntentId` in metadata for matching
- Refunds should have negative amounts
- Fees are always positive
- Net = amount - fee (or amount + fee for refunds)

### Reconciliation Process

Run daily via cron:

```typescript
import { runDailyReconciliation } from '@/lib/payments/reconciliation'

// In cron job or serverless function
await runDailyReconciliation()
```

Discrepancies are automatically flagged and stored for review.

---

## Production Checklist

Before launching with a new provider:

### 1. Security

- [ ] Webhook signature verification implemented
- [ ] API keys stored in environment variables (not code)
- [ ] Test mode enforcement for development
- [ ] HTTPS only for webhooks

### 2. Error Handling

- [ ] All API errors wrapped in `PaymentProviderError`
- [ ] Webhook verification errors use `WebhookVerificationError`
- [ ] Retry logic for transient failures
- [ ] Logging for all errors

### 3. Testing

- [ ] Unit tests for all methods
- [ ] Integration tests for full payment flow
- [ ] Webhook testing (success, failure, refund, chargeback)
- [ ] Idempotency testing
- [ ] Reconciliation testing

### 4. Compliance

- [ ] PCI-DSS compliance (no card data storage)
- [ ] Terms of service reviewed
- [ ] Prohibited use cases checked
- [ ] Country restrictions configured

### 5. Monitoring

- [ ] Error logging configured
- [ ] Webhook failures monitored
- [ ] Reconciliation reports reviewed
- [ ] Payment success rate tracked

### 6. Documentation

- [ ] Environment variables documented
- [ ] Webhook configuration documented
- [ ] Test mode instructions written
- [ ] Production deployment steps documented

---

## Example: PayPal Provider

Here's a minimal PayPal provider example:

```typescript
import type { PaymentProvider, CreateCheckoutParams, CheckoutResult } from '../provider'
import { PaymentProviderError } from '../provider'

export class PayPalProvider implements PaymentProvider {
  readonly name = 'paypal'

  constructor(
    private clientId: string,
    private clientSecret: string,
    private webhookId: string
  ) {}

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // Create PayPal order
    const order = await this.paypalClient.orders.create({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: params.currency,
          value: (params.amountCents / 100).toFixed(2),
        },
      }],
    })

    // PayPal uses redirect flow
    const approveLink = order.links.find(link => link.rel === 'approve')
    
    return {
      paymentIntentId: order.id,
      clientSecret: undefined,
      redirectUrl: approveLink?.href,
    }
  }

  async confirm(params: ConfirmParams): Promise<ConfirmResult> {
    // Capture PayPal order
    const capture = await this.paypalClient.orders.capture(params.paymentIntentId)

    if (capture.status === 'COMPLETED') {
      return {
        status: 'succeeded',
        confirmedAt: new Date(capture.create_time),
      }
    } else {
      return {
        status: 'failed',
        failureReason: capture.status,
      }
    }
  }

  // ... implement other methods
}
```

---

## Need Help?

- **Stripe Documentation**: https://stripe.com/docs/payments
- **PayPal Documentation**: https://developer.paypal.com/docs/checkout/
- **Square Documentation**: https://developer.squareup.com/docs/payments-api

For questions or issues, please open a GitHub issue.

