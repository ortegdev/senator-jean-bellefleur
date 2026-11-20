/**
 * Channel Adapter Types
 * 
 * Common interface for all communication channels
 */

import type { CommunicationChannel, CommunicationTopic } from '@prisma/client'

export interface AdapterCapabilities {
  supportsRichText: boolean
  supportsAttachments: boolean
  supportsScheduling: boolean
  requiresDoubleOptIn: boolean
  maxMessageLength?: number
  quietHoursEnforced: boolean
}

export interface RecipientInfo {
  email?: string
  phone?: string
  name?: string
  locale?: string
}

export interface MessageContent {
  subject?: string
  body: string
  bodyHtml?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
  suppressed?: boolean
  bounced?: boolean
}

export interface ValidationResult {
  valid: boolean
  error?: string
  normalized?: string // Normalized address (e.g., E.164 phone)
}

export interface HealthCheckResult {
  healthy: boolean
  error?: string
  details?: Record<string, unknown>
}

export interface WebhookPayload {
  provider: string
  eventType: string
  messageId?: string
  recipient?: string
  status?: 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked'
  bounceType?: 'hard' | 'soft' | 'complaint'
  timestamp: Date
  raw: unknown
}

/**
 * Channel Adapter Interface
 * 
 * All adapters MUST implement this interface
 */
export interface ChannelAdapter {
  channel: CommunicationChannel
  
  /**
   * Get adapter capabilities
   */
  capabilities(): AdapterCapabilities
  
  /**
   * Validate recipient address/identifier
   * 
   * Returns normalized version if valid
   */
  validateRecipient(recipient: RecipientInfo): Promise<ValidationResult>
  
  /**
   * Send message
   * 
   * Must check consent and suppression before calling this
   */
  send(
    recipient: RecipientInfo,
    content: MessageContent,
    topic: CommunicationTopic
  ): Promise<SendResult>
  
  /**
   * Handle incoming webhook from provider
   * 
   * Returns normalized webhook payload
   */
  handleWebhook(payload: unknown, signature?: string): Promise<WebhookPayload>
  
  /**
   * Health check
   * 
   * Verify adapter is configured and operational
   */
  healthCheck(): Promise<HealthCheckResult>
}

/**
 * Adapter registry
 */
export const ADAPTERS = new Map<CommunicationChannel, ChannelAdapter>()

/**
 * Register adapter
 */
export function registerAdapter(adapter: ChannelAdapter): void {
  ADAPTERS.set(adapter.channel, adapter)
}

/**
 * Get adapter by channel
 */
export function getAdapter(channel: CommunicationChannel): ChannelAdapter | null {
  return ADAPTERS.get(channel) || null
}
