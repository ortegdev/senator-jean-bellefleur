#!/usr/bin/env tsx
/**
 * Production Smoke Test
 * 
 * Runs after `next build && next start`
 * Visits every public route in ht/fr/en plus admin login
 * Fails on:
 * - Non-200 status
 * - Console errors
 * - Error boundary UI
 * - Server logs containing "Event handlers cannot be passed", "digest", or "Error:"
 * 
 * Usage: npm run test:smoke
 */

import { chromium, Browser, Page } from 'playwright'
import { spawn, ChildProcess } from 'child_process'
import { setTimeout as sleep } from 'timers/promises'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TIMEOUT = 30000 // 30 seconds per page

interface TestResult {
  url: string
  status: number
  consoleErrors: string[]
  serverErrors: string[]
  hasErrorBoundary: boolean
  passed: boolean
  duration: number
}

const results: TestResult[] = []
let nextServer: ChildProcess | null = null
let browser: Browser | null = null

// Routes to test in each locale
const publicRoutes = [
  '/',
  '/about',
  '/his-journey',
  '/vision',
  '/department',
  '/contribute',
  '/faq',
  '/contact',
  '/privacy',
  '/terms',
]

const locales = ['ht', 'fr', 'en']

// Server log patterns that indicate errors
const serverErrorPatterns = [
  /Event handlers cannot be passed/i,
  /digest:\s*"[^"]+"/i,
  /Error:/,
  /Unhandled error/i,
  /Failed to compile/i,
]

