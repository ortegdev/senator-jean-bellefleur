/**
 * Field-Level Encryption for PII
 * 
 * Encrypts sensitive fields (name, email, phone) with AES-256-GCM
 * Creates blind indexes (SHA-256 HMAC) for searching without decryption
 * 
 * Usage:
 *   const encrypted = await encryptField('user@example.com', 'email')
 *   const blindIndex = createBlindIndex('user@example.com', 'email')
 *   const decrypted = await decryptField(encrypted, 'email')
 */

import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto'

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY
if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
  throw new Error('FIELD_ENCRYPTION_KEY must be a 32-byte hex string (64 characters)')
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex')

// Separate HMAC key for blind indexes (derived from encryption key)
const HMAC_KEY = createHmac('sha256', KEY_BUFFER).update('blind-index').digest()

/**
 * Encrypt a field value
 * 
 * Returns: base64-encoded string containing IV + auth tag + ciphertext
 * Format: <12-byte IV><16-byte auth tag><ciphertext>
 */
export async function encryptField(plaintext: string, fieldName: string): Promise<string> {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty value')
  }
  
  // Generate random IV (12 bytes for GCM)
  const iv = randomBytes(12)
  
  // Create cipher (AES-256-GCM)
  const cipher = createCipheriv('aes-256-gcm', KEY_BUFFER, iv)
  
  // Add authenticated data (field name, prevents ciphertext swapping between fields)
  cipher.setAAD(Buffer.from(fieldName, 'utf8'))
  
  // Encrypt
  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])
  
  // Get auth tag (16 bytes)
  const authTag = cipher.getAuthTag()
  
  // Combine: IV + auth tag + ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted])
  
  // Return as base64
  return combined.toString('base64')
}

/**
 * Decrypt a field value
 * 
 * Input: base64-encoded string from encryptField
 * Returns: original plaintext
 */
export async function decryptField(ciphertext: string, fieldName: string): Promise<string> {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty value')
  }
  
  // Decode from base64
  const combined = Buffer.from(ciphertext, 'base64')
  
  // Extract components
  const iv = combined.slice(0, 12)
  const authTag = combined.slice(12, 28)
  const encrypted = combined.slice(28)
  
  // Create decipher
  const decipher = createDecipheriv('aes-256-gcm', KEY_BUFFER, iv)
  
  // Set auth tag and AAD
  decipher.setAuthTag(authTag)
  decipher.setAAD(Buffer.from(fieldName, 'utf8'))
  
  // Decrypt
  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  
  return decrypted.toString('utf8')
}

/**
 * Create blind index for searching
 * 
 * Uses HMAC-SHA256 with field-specific salts
 * Cannot be reversed to get original value
 * Consistent for same input (allows exact-match searches)
 * 
 * Returns: hex-encoded hash
 */
export function createBlindIndex(value: string, fieldName: string): string {
  if (!value) {
    throw new Error('Cannot create blind index for empty value')
  }
  
  // Normalize value (lowercase, trim)
  const normalized = value.toLowerCase().trim()
  
  // Create HMAC with field-specific salt
  const hmac = createHmac('sha256', HMAC_KEY)
  hmac.update(fieldName) // Salt with field name
  hmac.update(normalized)
  
  // Return as hex
  return hmac.digest('hex')
}

/**
 * Encrypt email with blind index
 */
export async function encryptEmail(email: string): Promise<{
  encrypted: string
  blindIndex: string
}> {
  return {
    encrypted: await encryptField(email, 'email'),
    blindIndex: createBlindIndex(email, 'email'),
  }
}

/**
 * Encrypt phone with blind index
 * 
 * Phone must be in E.164 format (+1234567890)
 */
export async function encryptPhone(phone: string): Promise<{
  encrypted: string
  blindIndex: string
}> {
  // Validate E.164 format
  if (!phone.match(/^\+[1-9]\d{1,14}$/)) {
    throw new Error('Phone must be in E.164 format (e.g., +15551234567)')
  }
  
  return {
    encrypted: await encryptField(phone, 'phone'),
    blindIndex: createBlindIndex(phone, 'phone'),
  }
}

/**
 * Encrypt name (no blind index needed)
 */
export async function encryptName(name: string): Promise<string> {
  return encryptField(name, 'name')
}

/**
 * Decrypt email
 */
export async function decryptEmail(encrypted: string): Promise<string> {
  return decryptField(encrypted, 'email')
}

/**
 * Decrypt phone
 */
export async function decryptPhone(encrypted: string): Promise<string> {
  return decryptField(encrypted, 'phone')
}

/**
 * Decrypt name
 */
export async function decryptName(encrypted: string): Promise<string> {
  return decryptField(encrypted, 'name')
}

/**
 * Find contact by email (using blind index)
 */
export function getEmailBlindIndex(email: string): string {
  return createBlindIndex(email, 'email')
}

/**
 * Find contact by phone (using blind index)
 */
export function getPhoneBlindIndex(phone: string): string {
  return createBlindIndex(phone, 'phone')
}

/**
 * Validate encryption key on startup
 */
export function validateEncryptionKey(): void {
  try {
    const testValue = 'test@example.com'
    const encrypted = Buffer.from(randomBytes(60)).toString('base64') // Simulate encrypted value
    
    // Verify key format
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
      throw new Error('FIELD_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    }
    
    // Verify key is valid hex
    if (!/^[0-9a-f]{64}$/i.test(ENCRYPTION_KEY)) {
      throw new Error('FIELD_ENCRYPTION_KEY must be hexadecimal')
    }
    
    console.log('✓ Field encryption key validated')
  } catch (error) {
    console.error('❌ Field encryption key validation failed:', error)
    throw error
  }
}
