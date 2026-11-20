/**
 * Field-Level Encryption for Sensitive Donor Data
 * 
 * Uses separate encryption keys for names and emails.
 * Creates blind indexes (keyed hashes) for searchable fields without weakening encryption.
 * 
 * SECURITY:
 * - AES-256-GCM for encryption (authenticated encryption)
 * - Separate keys for data and blind indexes
 * - Keys stored in environment variables, NEVER in code or database
 * - Blind indexes use HMAC-SHA256 with normalized input
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 16

interface EncryptionKeys {
  nameKey: Buffer
  emailKey: Buffer
  blindIndexKey: Buffer
}

/**
 * Get encryption keys from environment
 * CRITICAL: These must be 32-byte (256-bit) keys stored securely
 */
function getEncryptionKeys(): EncryptionKeys {
  const nameKey = process.env.DONOR_NAME_ENCRYPTION_KEY
  const emailKey = process.env.DONOR_EMAIL_ENCRYPTION_KEY
  const blindIndexKey = process.env.BLIND_INDEX_KEY

  if (!nameKey || !emailKey || !blindIndexKey) {
    throw new Error(
      'Missing encryption keys. Set DONOR_NAME_ENCRYPTION_KEY, DONOR_EMAIL_ENCRYPTION_KEY, and BLIND_INDEX_KEY'
    )
  }

  // Keys should be hex-encoded 32-byte keys
  return {
    nameKey: Buffer.from(nameKey, 'hex'),
    emailKey: Buffer.from(emailKey, 'hex'),
    blindIndexKey: Buffer.from(blindIndexKey, 'hex'),
  }
}

/**
 * Encrypt a field value
 * Returns: base64-encoded string containing: salt + iv + authTag + ciphertext
 */
export function encryptField(plaintext: string, key: Buffer): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)

  // Derive key with salt for additional security
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256')

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)

  let encrypted = cipher.update(plaintext, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])
  const authTag = cipher.getAuthTag()

  // Combine: salt + iv + authTag + encrypted
  const combined = Buffer.concat([salt, iv, authTag, encrypted])

  return combined.toString('base64')
}

/**
 * Decrypt a field value
 */
export function decryptField(ciphertext: string, key: Buffer): string {
  const combined = Buffer.from(ciphertext, 'base64')

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH)
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  )
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)

  // Derive key with salt
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256')

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Normalize email for blind index
 * - Lowercase
 * - Trim whitespace
 * - Remove dots in Gmail addresses (foo.bar@gmail.com === foobar@gmail.com)
 */
export function normalizeEmail(email: string): string {
  let normalized = email.toLowerCase().trim()

  // Gmail dot normalization
  const [localPart, domain] = normalized.split('@')
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    normalized = localPart.replace(/\./g, '') + '@' + domain
  }

  return normalized
}

/**
 * Normalize name for blind index
 * - Lowercase
 * - Trim whitespace
 * - Remove extra spaces
 * - Remove common punctuation
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[.,\-'']/g, '') // Remove common punctuation
}

/**
 * Create blind index (keyed hash) for searching
 * Uses HMAC-SHA256 with blind index key
 */
export function createBlindIndex(value: string, key: Buffer): string {
  const hmac = crypto.createHmac('sha256', key)
  hmac.update(value)
  return hmac.digest('hex')
}

/**
 * Encrypt donor name
 */
export function encryptDonorName(name: string): string {
  const keys = getEncryptionKeys()
  return encryptField(name, keys.nameKey)
}

/**
 * Decrypt donor name
 */
export function decryptDonorName(ciphertext: string): string {
  const keys = getEncryptionKeys()
  return decryptField(ciphertext, keys.nameKey)
}

/**
 * Encrypt donor email
 */
export function encryptDonorEmail(email: string): string {
  const keys = getEncryptionKeys()
  return encryptField(email, keys.emailKey)
}

/**
 * Decrypt donor email
 */
export function decryptDonorEmail(ciphertext: string): string {
  const keys = getEncryptionKeys()
  return decryptField(ciphertext, keys.emailKey)
}

/**
 * Create blind index for email search
 */
export function createEmailBlindIndex(email: string): string {
  const keys = getEncryptionKeys()
  const normalized = normalizeEmail(email)
  return createBlindIndex(normalized, keys.blindIndexKey)
}

/**
 * Create blind index for name search
 */
export function createNameBlindIndex(name: string): string {
  const keys = getEncryptionKeys()
  const normalized = normalizeName(name)
  return createBlindIndex(normalized, keys.blindIndexKey)
}

/**
 * Batch encrypt donor data
 */
export function encryptDonorData(data: {
  name: string
  email: string
}): {
  encryptedName: string
  encryptedEmail: string
  emailBlindIndex: string
  nameBlindIndex: string
} {
  return {
    encryptedName: encryptDonorName(data.name),
    encryptedEmail: encryptDonorEmail(data.email),
    emailBlindIndex: createEmailBlindIndex(data.email),
    nameBlindIndex: createNameBlindIndex(data.name),
  }
}

/**
 * Batch decrypt donor data
 */
export function decryptDonorData(data: {
  encryptedName: string
  encryptedEmail: string
}): {
  name: string
  email: string
} {
  return {
    name: decryptDonorName(data.encryptedName),
    email: decryptDonorEmail(data.encryptedEmail),
  }
}

/**
 * Generate encryption keys (for initial setup)
 * CRITICAL: Run this ONCE, store keys securely, NEVER regenerate in production
 */
export function generateEncryptionKeys(): {
  nameKey: string
  emailKey: string
  blindIndexKey: string
} {
  return {
    nameKey: crypto.randomBytes(32).toString('hex'),
    emailKey: crypto.randomBytes(32).toString('hex'),
    blindIndexKey: crypto.randomBytes(32).toString('hex'),
  }
}

/**
 * Search for donor by email (using blind index)
 */
export async function findDonorByEmail(email: string) {
  const { prisma } = await import('@/lib/db/prisma')
  const blindIndex = createEmailBlindIndex(email)

  const donor = await prisma.donor.findFirst({
    where: { emailBlindIndex: blindIndex },
  })

  return donor
}

/**
 * Search for donors by name (using blind index)
 */
export async function findDonorsByName(name: string) {
  const { prisma } = await import('@/lib/db/prisma')
  const blindIndex = createNameBlindIndex(name)

  const donors = await prisma.donor.findMany({
    where: { nameBlindIndex: blindIndex },
  })

  return donors
}
