/**
 * Volunteer Management System
 * 
 * Features:
 * - Volunteer signup with skills and availability
 * - Assignment management
 * - Skills matching
 * - Status tracking
 * - Audit logging
 */

import { prisma } from '@/lib/db/prisma'
import type { 
  VolunteerSkill, 
  VolunteerStatus, 
  AssignmentStatus 
} from '@prisma/client'

// ============================================================================
// Types
// ============================================================================

export interface CreateVolunteerInput {
  email: string
  firstName: string
  lastName: string
  country: string
  communeOfOrigin?: string
  skills: VolunteerSkill[]
  otherSkill?: string // Required if skills includes OTHER
  hoursPerWeek: number
  availability: string // Free text: "Weekends", "Evenings", etc.
  preferredLocale: 'ht' | 'fr' | 'en'
  whyVolunteer: string
  consentIpAddress?: string
  consentUserAgent?: string
}

export interface CreateAssignmentInput {
  volunteerId: string
  title: string
  description: string
  skill: VolunteerSkill
  estimatedHours?: number
  dueDate?: Date
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

export interface SkillMatchQuery {
  skill: VolunteerSkill
  minHoursPerWeek?: number
  country?: string
  status?: VolunteerStatus
}

export interface VolunteerStats {
  total: number
  active: number
  pending: number
  inactive: number
  bySkill: Record<string, number>
  byCountry: Record<string, number>
  totalHoursOffered: number
  assignmentsActive: number
  assignmentsCompleted: number
}

// ============================================================================
// Rate Limiting
// ============================================================================

const VOLUNTEER_RATE_LIMITS = {
  PER_IP_PER_HOUR: 3,
  PER_EMAIL_PER_HOUR: 2,
} as const

async function checkVolunteerRateLimits(
  email: string,
  ipAddress?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  // Check email rate limit
  const emailCount = await prisma.volunteer.count({
    where: {
      email,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (emailCount >= VOLUNTEER_RATE_LIMITS.PER_EMAIL_PER_HOUR) {
    return {
      allowed: false,
      reason: 'TOO_MANY_SIGNUPS_FROM_EMAIL',
    }
  }

  // Check IP rate limit (if provided)
  if (ipAddress) {
    const ipCount = await prisma.volunteer.count({
      where: {
        consentIpAddress: ipAddress,
        createdAt: { gte: oneHourAgo },
      },
    })

    if (ipCount >= VOLUNTEER_RATE_LIMITS.PER_IP_PER_HOUR) {
      return {
        allowed: false,
        reason: 'TOO_MANY_SIGNUPS_FROM_IP',
      }
    }
  }

  return { allowed: true }
}

// ============================================================================
// Validation
// ============================================================================

function validateVolunteerInput(input: CreateVolunteerInput): void {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(input.email)) {
    throw new Error('INVALID_EMAIL_FORMAT')
  }

  // Skills validation
  if (input.skills.length === 0) {
    throw new Error('AT_LEAST_ONE_SKILL_REQUIRED')
  }

  if (input.skills.includes('OTHER' as VolunteerSkill) && !input.otherSkill?.trim()) {
    throw new Error('OTHER_SKILL_DESCRIPTION_REQUIRED')
  }

  // Hours validation
  if (input.hoursPerWeek < 1 || input.hoursPerWeek > 40) {
    throw new Error('HOURS_PER_WEEK_OUT_OF_RANGE')
  }

  // Required fields
  if (!input.firstName?.trim()) {
    throw new Error('FIRST_NAME_REQUIRED')
  }

  if (!input.lastName?.trim()) {
    throw new Error('LAST_NAME_REQUIRED')
  }

  if (!input.availability?.trim()) {
    throw new Error('AVAILABILITY_REQUIRED')
  }

  if (!input.whyVolunteer?.trim()) {
    throw new Error('WHY_VOLUNTEER_REQUIRED')
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Create a new volunteer signup
 */
export async function createVolunteer(
  input: CreateVolunteerInput
): Promise<{ id: string; email: string }> {
  validateVolunteerInput(input)

  // Rate limit check
  const rateLimitCheck = await checkVolunteerRateLimits(
    input.email,
    input.consentIpAddress
  )

  if (!rateLimitCheck.allowed) {
    throw new Error(rateLimitCheck.reason)
  }

  // Check for existing volunteer
  const existing = await prisma.volunteer.findUnique({
    where: { email: input.email.toLowerCase() },
  })

  if (existing) {
    throw new Error('VOLUNTEER_ALREADY_EXISTS')
  }

  // Create volunteer
  const volunteer = await prisma.volunteer.create({
    data: {
      email: input.email.toLowerCase(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      country: input.country,
      communeOfOrigin: input.communeOfOrigin,
      skills: input.skills,
      otherSkill: input.otherSkill?.trim(),
      hoursPerWeek: input.hoursPerWeek,
      availability: input.availability.trim(),
      preferredLocale: input.preferredLocale,
      whyVolunteer: input.whyVolunteer.trim(),
      status: 'PENDING',
      consentIpAddress: input.consentIpAddress,
      consentUserAgent: input.consentUserAgent,
      consentTimestamp: new Date(),
    },
  })

  return {
    id: volunteer.id,
    email: volunteer.email,
  }
}

/**
 * Update volunteer status (PENDING -> ACTIVE, ACTIVE -> INACTIVE, etc.)
 */
export async function updateVolunteerStatus(
  volunteerId: string,
  status: VolunteerStatus,
  updatedBy: string
): Promise<void> {
  await prisma.volunteer.update({
    where: { id: volunteerId },
    data: { 
      status,
      updatedAt: new Date(),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'VOLUNTEER_STATUS_UPDATED',
      entityType: 'Volunteer',
      entityId: volunteerId,
      changes: { status },
      userId: updatedBy,
    },
  })
}

/**
 * Create a volunteer assignment
 */
export async function createAssignment(
  input: CreateAssignmentInput,
  createdBy: string
): Promise<{ id: string }> {
  // Verify volunteer exists and is active
  const volunteer = await prisma.volunteer.findUnique({
    where: { id: input.volunteerId },
  })

  if (!volunteer) {
    throw new Error('VOLUNTEER_NOT_FOUND')
  }

  if (volunteer.status !== 'ACTIVE') {
    throw new Error('VOLUNTEER_NOT_ACTIVE')
  }

  // Verify volunteer has the required skill
  if (!volunteer.skills.includes(input.skill)) {
    throw new Error('VOLUNTEER_LACKS_REQUIRED_SKILL')
  }

  const assignment = await prisma.volunteerAssignment.create({
    data: {
      volunteerId: input.volunteerId,
      title: input.title.trim(),
      description: input.description.trim(),
      skill: input.skill,
      estimatedHours: input.estimatedHours,
      dueDate: input.dueDate,
      priority: input.priority,
      status: 'PENDING',
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'VOLUNTEER_ASSIGNMENT_CREATED',
      entityType: 'VolunteerAssignment',
      entityId: assignment.id,
      userId: createdBy,
      changes: {
        volunteerId: input.volunteerId,
        title: input.title,
        skill: input.skill,
      },
    },
  })

  return { id: assignment.id }
}

/**
 * Update assignment status
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
  updatedBy: string,
  notes?: string
): Promise<void> {
  const assignment = await prisma.volunteerAssignment.findUnique({
    where: { id: assignmentId },
  })

  if (!assignment) {
    throw new Error('ASSIGNMENT_NOT_FOUND')
  }

  await prisma.volunteerAssignment.update({
    where: { id: assignmentId },
    data: {
      status,
      ...(status === 'COMPLETED' && { completedAt: new Date() }),
      ...(status === 'ACCEPTED' && { acceptedAt: new Date() }),
      updatedAt: new Date(),
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'VOLUNTEER_ASSIGNMENT_STATUS_UPDATED',
      entityType: 'VolunteerAssignment',
      entityId: assignmentId,
      userId: updatedBy,
      changes: { status, notes },
    },
  })
}

/**
 * Find volunteers matching skill requirements
 */
export async function findVolunteersBySkill(
  query: SkillMatchQuery
): Promise<Array<{
  id: string
  email: string
  firstName: string
  lastName: string
  skills: VolunteerSkill[]
  hoursPerWeek: number
  availability: string
  assignmentCount: number
}>> {
  const volunteers = await prisma.volunteer.findMany({
    where: {
      skills: { has: query.skill },
      status: query.status ?? 'ACTIVE',
      ...(query.minHoursPerWeek && {
        hoursPerWeek: { gte: query.minHoursPerWeek },
      }),
      ...(query.country && { country: query.country }),
    },
    include: {
      _count: {
        select: {
          assignments: {
            where: {
              status: { in: ['PENDING', 'ACCEPTED'] },
            },
          },
        },
      },
    },
    orderBy: [
      { hoursPerWeek: 'desc' },
      { createdAt: 'asc' },
    ],
  })

  return volunteers.map((v) => ({
    id: v.id,
    email: v.email,
    firstName: v.firstName,
    lastName: v.lastName,
    skills: v.skills as VolunteerSkill[],
    hoursPerWeek: v.hoursPerWeek,
    availability: v.availability,
    assignmentCount: v._count.assignments,
  }))
}

/**
 * Get volunteer statistics
 */
export async function getVolunteerStats(): Promise<VolunteerStats> {
  const [
    volunteers,
    assignments,
    completedAssignments,
  ] = await Promise.all([
    prisma.volunteer.findMany({
      select: {
        status: true,
        skills: true,
        country: true,
        hoursPerWeek: true,
      },
    }),
    prisma.volunteerAssignment.count({
      where: { status: { in: ['PENDING', 'ACCEPTED'] } },
    }),
    prisma.volunteerAssignment.count({
      where: { status: 'COMPLETED' },
    }),
  ])

  const bySkill: Record<string, number> = {}
  const byCountry: Record<string, number> = {}
  let totalHours = 0

  let active = 0
  let pending = 0
  let inactive = 0

  for (const v of volunteers) {
    // Status counts
    if (v.status === 'ACTIVE') active++
    else if (v.status === 'PENDING') pending++
    else if (v.status === 'INACTIVE') inactive++

    // Skills counts
    for (const skill of v.skills as VolunteerSkill[]) {
      bySkill[skill] = (bySkill[skill] || 0) + 1
    }

    // Country counts
    byCountry[v.country] = (byCountry[v.country] || 0) + 1

    // Total hours
    totalHours += v.hoursPerWeek
  }

  return {
    total: volunteers.length,
    active,
    pending,
    inactive,
    bySkill,
    byCountry,
    totalHoursOffered: totalHours,
    assignmentsActive: assignments,
    assignmentsCompleted: completedAssignments,
  }
}

/**
 * Export volunteers (audit-logged)
 */
export async function exportVolunteers(
  filters: {
    status?: VolunteerStatus
    skill?: VolunteerSkill
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
  firstName: string
  lastName: string
  country: string
  skills: string[]
  hoursPerWeek: number
  status: string
  createdAt: Date
}>> {
  if (!reason.trim()) {
    throw new Error('EXPORT_REASON_REQUIRED')
  }

  const volunteers = await prisma.volunteer.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.skill && { skills: { has: filters.skill } }),
      ...(filters.country && { country: filters.country }),
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      country: true,
      skills: true,
      hoursPerWeek: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Audit log the export
  await prisma.subscriberExport.create({
    data: {
      exportType: 'VOLUNTEERS',
      format: 'JSON',
      filters: filters as any,
      recordCount: volunteers.length,
      exportedBy: exportedBy.userId,
      exportedByEmail: exportedBy.userEmail,
      exportedByRole: exportedBy.userRole,
      reason: reason.trim(),
    },
  })

  return volunteers.map((v) => ({
    email: v.email,
    firstName: v.firstName,
    lastName: v.lastName,
    country: v.country,
    skills: v.skills as string[],
    hoursPerWeek: v.hoursPerWeek,
    status: v.status,
    createdAt: v.createdAt,
  }))
}
