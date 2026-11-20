/**
 * Channel Adapters Registry
 * 
 * Exports all adapters and initialization
 */

export * from './types'
export { EmailAdapter } from './email-adapter'
export { SMSAdapter } from './sms-adapter'

import { registerAdapter } from './types'
import { EmailAdapter } from './email-adapter'
import { SMSAdapter } from './sms-adapter'

/**
 * Initialize all adapters
 * 
 * Call this on app startup
 */
export function initializeAdapters(): void {
  // Register email adapter
  registerAdapter(new EmailAdapter())
  
  // Register SMS adapter (OFF by default)
  registerAdapter(new SMSAdapter())
  
  // TODO: Register other adapters (Telegram, WebPush) when implemented
  
  console.log('✓ Communication adapters initialized')
}
