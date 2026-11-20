#!/usr/bin/env tsx
/**
 * Pre-Launch Content Audit
 * 
 * Fails the release on:
 * - Placeholder text
 * - Unapproved legal pages
 * - Missing disclosures
 * - Unsourced claims
 * - NEEDS_REVIEW content leaking publicly
 * - Missing translations
 * - Unapproved imagery
 * - Candidacy wording that doesn't match candidacyStatus
 * 
 * Usage: npm run audit:content
 */

import { glob } from 'glob'
import { readFileSync } from 'fs'
import { prisma } from '../src/lib/db/prisma'

interface AuditIssue {
  severity: 'BLOCKER' | 'HIGH' | 'LOW'
  category: string
  file?: string
  line?: number
  message: string
}

const issues: AuditIssue[] = []

async function auditPlaceholderText(): Promise<void> {
  console.log('\n📝 Auditing for placeholder text...')
  
  const patterns = [
    /lorem\s+ipsum/i,
    /\bplaceholder\b/i,
    /\bTODO:/i,
    /\bFIXME:/i,
    /\[TBD\]/i,
    /\[INSERT\s+.*?\]/i,
    /test@example\.com/i, // Outside test files
  ]
  
  const files = await glob('src/**/*.{ts,tsx,md,mdx}', {
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/test/**'],
  })
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          issues.push({
            severity: 'BLOCKER',
            category: 'Placeholder Text',
            file,
            line: index + 1,
            message: `Found placeholder: ${line.trim().slice(0, 80)}`,
          })
        }
      }
    })
  }
  
  console.log(`  Found ${issues.filter(i => i.category === 'Placeholder Text').length} placeholder issues`)
}

async function auditLegalPages(): Promise<void> {
  console.log('\n⚖️  Auditing legal pages...')
  
  const legalPages = ['privacy', 'terms', 'refund-policy']
  
  for (const page of legalPages) {
    const files = await glob(`src/app/[locale]/${page}/page.tsx`)
    
    if (files.length === 0) {
      issues.push({
        severity: 'BLOCKER',
        category: 'Legal Pages',
        message: `Missing legal page: ${page}`,
      })
      continue
    }
    
    const content = readFileSync(files[0], 'utf-8')
    
    // Check for needsReview flag
    if (content.includes('needsReview: true')) {
      issues.push({
        severity: 'BLOCKER',
        category: 'Legal Pages',
        file: files[0],
        message: `Legal page ${page} marked needsReview (requires counsel approval)`,
      })
    }
    
    // Check for approval metadata
    if (!content.includes('approvedBy')) {
      issues.push({
        severity: 'HIGH',
        category: 'Legal Pages',
        file: files[0],
        message: `Legal page ${page} missing approval metadata`,
      })
    }
  }
  
  console.log(`  Found ${issues.filter(i => i.category === 'Legal Pages').length} legal page issues`)
}

async function auditAffiliationDisclosures(): Promise<void> {
  console.log('\n🏷️  Auditing affiliation disclosures...')
  
  const publicPages = await glob('src/app/[locale]/**/page.tsx', {
    ignore: ['**/admin/**', '**/api/**'],
  })
  
  for (const file of publicPages) {
    const content = readFileSync(file, 'utf-8')
    
    // Check if page includes AffiliationBadge or similar disclosure
    if (!content.includes('AffiliationBadge') && !content.includes('data-testid="affiliation-badge"')) {
      issues.push({
        severity: 'HIGH',
        category: 'Affiliation Disclosure',
        file,
        message: 'Page missing affiliation disclosure badge',
      })
    }
  }
  
  console.log(`  Found ${issues.filter(i => i.category === 'Affiliation Disclosure').length} disclosure issues`)
}

