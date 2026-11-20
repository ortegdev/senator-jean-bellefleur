/**
 * Delivery Worker
 * 
 * Processes message delivery jobs in small, resumable batches
 * Handles retries, rate limits, quiet hours, and provider errors
 * 
 * Design:
 * - Postgres-backed queue (DeliveryJob table)
 * - Batch processing (100 recipients at a time)
 * - Idempotent sends (idempotency keys)
 * - Resumable after failures
 * - Time-zone aware quiet hours
 * - Per-provider rate limiting
 */

import { prisma } from '@/lib/db/prisma'
import { getAdapter } from '@/lib/communications/adapters'
import { isInQuietHours, getNextAvailableSendTime } from './quiet-hours'
import { decryptEmail, decryptPhone, decryptName } from '@/lib/crypto/field-encryption'
import type { 
  DeliveryJob, 
  DeliveryJobStatus,
  CommunicationChannel 
} from '@prisma/client'

const BATCH_SIZE = 100
const MAX_RETRIES = 3
const RATE_LIMIT_DELAY_MS = 100 // 100ms between sends (10/sec)

export interface DeliveryProgress {
  jobId: string
  processed: number
  succeeded: number
  failed: number
  skipped: number
  total: number
  status: DeliveryJobStatus
}

/**
 * Process a delivery job
 * 
 * @param jobId - Delivery job ID
 * @returns Progress information
 */
export async function processDeliveryJob(jobId: string): Promise<DeliveryProgress> {
  // Get job
  const job = await prisma.deliveryJob.findUnique({
    where: { id: jobId },
    include: {
      message: {
        include: {
          variants: true,
        },
      },
    },
  })
  
  if (!job) {
    throw new Error(`Delivery job ${jobId} not found`)
  }
  
  // Check if already completed or cancelled
  if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
    return jobToProgress(job)
  }
  
  // Mark as running
  await prisma.deliveryJob.update({
    where: { id: jobId },
    data: {
      status: 'RUNNING',
      startedAt: job.startedAt || new Date(),
    },
  })
  
  try {
    // Process in batches
    let batchIndex = job.batchStartIndex
    const totalRecipients = job.recipientContactIds.length
    
    while (batchIndex < totalRecipients) {
      const batchEnd = Math.min(batchIndex + BATCH_SIZE, totalRecipients)
      const batchContactIds = job.recipientContactIds.slice(batchIndex, batchEnd)
      
      // Process batch
      const batchResult = await processBatch(
        job.id,
        job.messageId,
        job.channel,
        job.locale,
        batchContactIds
      )
      
      // Update job progress
      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          batchStartIndex: batchEnd,
          processedCount: {
            increment: batchResult.processed,
          },
          successCount: {
            increment: batchResult.succeeded,
          },
          failedCount: {
            increment: batchResult.failed,
          },
          skippedCount: {
            increment: batchResult.skipped,
          },
        },
      })
      
      batchIndex = batchEnd
      
      // Small delay between batches for rate limiting
      await sleep(RATE_LIMIT_DELAY_MS)
    }
    
    // Mark job as completed
    await prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })
    
    // Get final job state
    const finalJob = await prisma.deliveryJob.findUnique({
      where: { id: jobId },
    })
    
    return jobToProgress(finalJob!)
  } catch (error) {
    console.error('[DeliveryWorker] Job failed:', jobId, error)
    
    // Retry or mark as failed
    const retryCount = job.retryCount + 1
    
    if (retryCount < MAX_RETRIES) {
      // Retry later
      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: 'PENDING',
          retryCount,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    } else {
      // Max retries reached, mark as failed
      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }
    
    throw error
  }
}

/**
 * Process a batch of recipients
 */
