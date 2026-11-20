#!/usr/bin/env tsx

/**
 * Translation Key Validation Script
 * 
 * Ensures all locale files (ht, fr, en) have the same keys.
 * Fails CI if keys diverge.
 */

import * as fs from 'fs'
import * as path from 'path'

const REQUIRED_LOCALES = ['ht', 'fr', 'en']
const MESSAGES_DIR = path.join(process.cwd(), 'src/i18n/messages')

interface TranslationKeys {
  [key: string]: string | TranslationKeys
}

/**
 * Flatten nested keys into dot-notation paths
 * Example: { common: { appName: "..." } } → ["common.appName"]
 */
function flattenKeys(obj: TranslationKeys, prefix = ''): string[] {
  const keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null) {
      keys.push(...flattenKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys
}

/**
 * Load and parse a locale JSON file
 */
function loadLocaleFile(locale: string): { keys: string[]; raw: TranslationKeys } {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Locale file not found: ${filePath}`)
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(content) as TranslationKeys
  const keys = flattenKeys(parsed).sort()

  return { keys, raw: parsed }
}

/**
 * Find differences between two key sets
 */
function findDifferences(
  keysA: string[],
  keysB: string[],
  labelA: string,
  labelB: string
): { missing: string[]; extra: string[] } {
  const setA = new Set(keysA)
  const setB = new Set(keysB)

  const missing = keysB.filter((key) => !setA.has(key))
  const extra = keysA.filter((key) => !setB.has(key))

  return { missing, extra }
}

/**
 * Main validation
 */
async function main() {
  console.log('🔍 Checking translation keys...\n')

  try {
    // Load all locale files
    const locales = REQUIRED_LOCALES.map((locale) => ({
      locale,
      ...loadLocaleFile(locale),
    }))

    console.log(`✓ Loaded ${locales.length} locale files\n`)

    // Use 'en' as the reference
    const reference = locales.find((l) => l.locale === 'en')!
    const referenceKeys = reference.keys

    console.log(`📋 Reference locale: en (${referenceKeys.length} keys)\n`)

    // Compare each locale to the reference
    let hasErrors = false

    for (const { locale, keys } of locales) {
      if (locale === 'en') continue

      const { missing, extra } = findDifferences(keys, referenceKeys, locale, 'en')

      if (missing.length === 0 && extra.length === 0) {
        console.log(`✓ ${locale}: All keys match (${keys.length} keys)`)
      } else {
        hasErrors = true
        console.log(`✗ ${locale}: Keys diverge!`)

        if (missing.length > 0) {
          console.log(`  Missing keys (in en but not in ${locale}):`)
          missing.forEach((key) => console.log(`    - ${key}`))
        }

        if (extra.length > 0) {
          console.log(`  Extra keys (in ${locale} but not in en):`)
          extra.forEach((key) => console.log(`    - ${key}`))
        }

        console.log()
      }
    }

    if (hasErrors) {
      console.error('\n❌ Translation keys are out of sync!')
      console.error('Fix the diverging keys before committing.\n')
      process.exit(1)
    } else {
      console.log('\n✅ All translation keys are in sync!')
      console.log(`Total keys per locale: ${referenceKeys.length}\n`)
    }
  } catch (error) {
    console.error('\n❌ Error checking translations:')
    console.error(error)
    process.exit(1)
  }
}

main()
