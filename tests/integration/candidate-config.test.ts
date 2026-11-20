import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import { getCandidateConfig, canUseActiveCandidateLanguage } from '@/lib/config/candidate'

describe('Candidate Configuration', () => {
  beforeAll(async () => {
    // Ensure seed data exists
    const config = await prisma.candidateConfig.findFirst({
      where: { slug: 'bellefleur' },
    })

    if (!config) {
      throw new Error('Run npm run db:seed before running tests')
    }
  })

  describe('getCandidateConfig', () => {
    it('retrieves candidate configuration', async () => {
      const config = await getCandidateConfig()

      expect(config).toBeDefined()
      expect(config.slug).toBe('bellefleur')
      expect(config.candidateName).toBe('Jean Fritznel Bellefleur')
      expect(config.office).toBe('SENATOR')
      expect(config.department).toBe('Nord-Ouest')
    })

    it('includes all required fields', async () => {
      const config = await getCandidateConfig()

      // Identity fields
      expect(config.candidateName).toBeTruthy()
      expect(config.office).toBeTruthy()
      expect(config.department).toBeTruthy()
      expect(config.communes).toHaveLength(10)

      // Contribution limits
      expect(config.minAmountCents).toBe(500)
      expect(config.maxAmountCents).toBe(1000)
      expect(config.cumulativeCapCents).toBe(1000)

      // Status
      expect(config.candidacyStatus).toBe('UNVERIFIED')
      expect(config.affiliationStatus).toBe('INDEPENDENT')
    })

    it('includes all Nord-Ouest communes', async () => {
      const config = await getCandidateConfig()

      const expectedCommunes = [
        'Môle-Saint-Nicolas',
        'Baie-de-Henne',
        'Bombardopolis',
        'Jean-Rabel',
        'Port-de-Paix',
        'Bassin-Bleu',
        'Chansolme',
        'La Tortue',
        'Saint-Louis-du-Nord',
        'Anse-à-Foleur',
      ]

      expectedCommunes.forEach((commune) => {
        expect(config.communes).toContain(commune)
      })
    })
  })

  describe('canUseActiveCandidateLanguage', () => {
    it('returns false for UNVERIFIED status', () => {
      expect(canUseActiveCandidateLanguage('UNVERIFIED')).toBe(false)
    })

    it('returns true for REGISTERED_PRELIMINARY status', () => {
      expect(canUseActiveCandidateLanguage('REGISTERED_PRELIMINARY')).toBe(true)
    })

    it('returns true for ON_FINAL_LIST status', () => {
      expect(canUseActiveCandidateLanguage('ON_FINAL_LIST')).toBe(true)
    })

    it('returns false for NOT_ON_FINAL_LIST status', () => {
      expect(canUseActiveCandidateLanguage('NOT_ON_FINAL_LIST')).toBe(false)
    })
  })

  describe('RULE 2: Candidacy Status Verification', () => {
    it('default status is UNVERIFIED', async () => {
      const config = await getCandidateConfig()
      expect(config.candidacyStatus).toBe('UNVERIFIED')
    })

    it('has date verification fields', async () => {
      const config = await getCandidateConfig()
      
      // These fields exist for tracking verification
      expect(config).toHaveProperty('candidacyStatusSource')
      expect(config).toHaveProperty('candidacyStatusDate')
    })
  })

  describe('RULE 7: Compliance Configuration', () => {
    it('stores contribution limits in database', async () => {
      const config = await getCandidateConfig()

      // Limits are in database, not code
      expect(typeof config.minAmountCents).toBe('number')
      expect(typeof config.maxAmountCents).toBe('number')
      expect(typeof config.cumulativeCapCents).toBe('number')
      
      expect(config.minAmountCents).toBe(500)
      expect(config.maxAmountCents).toBe(1000)
    })

    it('stores election dates in database', async () => {
      const config = await getCandidateConfig()

      expect(config.firstRoundDate).toBeInstanceOf(Date)
      expect(config.secondRoundDate).toBeInstanceOf(Date)
      
      // Dates should have verification notes
      expect(config.firstRoundDateNote).toContain('verify')
      expect(config.secondRoundDateNote).toContain('verify')
    })
  })
})
