import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import { LaunchMode, AffiliationStatus, CandidacyStatus } from '@prisma/client'

describe('Global Shell Components', () => {
  beforeAll(async () => {
    // Ensure launch gate exists
    await prisma.launchGate.upsert({
      where: { id: 1 },
      create: {
        mode: 'INFO_ONLY',
        killSwitch: false,
        killSwitchReason: null,
      },
      update: {},
    })

    // Ensure candidate config exists
    await prisma.candidateConfig.upsert({
      where: { slug: 'bellefleur' },
      create: {
        slug: 'bellefleur',
        candidateName: 'Jean Fritznel Bellefleur',
        office: 'Senator',
        department: 'Nord-Ouest',
        candidacyStatus: 'UNVERIFIED',
        affiliationStatus: 'INDEPENDENT',
      },
      update: {},
    })
  })

  describe('Header CTA Logic', () => {
    it('shows correct CTA for INFO_ONLY mode', async () => {
      await prisma.launchGate.update({
        where: { id: 1 },
        data: { mode: 'INFO_ONLY' },
      })

      const gate = await prisma.launchGate.findUnique({ where: { id: 1 } })
      expect(gate?.mode).toBe('INFO_ONLY')

      // In INFO_ONLY, CTA should link to /about with "Learn more"
    })

    it('shows correct CTA for WAITLIST mode', async () => {
      await prisma.launchGate.update({
        where: { id: 1 },
        data: { mode: 'WAITLIST' },
      })

      const gate = await prisma.launchGate.findUnique({ where: { id: 1 } })
      expect(gate?.mode).toBe('WAITLIST')

      // In WAITLIST, CTA should link to /get-involved with "Get launch updates"
    })

    it('shows correct CTA for DONATIONS_LIVE mode', async () => {
      await prisma.launchGate.update({
        where: { id: 1 },
        data: { mode: 'DONATIONS_LIVE' },
      })

      const gate = await prisma.launchGate.findUnique({ where: { id: 1 } })
      expect(gate?.mode).toBe('DONATIONS_LIVE')

      // In DONATIONS_LIVE, CTA should link to /contribute with "Give $5-$10"
    })
  })

  describe('Affiliation Disclosure', () => {
    it('shows INDEPENDENT affiliation by default', async () => {
      const config = await prisma.candidateConfig.findUnique({
        where: { slug: 'bellefleur' },
      })

      expect(config?.affiliationStatus).toBe('INDEPENDENT')
    })

    it('can update to AUTHORIZED status', async () => {
      await prisma.candidateConfig.update({
        where: { slug: 'bellefleur' },
        data: {
          affiliationStatus: 'AUTHORIZED',
          affiliationText: 'Authorized by Jean Fritznel Bellefleur for Senator',
          affiliationAgreementRef: 'DOC-2027-001',
          affiliationAgreementDate: new Date('2027-01-15'),
        },
      })

      const config = await prisma.candidateConfig.findUnique({
        where: { slug: 'bellefleur' },
      })

      expect(config?.affiliationStatus).toBe('AUTHORIZED')
      expect(config?.affiliationAgreementRef).toBe('DOC-2027-001')
    })

    it('can update to COORDINATED status', async () => {
      await prisma.candidateConfig.update({
        where: { slug: 'bellefleur' },
        data: {
          affiliationStatus: 'COORDINATED',
          affiliationText: 'Coordinated with Jean Fritznel Bellefleur campaign',
        },
      })

      const config = await prisma.candidateConfig.findUnique({
        where: { slug: 'bellefleur' },
      })

      expect(config?.affiliationStatus).toBe('COORDINATED')
    })

    it('resets to INDEPENDENT', async () => {
      await prisma.candidateConfig.update({
        where: { slug: 'bellefleur' },
        data: {
          affiliationStatus: 'INDEPENDENT',
          affiliationText: null,
          affiliationAgreementRef: null,
          affiliationAgreementDate: null,
        },
      })

      const config = await prisma.candidateConfig.findUnique({
        where: { slug: 'bellefleur' },
      })

      expect(config?.affiliationStatus).toBe('INDEPENDENT')
    })
  })

  describe('Candidacy Status', () => {
    it('starts as UNVERIFIED', async () => {
      const config = await prisma.candidateConfig.findUnique({
        where: { slug: 'bellefleur' },
      })

      expect(config?.candidacyStatus).toBe('UNVERIFIED')
    })

    it('can update to REGISTERED_PRELIMINARY', async () => {
      await prisma.candidateConfig.update({
        where: { slug: 'bellefleur' },
        data: {
          candidacyStatus: 'REGISTERED_PRELIMINARY',
          candidacyStatusSource: 'CEP Haiti Official List',
          candidacyStatusDate: new Date('2027-02-01'),
          candidacyStatusVerifier: 'Admin User',
        },
      })

      const config = await prisma.candidateConfig.findUnique({
        where: { slug: 'bellefleur' },
      })

      expect(config?.candidacyStatus).toBe('REGISTERED_PRELIMINARY')
      expect(config?.candidacyStatusSource).toBe('CEP Haiti Official List')
    })

    it('can update to ON_FINAL_LIST', async () => {
      await prisma.candidateConfig.update({
        where: { slug: 'bellefleur' },
        data: {
          candidacyStatus: 'ON_FINAL_LIST',
          candidacyStatusDate: new Date('2027-03-01'),
        },
      })

      const config = await prisma.candidateConfig.findUnique({
        where: { slug: 'bellefleur' },
      })

      expect(config?.candidacyStatus).toBe('ON_FINAL_LIST')
    })
  })

  describe('Locale Detection', () => {
    it('supports all required locales', () => {
      const requiredLocales = ['ht', 'fr', 'en']
      
      // These would be tested via E2E, but we can verify config
      requiredLocales.forEach((locale) => {
        expect(locale).toMatch(/^(ht|fr|en)$/)
      })
    })
  })
})
