/**
 * SMS Adapter (Stub)
 * 
 * OFF by default, requires compliance checklist
 * Uses Twilio when enabled
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

// E.164 phone validation regex
const E164_REGEX = /^\+[1-9]\d{1,14}$/

export class SMSAdapter implements ChannelAdapter {
  channel: CommunicationChannel = 'SMS'
  
  private accountSid: string
  private authToken: string
  private fromNumber: string
  
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || ''
    this.authToken = process.env.TWILIO_AUTH_TOKEN || ''
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || ''
  }
  
  capabilities(): AdapterCapabilities {
    return {
      supportsRichText: false,
      supportsAttachments: false,
      supportsScheduling: false,
      requiresDoubleOptIn: true,
      maxMessageLength: 160, // Standard SMS length
      quietHoursEnforced: true, // 8am-8pm local time
    }
  }
  
  async validateRecipient(recipient: RecipientInfo): Promise<ValidationResult> {
    if (!recipient.phone) {
      return {
        valid: false,
        error: 'Phone number is required',
      }
    }
    
    // Must be E.164 format
    if (!E164_REGEX.test(recipient.phone)) {
      return {
        valid: false,
        error: 'Phone must be in E.164 format (e.g., +15551234567)',
      }
    }
    
    return {
      valid: true,
      normalized: recipient.phone,
    }
  }
  
  async send(
    recipient: RecipientInfo,
    content: MessageContent,
    topic: CommunicationTopic
  ): Promise<SendResult> {
    // Check enabled
    const enabled = process.env.CHANNEL_SMS_ENABLED === 'true'
    if (!enabled) {
      return {
        success: false,
        error: 'SMS channel is disabled. Complete compliance checklist first.',
      }
    }
    
    // Validate recipient
    const validation = await this.validateRecipient(recipient)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }
    
    // Check message length
    if (content.body.length > 160) {
      return {
        success: false,
        error: `Message too long (${content.body.length} chars, max 160)`,
      }
    }
    
    // TODO: Check quiet hours (8am-8pm recipient local time)
    // For now, just warn
    console.warn('[SMS] Quiet hours not yet implemented')
    
    try {
      // Send via Twilio (mock for now)
      const messageId = await this.sendViaTwilio(
        validation.normalized!,
        content.body
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
  
  private async sendViaTwilio(to: string, body: string): Promise<string> {
    // TODO: Implement real Twilio send
    // For now, just log
    console.log('[SMS] Sending to:', to)
    console.log('[SMS] Body:', body)
    
    // Mock message ID
    return `mock_sms_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
  
  async handleWebhook(payload: unknown, signature?: string): Promise<WebhookPayload> {
    // TODO: Implement Twilio webhook parsing
    return {
      provider: 'twilio',
      eventType: 'delivered',
      timestamp: new Date(),
      raw: payload,
    }
  }
  
  async healthCheck(): Promise<HealthCheckResult> {
    const enabled = process.env.CHANNEL_SMS_ENABLED === 'true'
    
    if (!enabled) {
      return {
        healthy: false,
        error: 'SMS channel is disabled (requires compliance checklist)',
        details: {
          checklistUrl: '/admin/channels/sms/checklist',
        },
      }
    }
    
    if (!this.accountSid || !this.authToken) {
      return {
        healthy: false,
        error: 'Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)',
      }
    }
    
    if (!this.fromNumber || !E164_REGEX.test(this.fromNumber)) {
      return {
        healthy: false,
        error: 'Twilio phone number not configured or invalid (TWILIO_PHONE_NUMBER)',
      }
    }
    
    return {
      healthy: true,
      details: {
        provider: 'twilio',
        from: this.fromNumber,
      },
    }
  }
}
