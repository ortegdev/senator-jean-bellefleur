import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db/prisma'

describe('Compliance Rules', () => {
  beforeAll(async () => {
    // Ensure seed data exists
    const rules = await prisma.complianceRule.findMany()

    if (rules.length === 0) {
      throw new Error('Run npm run db:seed before running tests')
    }
  })

  describe('Country Restrictions', () => {
    it('has country restriction rule configured', async () => {
      const rule = await prisma.complianceRule.findFirst({
        where: {
          ruleType: 'COUNTRY_RESTRICTION',
          isActive: true,
        },
      })

      expect(rule).toBeDefined()
      expect(rule?.name).toBe('Allowed Countries')
      expect(rule?.isActive).toBe(true)
    })

    it('specifies allowed countries in config', async () => {
      const rule = await prisma.complianceRule.findFirst({
        where: { ruleType: 'COUNTRY_RESTRICTION' },
      })

      const config = rule?.config as { allowedCountries: string[] }
      expect(config.allowedCountries).toContain('US')
      expect(config.allowedCountries).toContain('CA')
      expect(config.allowedCountries).toContain('FR')
      expect(config.allowedCountries).toContain('HT')
    })
  })

  describe('Amount Limits', () => {
    it('has amount limit rule configured', async () => {
      const rule = await prisma.complianceRule.findFirst({
        where: {
          ruleType: 'AMOUNT_LIMIT',
          isActive: true,
        },
      })

      expect(rule).toBeDefined()
      expect(rule?.name).toBe('Contribution Amount Limits')
    })

    it('specifies min and max amounts', async () => {
      const rule = await prisma.complianceRule.findFirst({
        where: { ruleType: 'AMOUNT_LIMIT' },
      })

      const config = rule?.config as { minCents: number; maxCents: number }
      expect(config.minCents).toBe(500) // $5
      expect(config.maxCents).toBe(1000) // $10
    })
  })

  describe('RULE 7: Database-Driven Compliance', () => {
    it('all rules have effective dates', async () => {
      const rules = await prisma.complianceRule.findMany()

      rules.forEach((rule) => {
        expect(rule.effectiveFrom).toBeInstanceOf(Date)
        // effectiveTo is nullable (can be ongoing)
      })
    })

    it('rules can be activated/deactivated', async () => {
      const rules = await prisma.complianceRule.findMany()

      rules.forEach((rule) => {
        expect(typeof rule.isActive).toBe('boolean')
      })
    })

    it('rules use flexible JSON config', async () => {
      const rules = await prisma.complianceRule.findMany()

      rules.forEach((rule) => {
        expect(rule.config).toBeDefined()
        expect(typeof rule.config).toBe('object')
      })
    })
  })
})
