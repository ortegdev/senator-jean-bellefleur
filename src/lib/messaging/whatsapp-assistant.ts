/**
 * WhatsApp Channel Publish Assistant (Manual, No Automation)
 * 
 * Creates tasks for team members to manually post to WhatsApp Channel
 * Provides ready-to-paste text and downloadable media
 * Sends reminders at scheduled time
 * Records completion for audit trail
 * 
 * NEVER automates, NEVER connects to WhatsApp account, NEVER uses WhatsApp API
 */

import { prisma } from '@/lib/db/prisma'
import type { WhatsAppTaskStatus } from '@prisma/client'

export interface WhatsAppPublishTask {
  id: string
  messageId: string
  locale: string
  assignedTo: string
  assignedToEmail: string
  textToPaste: string
  mediaDownloadUrls: string[]
  status: WhatsAppTaskStatus
  scheduledFor?: Date
}

/**
 * Create WhatsApp Channel publish task
 * 
 * Called when message is approved with WhatsApp Channel variant
 */
export async function createWhatsAppPublishTask(
  messageId: string,
  locale: string,
  assignedTo: string,
  assignedToEmail: string
): Promise<WhatsAppPublishTask> {
  // Get message variant
  const variant = await prisma.messageVariant.findFirst({
    where: {
      messageId,
      channel: 'WEB_PUSH', // WhatsApp content stored in variants but not sent via adapter
      locale,
    },
  })
  
  if (!variant || !variant.whatsappChannelText) {
    throw new Error(`No WhatsApp Channel variant found for message ${messageId}, locale ${locale}`)
  }
  
  // Get message details
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  })
  
  if (!message) {
    throw new Error(`Message ${messageId} not found`)
  }
  
  // Prepare text to paste (with disclosures already appended)
  const textToPaste = variant.whatsappChannelText
  
  // Prepare media URLs (already sized for WhatsApp by admin)
  const mediaDownloadUrls = variant.whatsappChannelMediaUrls || []
  
  // Create task
  const task = await prisma.whatsAppChannelTask.create({
    data: {
      messageId,
      locale,
      assignedTo,
      assignedToEmail,
      textToPaste,
      mediaDownloadUrls,
      status: 'PENDING',
    },
  })
  
  return {
    id: task.id,
    messageId: task.messageId,
    locale: task.locale,
    assignedTo: task.assignedTo,
    assignedToEmail: task.assignedToEmail,
    textToPaste: task.textToPaste,
    mediaDownloadUrls: task.mediaDownloadUrls,
    status: task.status,
    scheduledFor: message.scheduledFor || undefined,
  }
}

/**
 * Send reminder to assigned team member
 * 
 * Called at scheduled time (or manually by admin)
 * Sends email or web push notification (NOT via WhatsApp)
 */
export async function sendPublishReminder(taskId: string): Promise<void> {
  const task = await prisma.whatsAppChannelTask.findUnique({
    where: { id: taskId },
    include: {
      message: true,
    },
  })
  
  if (!task) {
    throw new Error(`WhatsApp task ${taskId} not found`)
  }
  
  if (task.status !== 'PENDING') {
    return // Already posted or cancelled
  }
  
  // TODO: Send email reminder to assignedToEmail
  // Subject: "Reminder: Post to WhatsApp Channel - [Message Name]"
  // Body: Ready-to-paste text, links to download media
  
  console.log('[WhatsAppAssistant] Sending reminder to:', task.assignedToEmail)
  console.log('[WhatsAppAssistant] Text to paste:', task.textToPaste)
  console.log('[WhatsAppAssistant] Media URLs:', task.mediaDownloadUrls)
  
  // Mark reminder sent
  await prisma.whatsAppChannelTask.update({
    where: { id: taskId },
    data: {
      status: 'REMINDED',
      reminderSentAt: new Date(),
    },
  })
}

/**
 * Mark task as posted (manual action by team member)
 * 
 * Records:
 * - Who marked it posted
 * - When it was marked
 * - Link to the WhatsApp Channel post
 * - Actual publish time
 */
export async function markAsPosted(
  taskId: string,
  markedBy: string,
  postLink: string,
  postPublishedAt: Date
): Promise<void> {
  await prisma.whatsAppChannelTask.update({
    where: { id: taskId },
    data: {
      status: 'POSTED',
      markedPostedAt: new Date(),
      markedPostedBy: markedBy,
      postLink,
      postPublishedAt,
    },
  })
  
  console.log('[WhatsAppAssistant] Task marked as posted:', taskId)
  console.log('[WhatsAppAssistant] Post link:', postLink)
}

/**
 * Cancel task (if message is cancelled before posting)
 */
