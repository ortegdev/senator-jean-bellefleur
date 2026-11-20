import { z } from 'zod'

/**
 * Contribution validation schema
 */
export const contributionSchema = z.object({
  amountCents: z.number().int().positive().min(500).max(100000),
  donorEmail: z.string().email(),
  donorFirstName: z.string().min(1).max(100),
  donorLastName: z.string().min(1).max(100),
  donorCountry: z.string().length(2).toUpperCase(),
  donorPostalCode: z.string().max(20).optional(),
  donorOptInPublic: z.boolean().default(false),
  donorOptInEmail: z.boolean().default(false),
  locale: z.string().default('en'),
  referralCode: z.string().optional(),
})

export type ContributionInput = z.infer<typeof contributionSchema>

/**
 * Content validation schema
 */
export const contentSchema = z.object({
  slug: z.string().min(1).max(100),
  type: z.enum(['BIOGRAPHY', 'POLICY', 'NEWS', 'FAQ', 'TESTIMONIAL', 'ENDORSEMENT']),
  status: z.enum(['DRAFT', 'NEEDS_REVIEW', 'PUBLISHED', 'ARCHIVED']),
  titleHt: z.string().optional(),
  titleFr: z.string().optional(),
  titleEn: z.string().optional(),
  bodyHt: z.string().optional(),
  bodyFr: z.string().optional(),
  bodyEn: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
})

export type ContentInput = z.infer<typeof contentSchema>

/**
 * Candidate config update schema
 */
export const candidateConfigUpdateSchema = z.object({
  candidacyStatus: z.enum([
    'UNVERIFIED',
    'REGISTERED_PRELIMINARY',
    'ON_FINAL_LIST',
    'NOT_ON_FINAL_LIST',
  ]),
  candidacyStatusSource: z.string().optional(),
  affiliationStatus: z.enum(['INDEPENDENT', 'AUTHORIZED', 'COORDINATED']),
  affiliationText: z.string().min(10),
  minAmountCents: z.number().int().positive(),
  maxAmountCents: z.number().int().positive(),
  cumulativeCapCents: z.number().int().positive(),
})

export type CandidateConfigUpdate = z.infer<typeof candidateConfigUpdateSchema>