async function processBatch(
  jobId: string,
  messageId: string,
  channel: CommunicationChannel,
  locale: string,
  contactIds: string[]
): Promise<{
  processed: number
  succeeded: number
  failed: number
  skipped: number
}> {
  let succeeded = 0
  let failed = 0
  let skipped = 0
  
  // Get message variant
  const variant = await prisma.messageVariant.findFirst({
    where: {
      messageId,
      channel,
      locale,
    },
  })
  
  if (!variant) {
    throw new Error(`No variant found for message ${messageId}, channel ${channel}, locale ${locale}`)
  }
  
  // Get channel adapter
  const adapter = getAdapter(channel)
  if (!adapter) {
    throw new Error(`No adapter found for channel ${channel}`)
  }
  
  // Process each contact
  for (const contactId of contactIds) {
    try {
      // Get contact
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
      })
      
      if (!contact) {
        skipped++
        continue
      }
      
      // Decrypt contact info
      const email = contact.emailEncrypted ? await decryptEmail(contact.emailEncrypted) : null
      const phone = contact.phoneEncrypted ? await decryptPhone(contact.phoneEncrypted) : null
      const name = contact.nameEncrypted ? await decryptName(contact.nameEncrypted) : null
      
      // Check quiet hours
      if (isInQuietHours(contact.country, null, channel)) {
        const deferredUntil = getNextAvailableSendTime(contact.country, null, channel)
        
        // Create deferred send record
        await createSendRecord(
          messageId,
          contactId,
          channel,
          locale,
          'DEFERRED',
          null,
          deferredUntil
        )
        
        skipped++
        continue
      }
      
      // Check for existing send (idempotency)
      const idempotencyKey = `${messageId}:${contactId}:${channel}`
      const existingSend = await prisma.messageSendRecord.findUnique({
        where: { idempotencyKey },
      })
      
      if (existingSend) {
        // Already sent, skip
        skipped++
        continue
      }
      
      // Build message content
      const content = buildMessageContent(variant, channel, name)
      
      // Send via adapter
      const result = await adapter.send(
        { email: email || undefined, phone: phone || undefined, name: name || undefined, locale },
        content,
        variant.message!.topic
      )
      
      // Create send record
      if (result.success) {
        await createSendRecord(
          messageId,
          contactId,
          channel,
          locale,
          'SENT',
          result.messageId,
          null,
          idempotencyKey
        )
        succeeded++
      } else {
        await createSendRecord(
          messageId,
          contactId,
          channel,
          locale,
          'FAILED',
          null,
          null,
          idempotencyKey,
          result.error
        )
        failed++
      }
      
      // Small delay for rate limiting
      await sleep(RATE_LIMIT_DELAY_MS)
    } catch (error) {
      console.error('[DeliveryWorker] Recipient send failed:', contactId, error)
      failed++
    }
  }
  
  return {
    processed: contactIds.length,
    succeeded,
    failed,
    skipped,
  }
}

/**
 * Build message content from variant
 */
function buildMessageContent(
  variant: any,
  channel: CommunicationChannel,
  recipientName: string | null
): any {
  switch (channel) {
    case 'EMAIL':
      return {
        subject: variant.emailSubject,
        body: variant.emailBodyText || '',
        bodyHtml: variant.emailBodyHtml,
      }
    
    case 'SMS':
      return {
        body: variant.smsBody || '',
      }
    
    case 'TELEGRAM':
      return {
        body: variant.telegramBody || '',
      }
    
    case 'WEB_PUSH':
      return {
        subject: variant.webPushTitle,
        body: variant.webPushBody || '',
      }
    
    default:
      throw new Error(`Unsupported channel: ${channel}`)
  }
}

/**
 * Create message send record
 */
async function createSendRecord(
  messageId: string,
  contactId: string,
  channel: CommunicationChannel,
  locale: string,
  status: any,
  providerMessageId: string | null,
  deferredUntil: Date | null,
  idempotencyKey?: string,
  failureReason?: string
): Promise<void> {
  const key = idempotencyKey || `${messageId}:${contactId}:${channel}`
  
  await prisma.messageSendRecord.create({
    data: {
      messageId,
      contactId,
      channel,
      locale,
      status,
      providerMessageId,
      deferredUntil,
      idempotencyKey: key,
      sentAt: status === 'SENT' ? new Date() : null,
      failedAt: status === 'FAILED' ? new Date() : null,
      failureReason,
    },
  })
}

/**
 * Convert job to progress object
 */
function jobToProgress(job: DeliveryJob): DeliveryProgress {
  return {
    jobId: job.id,
    processed: job.processedCount,
    succeeded: job.successCount,
    failed: job.failedCount,
    skipped: job.skippedCount,
    total: job.recipientContactIds.length,
    status: job.status,
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get all pending jobs
 */
export async function getPendingJobs(): Promise<DeliveryJob[]> {
  return prisma.deliveryJob.findMany({
    where: {
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

/**
 * Cancel a delivery job
 */
export async function cancelDeliveryJob(jobId: string): Promise<void> {
  await prisma.deliveryJob.update({
    where: { id: jobId },
    data: {
      status: 'CANCELLED',
    },
  })
}

/**
 * Resume failed job (reset to pending)
 */
export async function resumeDeliveryJob(jobId: string): Promise<void> {
  await prisma.deliveryJob.update({
    where: { id: jobId },
    data: {
      status: 'PENDING',
      error: null,
    },
  })
}
