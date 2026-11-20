/**
 * Q&A System with Canned Replies
 * 
 * Features:
 * - Question submission form
 * - Spam detection
 * - Canned reply templates in ht/fr/en
 * - Admin inbox management
 * - Response tracking
 * - Rate limiting
 */

import { prisma } from '@/lib/db/prisma'
import type { QuestionStatus } from '@prisma/client'

// ============================================================================
// Types
// ============================================================================

export interface SubmitQuestionInput {
  email: string
  firstName?: string
  lastName?: string
  question: string
  country?: string
  consentIpAddress?: string
  consentUserAgent?: string
}

export interface CreateCannedReplyInput {
  slug: string
  titleHt: string
  titleFr: string
  titleEn: string
  contentHt: string
  contentFr: string
  contentEn: string
}

export interface RespondToQuestionInput {
  questionId: string
  response: string
  cannedReplyId?: string // Optional: track which canned reply was used
  respondedBy: string
}

export interface QuestionStats {
  total: number
  pending: number
  responded: number
  spam: number
  archived: number
  averageResponseTimeHours: number
  topCannedReplies: Array<{
    slug: string
    titleEn: string
    useCount: number
  }>
}

// ============================================================================
// Rate Limiting
// ============================================================================

const QUESTION_RATE_LIMITS = {
  PER_IP_PER_HOUR: 3,
  PER_EMAIL_PER_HOUR: 2,
} as const