export async function cancelWhatsAppTask(taskId: string): Promise<void> {
  await prisma.whatsAppChannelTask.update({
    where: { id: taskId },
    data: {
      status: 'CANCELLED',
    },
  })
}

/**
 * Get all pending tasks
 */
export async function getPendingWhatsAppTasks(): Promise<WhatsAppPublishTask[]> {
  const tasks = await prisma.whatsAppChannelTask.findMany({
    where: {
      status: { in: ['PENDING', 'REMINDED'] },
    },
    include: {
      message: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
  
  return tasks.map(task => ({
    id: task.id,
    messageId: task.messageId,
    locale: task.locale,
    assignedTo: task.assignedTo,
    assignedToEmail: task.assignedToEmail,
    textToPaste: task.textToPaste,
    mediaDownloadUrls: task.mediaDownloadUrls,
    status: task.status,
    scheduledFor: task.message.scheduledFor || undefined,
  }))
}

/**
 * Get task instructions for UI
 */
export function getPublishInstructions(locale: string): string {
  const instructions: Record<string, string> = {
    en: `
# How to Post to WhatsApp Channel

1. **Open WhatsApp** on your phone
2. **Navigate to your Channel** (swipe to Updates tab, tap your Channel)
3. **Tap the "+" button** to create a new post
4. **Copy the text below** and paste into the post
5. **Download and attach media** (if any)
6. **Review the post** - ensure text and images look correct
7. **Tap "Send"** to publish
8. **Copy the post link** (tap the post, tap share icon, copy link)
9. **Come back here** and paste the link to mark as posted

**Important:**
- Do NOT use any automation or unofficial tools
- Post manually from the official WhatsApp app only
- The text already includes all required disclosures
`,
    fr: `
# Comment publier sur le canal WhatsApp

1. **Ouvrez WhatsApp** sur votre téléphone
2. **Accédez à votre canal** (balayez vers Actualités, appuyez sur votre canal)
3. **Appuyez sur le bouton "+"** pour créer une nouvelle publication
4. **Copiez le texte ci-dessous** et collez-le dans la publication
5. **Téléchargez et joignez les médias** (le cas échéant)
6. **Vérifiez la publication** - assurez-vous que le texte et les images sont corrects
7. **Appuyez sur "Envoyer"** pour publier
8. **Copiez le lien de publication** (appuyez sur la publication, icône de partage, copier le lien)
9. **Revenez ici** et collez le lien pour marquer comme publié

**Important :**
- N'utilisez AUCUNE automatisation ni outil non officiel
- Publiez manuellement depuis l'application WhatsApp officielle uniquement
- Le texte inclut déjà toutes les mentions obligatoires
`,
    ht: `
# Kòman pou pibliye sou kanal WhatsApp la

1. **Ouvri WhatsApp** sou telefòn ou
2. **Navige nan kanal ou** (glise nan tab Mizajou, tape kanal ou)
3. **Tape bouton "+"** pou kreye yon nouvo pòs
4. **Kopye tèks ki anba a** epi kole l nan pòs la
5. **Telechaje ak tache medya yo** (si gen)
6. **Verifye pòs la** - asire w ke tèks ak imaj yo kòrèk
7. **Tape "Voye"** pou pibliye
8. **Kopye lyen pòs la** (tape pòs la, tape ikòn pataje, kopye lyen)
9. **Tounen isit la** epi kole lyen an pou make l kòm pibliye

**Enpòtan:**
- Pa itilize okenn otomatizasyon oswa zouti ki pa ofisyèl
- Pibliye manyèlman depi aplikasyon WhatsApp ofisyèl la sèlman
- Tèks la genyen deja tout deklarasyon obligatwa yo
`,
  }
  
  return instructions[locale] || instructions.en
}

/**
 * Prepare media for WhatsApp (resize if needed)
 * 
 * WhatsApp Channel limits:
 * - Images: Max 5MB, recommended 1080x1080 or 1920x1080
 * - Videos: Max 16MB, max 30 seconds
 * 
 * This function returns URLs to pre-sized media
 * (actual resizing happens in admin UI before creating task)
 */
export function getWhatsAppMediaRequirements(): {
  images: { maxSizeMB: number; recommendedDimensions: string[] }
  videos: { maxSizeMB: number; maxDurationSeconds: number }
} {
  return {
    images: {
      maxSizeMB: 5,
      recommendedDimensions: ['1080x1080 (square)', '1920x1080 (landscape)', '1080x1920 (portrait)'],
    },
    videos: {
      maxSizeMB: 16,
      maxDurationSeconds: 30,
    },
  }
}
