/**
 * Compliance System Seed Data
 * 
 * Creates default compliance rules with proper workflow states.
 * Rules start as DRAFT and require dual approval before activation.
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔒 Seeding compliance system...')

  // Create compliance users (if not exists)
  const complianceUser1 = await prisma.user.upsert({
    where: { email: 'compliance1@diaspora4bellefleur.org' },
    update: {},
    create: {
      email: 'compliance1@diaspora4bellefleur.org',
      name: 'Compliance Officer 1',
      role: 'COMPLIANCE',
      active: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'compliance2@diaspora4bellefleur.org' },
    update: {},
    create: {
      email: 'compliance2@diaspora4bellefleur.org',
      name: 'Compliance Officer 2',
      role: 'COMPLIANCE',
      active: true,
    },
  })

  console.log('✅ Created compliance users')

  // 1. AMOUNT_LIMIT Rule
  const amountLimitRule = await prisma.complianceRule.create({
    data: {
      name: 'Transaction Amount Limits',
      description: 'Enforces minimum and maximum contribution amounts per transaction',
      ruleType: 'AMOUNT_LIMIT',
      config: {
        minCents: 500, // $5.00
        maxCents: 1000, // $10.00
      },
      legalBasisReference: 'Default limits set by platform policy pending legal counsel review',
      effectiveFrom: new Date('2024-01-01'),
      isActive: false, // Not active until approved
    },
  })

  await prisma.complianceRuleVersion.create({
    data: {
      ruleId: amountLimitRule.id,
      version: 1,
      name: amountLimitRule.name,
      description: amountLimitRule.description,
      ruleType: amountLimitRule.ruleType,
      config: amountLimitRule.config as Prisma.InputJsonValue,
      legalBasisReference: amountLimitRule.legalBasisReference,
      effectiveFrom: amountLimitRule.effectiveFrom,
      effectiveTo: amountLimitRule.effectiveTo,
      isActive: false,
      status: 'DRAFT',
      createdBy: complianceUser1.id,
      createdByEmail: complianceUser1.email,
    },
  })

  console.log('✅ Created AMOUNT_LIMIT rule')

  // 2. CUMULATIVE_CAP Rule
  const cumulativeCapRule = await prisma.complianceRule.create({
    data: {
      name: 'Per-Donor Cumulative Cap',
      description: 'Enforces maximum total contributions per donor per election cycle',
      ruleType: 'CUMULATIVE_CAP',
      config: {
        capCents: 1000, // $10.00 total per donor
        cycleType: 'election', // per election cycle
      },
      legalBasisReference: 'Default cap set by platform policy pending legal counsel review',
      effectiveFrom: new Date('2024-01-01'),
      isActive: false,
    },
  })

  await prisma.complianceRuleVersion.create({
    data: {
      ruleId: cumulativeCapRule.id,
      version: 1,
      name: cumulativeCapRule.name,
      description: cumulativeCapRule.description,
      ruleType: cumulativeCapRule.ruleType,
      config: cumulativeCapRule.config as Prisma.InputJsonValue,
      legalBasisReference: cumulativeCapRule.legalBasisReference,
      effectiveFrom: cumulativeCapRule.effectiveFrom,
      effectiveTo: cumulativeCapRule.effectiveTo,
      isActive: false,
      status: 'DRAFT',
      createdBy: complianceUser1.id,
      createdByEmail: complianceUser1.email,
    },
  })

  console.log('✅ Created CUMULATIVE_CAP rule')

  // 3. COUNTRY_RESTRICTION Rule (denylist for sanctioned jurisdictions)
  const countryRule = await prisma.complianceRule.create({
    data: {
      name: 'Country Restrictions',
      description: 'Denies contributions from sanctioned jurisdictions',
      ruleType: 'COUNTRY_RESTRICTION',
      config: {
        mode: 'denylist',
        countries: ['KP', 'IR', 'SY', 'CU'], // North Korea, Iran, Syria, Cuba
      },
      legalBasisReference: 'US OFAC sanctions compliance',
      effectiveFrom: new Date('2024-01-01'),
      isActive: false,
    },
  })

  await prisma.complianceRuleVersion.create({
    data: {
      ruleId: countryRule.id,
      version: 1,
      name: countryRule.name,
      description: countryRule.description,
      ruleType: countryRule.ruleType,
      config: countryRule.config as Prisma.InputJsonValue,
      legalBasisReference: countryRule.legalBasisReference,
      effectiveFrom: countryRule.effectiveFrom,
      effectiveTo: countryRule.effectiveTo,
      isActive: false,
      status: 'DRAFT',
      createdBy: complianceUser1.id,
      createdByEmail: complianceUser1.email,
    },
  })

  console.log('✅ Created COUNTRY_RESTRICTION rule')

  // 4. ELIGIBILITY_CHECK Rule
  const eligibilityRule = await prisma.complianceRule.create({
    data: {
      name: 'Required Eligibility Attestations',
      description: 'Requires donors to confirm eligibility criteria',
      ruleType: 'ELIGIBILITY_CHECK',
      config: {
        requiredAttestations: [
          'ageConfirm',
          'legalConfirm',
          'foreignAgentConfirm',
        ],
      },
      legalBasisReference: 'Standard donor eligibility requirements pending counsel review',
      effectiveFrom: new Date('2024-01-01'),
      isActive: false,
    },
  })

  await prisma.complianceRuleVersion.create({
    data: {
      ruleId: eligibilityRule.id,
      version: 1,
      name: eligibilityRule.name,
      description: eligibilityRule.description,
      ruleType: eligibilityRule.ruleType,
      config: eligibilityRule.config as Prisma.InputJsonValue,
      legalBasisReference: eligibilityRule.legalBasisReference,
      effectiveFrom: eligibilityRule.effectiveFrom,
      effectiveTo: eligibilityRule.effectiveTo,
      isActive: false,
      status: 'DRAFT',
      createdBy: complianceUser1.id,
      createdByEmail: complianceUser1.email,
    },
  })

  console.log('✅ Created ELIGIBILITY_CHECK rule')

  // 5. SANCTIONS_SCREENING Rule
  const sanctionsRule = await prisma.complianceRule.create({
    data: {
      name: 'Sanctions List Screening',
      description: 'Screens donors against OFAC and international sanctions lists',
      ruleType: 'SANCTIONS_SCREENING',
      config: {
        enabled: true,
        provider: 'stub', // Use stub provider for now
      },
      legalBasisReference: 'US OFAC compliance requirement',
      effectiveFrom: new Date('2024-01-01'),
      isActive: false,
    },
  })

  await prisma.complianceRuleVersion.create({
    data: {
      ruleId: sanctionsRule.id,
      version: 1,
      name: sanctionsRule.name,
      description: sanctionsRule.description,
      ruleType: sanctionsRule.ruleType,
      config: sanctionsRule.config as Prisma.InputJsonValue,
      legalBasisReference: sanctionsRule.legalBasisReference,
      effectiveFrom: sanctionsRule.effectiveFrom,
      effectiveTo: sanctionsRule.effectiveTo,
      isActive: false,
      status: 'DRAFT',
      createdBy: complianceUser1.id,
      createdByEmail: complianceUser1.email,
    },
  })

  console.log('✅ Created SANCTIONS_SCREENING rule')

  // 6. PROHIBITED_SOURCE Rule
  const prohibitedSourceRule = await prisma.complianceRule.create({
    data: {
      name: 'Prohibited Payment Sources',
      description: 'Blocks or flags prohibited payment methods',
      ruleType: 'PROHIBITED_SOURCE',
      config: {
        blockCorporateCards: true,
        blockPrepaidCards: true,
        flagCountryMismatch: true,
      },
      legalBasisReference: 'Standard campaign finance rules - own funds requirement',
      effectiveFrom: new Date('2024-01-01'),
      isActive: false,
    },
  })

  await prisma.complianceRuleVersion.create({
    data: {
      ruleId: prohibitedSourceRule.id,
      version: 1,
      name: prohibitedSourceRule.name,
      description: prohibitedSourceRule.description,
      ruleType: prohibitedSourceRule.ruleType,
      config: prohibitedSourceRule.config as Prisma.InputJsonValue,
      legalBasisReference: prohibitedSourceRule.legalBasisReference,
      effectiveFrom: prohibitedSourceRule.effectiveFrom,
      effectiveTo: prohibitedSourceRule.effectiveTo,
      isActive: false,
      status: 'DRAFT',
      createdBy: complianceUser1.id,
      createdByEmail: complianceUser1.email,
    },
  })

  console.log('✅ Created PROHIBITED_SOURCE rule')

  // 7. PRE_CAMPAIGN_BLOCK Rule (disabled by default)
  const preCampaignRule = await prisma.complianceRule.create({
    data: {
      name: 'Pre-Campaign Fundraising Block',
      description: 'Blocks contributions before official campaign period if required by counsel',
      ruleType: 'PRE_CAMPAIGN_BLOCK',
      config: {
        enabled: false, // Disabled unless counsel requires it
        campaignStartDate: new Date('2027-01-01'), // Placeholder date
      },
      legalBasisReference: 'To be determined by Haitian legal counsel - currently disabled',
      effectiveFrom: new Date('2024-01-01'),
      isActive: false,
    },
  })

  await prisma.complianceRuleVersion.create({
    data: {
      ruleId: preCampaignRule.id,
      version: 1,
      name: preCampaignRule.name,
      description: preCampaignRule.description,
      ruleType: preCampaignRule.ruleType,
      config: preCampaignRule.config as Prisma.InputJsonValue,
      legalBasisReference: preCampaignRule.legalBasisReference,
      effectiveFrom: preCampaignRule.effectiveFrom,
      effectiveTo: preCampaignRule.effectiveTo,
      isActive: false,
      status: 'DRAFT',
      createdBy: complianceUser1.id,
      createdByEmail: complianceUser1.email,
    },
  })

  console.log('✅ Created PRE_CAMPAIGN_BLOCK rule')

  // Create default eligibility attestations
  const attestations = [
    {
      key: 'ageConfirm',
      textEn: 'I confirm that I am at least 18 years old',
      textFr: 'Je confirme que j\'ai au moins 18 ans',
      textHt: 'Mwen konfime mwen gen omwen 18 an',
      legalBasis: 'Standard age requirement for campaign contributions',
    },
    {
      key: 'legalConfirm',
      textEn: 'I confirm that this contribution complies with applicable election laws in my country of residence',
      textFr: 'Je confirme que cette contribution est conforme aux lois électorales applicables dans mon pays de résidence',
      textHt: 'Mwen konfime kontribisyon sa a konfòm ak lwa elektoral ki aplikab nan peyi mwen rete a',
      legalBasis: 'Donor responsibility for compliance with local laws',
    },
    {
      key: 'foreignAgentConfirm',
      textEn: 'I understand that this is an independent initiative and not an official campaign',
      textFr: 'Je comprends qu\'il s\'agit d\'une initiative indépendante et non d\'une campagne officielle',
      textHt: 'Mwen konprann sa se yon inisyativ endepandan epi se pa yon kanpay ofisyèl',
      legalBasis: 'FARA and foreign agent disclosure requirements',
    },
  ]

  for (const att of attestations) {
    await prisma.eligibilityAttestation.upsert({
      where: { key: att.key },
      update: {},
      create: {
        key: att.key,
        version: 1,
        textEn: att.textEn,
        textFr: att.textFr,
        textHt: att.textHt,
        legalBasis: att.legalBasis,
        isActive: true,
        isRequired: true,
        createdBy: complianceUser1.id,
        createdByEmail: complianceUser1.email,
      },
    })
  }

  console.log('✅ Created eligibility attestations')

  console.log('\n📋 IMPORTANT: All rules are in DRAFT state')
  console.log('To activate rules:')
  console.log('1. Log in as COMPLIANCE user')
  console.log('2. Review each rule')
  console.log('3. Submit for approval')
  console.log('4. First approval (different user)')
  console.log('5. Second approval (third user)')
  console.log('6. Activate rule\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