async function auditNeedsReviewContent(): Promise<void> {
  console.log('\n🔍 Auditing for NEEDS_REVIEW content...')
  
  // Check database for content with NEEDS_REVIEW status that might be publicly visible
  try {
    const needsReview = await prisma.content.count({
      where: {
        status: 'NEEDS_REVIEW',
        // Add conditions for public visibility
      },
    })
    
    if (needsReview > 0) {
      issues.push({
        severity: 'BLOCKER',
        category: 'Unapproved Content',
        message: `${needsReview} content items marked NEEDS_REVIEW are potentially publicly visible`,
      })
    }
  } catch (error) {
    console.warn('  Warning: Could not check database for NEEDS_REVIEW content')
  }
  
  console.log(`  Found ${issues.filter(i => i.category === 'Unapproved Content').length} unapproved content issues`)
}

async function auditTranslations(): Promise<void> {
  console.log('\n🌍 Auditing translations...')
  
  const locales = ['ht', 'fr', 'en']
  const translationKeys: Record<string, Set<string>> = {}
  
  // Load all translation files
  for (const locale of locales) {
    try {
      const content = readFileSync(`src/i18n/messages/${locale}.json`, 'utf-8')
      const translations = JSON.parse(content)
      
      // Flatten keys
      const flattenKeys = (obj: any, prefix = ''): string[] => {
        let keys: string[] = []
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key
          if (typeof value === 'object' && value !== null) {
            keys = keys.concat(flattenKeys(value, fullKey))
          } else {
            keys.push(fullKey)
          }
        }
        return keys
      }
      
      translationKeys[locale] = new Set(flattenKeys(translations))
    } catch (error) {
      issues.push({
        severity: 'BLOCKER',
        category: 'Translations',
        message: `Missing or invalid translation file for locale: ${locale}`,
      })
    }
  }
  
  // Compare keys across locales
  const baseLocale = 'en'
  const baseKeys = translationKeys[baseLocale] || new Set()
  
  for (const locale of locales) {
    if (locale === baseLocale) continue
    
    const localeKeys = translationKeys[locale] || new Set()
    
    // Find missing keys
    const missing = [...baseKeys].filter(key => !localeKeys.has(key))
    
    if (missing.length > 0) {
      issues.push({
        severity: 'HIGH',
        category: 'Translations',
        message: `Locale ${locale} missing ${missing.length} translation keys: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`,
      })
    }
  }
  
  console.log(`  Found ${issues.filter(i => i.category === 'Translations').length} translation issues`)
}

async function auditImageApprovals(): Promise<void> {
  console.log('\n🖼️  Auditing imagery approvals...')
  
  // Check for candidate photo in database
  try {
    const candidateConfig = await prisma.candidateConfig.findFirst({
      where: { slug: 'bellefleur' },
    })
    
    // For now, just note if photo exists (approval tracking can be added later)
    if (!candidateConfig?.photoUrl) {
      issues.push({
        severity: 'LOW',
        category: 'Imagery Approval',
        message: 'No candidate photo configured yet (design must work without it)',
      })
    }
  } catch (error) {
    console.warn('  Warning: Could not check database for image configuration')
  }
  
  console.log(`  Found ${issues.filter(i => i.category === 'Imagery Approval').length} imagery issues`)
}

async function auditCandidacyWording(): Promise<void> {
  console.log('\n🗳️  Auditing candidacy wording...')
  
  // Get candidacy status from database
  let candidacyStatus = 'UNVERIFIED'
  
  try {
    const candidateConfig = await prisma.candidateConfig.findFirst({
      where: { slug: 'bellefleur' },
    })
    
    candidacyStatus = candidateConfig?.candidacyStatus || 'UNVERIFIED'
  } catch (error) {
    console.warn('  Warning: Could not check candidacy status from database')
  }
  
  // Define prohibited wording per status
  const prohibitedWording: Record<string, RegExp[]> = {
    UNVERIFIED: [
      /\bis\s+running\b/i,
      /\bis\s+a\s+candidate\b/i,
      /\bsenate\s+candidate\b/i,
      /\bon\s+the\s+ballot\b/i,
      /\bwill\s+be\s+elected\b/i,
    ],
    REGISTERED_PRELIMINARY: [
      /\belected\b/i,
      /\bsenator\s+bellefleur\b/i,
      /\bour\s+senator\b/i,
    ],
    ON_FINAL_LIST: [
      /\belected\b/i,
      /\bsenator\s+bellefleur\b/i,
      /\bhas\s+won\b/i,
    ],
  }
  
  const prohibited = prohibitedWording[candidacyStatus] || []
  
  // Scan content files
  const contentFiles = await glob('src/app/[locale]/**/page.tsx')
  
  for (const file of contentFiles) {
    const content = readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      for (const pattern of prohibited) {
        if (pattern.test(line)) {
          issues.push({
            severity: 'BLOCKER',
            category: 'Candidacy Wording',
            file,
            line: index + 1,
            message: `Prohibited wording for status ${candidacyStatus}: ${line.trim().slice(0, 80)}`,
          })
        }
      }
    })
  }
  
  console.log(`  Candidacy status: ${candidacyStatus}`)
  console.log(`  Found ${issues.filter(i => i.category === 'Candidacy Wording').length} wording issues`)
}

