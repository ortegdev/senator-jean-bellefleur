/**
 * Tamper-Evident Audit Log Tests
 * 
 * Tests:
 * - Hash chain verification
 * - Sequence number integrity (no gaps)
 * - Tamper detection
 * - Export functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import {
  createTamperEvidentAuditLog,
  verifyAuditLogIntegrity,
  exportAuditLog,
  searchAuditLog,
  getAuditLogStats,
} from '@/lib/admin/audit-log'

describe('Tamper-Evident Audit Log', () => {
  // Clean up test data
  afterEach(async () => {
    await prisma.tamperEvidentAuditLog.deleteMany({
      where: { action: { startsWith: 'TEST_' } },
    })
  })

  describe('Hash Chain Creation', () => {
    it('should create first entry with genesis hash', async () => {
      const result = await createTamperEvidentAuditLog({
        action: 'TEST_FIRST_ENTRY',
        entityType: 'Test',
        entityId: 'test-1',
        actorEmail: 'test@example.com',
      })

      expect(result.sequenceNumber).toBe(1n)
      expect(result.currentHash).toHaveLength(64) // SHA-256 hex

      const entry = await prisma.tamperEvidentAuditLog.findUnique({
        where: { id: result.id },
      })

      expect(entry!.previousHash).toBe('0'.repeat(64)) // Genesis hash
      expect(entry!.currentHash).toBe(result.currentHash)
    })

    it('should chain subsequent entries correctly', async () => {
      // Create first entry
      const first = await createTamperEvidentAuditLog({
        action: 'TEST_CHAIN_1',
        entityType: 'Test',
        actorEmail: 'test@example.com',
      })

      // Create second entry
      const second = await createTamperEvidentAuditLog({
        action: 'TEST_CHAIN_2',
        entityType: 'Test',
        actorEmail: 'test@example.com',
      })

      // Create third entry
      const third = await createTamperEvidentAuditLog({
        action: 'TEST_CHAIN_3',
        entityType: 'Test',
        actorEmail: 'test@example.com',
      })

      // Verify chain
      const secondEntry = await prisma.tamperEvidentAuditLog.findUnique({
        where: { id: second.id },
      })
      expect(secondEntry!.previousHash).toBe(first.currentHash)

      const thirdEntry = await prisma.tamperEvidentAuditLog.findUnique({
        where: { id: third.id },
      })
      expect(thirdEntry!.previousHash).toBe(second.currentHash)
    })

    it('should have strictly increasing sequence numbers', async () => {
      const entries = []

      for (let i = 0; i < 5; i++) {
        const result = await createTamperEvidentAuditLog({
          action: `TEST_SEQUENCE_${i}`,
          entityType: 'Test',
          actorEmail: 'test@example.com',
        })
        entries.push(result.sequenceNumber)
      }

      // Verify strictly increasing
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i]).toBe(entries[i - 1] + 1n)
      }
    })
  })

  describe('Hash Chain Verification', () => {
    beforeEach(async () => {
      // Create a chain of test entries
      for (let i = 0; i < 10; i++) {
        await createTamperEvidentAuditLog({
          action: `TEST_VERIFY_${i}`,
          entityType: 'Test',
          entityId: `test-${i}`,
          actorEmail: 'test@example.com',
          metadata: { index: i },
        })
      }
    })

    it('should verify valid audit log chain', async () => {
      const result = await verifyAuditLogIntegrity()

      expect(result.valid).toBe(true)
      expect(result.totalEntries).toBeGreaterThanOrEqual(10)
      expect(result.verifiedEntries).toBe(result.totalEntries)
      expect(result.firstBrokenLink).toBeUndefined()
      expect(result.gaps).toBeUndefined()
    })

    it('should detect tampered currentHash', async () => {
      // Get a test entry
      const entry = await prisma.tamperEvidentAuditLog.findFirst({
        where: { action: { startsWith: 'TEST_VERIFY_' } },
        orderBy: { sequenceNumber: 'asc' },
      })

      if (!entry) {
        throw new Error('No test entry found')
      }

      // Tamper with the current hash (DANGER: Only for testing!)
      await prisma.$executeRaw`
        UPDATE "TamperEvidentAuditLog"
        SET "currentHash" = 'tampered_hash_0000000000000000000000000000000000000000'
        WHERE "id" = ${entry.id}
      `

      // Verify should detect tampering
      const result = await verifyAuditLogIntegrity({
        startSequence: entry.sequenceNumber,
        limit: 100,
      })

      expect(result.valid).toBe(false)
      expect(result.firstBrokenLink).toBeDefined()
      expect(result.firstBrokenLink!.sequenceNumber).toBe(entry.sequenceNumber)
    })

    it('should detect tampered previousHash', async () => {
      // Get second test entry
      const entries = await prisma.tamperEvidentAuditLog.findMany({
        where: { action: { startsWith: 'TEST_VERIFY_' } },
        orderBy: { sequenceNumber: 'asc' },
        take: 2,
      })

      if (entries.length < 2) {
        throw new Error('Need at least 2 test entries')
      }

      const secondEntry = entries[1]

      // Tamper with the previous hash
      await prisma.$executeRaw`
        UPDATE "TamperEvidentAuditLog"
        SET "previousHash" = 'tampered_prev_0000000000000000000000000000000000000000'
        WHERE "id" = ${secondEntry.id}
      `

      // Verify should detect tampering
      const result = await verifyAuditLogIntegrity({
        startSequence: entries[0].sequenceNumber,
        limit: 10,
      })

      expect(result.valid).toBe(false)
      expect(result.firstBrokenLink).toBeDefined()
    })

    it('should detect sequence number gaps', async () => {
      // Get a middle entry
      const entries = await prisma.tamperEvidentAuditLog.findMany({
        where: { action: { startsWith: 'TEST_VERIFY_' } },
        orderBy: { sequenceNumber: 'asc' },
        take: 5,
      })

      if (entries.length < 3) {
        throw new Error('Need at least 3 test entries')
      }

      // Delete middle entry to create gap
      await prisma.tamperEvidentAuditLog.delete({
        where: { id: entries[2].id },
      })

      // Verify should detect gap
      const result = await verifyAuditLogIntegrity({
        startSequence: entries[0].sequenceNumber,
        limit: 10,
      })

      expect(result.valid).toBe(false)
      expect(result.gaps).toBeDefined()
      expect(result.gaps!.length).toBeGreaterThan(0)
      expect(result.gaps).toContain(entries[2].sequenceNumber)
    })
  })

  describe('Export Functionality', () => {
    beforeEach(async () => {
      // Create test entries
      for (let i = 0; i < 5; i++) {
        await createTamperEvidentAuditLog({
          action: `TEST_EXPORT_${i}`,
          entityType: 'Test',
          entityId: `export-${i}`,
          actorEmail: 'exporter@example.com',
          actorRole: 'OWNER',
          reason: `Test reason ${i}`,
        })
      }
    })

    it('should export as JSON', async () => {
      const exported = await exportAuditLog({
        format: 'json',
      })

      const parsed = JSON.parse(exported)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBeGreaterThanOrEqual(5)

      // Verify structure
      const firstEntry = parsed.find((e: any) => 
        e.action.startsWith('TEST_EXPORT_')
      )
      expect(firstEntry).toBeDefined()
      expect(firstEntry).toHaveProperty('sequenceNumber')
      expect(firstEntry).toHaveProperty('action')
      expect(firstEntry).toHaveProperty('previousHash')
      expect(firstEntry).toHaveProperty('currentHash')
    })

    it('should export as CSV', async () => {
      const exported = await exportAuditLog({
        format: 'csv',
      })

      const lines = exported.split('\n')
      expect(lines.length).toBeGreaterThan(5) // Header + at least 5 entries

      // Verify header
      const header = lines[0]
      expect(header).toContain('sequenceNumber')
      expect(header).toContain('action')
      expect(header).toContain('previousHash')
      expect(header).toContain('currentHash')

      // Verify at least one TEST_EXPORT entry
      const testEntry = lines.find((line) => 
        line.includes('TEST_EXPORT_')
      )
      expect(testEntry).toBeDefined()
    })

    it('should export specific sequence range', async () => {
      const entries = await prisma.tamperEvidentAuditLog.findMany({
        where: { action: { startsWith: 'TEST_EXPORT_' } },
        orderBy: { sequenceNumber: 'asc' },
        take: 3,
      })

      const startSeq = entries[0].sequenceNumber
      const endSeq = entries[2].sequenceNumber

      const exported = await exportAuditLog({
        startSequence: startSeq,
        endSequence: endSeq,
        format: 'json',
      })

      const parsed = JSON.parse(exported)
      expect(parsed.length).toBe(3)
      
      // Verify all entries in range
      for (const entry of parsed) {
        const seq = BigInt(entry.sequenceNumber)
        expect(seq >= startSeq && seq <= endSeq).toBe(true)
      }
    })
  })

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Create diverse test entries
      await createTamperEvidentAuditLog({
        action: 'TEST_SEARCH_USER_CREATED',
        entityType: 'User',
        entityId: 'user-1',
        actorEmail: 'admin1@example.com',
        actorRole: 'OWNER',
      })

      await createTamperEvidentAuditLog({
        action: 'TEST_SEARCH_USER_UPDATED',
        entityType: 'User',
        entityId: 'user-1',
        actorEmail: 'admin2@example.com',
        actorRole: 'EDITOR',
      })

      await createTamperEvidentAuditLog({
        action: 'TEST_SEARCH_DONATION_CREATED',
        entityType: 'Contribution',
        entityId: 'contrib-1',
        actorEmail: 'admin1@example.com',
        actorRole: 'OWNER',
      })
    })

    it('should search by action', async () => {
      const result = await searchAuditLog({
        action: 'TEST_SEARCH_USER_CREATED',
        limit: 10,
      })

      expect(result.total).toBe(1)
      expect(result.entries.length).toBe(1)
      expect(result.entries[0].action).toBe('TEST_SEARCH_USER_CREATED')
    })

    it('should search by entityType', async () => {
      const result = await searchAuditLog({
        entityType: 'User',
        limit: 10,
      })

      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.entries.every((e) => e.entityType === 'User')).toBe(true)
    })

    it('should search by entityId', async () => {
      const result = await searchAuditLog({
        entityType: 'User',
        entityId: 'user-1',
        limit: 10,
      })

      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.entries.every((e) => e.entityId === 'user-1')).toBe(true)
    })

    it('should search by actorEmail', async () => {
      const result = await searchAuditLog({
        actorEmail: 'admin1@example.com',
        limit: 10,
      })

      expect(result.total).toBeGreaterThanOrEqual(2)
      expect(result.entries.every((e) => 
        e.actorEmail === 'admin1@example.com'
      )).toBe(true)
    })

    it('should paginate results', async () => {
      const page1 = await searchAuditLog({
        entityType: 'User',
        limit: 1,
        offset: 0,
      })

      const page2 = await searchAuditLog({
        entityType: 'User',
        limit: 1,
        offset: 1,
      })

      expect(page1.entries.length).toBe(1)
      expect(page2.entries.length).toBeLessThanOrEqual(1)

      if (page2.entries.length > 0) {
        expect(page1.entries[0].sequenceNumber).not.toBe(
          page2.entries[0].sequenceNumber
        )
      }
    })

    it('should filter by date range', async () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

      const result = await searchAuditLog({
        startDate: oneHourAgo,
        endDate: twoHoursFromNow,
        limit: 100,
      })

      expect(result.total).toBeGreaterThanOrEqual(3)
      
      for (const entry of result.entries) {
        expect(entry.createdAt >= oneHourAgo).toBe(true)
        expect(entry.createdAt <= twoHoursFromNow).toBe(true)
      }
    })
  })

  describe('Statistics', () => {
    it('should calculate audit log statistics', async () => {
      // Create some test entries
      for (let i = 0; i < 3; i++) {
        await createTamperEvidentAuditLog({
          action: `TEST_STATS_${i}`,
          entityType: 'Test',
          actorEmail: 'stats-tester@example.com',
        })
      }

      const stats = await getAuditLogStats()

      expect(stats.totalEntries).toBeGreaterThanOrEqual(3)
      expect(stats.latestSequence).toBeDefined()
      expect(BigInt(stats.latestSequence) > 0n).toBe(true)
      expect(stats.oldestEntry).toBeInstanceOf(Date)
      expect(stats.newestEntry).toBeInstanceOf(Date)
      expect(stats.topActions).toBeDefined()
      expect(Array.isArray(stats.topActions)).toBe(true)
      expect(stats.topActors).toBeDefined()
      expect(Array.isArray(stats.topActors)).toBe(true)
    })
  })

  describe('Immutability', () => {
    it('should not allow updating existing entries', async () => {
      const entry = await createTamperEvidentAuditLog({
        action: 'TEST_IMMUTABLE',
        entityType: 'Test',
      })

      // Attempt to update should fail (if Prisma allows it, this is a schema issue)
      // In production, database constraints should prevent updates
      await expect(
        prisma.tamperEvidentAuditLog.update({
          where: { id: entry.id },
          data: { action: 'MODIFIED_ACTION' },
        })
      ).rejects.toThrow()
    })
  })
})
