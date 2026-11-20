import { prisma } from '@/lib/db/prisma'
import type { ChecklistCategory } from '@prisma/client'

/**
 * Launch Readiness Checklist Management
 * 
 * Each item has:
 * - Owner
 * - Document reference
 * - Checked-by and timestamp
 */

export interface ChecklistItemUpdate {
  checked: boolean
  checkedBy: string
  documentRef?: string
  documentUrl?: string
  notes?: string
}

/**
 * Get all checklist items
 */
export async function getChecklistItems() {
  return prisma.launchChecklistItem.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })
}

/**
 * Get checklist completion status
 */
export async function getChecklistStatus() {
  const items = await prisma.launchChecklistItem.findMany()

  const total = items.length
  const required = items.filter((i) => i.required).length
  const completed = items.filter((i) => i.checked).length
  const requiredCompleted = items.filter((i) => i.required && i.checked).length

  return {
    total,
    required,
    completed,
    requiredCompleted,
    allRequiredComplete: requiredCompleted === required,
    percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * Update checklist item (OWNER only)
 */
export async function updateChecklistItem(
  itemKey: string,
  update: ChecklistItemUpdate,
  userId: string,
  userEmail: string,
  ipAddress?: string
): Promise<{ success: boolean; error?: string }> {
  // Validate user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user || user.role !== 'OWNER') {
    return { success: false, error: 'Only OWNER role can update checklist' }
  }

  const item = await prisma.launchChecklistItem.findUnique({
    where: { itemKey },
  })

  if (!item) {
    return { success: false, error: 'Checklist item not found' }
  }

  const oldData = { ...item }

  // Update item
  await prisma.launchChecklistItem.update({
    where: { itemKey },
    data: {
      checked: update.checked,
      checkedBy: update.checkedBy,
      checkedAt: update.checked ? new Date() : null,
      documentRef: update.documentRef,
      documentUrl: update.documentUrl,
      notes: update.notes,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'CHECKLIST_ITEM_UPDATED',
      entityType: 'LaunchChecklistItem',
      entityId: item.id,
      changes: {
        old: oldData,
        new: update,
      },
      userId,
      userEmail,
      ipAddress,
    },
  })

  return { success: true }
}

/**
 * Get incomplete required items
 */
export async function getIncompleteRequiredItems() {
  return prisma.launchChecklistItem.findMany({
    where: {
      required: true,
      checked: false,
    },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * Get items by category
 */
export async function getItemsByCategory(category: ChecklistCategory) {
  return prisma.launchChecklistItem.findMany({
    where: { category },
    orderBy: { sortOrder: 'asc' },
  })
}