async function checkQuestionRateLimits(
  email: string,
  ipAddress?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  // Check email rate limit
  const emailCount = await prisma.question.count({
    where: {
      email: email.toLowerCase(),
      createdAt: { gte: oneHourAgo },
    },
  })

  if (emailCount >= QUESTION_RATE_LIMITS.PER_EMAIL_PER_HOUR) {
    return {
      allowed: false,
      reason: 'TOO_MANY_QUESTIONS_FROM_EMAIL',
    }
  }

  // Check IP rate limit (if provided)
  if (ipAddress) {
    const ipCount = await prisma.question.count({
      where: {
        consentIpAddress: ipAddress,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (ipCount >= QUESTION_RATE_LIMITS.PER_IP_PER_HOUR) {
      return {
        allowed: false,
        reason: 'TOO_MANY_QUESTIONS_FROM_IP',
      }
    }
  }

  return { allowed: true }
}

// ============================================================================
// Spam Detection
// ============================================================================

const SPAM_PATTERNS = [
  // Common spam indicators
  /\b(viagra|cialis|poker|casino|lottery|prize)\b/i,
  /\b(click here|buy now|limited time|act now)\b/i,
  /\b(make money|work from home|earn \$\d+)\b/i,
  
  // Suspicious patterns
  /https?:\/\/[^\s]+/gi, // Multiple URLs (count matches)
  /<[^>]+>/g, // HTML tags
  /\b[A-Z]{10,}\b/, // All caps words
  
  // Gibberish detection
  /[bcdfghjklmnpqrstvwxyz]{8,}/i, // Long consonant sequences
]

function calculateSpamScore(question: string): number {
  let score = 0

  // Check each spam pattern
  for (const pattern of SPAM_PATTERNS) {
    const matches = question.match(pattern)
    if (matches) {
      if (pattern.source.includes('https?')) {
        // Multiple URLs: +10 per URL beyond the first
        score += Math.max(0, (matches.length - 1) * 10)
      } else {
        score += 15
      }
    }
  }

  // Check for excessive punctuation
  const punctuationCount = (question.match(/[!?]{2,}/g) || []).length
  score += punctuationCount * 10

  // Check length (very short questions are suspicious)
  if (question.trim().length < 10) {
    score += 20
  }

  // Check for excessive repetition
  const words = question.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)
  if (words.length > 5 && uniqueWords.size / words.length < 0.5) {
    score += 15 // More than 50% repeated words
  }

  return Math.min(score, 100) // Cap at 100
}

// ============================================================================
// Validation
// ============================================================================

function validateQuestionInput(input: SubmitQuestionInput): void {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(input.email)) {
    throw new Error('INVALID_EMAIL_FORMAT')
  }

  // Question validation
  if (!input.question?.trim()) {
    throw new Error('QUESTION_REQUIRED')
  }

  if (input.question.trim().length < 10) {
    throw new Error('QUESTION_TOO_SHORT')
  }

  if (input.question.trim().length > 2000) {
    throw new Error('QUESTION_TOO_LONG')
  }
}

function validateCannedReplyInput(input: CreateCannedReplyInput): void {
  // Slug validation
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(input.slug)) {
    throw new Error('INVALID_SLUG_FORMAT')
  }

  // All translations required
  if (!input.titleHt?.trim() || !input.titleFr?.trim() || !input.titleEn?.trim()) {
    throw new Error('ALL_TITLE_TRANSLATIONS_REQUIRED')
  }

  if (!input.contentHt?.trim() || !input.contentFr?.trim() || !input.contentEn?.trim()) {
    throw new Error('ALL_CONTENT_TRANSLATIONS_REQUIRED')
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Submit a new question
 */
export async function submitQuestion(
  input: SubmitQuestionInput
): Promise<{ id: string; spamScore: number }> {
  validateQuestionInput(input)

  // Rate limit check
  const rateLimitCheck = await checkQuestionRateLimits(
    input.email,
    input.consentIpAddress
  )

  if (!rateLimitCheck.allowed) {
    throw new Error(rateLimitCheck.reason)
  }

  // Calculate spam score
  const spamScore = calculateSpamScore(input.question)

  // Auto-mark as spam if score is very high
  const status: QuestionStatus = spamScore >= 80 ? 'SPAM' : 'PENDING'

  const question = await prisma.question.create({
    data: {
      email: input.email.toLowerCase(),
      firstName: input.firstName?.trim(),
      lastName: input.lastName?.trim(),
      question: input.question.trim(),
      country: input.country,
      spamScore,
      status,
      consentIpAddress: input.consentIpAddress,
      consentUserAgent: input.consentUserAgent,
      consentTimestamp: new Date(),
    },
  })

  return {
    id: question.id,
    spamScore,
  }
}

/**
 * Create a canned reply template
 */
export async function createCannedReply(
  input: CreateCannedReplyInput,
  createdBy: string
): Promise<{ id: string; slug: string }> {
  validateCannedReplyInput(input)

  // Check for slug uniqueness
  const existing = await prisma.cannedReply.findUnique({
    where: { slug: input.slug },
  })

  if (existing) {
    throw new Error('SLUG_ALREADY_EXISTS')
  }

  const cannedReply = await prisma.cannedReply.create({
    data: {
      slug: input.slug,
      titleHt: input.titleHt.trim(),
      titleFr: input.titleFr.trim(),
      titleEn: input.titleEn.trim(),
      contentHt: input.contentHt.trim(),
      contentFr: input.contentFr.trim(),
      contentEn: input.contentEn.trim(),
      useCount: 0,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'CANNED_REPLY_CREATED',
      entityType: 'CannedReply',
      entityId: cannedReply.id,
      userId: createdBy,
      changes: {
        slug: input.slug,
        titleEn: input.titleEn,
      },
    },
  })

  return {
    id: cannedReply.id,
    slug: cannedReply.slug,
  }
}

/**
 * Update a canned reply template
 */
export async function updateCannedReply(
  cannedReplyId: string,
  updates: Partial<CreateCannedReplyInput>,
  updatedBy: string
): Promise<void> {
  const existing = await prisma.cannedReply.findUnique({
    where: { id: cannedReplyId },
  })

  if (!existing) {
    throw new Error('CANNED_REPLY_NOT_FOUND')
  }

  await prisma.cannedReply.update({
    where: { id: cannedReplyId },
    data: {
      ...(updates.titleHt && { titleHt: updates.titleHt.trim() }),
      ...(updates.titleFr && { titleFr: updates.titleFr.trim() }),
      ...(updates.titleEn && { titleEn: updates.titleEn.trim() }),
      ...(updates.contentHt && { contentHt: updates.contentHt.trim() }),
      ...(updates.contentFr && { contentFr: updates.contentFr.trim() }),
      ...(updates.contentEn && { contentEn: updates.contentEn.trim() }),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'CANNED_REPLY_UPDATED',
      entityType: 'CannedReply',
      entityId: cannedReplyId,
      userId: updatedBy,
      changes: updates,
    },
  })
}

/**
 * Respond to a question
 */
export async function respondToQuestion(
  input: RespondToQuestionInput
): Promise<void> {
  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
  })

  if (!question) {
    throw new Error('QUESTION_NOT_FOUND')
  }

  if (question.status === 'RESPONDED') {
    throw new Error('QUESTION_ALREADY_RESPONDED')
  }

  if (question.status === 'SPAM') {
    throw new Error('CANNOT_RESPOND_TO_SPAM')
  }

  // Update question
  await prisma.question.update({
    where: { id: input.questionId },
    data: {
      response: input.response.trim(),
      status: 'RESPONDED',
      respondedAt: new Date(),
      cannedReplyId: input.cannedReplyId,
    },
  })

  // Increment canned reply use count if applicable
  if (input.cannedReplyId) {
    await prisma.cannedReply.update({
      where: { id: input.cannedReplyId },
      data: {
        useCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    })
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'QUESTION_RESPONDED',
      entityType: 'Question',
      entityId: input.questionId,
      userId: input.respondedBy,
      changes: {
        cannedReplyId: input.cannedReplyId,
      },
    },
  })
}

