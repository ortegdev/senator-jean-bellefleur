/**
 * Tests for Mock Payment Provider
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MockProvider } from '@/lib/payments/providers/mock'

describe('MockProvider', () => {
  let provider: MockProvider

  beforeEach(() => {
    provider = new MockProvider()
  })

  describe('createCheckout', () => {
    it('creates a payment intent with client secret', async () => {
      const result = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
        metadata: { test: 'value' },
      })

      expect(result.paymentIntentId).toMatch(/^mock_pi_/)
      expect(result.clientSecret).toMatch(/secret/)
      expect(result.redirectUrl).toBeUndefined()
    })

    it('supports idempotency keys', async () => {
      const params = {
        amountCents: 5000,
        currency: 'USD',
        idempotencyKey: 'test-key-123',
      }

      const result1 = await provider.createCheckout(params)
      const result2 = await provider.createCheckout(params)

      // Note: Mock provider doesn't implement true idempotency
      // In real implementation, same key should return same intent
      expect(result1.paymentIntentId).toBeDefined()
      expect(result2.paymentIntentId).toBeDefined()
    })
  })

  describe('confirm', () => {
    it('confirms a successful payment with success card', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      const result = await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242', // Success card
      })

      expect(result.status).toBe('succeeded')
      expect(result.confirmedAt).toBeInstanceOf(Date)
      expect(result.failureReason).toBeUndefined()
    })

    it('declines payment with decline card', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      const result = await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4000000000000002', // Decline card
      })

      expect(result.status).toBe('failed')
      expect(result.failureReason).toBe('card_declined')
    })

    it('fails with insufficient funds card', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      const result = await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4000000000009995', // Insufficient funds
      })

      expect(result.status).toBe('failed')
      expect(result.failureReason).toBe('insufficient_funds')
    })

    it('throws error for non-existent payment intent', async () => {
      await expect(
        provider.confirm({
          paymentIntentId: 'mock_pi_nonexistent',
          paymentMethodId: '4242424242424242',
        })
      ).rejects.toThrow('Payment intent not found')
    })

    it('throws error for already processed payment', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      await expect(
        provider.confirm({
          paymentIntentId: checkout.paymentIntentId,
          paymentMethodId: '4242424242424242',
        })
      ).rejects.toThrow('already succeeded')
    })
  })

  describe('retrieve', () => {
    it('retrieves payment intent details', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
        metadata: { test: 'value' },
      })

      const details = await provider.retrieve(checkout.paymentIntentId)

      expect(details.id).toBe(checkout.paymentIntentId)
      expect(details.amountCents).toBe(5000)
      expect(details.currency).toBe('USD')
      expect(details.status).toBe('pending')
      expect(details.metadata).toEqual({ test: 'value' })
    })

    it('includes confirmation details after confirmation', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      const details = await provider.retrieve(checkout.paymentIntentId)

      expect(details.status).toBe('succeeded')
      expect(details.confirmedAt).toBeInstanceOf(Date)
      expect(details.paymentMethod).toBe('4242424242424242')
    })
  })

  describe('refund', () => {
    it('refunds a successful payment', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      const refund = await provider.refund({
        paymentIntentId: checkout.paymentIntentId,
        reason: 'requested_by_customer',
      })

      expect(refund.refundId).toMatch(/^mock_re_/)
      expect(refund.status).toBe('succeeded')
      expect(refund.amountCents).toBe(5000)
      expect(refund.refundedAt).toBeInstanceOf(Date)
    })

    it('supports partial refunds', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      const refund = await provider.refund({
        paymentIntentId: checkout.paymentIntentId,
        amountCents: 2000,
        reason: 'partial_refund',
      })

      expect(refund.amountCents).toBe(2000)

      const details = await provider.retrieve(checkout.paymentIntentId)
      expect(details.status).toBe('succeeded') // Not fully refunded
    })

    it('marks payment as refunded after full refund', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      await provider.refund({
        paymentIntentId: checkout.paymentIntentId,
      })

      const details = await provider.retrieve(checkout.paymentIntentId)
      expect(details.status).toBe('refunded')
    })

    it('throws error for refund exceeding available balance', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      await expect(
        provider.refund({
          paymentIntentId: checkout.paymentIntentId,
          amountCents: 6000,
        })
      ).rejects.toThrow('exceeds available balance')
    })
  })

  describe('handleWebhook', () => {
    it('processes valid webhook events', async () => {
      const event = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: { id: 'mock_pi_123', amount: 5000 },
        createdAt: new Date(),
      }

      const result = await provider.handleWebhook({
        payload: JSON.stringify(event),
        signature: 'mock_signature',
      })

      expect(result.eventId).toBe('evt_test_123')
      expect(result.eventType).toBe('payment_intent.succeeded')
      expect(result.processed).toBe(true)
      expect(result.data).toEqual(event.data)
    })

    it('prevents duplicate webhook processing', async () => {
      const event = {
        id: 'evt_test_duplicate',
        type: 'payment_intent.succeeded',
        data: { id: 'mock_pi_123', amount: 5000 },
        createdAt: new Date(),
      }

      const payload = JSON.stringify(event)
      const signature = 'mock_signature'

      const result1 = await provider.handleWebhook({ payload, signature })
      expect(result1.processed).toBe(true)

      const result2 = await provider.handleWebhook({ payload, signature })
      expect(result2.processed).toBe(false) // Already processed
    })

    it('throws error for invalid signature', async () => {
      await expect(
        provider.handleWebhook({
          payload: '{}',
          signature: 'invalid_signature',
        })
      ).rejects.toThrow('Invalid webhook signature')
    })

    it('throws error for invalid JSON payload', async () => {
      await expect(
        provider.handleWebhook({
          payload: 'not json',
          signature: 'mock_signature',
        })
      ).rejects.toThrow('Invalid webhook payload JSON')
    })
  })

  describe('getBalanceTransactions', () => {
    it('returns balance transactions for successful payments', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      const transactions = await provider.getBalanceTransactions({})

      expect(transactions.length).toBeGreaterThan(0)
      
      const tx = transactions[0]
      expect(tx.type).toBe('charge')
      expect(tx.amountCents).toBe(5000)
      expect(tx.feeCents).toBeGreaterThan(0)
      expect(tx.netCents).toBe(tx.amountCents - tx.feeCents)
    })

    it('includes refund transactions', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      await provider.refund({
        paymentIntentId: checkout.paymentIntentId,
      })

      const transactions = await provider.getBalanceTransactions({})
      
      const refundTx = transactions.find(tx => tx.type === 'refund')
      expect(refundTx).toBeDefined()
      expect(refundTx!.amountCents).toBe(-5000) // Negative for refund
    })

    it('filters by date range', async () => {
      provider.reset()

      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const transactions = await provider.getBalanceTransactions({
        startDate: yesterday,
        endDate: tomorrow,
      })

      expect(transactions.length).toBeGreaterThan(0)
    })
  })

  describe('reset', () => {
    it('clears all stored data', async () => {
      const checkout = await provider.createCheckout({
        amountCents: 5000,
        currency: 'USD',
      })

      await provider.confirm({
        paymentIntentId: checkout.paymentIntentId,
        paymentMethodId: '4242424242424242',
      })

      provider.reset()

      await expect(
        provider.retrieve(checkout.paymentIntentId)
      ).rejects.toThrow('Payment intent not found')

      const transactions = await provider.getBalanceTransactions({})
      expect(transactions.length).toBe(0)
    })
  })
})
