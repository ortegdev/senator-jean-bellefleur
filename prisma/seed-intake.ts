import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedIntakeChecklist() {
  console.log('🌱 Seeding intake checklist...')

  const checklistItems = [
    {
      itemKey: 'cep_registration',
      title: 'CEP Registration Proof',
      description: 'Official document showing registration with Conseil Electoral Provisoire',
      category: 'CEP_REGISTRATION' as const,
      required: true,
      sortOrder: 1,
    },
    {
      itemKey: 'party_2026',
      title: 'Party Affiliation for 2026',
      description: 'Verified party affiliation for the 2026 election cycle',
      category: 'PARTY_2026' as const,
      required: true,
      sortOrder: 2,
    },
    {
      itemKey: 'education',
      title: 'Education History',
      description: 'Verified educational background with diplomas or transcripts',
      category: 'EDUCATION' as const,
      required: true,
      sortOrder: 3,
    },
    {
      itemKey: 'work_history',
      title: 'Professional Work History',
      description: 'Verified employment history and professional experience',
      category: 'WORK_HISTORY' as const,
      required: true,
      sortOrder: 4,
    },
    {
      itemKey: 'public_service',
      title: 'Public Service Record',
      description: 'Any previous public service, elected positions, or government roles',
      category: 'PUBLIC_SERVICE' as const,
      required: false,
      sortOrder: 5,
    },
    {
      itemKey: 'approved_photo',
      title: 'Approved Candidate Photo',
      description: 'High-resolution photo with permission to use',
      category: 'PHOTO' as const,
      required: false,
      sortOrder: 6,
    },
    {
      itemKey: 'approved_logo',
      title: 'Approved Campaign Logo',
      description: 'Official campaign logo with permission to use',
      category: 'LOGO' as const,
      required: false,
      sortOrder: 7,
    },
    {
      itemKey: 'name_permission',
      title: 'Permission to Use Name',
      description: 'Written permission from candidate or campaign to use name and likeness',
      category: 'NAME_PERMISSION' as const,
      required: true,
      sortOrder: 8,
    },
  ]

  for (const item of checklistItems) {
    await prisma.intakeChecklist.upsert({
      where: { itemKey: item.itemKey },
      create: item,
      update: item,
    })
  }

  console.log(`✓ Created ${checklistItems.length} intake checklist items`)
}