/**
 * Update question status (mark as spam, archive, etc.)
 */
export async function updateQuestionStatus(
  questionId: string,
  status: QuestionStatus,
  updatedBy: string
): Promise<void> {
  await prisma.question.update({
    where: { id: questionId },
    data: { status },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'QUESTION_STATUS_UPDATED',
      entityType: 'Question',
      entityId: questionId,
      userId: updatedBy,
      changes: { status },
    },
  })
}

/**
 * Get all canned replies (for admin UI picker)
 */
export async function getCannedReplies(locale: 'ht' | 'fr' | 'en'): Promise<
  Array<{
    id: string
    slug: string
    title: string
    content: string
    useCount: number
  }>
> {
  const replies = await prisma.cannedReply.findMany({
    orderBy: [
      { useCount: 'desc' },
      { titleEn: 'asc' },
    ],
  })

  return replies.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: locale === 'ht' ? r.titleHt : locale === 'fr' ? r.titleFr : r.titleEn,
    content: locale === 'ht' ? r.contentHt : locale === 'fr' ? r.contentFr : r.contentEn,
    useCount: r.useCount,
  }))
}

/**
 * Get question statistics
 */
export async function getQuestionStats(): Promise<QuestionStats> {
  const [
    questions,
    cannedReplies,
  ] = await Promise.all([
    prisma.question.findMany({
      select: {
        status: true,
        createdAt: true,
        respondedAt: true,
      },
    }),
    prisma.cannedReply.findMany({
      select: {
        slug: true,
        titleEn: true,
        useCount: true,
      },
      orderBy: { useCount: 'desc' },
      take: 5,
    }),
  ])

  let pending = 0
  let responded = 0
  let spam = 0
  let archived = 0
  let totalResponseTime = 0
  let respondedCount = 0

  for (const q of questions) {
    if (q.status === 'PENDING') pending++
    else if (q.status === 'RESPONDED') {
      responded++
      if (q.respondedAt) {
        const responseTime = q.respondedAt.getTime() - q.createdAt.getTime()
        totalResponseTime += responseTime
        respondedCount++
      }
    } else if (q.status === 'SPAM') spam++
    else if (q.status === 'ARCHIVED') archived++
  }

  const averageResponseTimeMs = respondedCount > 0 ? totalResponseTime / respondedCount : 0
  const averageResponseTimeHours = Math.round((averageResponseTimeMs / (1000 * 60 * 60)) * 10) / 10

  return {
    total: questions.length,
    pending,
    responded,
    spam,
    archived,
    averageResponseTimeHours,
    topCannedReplies: cannedReplies,
  }
}

/**
 * Export questions (audit-logged)
 */
export async function exportQuestions(
  filters: {
    status?: QuestionStatus
    minSpamScore?: number
    country?: string
  },
  exportedBy: {
    userId: string
    userEmail: string
    userRole: string
  },
  reason: string
): Promise<Array<{
  email: string
  firstName: string | null
  lastName: string | null
  question: string
  response: string | null
  status: string
  spamScore: number
  createdAt: Date
  respondedAt: Date | null
}>> {
  if (!reason.trim()) {
    throw new Error('EXPORT_REASON_REQUIRED')
  }

  const questions = await prisma.question.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.minSpamScore !== undefined && {
        spamScore: { gte: filters.minSpamScore },
      }),
      ...(filters.country && { country: filters.country }),
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      question: true,
      response: true,
      status: true,
      spamScore: true,
      createdAt: true,
      respondedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Audit log the export
  await prisma.subscriberExport.create({
    data: {
      exportType: 'QUESTIONS',
      format: 'JSON',
      filters: filters as any,
      recordCount: questions.length,
      exportedBy: exportedBy.userId,
      exportedByEmail: exportedBy.userEmail,
      exportedByRole: exportedBy.userRole,
      reason: reason.trim(),
    },
  })

  return questions
}

