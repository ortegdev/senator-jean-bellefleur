/**
 * Blind Index Search Tests
 * 
 * Verifies that:
 * 1. Donor data is encrypted in database
 * 2. Blind indexes allow searching without decryption
 * 3. Search works with normalized variations (case, dots, etc.)
 * 4. Legal holds prevent deletion
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import {
  encryptDonorData,
  decryptDonorData,
  normalizeEmail,
  normalizeName,
  createEmailBlindIndex,
  createNameBlindIndex,
  findDonorByEmail,
  findDonorsByName,
} from '@/lib/privacy/encryption'
import {
  canDeleteDonor,
  setLegalHold,
  releaseLegalHold,
} from '@/lib/privacy/data-subject-rights'

describe('Blind Index Search', () => {
  let testDonor1Id: string
  let testDonor2Id: string
  let testDonor3Id: string

  beforeAll(async () => {
    // Create test donors with encrypted data
    const donor1Data = encryptDonorData({
      name: 'Jean Bellefleur',
      email: 'jean.bellefleur@example.com',
    })

    const donor1 = await prisma.donor.create({
      data: {
        ...donor1Data,
        country: 'HT',
        locale: 'ht',
      },
    })
    testDonor1Id = donor1.id

    const donor2Data = encryptDonorData({
      name: 'Marie Dupont',
      email: 'marie.dupont@gmail.com',
    })

    const donor2 = await prisma.donor.create({
      data: {
        ...donor2Data,
        country: 'FR',
        locale: 'fr',
      },
    })
    testDonor2Id = donor2.id

    const donor3Data = encryptDonorData({
      name: 'John Smith',
      email: 'john.smith@example.org',
    })

    const donor3 = await prisma.donor.create({
      data: {
        ...donor3Data,
        country: 'US',
        locale: 'en',
      },
    })
    testDonor3Id = donor3.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.donor.deleteMany({
      where: {
        id: { in: [testDonor1Id, testDonor2Id, testDonor3Id] },
      },
    })
  })

  describe('Encryption', () => {
    it('encrypts and decrypts name correctly', () => {
      const original = 'Jean Bellefleur'
      const encrypted = encryptDonorData({ name: original, email: 'test@example.com' })

      expect(encrypted.encryptedName).not.toBe(original)
      expect(encrypted.encryptedName).toMatch(/^[A-Za-z0-9+/=]+$/) // Base64

      const decrypted = decryptDonorData({
        encryptedName: encrypted.encryptedName,
        encryptedEmail: encrypted.encryptedEmail,
      })

      expect(decrypted.name).toBe(original)
    })

    it('encrypts and decrypts email correctly', () => {
      const original = 'test@example.com'
      const encrypted = encryptDonorData({ name: 'Test', email: original })

      expect(encrypted.encryptedEmail).not.toBe(original)
      expect(encrypted.encryptedEmail).toMatch(/^[A-Za-z0-9+/=]+$/) // Base64

      const decrypted = decryptDonorData({
        encryptedName: encrypted.encryptedName,
        encryptedEmail: encrypted.encryptedEmail,
      })

      expect(decrypted.email).toBe(original)
    })

    it('produces different ciphertexts for same plaintext', () => {
      const email = 'same@example.com'

      const encrypted1 = encryptDonorData({ name: 'Test', email })
      const encrypted2 = encryptDonorData({ name: 'Test', email })

      // Should be different due to random IV
      expect(encrypted1.encryptedEmail).not.toBe(encrypted2.encryptedEmail)

      // But both should decrypt to the same value
      expect(decryptDonorData({ encryptedName: '', encryptedEmail: encrypted1.encryptedEmail }).email).toBe(email)
      expect(decryptDonorData({ encryptedName: '', encryptedEmail: encrypted2.encryptedEmail }).email).toBe(email)
    })
  })

  describe('Email Normalization', () => {
    it('normalizes email case', () => {
      expect(normalizeEmail('Test@Example.Com')).toBe('test@example.com')
    })

    it('trims whitespace', () => {
      expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com')
    })

    it('removes dots in Gmail addresses', () => {
      expect(normalizeEmail('test.user@gmail.com')).toBe('testuser@gmail.com')
      expect(normalizeEmail('t.e.s.t@gmail.com')).toBe('test@gmail.com')
    })

    it('does not remove dots in non-Gmail addresses', () => {
      expect(normalizeEmail('test.user@example.com')).toBe('test.user@example.com')
    })

    it('handles googlemail.com as Gmail', () => {
      expect(normalizeEmail('test.user@googlemail.com')).toBe('testuser@googlemail.com')
    })
  })

  describe('Name Normalization', () => {
    it('normalizes name case', () => {
      expect(normalizeName('Jean Bellefleur')).toBe('jean bellefleur')
    })

    it('trims whitespace', () => {
      expect(normalizeName('  Jean Bellefleur  ')).toBe('jean bellefleur')
    })

    it('removes extra spaces', () => {
      expect(normalizeName('Jean   Bellefleur')).toBe('jean bellefleur')
    })

    it('removes common punctuation', () => {
      expect(normalizeName("O'Brien-Smith")).toBe('obriensmith')
      expect(normalizeName('Jean-Paul')).toBe('jeanpaul')
    })
  })

  describe('Blind Index Creation', () => {
    it('creates consistent blind index for same email', () => {
      const email = 'test@example.com'
      const index1 = createEmailBlindIndex(email)
      const index2 = createEmailBlindIndex(email)

      expect(index1).toBe(index2)
      expect(index1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
    })

    it('creates consistent blind index for normalized email variations', () => {
      const index1 = createEmailBlindIndex('Test@Example.Com')
      const index2 = createEmailBlindIndex('test@example.com')
      const index3 = createEmailBlindIndex('  test@example.com  ')

      expect(index1).toBe(index2)
      expect(index2).toBe(index3)
    })

    it('creates consistent blind index for Gmail dot variations', () => {
      const index1 = createEmailBlindIndex('test.user@gmail.com')
      const index2 = createEmailBlindIndex('testuser@gmail.com')
      const index3 = createEmailBlindIndex('t.e.s.t.u.s.e.r@gmail.com')

      expect(index1).toBe(index2)
      expect(index2).toBe(index3)
    })

    it('creates different blind indexes for different emails', () => {
      const index1 = createEmailBlindIndex('test1@example.com')
      const index2 = createEmailBlindIndex('test2@example.com')

      expect(index1).not.toBe(index2)
    })

    it('creates consistent blind index for same name', () => {
      const name = 'Jean Bellefleur'
      const index1 = createNameBlindIndex(name)
      const index2 = createNameBlindIndex(name)

      expect(index1).toBe(index2)
      expect(index1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
    })

    it('creates consistent blind index for normalized name variations', () => {
      const index1 = createNameBlindIndex('Jean Bellefleur')
      const index2 = createNameBlindIndex('jean bellefleur')
      const index3 = createNameBlindIndex('JEAN BELLEFLEUR')
      const index4 = createNameBlindIndex('Jean   Bellefleur')

      expect(index1).toBe(index2)
      expect(index2).toBe(index3)
      expect(index3).toBe(index4)
    })

    it('creates different blind indexes for different names', () => {
      const index1 = createNameBlindIndex('Jean Bellefleur')
      const index2 = createNameBlindIndex('Marie Dupont')

      expect(index1).not.toBe(index2)
    })
  })

  describe('Blind Index Search', () => {
    it('finds donor by exact email match', async () => {
      const donor = await findDonorByEmail('jean.bellefleur@example.com')

      expect(donor).toBeTruthy()
      expect(donor?.id).toBe(testDonor1Id)
    })

    it('finds donor by case-insensitive email', async () => {
      const donor = await findDonorByEmail('JEAN.BELLEFLEUR@EXAMPLE.COM')

      expect(donor).toBeTruthy()
      expect(donor?.id).toBe(testDonor1Id)
    })

    it('finds donor by Gmail with dots', async () => {
      const donor = await findDonorByEmail('m.a.r.i.e.d.u.p.o.n.t@gmail.com')

      expect(donor).toBeTruthy()
      expect(donor?.id).toBe(testDonor2Id)
    })

    it('returns null for non-existent email', async () => {
      const donor = await findDonorByEmail('nonexistent@example.com')

      expect(donor).toBeNull()
    })

    it('finds donors by exact name match', async () => {
      const donors = await findDonorsByName('Jean Bellefleur')

      expect(donors.length).toBeGreaterThan(0)
      expect(donors.some(d => d.id === testDonor1Id)).toBe(true)
    })

    it('finds donors by case-insensitive name', async () => {
      const donors = await findDonorsByName('jean bellefleur')

      expect(donors.length).toBeGreaterThan(0)
      expect(donors.some(d => d.id === testDonor1Id)).toBe(true)
    })

    it('finds donors with extra spaces in name', async () => {
      const donors = await findDonorsByName('Jean   Bellefleur')

      expect(donors.length).toBeGreaterThan(0)
      expect(donors.some(d => d.id === testDonor1Id)).toBe(true)
    })

    it('returns empty array for non-existent name', async () => {
      const donors = await findDonorsByName('Nonexistent Person')

      expect(donors).toEqual([])
    })
  })

  describe('Legal Holds', () => {
    it('prevents deletion when legal hold is active', async () => {
      // Set legal hold
      await setLegalHold(testDonor1Id, 'Under investigation', 'admin@example.com')

      // Check if can delete
      const { canDelete, reasons } = await canDeleteDonor(testDonor1Id)

      expect(canDelete).toBe(false)
      expect(reasons).toContain(
        expect.stringContaining('legal hold')
      )

      // Cleanup: release hold
      await releaseLegalHold(testDonor1Id, 'admin@example.com')
    })

    it('allows deletion after legal hold is released', async () => {
      // Set and then release legal hold
      await setLegalHold(testDonor1Id, 'Under investigation', 'admin@example.com')
      await releaseLegalHold(testDonor1Id, 'admin@example.com')

      // Verify hold is released
      const donor = await prisma.donor.findUnique({
        where: { id: testDonor1Id },
      })

      expect(donor?.legalHold).toBe(false)
      expect(donor?.legalHoldReleasedBy).toBe('admin@example.com')
    })

    it('records who set and released legal hold', async () => {
      await setLegalHold(testDonor1Id, 'Litigation pending', 'counsel@example.com')

      let donor = await prisma.donor.findUnique({
        where: { id: testDonor1Id },
      })

      expect(donor?.legalHold).toBe(true)
      expect(donor?.legalHoldReason).toBe('Litigation pending')
      expect(donor?.legalHoldSetBy).toBe('counsel@example.com')
      expect(donor?.legalHoldSetAt).toBeTruthy()

      await releaseLegalHold(testDonor1Id, 'judge@example.com')

      donor = await prisma.donor.findUnique({
        where: { id: testDonor1Id },
      })

      expect(donor?.legalHold).toBe(false)
      expect(donor?.legalHoldReleasedBy).toBe('judge@example.com')
      expect(donor?.legalHoldReleasedAt).toBeTruthy()
    })
  })

  describe('Data Verification', () => {
    it('data is encrypted in database', async () => {
      const donor = await prisma.donor.findUnique({
        where: { id: testDonor1Id },
      })

      // Encrypted data should not contain plaintext
      expect(donor?.encryptedName).not.toContain('Jean')
      expect(donor?.encryptedName).not.toContain('Bellefleur')
      expect(donor?.encryptedEmail).not.toContain('jean.bellefleur')
      expect(donor?.encryptedEmail).not.toContain('example.com')

      // Blind indexes should be hashes, not plaintext
      expect(donor?.emailBlindIndex).toMatch(/^[a-f0-9]{64}$/)
      expect(donor?.nameBlindIndex).toMatch(/^[a-f0-9]{64}$/)
    })

    it('decryption recovers original plaintext', async () => {
      const donor = await prisma.donor.findUnique({
        where: { id: testDonor1Id },
      })

      if (!donor) throw new Error('Donor not found')

      const decrypted = decryptDonorData({
        encryptedName: donor.encryptedName,
        encryptedEmail: donor.encryptedEmail,
      })

      expect(decrypted.name).toBe('Jean Bellefleur')
      expect(decrypted.email).toBe('jean.bellefleur@example.com')
    })

    it('blind indexes match search queries', async () => {
      const donor = await prisma.donor.findUnique({
        where: { id: testDonor1Id },
      })

      if (!donor) throw new Error('Donor not found')

      // Blind index should match what search would use
      const searchIndex = createEmailBlindIndex('jean.bellefleur@example.com')
      expect(donor.emailBlindIndex).toBe(searchIndex)

      const nameSearchIndex = createNameBlindIndex('Jean Bellefleur')
      expect(donor.nameBlindIndex).toBe(nameSearchIndex)
    })
  })
})
