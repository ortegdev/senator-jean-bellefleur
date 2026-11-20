#!/usr/bin/env tsx
/**
 * CI Check: Fail build if forbidden WhatsApp technologies detected
 * 
 * Enforces .kiro/steering/messaging.md Rule 1:
 * - No WhatsApp Business API or Cloud API
 * - No unofficial WhatsApp libraries
 * - No automation solutions
 * 
 * Exit 1 (fail build) if violations found
 * Exit 0 (pass) if clean
 */

import { readFileSync, existsSync } from 'fs'
import { glob } from 'glob'

interface Violation {
  type: 'package' | 'code' | 'endpoint'
  file: string
  line?: number
  detail: string
  severity: 'CRITICAL' | 'HIGH'
}

const violations: Violation[] = []

// Forbidden package names
const FORBIDDEN_PACKAGES = [
  '@whiskeysockets/baileys',
  'whatsapp-web.js',
  '@waha/waha',
  'waha',
  'whapi',
  'wa-automate',
  'wa-automate-nodejs',
  'venom-bot',
  'baileys',
  '@adiwajshing/baileys',
]

// Forbidden code patterns (WhatsApp Graph API)
const FORBIDDEN_CODE_PATTERNS = [
  // WhatsApp Business API message endpoints
  {
    pattern: /graph\.facebook\.com\/v\d+\/.*\/messages/gi,
    reason: 'WhatsApp Business API message endpoint (prohibited for political actors)',
  },
  {
    pattern: /\/v\d+\/\d+\/messages/gi,
    reason: 'WhatsApp Graph API message endpoint',
  },
  {
    pattern: /whatsapp\.cloud\.api/gi,
    reason: 'WhatsApp Cloud API reference',
  },
  
  // Solution provider WhatsApp methods
  {
    pattern: /twilio\.messages\.create\s*\([\s\S]*?['"]whatsapp:/gi,
    reason: 'Twilio WhatsApp message sending (prohibited)',
  },
  {
    pattern: /messagebird.*whatsapp/gi,
    reason: 'MessageBird WhatsApp integration',
  },
  {
    pattern: /vonage.*whatsapp/gi,
    reason: 'Vonage WhatsApp integration',
  },
  
  // QR code automation (when combined with WhatsApp)
  {
    pattern: /puppeteer.*whatsapp/gi,
    reason: 'Puppeteer + WhatsApp automation (prohibited)',
  },
  {
    pattern: /playwright.*whatsapp/gi,
    reason: 'Playwright + WhatsApp automation (prohibited)',
  },
  
  // Unofficial library methods
  {
    pattern: /baileys\.makeWASocket/gi,
    reason: 'Baileys WhatsApp automation',
  },
  {
    pattern: /create\(['"]whatsapp-web\.js['"]\)/gi,
    reason: 'whatsapp-web.js client creation',
  },
  {
    pattern: /waha\.sendMessage/gi,
    reason: 'WAHA WhatsApp HTTP API',
  },
]

/**
 * Check package.json for forbidden dependencies
 */
function checkPackageJson(): void {
  const packageJsonPath = './package.json'
  
  if (!existsSync(packageJsonPath)) {
    console.warn('⚠️  package.json not found, skipping package check')
    return
  }
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.optionalDependencies,
  }
  
  for (const forbiddenPkg of FORBIDDEN_PACKAGES) {
    if (forbiddenPkg in allDeps) {
      violations.push({
        type: 'package',
        file: packageJsonPath,
        detail: `Forbidden package "${forbiddenPkg}" found in dependencies. WhatsApp Business API and automation libraries are prohibited for political actors per Meta's policy.`,
        severity: 'CRITICAL',
      })
    }
  }
}

/**
 * Check source code for forbidden patterns
 */
async function checkSourceCode(): Promise<void> {
  const files = await glob('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  })
  
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      
      for (const { pattern, reason } of FORBIDDEN_CODE_PATTERNS) {
        const matches = content.matchAll(pattern)
        
        for (const match of matches) {
          // Find line number
          const index = match.index || 0
          const lineNumber = content.substring(0, index).split('\n').length
          
          violations.push({
            type: 'code',
            file,
            line: lineNumber,
            detail: `${reason}: ${match[0].slice(0, 80)}`,
            severity: 'CRITICAL',
          })
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read ${file}:`, error)
    }
  }
}

/**
 * Check for package-lock.json entries (catches transitive deps)
 */
function checkPackageLock(): void {
  const packageLockPath = './package-lock.json'
  
  if (!existsSync(packageLockPath)) {
    return // npm install hasn't been run yet, skip
  }
  
  try {
    const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf-8'))
    const packages = packageLock.packages || {}
    
    for (const [pkgPath, pkgInfo] of Object.entries(packages)) {
      const pkgName = pkgPath.replace(/^node_modules\//, '')
      
      if (FORBIDDEN_PACKAGES.some(forbidden => pkgName.startsWith(forbidden))) {
        violations.push({
          type: 'package',
          file: packageLockPath,
          detail: `Forbidden package "${pkgName}" found in package-lock.json (may be transitive dependency). Remove immediately.`,
          severity: 'CRITICAL',
        })
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not parse package-lock.json:', error)
  }
}

/**
 * Print violations and exit
 */
function reportViolations(): void {
  if (violations.length === 0) {
    console.log('✅ No WhatsApp policy violations detected')
    console.log('')
    console.log('Checked:')
    console.log('  - package.json dependencies')
    console.log('  - package-lock.json (transitive deps)')
    console.log('  - Source code patterns')
    console.log('')
    console.log('All messaging implementations must follow .kiro/steering/messaging.md')
    process.exit(0)
  }
  
  console.error('')
  console.error('❌ WHATSAPP POLICY VIOLATIONS DETECTED')
  console.error('=' .repeat(70))
  console.error('')
  console.error(`Found ${violations.length} violation(s) of .kiro/steering/messaging.md Rule 1`)
  console.error('')
  console.error('WhatsApp Business Platform and automation are PROHIBITED for political')
  console.error('actors per Meta\'s WhatsApp Business Messaging Policy (Sept 23, 2026).')
  console.error('')
  console.error('Violations:')
  console.error('')
  
  violations.forEach((v, index) => {
    console.error(`${index + 1}. [${v.severity}] ${v.type.toUpperCase()}`)
    console.error(`   File: ${v.file}${v.line ? `:${v.line}` : ''}`)
    console.error(`   ${v.detail}`)
    console.error('')
  })
  
  console.error('=' .repeat(70))
  console.error('')
  console.error('BUILD FAILED: Remove forbidden WhatsApp technologies before proceeding')
  console.error('')
  console.error('Allowed WhatsApp usage:')
  console.error('  ✅ Manual Channel posts by team members')
  console.error('  ✅ "Follow on WhatsApp" links to Channel')
  console.error('  ✅ "Share on WhatsApp" buttons (wa.me prefilled)')
  console.error('  ✅ QR codes linking to Channel')
  console.error('')
  console.error('NOT allowed:')
  console.error('  ❌ WhatsApp Business API or Cloud API')
  console.error('  ❌ Solution providers (Twilio, MessageBird, etc.)')
  console.error('  ❌ Unofficial libraries (Baileys, whatsapp-web.js, WAHA, etc.)')
  console.error('  ❌ Any automation of WhatsApp accounts')
  console.error('')
  
  process.exit(1)
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('🔍 Checking for WhatsApp policy violations...')
  console.log('')
  
  checkPackageJson()
  checkPackageLock()
  await checkSourceCode()
  
  reportViolations()
}

main()
