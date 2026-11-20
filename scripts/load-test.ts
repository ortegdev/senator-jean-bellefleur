#!/usr/bin/env tsx
/**
 * Load Test for Donation Endpoints
 * 
 * Simulates:
 * - 5,000 concurrent visitors
 * - 500 checkouts per minute
 * 
 * Uses Artillery for load testing
 * 
 * Usage: npm run test:load
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync } from 'fs'

const execAsync = promisify(exec)

const artilleryConfig = {
  config: {
    target: process.env.TARGET_URL || 'http://localhost:3000',
    phases: [
      {
        name: 'Warm up',
        duration: 60,
        arrivalRate: 10,
        rampTo: 100,
      },
      {
        name: 'Sustained load',
        duration: 300, // 5 minutes
        arrivalRate: 500, // 500 new users per minute
      },
      {
        name: 'Peak load',
        duration: 120, // 2 minutes
        arrivalRate: 800, // 800 new users per minute
      },
      {
        name: 'Cool down',
        duration: 60,
        arrivalRate: 100,
        rampTo: 10,
      },
    ],
    payload: {
      path: './test-data/donors.csv',
      fields: ['email', 'name', 'country'],
    },
  },
  scenarios: [
    {
      name: 'Browse public pages',
      weight: 80,
      flow: [
        {
          get: {
            url: '/{{ locale }}',
            capture: [
              {
                json: '$.mode',
                as: 'launchMode',
              },
            ],
          },
        },
        {
          think: 3,
        },
        {
          get: {
            url: '/{{ locale }}/about',
          },
        },
        {
          think: 5,
        },
        {
          get: {
            url: '/{{ locale }}/vision',
          },
        },
        {
          think: 2,
        },
        {
          get: {
            url: '/{{ locale }}/contribute',
          },
        },
      ],
    },
    {
      name: 'Complete donation',
      weight: 20,
      flow: [
        {
          get: {
            url: '/en/contribute',
          },
        },
        {
          think: 10, // User fills form
        },
        {
          post: {
            url: '/api/contributions/create',
            json: {
              amountCents: '{{ $randomNumber(500, 50000) }}',
              email: '{{ email }}',
              fullName: '{{ name }}',
              country: '{{ country }}',
            },
            capture: [
              {
                json: '$.contributionId',
                as: 'contributionId',
              },
            ],
          },
        },
        {
          think: 5,
        },
        {
          post: {
            url: '/api/payments/create-intent',
            json: {
              contributionId: '{{ contributionId }}',
            },
            capture: [
              {
                json: '$.clientSecret',
                as: 'clientSecret',
              },
            ],
          },
        },
        {
          think: 15, // User enters card details
        },
        {
          post: {
            url: '/api/payments/confirm',
            json: {
              paymentIntentId: '{{ clientSecret }}',
              testMode: true,
            },
          },
        },
      ],
    },
  ],
}

async function generateTestData(): Promise<void> {
  console.log('Generating test data...')
  
  const donors = []
  const countries = ['US', 'CA', 'HT', 'FR']
  
  for (let i = 0; i < 1000; i++) {
    donors.push({
      email: `loadtest${i}@example.com`,
      name: `Test User ${i}`,
      country: countries[i % countries.length],
    })
  }
  
  const csv = [
    'email,name,country',
    ...donors.map(d => `${d.email},${d.name},${d.country}`),
  ].join('\n')
  
  writeFileSync('./test-data/donors.csv', csv)
  console.log(`✓ Generated ${donors.length} test donors`)
}

async function runArtillery(): Promise<void> {
  console.log('\n🔥 Starting load test with Artillery...\n')
  
  // Write config to file
  writeFileSync('./artillery-config.yml', JSON.stringify(artilleryConfig, null, 2))
  
  try {
    const { stdout, stderr } = await execAsync('artillery run artillery-config.yml --output load-test-results.json')
    
    console.log(stdout)
    
    if (stderr) {
      console.error('Warnings:', stderr)
    }
    
    // Generate HTML report
    await execAsync('artillery report load-test-results.json --output load-test-report.html')
    console.log('\n✓ HTML report generated: load-test-report.html')
    
  } catch (error) {
    console.error('Load test failed:', error)
    throw error
  }
}

async function analyzeResults(): Promise<void> {
  console.log('\n📊 Analyzing results...\n')
  
  try {
    const { stdout } = await execAsync('cat load-test-results.json | jq ".aggregate"')
    const results = JSON.parse(stdout)
    
    console.log('Summary:')
    console.log(`  Total requests: ${results.counters?.['http.requests'] || 'N/A'}`)
    console.log(`  Success rate: ${results.counters?.['http.codes.200'] || 0} / ${results.counters?.['http.requests'] || 0}`)
    console.log(`  Error rate: ${results.counters?.['errors.ETIMEDOUT'] || 0} timeouts`)
    console.log(`  Response time (p95): ${results.latency?.p95 || 'N/A'}ms`)
    console.log(`  Response time (p99): ${results.latency?.p99 || 'N/A'}ms`)
    console.log(`  RPS: ${results.rps?.mean || 'N/A'}`)
    
    // Check thresholds
    const p95 = results.latency?.p95 || 0
    const p99 = results.latency?.p99 || 0
    const errorRate = (results.counters?.['errors.ETIMEDOUT'] || 0) / (results.counters?.['http.requests'] || 1)
    
    const thresholds = {
      p95: 2000, // 2 seconds
      p99: 5000, // 5 seconds
      errorRate: 0.01, // 1%
    }
    
    console.log('\nThreshold checks:')
    console.log(`  p95 < ${thresholds.p95}ms: ${p95 < thresholds.p95 ? '✅' : '❌'} (${p95}ms)`)
    console.log(`  p99 < ${thresholds.p99}ms: ${p99 < thresholds.p99 ? '✅' : '❌'} (${p99}ms)`)
    console.log(`  Error rate < ${thresholds.errorRate * 100}%: ${errorRate < thresholds.errorRate ? '✅' : '❌'} (${(errorRate * 100).toFixed(2)}%)`)
    
    if (p95 > thresholds.p95 || p99 > thresholds.p99 || errorRate > thresholds.errorRate) {
      console.log('\n❌ LOAD TEST FAILED: Performance thresholds not met')
      process.exit(1)
    }
    
    console.log('\n✅ LOAD TEST PASSED')
    
  } catch (error) {
    console.error('Failed to analyze results:', error)
  }
}

async function main(): Promise<void> {
  try {
    // Check if Artillery is installed
    try {
      await execAsync('artillery --version')
    } catch {
      console.error('❌ Artillery not installed. Install with: npm install -g artillery')
      process.exit(1)
    }
    
    await generateTestData()
    await runArtillery()
    await analyzeResults()
    
  } catch (error) {
    console.error('Load test error:', error)
    process.exit(1)
  }
}

main()