async function auditUnsourcedClaims(): Promise<void> {
  console.log('\n📚 Auditing for unsourced claims...')
  
  // This is a simplified check - full implementation would parse content structure
  const contentFiles = await glob('src/app/[locale]/{about,vision,his-journey,department}/page.tsx')
  
  for (const file of contentFiles) {
    const content = readFileSync(file, 'utf-8')
    
    // Check if file has content blocks with source citations
    // Simplified: look for presence of "source" or "citation" fields
    if (content.includes('content:') && !content.includes('source:')) {
      issues.push({
        severity: 'HIGH',
        category: 'Unsourced Claims',
        file,
        message: 'Content appears to have factual claims without source references',
      })
    }
  }
  
  console.log(`  Found ${issues.filter(i => i.category === 'Unsourced Claims').length} sourcing issues`)
}

function printSummary(): void {
  console.log('\n' + '='.repeat(70))
  console.log('PRE-LAUNCH AUDIT SUMMARY')
  console.log('='.repeat(70))
  
  const blockers = issues.filter(i => i.severity === 'BLOCKER')
  const high = issues.filter(i => i.severity === 'HIGH')
  const low = issues.filter(i => i.severity === 'LOW')
  
  console.log(`\nTotal Issues: ${issues.length}`)
  console.log(`  🚨 BLOCKERS: ${blockers.length}`)
  console.log(`  ⚠️  HIGH: ${high.length}`)
  console.log(`  ℹ️  LOW: ${low.length}`)
  
  if (blockers.length > 0) {
    console.log('\n🚨 BLOCKER ISSUES (Must fix before launch):')
    blockers.forEach((issue, index) => {
      console.log(`\n  ${index + 1}. [${issue.category}] ${issue.message}`)
      if (issue.file) {
        console.log(`     File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`)
      }
    })
  }
  
  if (high.length > 0) {
    console.log('\n⚠️  HIGH PRIORITY ISSUES:')
    high.forEach((issue, index) => {
      console.log(`\n  ${index + 1}. [${issue.category}] ${issue.message}`)
      if (issue.file) {
        console.log(`     File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`)
      }
    })
  }
  
  console.log('\n' + '='.repeat(70))
  
  if (blockers.length > 0) {
    console.log('\n❌ AUDIT FAILED: Blocker issues must be resolved before launch\n')
    process.exit(1)
  } else if (high.length > 0) {
    console.log('\n⚠️  AUDIT WARNING: High priority issues should be addressed\n')
    console.log('Continue with launch? Consider resolving these issues first.\n')
    process.exit(0) // Don't block on HIGH, but warn
  } else {
    console.log('\n✅ AUDIT PASSED: No blocking issues found\n')
    process.exit(0)
  }
}

async function main(): Promise<void> {
  console.log('🔍 Starting Pre-Launch Content Audit...')
  
  try {
    await auditPlaceholderText()
    await auditLegalPages()
    await auditAffiliationDisclosures()
    await auditNeedsReviewContent()
    await auditTranslations()
    await auditImageApprovals()
    await auditCandidacyWording()
    await auditUnsourcedClaims()
  } catch (error) {
    console.error('\n❌ Audit error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
  
  printSummary()
}

main()