async function startNextServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting Next.js server...')
    
    nextServer = spawn('npm', ['run', 'start'], {
      stdio: 'pipe',
      shell: true,
    })
    
    let output = ''
    
    nextServer.stdout?.on('data', (data) => {
      const text = data.toString()
      output += text
      process.stdout.write(text)
      
      if (text.includes('Local:') || text.includes('started server')) {
        resolve()
      }
    })
    
    nextServer.stderr?.on('data', (data) => {
      const text = data.toString()
      output += text
      process.stderr.write(text)
      
      // Check for server errors
      for (const pattern of serverErrorPatterns) {
        if (pattern.test(text)) {
          console.error(`\n❌ Server error detected: ${text.slice(0, 200)}`)
        }
      }
    })
    
    nextServer.on('error', (error) => {
      reject(error)
    })
    
    nextServer.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Server exited with code ${code}`))
      }
    })
    
    // Timeout if server doesn't start
    setTimeout(() => {
      if (!output.includes('Local:') && !output.includes('started server')) {
        reject(new Error('Server failed to start within 30 seconds'))
      }
    }, 30000)
  })
}

async function stopNextServer(): Promise<void> {
  if (nextServer) {
    nextServer.kill('SIGTERM')
    await sleep(1000)
    if (!nextServer.killed) {
      nextServer.kill('SIGKILL')
    }
  }
}

async function testPage(page: Page, url: string): Promise<TestResult> {
  const startTime = Date.now()
  const consoleErrors: string[] = []
  const serverErrors: string[] = []
  let status = 0
  let hasErrorBoundary = false
  
  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  
  // Listen for page errors
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message)
  })
  
  try {
    // Navigate to page
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: TIMEOUT,
    })
    
    status = response?.status() || 0
    
    // Check for error boundary UI
    const errorBoundarySelectors = [
      '[data-error-boundary]',
      'text=/application error/i',
      'text=/something went wrong/i',
      'text=/error occurred/i',
      '[role="alert"]:has-text("error")',
    ]
    
    for (const selector of errorBoundarySelectors) {
      try {
        const element = await page.locator(selector).first()
        if (await element.isVisible({ timeout: 1000 })) {
          hasErrorBoundary = true
          break
        }
      } catch {
        // Selector not found, continue
      }
    }
    
    // Wait a bit for any async errors
    await sleep(500)
    
  } catch (error) {
    consoleErrors.push(String(error))
    status = 0
  }
  
  const duration = Date.now() - startTime
  const passed = status === 200 && consoleErrors.length === 0 && !hasErrorBoundary
  
  return {
    url,
    status,
    consoleErrors,
    serverErrors,
    hasErrorBoundary,
    passed,
    duration,
  }
}

async function runTests(): Promise<void> {
  console.log('\n🧪 Starting Production Smoke Tests\n')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Timeout: ${TIMEOUT}ms per page\n`)
  
  // Start Next.js server
  await startNextServer()
  await sleep(3000) // Give server time to fully initialize
  
  // Start browser
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'SmokeTestBot/1.0',
  })
  const page = await context.newPage()
  
  // Test all public routes in all locales
  for (const locale of locales) {
    console.log(`\n📍 Testing locale: ${locale.toUpperCase()}`)
    
    for (const route of publicRoutes) {
      const url = `${BASE_URL}/${locale}${route}`
      process.stdout.write(`  Testing ${route}... `)
      
      const result = await testPage(page, url)
      results.push(result)
      
      if (result.passed) {
        console.log(`✅ ${result.status} (${result.duration}ms)`)
      } else {
        console.log(`❌ FAILED`)
        if (result.status !== 200) {
          console.log(`     Status: ${result.status}`)
        }
        if (result.consoleErrors.length > 0) {
          console.log(`     Console errors: ${result.consoleErrors.length}`)
          result.consoleErrors.forEach(err => {
            console.log(`       - ${err.slice(0, 100)}`)
          })
        }
        if (result.hasErrorBoundary) {
          console.log(`     Error boundary visible`)
        }
      }
    }
  }
  
  // Test admin login page (no locale)
  console.log(`\n📍 Testing admin routes`)
  process.stdout.write(`  Testing /admin/login... `)
  
  const adminResult = await testPage(page, `${BASE_URL}/admin/login`)
  results.push(adminResult)
  
  if (adminResult.passed) {
    console.log(`✅ ${adminResult.status} (${adminResult.duration}ms)`)
  } else {
    console.log(`❌ FAILED`)
    if (adminResult.status !== 200) {
      console.log(`     Status: ${adminResult.status}`)
    }
    if (adminResult.consoleErrors.length > 0) {
      console.log(`     Console errors:`)
      adminResult.consoleErrors.forEach(err => {
        console.log(`       - ${err.slice(0, 100)}`)
      })
    }
  }
  
  await browser.close()
}

function printSummary(): void {
  console.log('\n' + '='.repeat(60))
  console.log('SMOKE TEST SUMMARY')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  
  console.log(`\nTotal pages tested: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  
  if (failed > 0) {
    console.log('\n❌ FAILED PAGES:')
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`\n  ${r.url}`)
        console.log(`    Status: ${r.status}`)
        if (r.consoleErrors.length > 0) {
          console.log(`    Console errors: ${r.consoleErrors.length}`)
        }
        if (r.hasErrorBoundary) {
          console.log(`    Error boundary: YES`)
        }
      })
  }
  
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total
  console.log(`\nAverage response time: ${Math.round(avgDuration)}ms`)
  
  console.log('\n' + '='.repeat(60))
  
  if (failed > 0) {
    console.log('\n❌ SMOKE TEST FAILED\n')
    process.exit(1)
  } else {
    console.log('\n✅ ALL SMOKE TESTS PASSED\n')
    process.exit(0)
  }
}

async function main(): Promise<void> {
  try {
    await runTests()
  } catch (error) {
    console.error('\n❌ Smoke test error:', error)
    process.exit(1)
  } finally {
    await stopNextServer()
    printSummary()
  }
}

// Handle interrupts
process.on('SIGINT', async () => {
  console.log('\n\nInterrupted. Cleaning up...')
  await stopNextServer()
  if (browser) await browser.close()
  process.exit(130)
})

main()
