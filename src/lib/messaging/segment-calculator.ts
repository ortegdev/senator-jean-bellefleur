/**
 * SMS Segment Calculator
 * 
 * Calculates message segments for GSM-7 (160 chars) vs Unicode (70 chars)
 * French and Creole accents (è, ò, à, etc.) trigger Unicode mode
 * 
 * GSM-7: 160 chars single, 153 chars per segment (multi-part)
 * Unicode: 70 chars single, 67 chars per segment (multi-part)
 */

// GSM-7 character set (basic, no extended)
const GSM7_BASIC = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'

// GSM-7 extended characters (count as 2 characters)
const GSM7_EXTENDED = '^{}\\[~]|€'

// French/Creole accents that trigger Unicode
const UNICODE_TRIGGERS = /[àâêîôûëïöüÿçœÀÂÊÎÔÛËÏÖÜŸÇŒ]/

export interface SegmentInfo {
  segmentCount: number
  isUnicode: boolean
  characterCount: number
  charactersPerSegment: number
  remainingInSegment: number
  estimatedCostCents: number // At $0.0075 per segment
}

/**
 * Calculate SMS segments for a message
 * 
 * @param text - Message body
 * @param costPerSegmentCents - Cost per segment in cents (default: 0.75 cents)
 * @returns Segment information
 */
export function calculateSmsSegments(
  text: string,
  costPerSegmentCents: number = 0.75
): SegmentInfo {
  if (!text || text.length === 0) {
    return {
      segmentCount: 0,
      isUnicode: false,
      characterCount: 0,
      charactersPerSegment: 160,
      remainingInSegment: 160,
      estimatedCostCents: 0,
    }
  }
  
  // Check if Unicode is required
  const isUnicode = requiresUnicode(text)
  
  // Count characters
  const characterCount = isUnicode
    ? text.length
    : countGsm7Characters(text)
  
  // Segment sizes
  const singleSegmentLimit = isUnicode ? 70 : 160
  const multiSegmentLimit = isUnicode ? 67 : 153
  
  // Calculate segments
  let segmentCount: number
  let charactersPerSegment: number
  
  if (characterCount <= singleSegmentLimit) {
    segmentCount = 1
    charactersPerSegment = singleSegmentLimit
  } else {
    segmentCount = Math.ceil(characterCount / multiSegmentLimit)
    charactersPerSegment = multiSegmentLimit
  }
  
  // Remaining characters in current segment
  const remainingInSegment = segmentCount === 1
    ? singleSegmentLimit - characterCount
    : (segmentCount * multiSegmentLimit) - characterCount
  
  // Estimated cost
  const estimatedCostCents = Math.round(segmentCount * costPerSegmentCents)
  
  return {
    segmentCount,
    isUnicode,
    characterCount,
    charactersPerSegment,
    remainingInSegment,
    estimatedCostCents,
  }
}

/**
 * Check if text requires Unicode encoding
 * 
 * Returns true if:
 * - Contains French/Creole accents (è, ò, à, etc.)
 * - Contains characters outside GSM-7 set
 */
function requiresUnicode(text: string): boolean {
  // Check for French/Creole accents
  if (UNICODE_TRIGGERS.test(text)) {
    return true
  }
  
  // Check each character
  for (const char of text) {
    if (!GSM7_BASIC.includes(char) && !GSM7_EXTENDED.includes(char)) {
      return true
    }
  }
  
  return false
}

/**
 * Count GSM-7 characters (extended chars count as 2)
 */
function countGsm7Characters(text: string): number {
  let count = 0
  
  for (const char of text) {
    if (GSM7_EXTENDED.includes(char)) {
      count += 2 // Extended characters count as 2
    } else {
      count += 1
    }
  }
  
  return count
}

/**
 * Format segment info for display
 */
export function formatSegmentInfo(info: SegmentInfo): string {
  const encoding = info.isUnicode ? 'Unicode' : 'GSM-7'
  const cost = (info.estimatedCostCents / 100).toFixed(2)
  
  return `${info.characterCount} chars, ${info.segmentCount} segment(s) (${encoding}), ~$${cost}`
}

/**
 * Get segment warning if close to limit
 */
export function getSegmentWarning(info: SegmentInfo): string | null {
  if (info.remainingInSegment <= 10 && info.remainingInSegment > 0) {
    return `Only ${info.remainingInSegment} characters remaining in this segment`
  }
  
  if (info.segmentCount > 3) {
    return `This message will cost ${info.segmentCount} SMS segments (~$${(info.estimatedCostCents / 100).toFixed(2)})`
  }
  
  return null
}

/**
 * Test strings for segment calculation
 */
export const TEST_STRINGS = {
  gsm7Short: 'Hello! Reply STOP to unsubscribe.',
  gsm7Long: 'This is a longer message that will definitely exceed the 160 character limit for a single SMS segment and will therefore be split into multiple parts with 153 characters each.',
  unicodeShort: 'Bonjou! Règleman pou kanpay la.',
  unicodeLong: 'Mesaj sa a gen aksantye franse ak kreyòl ki fè li itilize Unicode. Li pi kout pase GSM-7, men li toujou ka fè plizyè segman si li twò long.',
  french: 'Événement à Port-de-Paix demain. Détails: https://example.com/événement',
  creole: 'Reyinyon nan Pòdepè demen. Èske w ap vini?',
}
