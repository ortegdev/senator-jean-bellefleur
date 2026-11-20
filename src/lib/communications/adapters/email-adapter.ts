/**
 * Email Adapter
 * 
 * Sends emails via configured provider (Resend, Postmark, etc.)
 * Handles double opt-in, bounces, complaints
 */

import type {
  ChannelAdapter,
  AdapterCapabilities,
  RecipientInfo,
  MessageContent,
  SendResult,
  ValidationResult,
  HealthCheckResult,
  WebhookPayload,
} from './types'
import type { CommunicationChannel, CommunicationTopic } from '@prisma/client'

// Email validation regex (basic)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export class EmailAdapter implements ChannelAdapter {
  channel: CommunicationChannel = 'EMAIL'
  
  private provider: string
  private apiKey: string
  private fromEmail: string
  private fromName: string
  
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'resend'
    this.apiKey = process.env.EMAIL_API_KEY || ''
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS || 'hello@example.com'
    this.fromName = process.env.EMAIL_FROM_NAME || 'Diaspora4Bellefleur'
  }
  
  capabilities(): AdapterCapabilities {
    return {
      supportsRichText: true,
      supportsAttachments: true,
      supportsScheduling: false,
      requiresDoubleOptIn: true,
      maxMessageLength: undefined, // No hard limit
      quietHoursEnforced: false,
    }
  }
  
  async validateRecipient(recipient: RecipientInfo): Promise<ValidationResult> {
    if (!recipient.email) {
      return {
        valid: false,
        error: 'Email address is required',
      }
    }
    
    const email = recipient.email.toLowerCase().trim()
    
    if (!EMAIL_REGEX.test(email)) {
      return {
        valid: false,
        error: 'Invalid email format',
      }
    }
    
    // Basic domain checks (optional: can add MX record lookup)
    const domain = email.split('@')[1]
    if (!domain || domain.includes('..') || domain.startsWith('.')) {
      return {
        valid: false,
        error: 'Invalid email domain',
      }
    }
    
    return {
      valid: true,
      normalized: email,
    }
  }
  
  async send(
    recipient: RecipientInfo,
    content: MessageContent,
    topic: CommunicationTopic
  ): Promise<SendResult> {
    // Validate recipient
    const validation = await this.validateRecipient(recipient)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }
    
    // Check adapter is enabled
    const enabled = process.env.CHANNEL_EMAIL_ENABLED === 'true'
    if (!enabled) {
      return {
        success: false,
        error: 'Email channel is disabled',
      }
    }
    
    try {
      // Send via provider (mock for now, implement real provider later)
      const messageId = await this.sendViaProvider(
        validation.normalized!,
        recipient.name || '',
        content
      )
      
      return {
        success: true,
        messageId,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
  
  private async sendViaProvider(
    to: string,
    toName: string,
    content: MessageContent
  ): Promise<string> {
    // TODO: Implement real provider (Resend, Postmark, etc.)
    // For now, just log
    console.log('[EMAIL] Sending to:', to, toName)
    console.log('[EMAIL] Subject:', content.subject)
    console.log('[EMAIL] Body length:', content.body.length)
    
    // Mock message ID
    return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
  
  async handleWebhook(payload: unknown, signature?: string): Promise<WebhookPayload> {
    // TODO: Implement provider-specific webhook parsing
    // For now, return mock
    return {
      provider: this.provider,
      eventType: 'delivered',
      timestamp: new Date(),
      raw: payload,
    }
  }
  
  async healthCheck(): Promise<HealthCheckResult> {
    // Check required config
    if (!this.apiKey) {
      return {
        healthy: false,
        error: 'EMAIL_API_KEY not configured',
      }
    }
    
    if (!this.fromEmail || !EMAIL_REGEX.test(this.fromEmail)) {
      return {
        healthy: false,
        error: 'EMAIL_FROM_ADDRESS not configured or invalid',
      }
    }
    
    const enabled = process.env.CHANNEL_EMAIL_ENABLED === 'true'
    if (!enabled) {
      return {
        healthy: false,
        error: 'Email channel is disabled (CHANNEL_EMAIL_ENABLED=false)',
      }
    }
    
    return {
      healthy: true,
      details: {
        provider: this.provider,
        from: this.fromEmail,
      },
    }
  }
}
