#!/usr/bin/env tsx

/**
 * Server/Client Boundary Checker
 * 
 * Detects when function props are passed from Server Components to Client Components
 * This is a Next.js 13+ boundary rule violation
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

const SRC_DIR = path.join(process.cwd(), 'src')

/**
 * Check if a file is a Server Component
 * (doesn't have 'use client' directive)
 */
function isServerComponent(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8')
  return !content.includes("'use client'") && !content.includes('"use client"')
}

/**
 * Extract component imports from a file
 */
function extractImports(content: string): { name: string; path: string }[] {
  const imports: { name: string; path: string }[] = []
  
  // Match: import { ComponentName } from '@/...'
  const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g
  let match

  while ((match = namedImportRegex.exec(content)) !== null) {
    const names = match[1].split(',').map((n) => n.trim())
    const importPath = match[2]

    names.forEach((name) => {
      imports.push({ name, path: importPath })
    })
  }

  // Match: import ComponentName from '@/...'
  const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g

  while ((match = defaultImportRegex.exec(content)) !== null) {
    imports.push({ name: match[1], path: match[2] })
  }

  return imports
}

/**
 * Check for function props being passed to components
 */
function checkFunctionProps(content: string, imports: { name: string; path: string }[]): string[] {
  const violations: string[] = []

  // Simple heuristic: look for props that look like functions being passed
  // Pattern: <Component onSomething={...} onClick={...} onChange={...} />
  const functionPropPattern = /<(\w+)[^>]*\s+(on[A-Z]\w+|handle[A-Z]\w+)\s*=\s*\{[^}]+\}/g
  let match

  while ((match = functionPropPattern.exec(content)) !== null) {
    const componentName = match[1]
    const propName = match[2]

    // Check if this component is imported from a client component path
    const importInfo = imports.find((imp) => imp.name === componentName)
    
    if (importInfo && importInfo.path.includes('client')) {
      // This is likely a client component, which is OK
      continue
    }

    if (importInfo && !importInfo.path.includes('client')) {
      violations.push(
        `Possible function prop '${propName}' passed to '${componentName}' (from ${importInfo.path})`
      )
    }
  }

  return violations
}

/**
 * Main check
 */
async function main() {
  console.log('🔍 Checking Server/Client boundaries...\n')

  try {
    // Find all .tsx files in src/ except in node_modules
    const files = await glob('**/*.tsx', {
      cwd: SRC_DIR,
      ignore: ['**/node_modules/**'],
      absolute: true,
    })

    console.log(`📂 Found ${files.length} .tsx files\n`)

    let totalViolations = 0
    const violationsByFile: Record<string, string[]> = {}

    for (const file of files) {
      // Only check Server Components
      if (!isServerComponent(file)) {
        continue
      }

      const content = fs.readFileSync(file, 'utf-8')
      const imports = extractImports(content)
      const violations = checkFunctionProps(content, imports)

      if (violations.length > 0) {
        const relativePath = path.relative(process.cwd(), file)
        violationsByFile[relativePath] = violations
        totalViolations += violations.length
      }
    }

    if (totalViolations > 0) {
      console.log('⚠️  Potential boundary violations detected:\n')

      for (const [file, violations] of Object.entries(violationsByFile)) {
        console.log(`  ${file}:`)
        violations.forEach((v) => console.log(`    - ${v}`))
        console.log()
      }

      console.log('⚠️  Note: These are heuristic warnings. Review manually.')
      console.log('   Function props from Server → Client components will cause errors.')
      console.log('   Move event handlers inside "use client" components.\n')
      
      // Don't fail CI, just warn
      // Uncomment to fail: process.exit(1)
    } else {
      console.log('✅ No obvious boundary violations detected!\n')
    }
  } catch (error) {
    console.error('\n❌ Error checking boundaries:')
    console.error(error)
    process.exit(1)
  }
}

main()