/**
 * Seed default canned replies (for initial setup)
 */
export async function seedCannedReplies(createdBy: string): Promise<number> {
  const defaultReplies: CreateCannedReplyInput[] = [
    {
      slug: 'thank-you-general',
      titleHt: 'Mèsi pou kesyon ou',
      titleFr: 'Merci pour votre question',
      titleEn: 'Thank you for your question',
      contentHt: 'Mèsi anpil pou ou te kontakte nou. Ekip nou ap revize kesyon ou epi n ap reponn ou nan kèk jou.',
      contentFr: 'Merci beaucoup de nous avoir contactés. Notre équipe examine votre question et vous répondra dans quelques jours.',
      contentEn: 'Thank you very much for contacting us. Our team is reviewing your question and will respond within a few days.',
    },
    {
      slug: 'donations-not-open',
      titleHt: 'Kontribisyon poko louvri',
      titleFr: 'Les contributions ne sont pas encore ouvertes',
      titleEn: 'Contributions not yet open',
      contentHt: 'Mèsi pou enterè ou. Nou poko kòmanse aksepte kontribisyon. Enskri nan lis atant nou pou resevwa notifikasyon lè nou pare.',
      contentFr: 'Merci pour votre intérêt. Nous n\'acceptons pas encore de contributions. Inscrivez-vous sur notre liste d\'attente pour être notifié lorsque nous serons prêts.',
      contentEn: 'Thank you for your interest. We are not yet accepting contributions. Sign up for our waitlist to be notified when we are ready.',
    },
    {
      slug: 'volunteer-opportunities',
      titleHt: 'Opòtinite pou volontè',
      titleFr: 'Opportunités de bénévolat',
      titleEn: 'Volunteer opportunities',
      contentHt: 'Nou apresye enterè ou pou ede! Tanpri ranpli fòm volontè nou yo epi n ap kontakte ou ak opòtinite ki koresponn ak konpetans ou.',
      contentFr: 'Nous apprécions votre intérêt pour aider ! Veuillez remplir notre formulaire de bénévolat et nous vous contacterons avec des opportunités correspondant à vos compétences.',
      contentEn: 'We appreciate your interest in helping! Please fill out our volunteer form and we will contact you with opportunities matching your skills.',
    },
    {
      slug: 'affiliation-disclosure',
      titleHt: 'Enfòmasyon sou afilyasyon',
      titleFr: 'Informations sur l\'affiliation',
      titleEn: 'Affiliation information',
      contentHt: 'Sit sa a se yon inisyativ sipòtè endepandan, li pa otorize pa oswa afilye avèk kandida a, kanpay li oswa nenpòt pati.',
      contentFr: 'Ce site est une initiative de soutien indépendante, non autorisée par ou affiliée avec le candidat, sa campagne ou tout parti.',
      contentEn: 'This site is an independent supporter initiative, not authorized by or affiliated with the candidate, their campaign or any party.',
    },
    {
      slug: 'event-info',
      titleHt: 'Enfòmasyon sou evènman',
      titleFr: 'Informations sur l\'événement',
      titleEn: 'Event information',
      contentHt: 'Gade seksyon evènman nou yo pou wè tout aktivite ki vini yo. Ou ka enskri dirèkteman sou paj evènman an.',
      contentFr: 'Consultez notre section événements pour voir toutes les activités à venir. Vous pouvez vous inscrire directement sur la page de l\'événement.',
      contentEn: 'Check our events section for all upcoming activities. You can register directly on the event page.',
    },
  ]

  let created = 0

  for (const reply of defaultReplies) {
    try {
      await createCannedReply(reply, createdBy)
      created++
    } catch (error) {
      // Skip if already exists
      if (error instanceof Error && error.message !== 'SLUG_ALREADY_EXISTS') {
        throw error
      }
    }
  }

  return created
}