async function seedStarterFAQs() {
  console.log('🌱 Seeding starter FAQs...')

  const starterFAQs = [
    {
      key: 'is_official',
      questionEn: 'Is this the official campaign website?',
      questionFr: 'Est-ce le site web officiel de la campagne ?',
      questionHt: 'Èske se sit ofisyèl kanpay la?',
      answerEn:
        'No. This is an independent supporter initiative, not authorized by or affiliated with the candidate, his campaign, or any political party. See our affiliation disclosure at the top of every page.',
      answerFr:
        'Non. C\'est une initiative de soutien indépendante, non autorisée par ou affiliée au candidat, sa campagne ou un parti politique. Voir notre divulgation d\'affiliation en haut de chaque page.',
      answerHt:
        'Non. Sa a se yon inisyativ sipòtè endepandan, pa otorize pa oswa afilye ak kandida a, kanpay li oswa nenpòt pati politik. Gade deklarasyon afiliyasyon nou anwo chak paj.',
      sourceTitle: 'Site Affiliation Policy',
      sourceNotes: 'As stated in steering documentation and visible on every page',
    },
    {
      key: 'who_behind',
      questionEn: 'Who is behind this initiative?',
      questionFr: 'Qui est derrière cette initiative ?',
      questionHt: 'Kilès ki dèyè inisyativ sa a?',
      answerEn:
        'This site is built and maintained by independent supporters in the Haitian diaspora who want to support representation for Nord-Ouest. It is not connected to any official campaign organization.',
      answerFr:
        'Ce site est construit et maintenu par des supporteurs indépendants de la diaspora haïtienne qui souhaitent soutenir la représentation du Nord-Ouest. Il n\'est pas connecté à une organisation de campagne officielle.',
      answerHt:
        'Sit sa a bati ak entretni pa sipòtè endepandan nan dyaspora ayisyen ki vle sipòte reprezantasyon Nòdwès. Li pa konekte ak okenn òganizasyon kanpay ofisyèl.',
      sourceTitle: 'About This Initiative',
      sourceNotes: 'As documented in project README and steering files',
    },
    {
      key: 'declined_gift',
      questionEn: 'What happens to my contribution if the campaign declines it?',
      questionFr: 'Qu\'advient-il de ma contribution si la campagne la refuse ?',
      questionHt: 'Kisa k ap rive kontribisyon mwen an si kanpay la refize li?',
      answerEn:
        'All contributions are processed through secure payment providers and will be refunded according to the refund policy if the campaign declines to accept them. No funds are distributed without proper acceptance and compliance verification.',
      answerFr:
        'Toutes les contributions sont traitées par des fournisseurs de paiement sécurisés et seront remboursées selon la politique de remboursement si la campagne refuse de les accepter. Aucun fonds n\'est distribué sans acceptation appropriée et vérification de conformité.',
      answerHt:
        'Tout kontribisyon trete atravè founisè peman sekirize epi yo ap ranboure selon politik ranbouman an si kanpay la refize aksepte yo. Yo pa distribye okenn lajan san akseptasyon apwopriye ak verifikasyon konfòmite.',
      sourceTitle: 'Refund Policy',
      sourceNotes: 'To be documented in site terms before donations launch',
    },
    {
      key: 'money_where',
      questionEn: 'Where does my money go?',
      questionFr: 'Où va mon argent ?',
      questionHt: 'Ki kote lajan mwen ale?',
      answerEn:
        'When donations are enabled, funds are held securely by the payment processor until they can be properly transferred to an account designated by the campaign or candidate, following all applicable Haitian election law requirements.',
      answerFr:
        'Lorsque les dons sont activés, les fonds sont conservés en toute sécurité par le processeur de paiement jusqu\'à ce qu\'ils puissent être correctement transférés vers un compte désigné par la campagne ou le candidat, conformément à toutes les exigences applicables de la loi électorale haïtienne.',
      answerHt:
        'Lè don yo aktive, lajan yo kenbe an sekirite pa procesè peman an jiskaske yo kapab transfere yo kòrèkteman nan yon kont deziye pa kanpay la oswa kandida a, swivan tout kondisyon ki aplikab nan lwa eleksyon ayisyen.',
      sourceTitle: 'Fund Management Policy',
      sourceNotes: 'To be verified with legal counsel before donations launch',
    },
    {
      key: 'report_error',
      questionEn: 'How do I report a factual error on this site?',
      questionFr: 'Comment signaler une erreur factuelle sur ce site ?',
      questionHt: 'Kòman mwen rapòte yon erè faktik sou sit sa a?',
      answerEn:
        'Use the "Report a Factual Error" link at the bottom of the profile page, or email us directly. Please include the specific claim you believe is incorrect and provide evidence if available. All reports are reviewed promptly.',
      answerFr:
        'Utilisez le lien "Signaler une erreur factuelle" en bas de la page de profil, ou envoyez-nous un e-mail directement. Veuillez inclure l\'affirmation spécifique que vous pensez incorrecte et fournir des preuves si disponibles. Tous les rapports sont examinés rapidement.',
      answerHt:
        'Itilize lyen "Rapòte yon erè faktik" nan ba paj pwofil la, oswa voye yon imèl direkteman. Tanpri mete reklamasyon espesifik ou panse ki pa kòrèk la epi bay prèv si ou genyen. Yo revize tout rapò rapidman.',
      sourceTitle: 'Error Reporting Process',
      sourceNotes: 'Defined in site governance documentation',
    },
  ]

  for (const faq of starterFAQs) {
    await prisma.fAQ.upsert({
      where: { id: faq.key },
      create: {
        id: faq.key,
        questionEn: faq.questionEn,
        questionFr: faq.questionFr,
        questionHt: faq.questionHt,
        answerEn: faq.answerEn,
        answerFr: faq.answerFr,
        answerHt: faq.answerHt,
        status: 'DRAFT', // Admin must publish after review
        order: starterFAQs.indexOf(faq),
        featured: true,
        sources: {
          create: [
            {
              title: faq.sourceTitle,
              notes: faq.sourceNotes,
            },
          ],
        },
      },
      update: {
        questionEn: faq.questionEn,
        questionFr: faq.questionFr,
        questionHt: faq.questionHt,
        answerEn: faq.answerEn,
        answerFr: faq.answerFr,
        answerHt: faq.answerHt,
      },
    })
  }

  console.log(`✓ Created ${starterFAQs.length} starter FAQ entries (DRAFT status)`)
  console.log('  ⚠️  FAQs are in DRAFT - admin must review sources and publish')
}

async function main() {
  console.log('Starting intake seed...')

  await seedIntakeChecklist()
  await seedStarterFAQs()

  console.log('✅ Intake seed complete!')
  console.log('')
  console.log('Next steps:')
  console.log('1. Review intake checklist at /admin/intake')
  console.log('2. Review and publish starter FAQs at /admin/faq')
  console.log('3. Do NOT seed any biography, education, or profession data - none is verified yet')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
