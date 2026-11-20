import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create candidate configuration
  const candidateConfig = await prisma.candidateConfig.upsert({
    where: { slug: 'bellefleur' },
    update: {},
    create: {
      slug: 'bellefleur',
      candidateName: 'Jean Fritznel Bellefleur',
      office: 'SENATOR',
      department: 'Nord-Ouest',
      communes: [
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
      ],
      party: null,
      candidacyStatus: 'UNVERIFIED',
      candidacyStatusSource: null,
      candidacyStatusDate: null,
      candidacyStatusVerifier: null,
      candidacyEvidenceUrl: null,
      officialCampaignStart: new Date('2027-04-15'),
      firstRoundDate: new Date('2027-07-18'),
      firstRoundDateNote: 'per CEP calendar reported Oct 28, 2026; verify',
      secondRoundDate: new Date('2027-10-04'),
      secondRoundDateNote: 'per CEP calendar reported Oct 28, 2026; verify',
      minAmountCents: 500,
      maxAmountCents: 1000,
      cumulativeCapCents: 1000,
      fundraisingGoalCents: null,
      domain: process.env.SITE_URL || null,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
      defaultLocale: 'ht',
      affiliationStatus: 'INDEPENDENT',
      affiliationText:
        'independent supporter initiative, not authorized by or affiliated with the candidate, his campaign or any party',
      affiliationAgreementRef: null,
      affiliationAgreementDate: null,
      version: 1,
    },
  })

  console.log('✅ Created candidate config:', candidateConfig.candidateName)

  // Create launch gate (default INFO_ONLY)
  const launchGate = await prisma.launchGate.upsert({
    where: { id: 'default-gate' },
    update: {},
    create: {
      id: 'default-gate',
      mode: 'INFO_ONLY',
      killSwitchActive: false,
    },
  })

  console.log('✅ Created launch gate:', launchGate.mode)

  // Create launch checklist items
  const checklistItems = [
    // LEGAL_HAITI
    {
      itemKey: 'haitian_counsel_opinion',
      title: 'Haitian Counsel Written Opinion',
      description:
        'Legal opinion covering: controlling decree articles, permitted donors, contribution limits, reporting requirements, and penalties',
      category: 'LEGAL_HAITI' as const,
      required: true,
      sortOrder: 1,
    },
    {
      itemKey: 'pre_campaign_fundraising_approval',
      title: 'Pre-Campaign Fundraising Confirmation',
      description:
        'Written confirmation that public fundraising is permitted BEFORE official campaign start date, OR plan to hold donations until that date',
      category: 'LEGAL_HAITI' as const,
      required: true,
      sortOrder: 2,
    },

    // LEGAL_US
    {
      itemKey: 'us_fara_counsel_opinion',
      title: 'US FARA/Election Counsel Opinion',
      description:
        'Legal opinion on US Foreign Agents Registration Act and election law compliance',
      category: 'LEGAL_US' as const,
      required: true,
      sortOrder: 3,
    },

    // ENTITY_TAX
    {
      itemKey: 'entity_classification',
      title: 'Entity and Tax Classification',
      description: 'Entity formation and tax classification documentation',
      category: 'ENTITY_TAX' as const,
      required: true,
      sortOrder: 4,
    },

    // FINANCIAL
    {
      itemKey: 'money_transmission_review',
      title: 'Money Transmission Review',
      description: 'Review of money transmission requirements and compliance',
      category: 'FINANCIAL' as const,
      required: true,
      sortOrder: 5,
    },
    {
      itemKey: 'sanctions_screening_procedure',
      title: 'Sanctions Screening Procedure',
      description: 'Documented procedure for screening donations against sanctions lists',
      category: 'FINANCIAL' as const,
      required: true,
      sortOrder: 6,
    },
    {
      itemKey: 'payment_processor_approval',
      title: 'Payment Processor Approval',
      description: 'Written approval from payment processor for political fundraising',
      category: 'FINANCIAL' as const,
      required: true,
      sortOrder: 7,
    },
    {
      itemKey: 'recipient_account_verified',
      title: 'Recipient Account Verified',
      description: 'Verification that recipient account is set up and accessible',
      category: 'FINANCIAL' as const,
      required: true,
      sortOrder: 8,
    },

    // COMPLIANCE
    {
      itemKey: 'donor_disclosures_approved',
      title: 'Donor Disclosures Approved',
      description: 'Donor disclosure forms approved by counsel',
      category: 'COMPLIANCE' as const,
      required: true,
      sortOrder: 9,
    },
    {
      itemKey: 'privacy_notice_approved',
      title: 'Privacy Notice Approved',
      description: 'Privacy notice reviewed and approved by counsel',
      category: 'COMPLIANCE' as const,
      required: true,
      sortOrder: 10,
    },
    {
      itemKey: 'refund_policy_approved',
      title: 'Refund Policy Approved',
      description: 'Refund policy reviewed and approved by counsel',
      category: 'COMPLIANCE' as const,
      required: true,
      sortOrder: 11,
    },
    {
      itemKey: 'candidacy_status_verified',
      title: 'Candidacy Status Verified (Not UNVERIFIED)',
      description: 'Candidacy status must be verified with evidence attached',
      category: 'COMPLIANCE' as const,
      required: true,
      sortOrder: 12,
    },

    // TECHNICAL
    {
      itemKey: 'operational_test_passed',
      title: 'Operational Test Passed',
      description: 'End-to-end test of donation flow in test mode',
      category: 'TECHNICAL' as const,
      required: true,
      sortOrder: 13,
    },
  ]

  for (const item of checklistItems) {
    await prisma.launchChecklistItem.upsert({
      where: { itemKey: item.itemKey },
      update: {},
      create: item,
    })
  }

  console.log(`✅ Created ${checklistItems.length} checklist items`)

  // Create compliance rules
  const countryRule = await prisma.complianceRule.upsert({
    where: { id: 'country-restriction-rule' },
    update: {},
    create: {
      id: 'country-restriction-rule',
      name: 'Allowed Countries',
      description: 'List of countries from which contributions are accepted',
      ruleType: 'COUNTRY_RESTRICTION',
      effectiveFrom: new Date('2024-01-01'),
      effectiveTo: null,
      isActive: true,
      config: {
        allowedCountries: ['US', 'CA', 'FR', 'HT'],
        blockMessage:
          'Contributions are currently only accepted from the United States, Canada, France, and Haiti.',
      },
    },
  })

  console.log('✅ Created compliance rule:', countryRule.name)

  const amountRule = await prisma.complianceRule.upsert({
    where: { id: 'amount-limit-rule' },
    update: {},
    create: {
      id: 'amount-limit-rule',
      name: 'Contribution Amount Limits',
      description: 'Minimum and maximum contribution amounts',
      ruleType: 'AMOUNT_LIMIT',
      effectiveFrom: new Date('2024-01-01'),
      effectiveTo: null,
      isActive: true,
      config: {
        minCents: 500,
        maxCents: 1000,
        currency: 'USD',
      },
    },
  })

  console.log('✅ Created compliance rule:', amountRule.name)

  // Create default owner user
  const defaultUser = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      name: 'System Owner',
      role: 'OWNER',
      active: true,
    },
  })

  console.log('✅ Created default user:', defaultUser.email, '(role:', defaultUser.role + ')')

  // Create sample content
  const bioContent = await prisma.content.upsert({
    where: { slug: 'candidate-bio' },
    update: {},
    create: {
      slug: 'candidate-bio',
      category: 'BIOGRAPHY',
      status: 'NEEDS_REVIEW',
      textHt: '[PLACEHOLDER: Byografi Jean Fritznel Bellefleur pral ale isit la]',
      textFr: '[PLACEHOLDER: La biographie de Jean Fritznel Bellefleur sera ici]',
      textEn: '[PLACEHOLDER: Jean Fritznel Bellefleur biography will go here]',
      verificationDate: null,
      publishedAt: null,
      tags: ['biography', 'candidate'],
    },
  })

  console.log('✅ Created content:', bioContent.slug)

  // Create reserved slugs (prevent impersonation)
  const reservedSlugs = [
    { slug: 'bellefleur', reason: 'Candidate surname' },
    { slug: 'jean-bellefleur', reason: 'Candidate full name variant' },
    { slug: 'fritznel-bellefleur', reason: 'Candidate name variant' },
    { slug: 'campaign', reason: 'Official campaign designation' },
    { slug: 'official', reason: 'Official designation' },
    { slug: 'senator', reason: 'Office title' },
    { slug: 'senateur', reason: 'Office title (French)' },
    { slug: 'admin', reason: 'System reserved' },
    { slug: 'administrator', reason: 'System reserved' },
    { slug: 'moderator', reason: 'System reserved' },
    { slug: 'staff', reason: 'System reserved' },
    { slug: 'team', reason: 'System reserved' },
    { slug: 'support', reason: 'System reserved' },
    { slug: 'help', reason: 'System reserved' },
    { slug: 'api', reason: 'System reserved' },
    { slug: 'nord-ouest', reason: 'Department name' },
    { slug: 'nordwest', reason: 'Department name variant' },
    { slug: 'northwest', reason: 'Department name (English)' },
  ]

  for (const reserved of reservedSlugs) {
    await prisma.reservedSlug.upsert({
      where: { slug: reserved.slug },
      update: {},
      create: reserved,
    })
  }

  console.log(`✅ Created ${reservedSlugs.length} reserved slugs`)

  // Create chapter seed candidates (pending approval)
  const chapterCandidates = [
    { slug: 'miami-fl', name: 'Miami, FL', city: 'Miami', state: 'FL', country: 'US' },
    { slug: 'new-york-ny', name: 'New York, NY', city: 'New York', state: 'NY', country: 'US' },
    { slug: 'boston-ma', name: 'Boston, MA', city: 'Boston', state: 'MA', country: 'US' },
    {
      slug: 'montreal-qc',
      name: 'Montreal, QC',
      city: 'Montreal',
      state: 'QC',
      country: 'CA',
    },
    { slug: 'paris-france', name: 'Paris, France', city: 'Paris', state: null, country: 'FR' },
    {
      slug: 'nassau-bahamas',
      name: 'Nassau, Bahamas',
      city: 'Nassau',
      state: null,
      country: 'BS',
    },
    {
      slug: 'turks-and-caicos',
      name: 'Turks and Caicos',
      city: 'Providenciales',
      state: null,
      country: 'TC',
    },
    {
      slug: 'santo-domingo',
      name: 'Santo Domingo',
      city: 'Santo Domingo',
      state: null,
      country: 'DO',
    },
  ]

  for (const chapter of chapterCandidates) {
    await prisma.chapter.upsert({
      where: { slug: chapter.slug },
      update: {},
      create: {
        ...chapter,
        status: 'PENDING',
        requestedBy: 'seed@example.com',
        requestedAt: new Date(),
        organizerName: 'To Be Determined',
        organizerEmail: null,
        organizerContactOptIn: false,
        memberCount: 0,
        totalAmountCents: 0,
        showLeaderboard: false,
        allowJoin: true,
        suspended: false,
      },
    })
  }

  console.log(`✅ Created ${chapterCandidates.length} chapter candidates (pending approval)`)

  // Create roots aggregates for communes
  const communes = [
    'mole-saint-nicolas',
    'baie-de-henne',
    'bombardopolis',
    'jean-rabel',
    'port-de-paix',
    'bassin-bleu',
    'chansolme',
    'la-tortue',
    'saint-louis-du-nord',
    'anse-a-foleur',
    'other', // Other Nord-Ouest
    'elsewhere', // Elsewhere in Haiti
  ]

  for (const communeSlug of communes) {
    await prisma.rootsAggregate.upsert({
      where: { communeSlug },
      update: {},
      create: {
        communeSlug,
        supporterCount: 0,
        isSuppressed: true, // Start suppressed (count < minimum)
        lastCalculatedAt: new Date(),
      },
    })
  }

  console.log(`✅ Created ${communes.length} roots aggregates`)

  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('⚠️  Launch Gate Status:')
  console.log('   Mode: INFO_ONLY (default - safest)')
  console.log('   Donations: DISABLED')
  console.log('   Waitlist: DISABLED')
  console.log('')
  console.log('📋 Next Steps:')
  console.log('   1. Review checklist at /admin/launch-control')
  console.log('   2. Complete all required items')
  console.log('   3. Verify candidacy status')
  console.log('   4. Change mode when ready (OWNER role required)')
  console.log('')
  console.log('👥 Chapter Requests:')
  console.log(`   ${chapterCandidates.length} pending approval at /admin/chapters`)

}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
