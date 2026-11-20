import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedJourneyEntries() {
  console.log('🌱 Seeding His Journey entries...')

  const entries = [
    {
      // E01 - 2016 RDNP Senate Candidate Announcement
      slug: 'e01-rdnp-senate-candidate-2016',
      category: 'ELECTIONS' as const,
      status: 'PUBLISHED' as const,
      confidence: 'CONFIRMED' as const,
      date: new Date('2016-08-01'),
      datePrecision: 'MONTH' as const,
      order: 1,
      textEn:
        'In August 2016, the Rassemblement des démocrates nationaux progressistes (RDNP) named Jean Fritznel Bellefleur as one of its seven candidates for the renewal of one third of the Senate, for the Northwest department.',
      textFr:
        'En août 2016, le Rassemblement des démocrates nationaux progressistes (RDNP) a nommé Jean Fritznel Bellefleur comme l\'un de ses sept candidats pour le renouvellement d\'un tiers du Sénat, pour le département du Nord-Ouest.',
      textHt:
        'Nan Dawout 2016, Rasanbleman demokrat nasyonal pwogresif yo (RDNP) te nonmen Jean Fritznel Bellefleur kòm youn nan sèt kandida li yo pou renouvèlman yon tyè Sena a, pou depatman Nòdwès la.',
      publishedAt: new Date(),
      publishedBy: 'system-seed',
      sources: [
        {
          title: 'Mirlande Manigat present the 7 Senate candidates of RNDP',
          publisher: 'HaitiLibre',
          url: 'https://www.haitilibre.com/en/news-18348-haiti-elections-mirlande-manigat-present-the-7-senate-candidates-of-rndp.html',
          language: 'en',
          accessedOn: new Date('2026-11-18'),
          order: 1,
        },
      ],
    },
    {
      // E02 - 2016 November Election Results
      slug: 'e02-senate-election-results-2016',
      category: 'ELECTIONS' as const,
      status: 'PUBLISHED' as const,
      confidence: 'REPORTED_SINGLE_SOURCE' as const,
      date: new Date('2016-11-01'),
      datePrecision: 'MONTH' as const,
      order: 2,
      textEn:
        'According to preliminary results published by the Provisional Electoral Council (CEP) and cited by Canada\'s Immigration and Refugee Board, he received 7,168 votes, or 11.26 percent, as the RDNP candidate for Senator in the Nord-Ouest department in the first round of the November 2016 elections.',
      textFr:
        'Selon les résultats préliminaires publiés par le Conseil électoral provisoire (CEP) et cités par la Commission de l\'immigration et du statut de réfugié du Canada, il a reçu 7 168 votes, soit 11,26 pour cent, en tant que candidat du RDNP pour sénateur dans le département du Nord-Ouest au premier tour des élections de novembre 2016.',
      textHt:
        'Selon rezilta preliminè ki pibliye pa Konsèy Elektoral Pwovizwa (CEP) a epi site pa Komisyon Imigrasyon ak Estati Refijye Kanada, li te resevwa 7,168 vòt, oswa 11.26 pousan, kòm kandida RDNP pou Senatè nan depatman Nòdwès nan premye tou eleksyon Novanm 2016 yo.',
      publishedAt: new Date(),
      publishedBy: 'system-seed',
      verificationNotes: 'Preliminary results; reported by a single secondary source.',
      sources: [
        {
          title: 'RDNP (Rassemblement des Démocrates Nationaux Progressistes) [2014 to June 2018]',
          publisher: 'Immigration and Refugee Board of Canada',
          url: 'https://www.irb-cisr.gc.ca/en/country-information/rir/Pages/index.aspx?doc=457515',
          language: 'en',
          accessedOn: new Date('2026-11-18'),
          order: 1,
        },
        {
          title: 'RDNP (Rassemblement des Démocrates Nationaux Progressistes) [2014 à juin 2018]',
          publisher: 'Commission de l\'immigration et du statut de réfugié du Canada',
          url: 'https://irb-cisr.gc.ca/fr/renseignements-pays/rdi/Pages/index.aspx?doc=457500',
          language: 'fr',
          accessedOn: new Date('2026-11-18'),
          order: 2,
        },
      ],
    },
    {
      // E03 - 2015 Deputy Filing (NEEDS_REVIEW - INTERNAL)
      slug: 'e03-deputy-filing-2015',
      category: 'ELECTIONS' as const,
      status: 'NEEDS_REVIEW' as const,
      confidence: 'DISPUTED_DATE' as const,
      date: new Date('2015-01-01'),
      datePrecision: 'YEAR' as const,
      order: 3,
      textEn:
        'CEP lists from April and May 2015 show a filing for deputy in Môle-Saint-Nicolas under Konvansyon Inité Demokratik, marked "rejeté" on the May 13, 2015 decision list. Ambiguous; verify the final outcome with the campaign.',
      textFr:
        'Les listes du CEP d\'avril et mai 2015 montrent un dépôt pour député à Môle-Saint-Nicolas sous Konvansyon Inité Demokratik, marqué "rejeté" sur la liste de décision du 13 mai 2015. Ambigu; vérifier le résultat final avec la campagne.',
      textHt:
        'Lis CEP soti nan Avril ak Me 2015 montre yon depo pou depite nan Môle-Saint-Nicolas anba Konvansyon Inité Demokratik, make "rejeté" sou lis desizyon 13 Me 2015 la. Anbigwe; verifye rezilta final la ak kanpay la.',
      verificationNotes: 'INTERNAL - Never publish without candidate approval. Ambiguous outcome.',
      sources: [
        {
          title: 'Liste des candidats inscrits (Avril 2015)',
          publisher: 'HaitiLibre/CEP',
          url: 'https://www.haitilibre.com/docs/liste_des_candidats_inscrits_avril_15.pdf',
          language: 'fr',
          accessedOn: new Date('2026-11-18'),
          order: 1,
        },
        {
          title: 'Liste définitive des candidats (14 mai 2015)',
          publisher: 'HaitiLibre/CEP',
          url: 'https://www.haitilibre.com/docs/Liste_definitive_des_candidats_14_mai_2015.pdf',
          language: 'fr',
          accessedOn: new Date('2026-11-18'),
          order: 2,
        },
      ],
    },
    {
      // E04 - 2026 Candidacy (NEEDS_REVIEW - awaiting evidence)
      slug: 'e04-senate-candidacy-2026',
      category: 'ELECTIONS' as const,
      status: 'NEEDS_REVIEW' as const,
      confidence: 'REPORTED_SINGLE_SOURCE' as const,
      date: new Date('2026-01-01'),
      datePrecision: 'YEAR' as const,
      order: 4,
      textEn:
        'Registered as a candidate for Senator, Nord-Ouest department.',
      textFr:
        'Inscrit comme candidat pour Sénateur, département du Nord-Ouest.',
      textHt:
        'Enskri kòm kandida pou Senatè, depatman Nòdwès.',
      verificationNotes:
        'NEEDS_REVIEW until CEP registry or registration receipt is attached and candidacyStatus is updated. Do not publish without evidence.',
      sources: [], // No sources yet - cannot publish
    },
  ]

  for (const entry of entries) {
    const { sources, ...entryData } = entry

    await prisma.content.upsert({
      where: { slug: entry.slug },
      create: {
        ...entryData,
        sources: {
          create: sources,
        },
      },
      update: {
        ...entryData,
        sources: {
          deleteMany: {},
          create: sources,
        },
      },
    })
  }

  console.log(`✓ Created ${entries.length} His Journey entries`)
  console.log('  ✅ E01: PUBLISHED (CONFIRMED)')
  console.log('  ✅ E02: PUBLISHED (SINGLE_SOURCE)')
  console.log('  ⚠️  E03: NEEDS_REVIEW (INTERNAL - never publish without approval)')
  console.log('  ⚠️  E04: NEEDS_REVIEW (awaiting CEP evidence)')
  console.log('')
  console.log('⚠️  E05-E09: NOT SEEDED - await intake workflow for Education, Career, Civic entries')
}

async function main() {
  console.log('Starting His Journey seed...')
  console.log('')

  await seedJourneyEntries()

  console.log('')
  console.log('✅ His Journey seed complete!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Run source verification: npm run verify:journey')
  console.log('2. Review NEEDS_REVIEW entries in admin')
  console.log('3. Native speaker review of FR/HT translations')
  console.log('4. Visit /[locale]/bellefleur to see published entries')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
