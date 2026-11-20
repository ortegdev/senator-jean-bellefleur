/**
 * Journey Source Verification Script
 *
 * Fetches each source URL from published Content entries and logs results
 * to docs/JOURNEY_VERIFICATION.md for manual review.
 *
 * Usage: npm run verify:journey-sources
 */

import { prisma } from '../src/lib/db/prisma'
import * as fs from 'fs'
import * as path from 'path'

interface VerificationResult {
  contentId: string
  contentSlug: string
  sourceId: string
  sourceTitle: string
  sourceUrl: string
  status: 'VERIFIED' | 'NOT_FOUND' | 'UNABLE' | 'NO_URL'
  statusCode?: number
  error?: string
  verifiedAt: Date
}

async function verifyUrl(url: string): Promise<{
  status: 'VERIFIED' | 'NOT_FOUND' | 'UNABLE'
  statusCode?: number
  error?: string
}> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (response.ok) {
      return { status: 'VERIFIED', statusCode: response.status }
    } else if (response.status === 404) {
      return { status: 'NOT_FOUND', statusCode: 404 }
    } else {
      return {
        status: 'UNABLE',
        statusCode: response.status,
        error: `HTTP ${response.status}`,
      }
    }
  } catch (error) {
    return {
      status: 'UNABLE',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function main() {
  console.log('🔍 Starting journey source verification...\n')

  // Fetch all published content with sources
  const contentEntries = await prisma.content.findMany({
    where: {
      status: 'PUBLISHED',
      category: {
        in: [
          'EDUCATION',
          'PROFESSION',
          'PUBLIC_SERVICE',
          'PARTY_AFFILIATION',
          'CEP_REGISTRATION',
        ],
      },
    },
    include: {
      sources: true,
    },
    orderBy: {
      date: 'asc',
    },
  })

  const results: VerificationResult[] = []

  // Verify each source
  for (const content of contentEntries) {
    console.log(`\nChecking: ${content.slug}`)

    for (const source of content.sources) {
      console.log(`  ↳ ${source.title}`)

      if (!source.url) {
        console.log(`    ⚠️  No URL provided`)
        results.push({
          contentId: content.id,
          contentSlug: content.slug,
          sourceId: source.id,
          sourceTitle: source.title,
          sourceUrl: '',
          status: 'NO_URL',
          verifiedAt: new Date(),
        })
        continue
      }

      const verification = await verifyUrl(source.url)

      console.log(
        `    ${
          verification.status === 'VERIFIED'
            ? '✅'
            : verification.status === 'NOT_FOUND'
            ? '❌'
            : '⚠️'
        } ${verification.status}${
          verification.statusCode ? ` (${verification.statusCode})` : ''
        }`
      )

      results.push({
        contentId: content.id,
        contentSlug: content.slug,
        sourceId: source.id,
        sourceTitle: source.title,
        sourceUrl: source.url,
        status: verification.status,
        statusCode: verification.statusCode,
        error: verification.error,
        verifiedAt: new Date(),
      })

      // Rate limiting: wait 500ms between requests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // Generate markdown report
  const report = generateMarkdownReport(results)

  // Write to docs/JOURNEY_VERIFICATION.md
  const docsDir = path.join(process.cwd(), 'docs')
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

  const reportPath = path.join(docsDir, 'JOURNEY_VERIFICATION.md')
  fs.writeFileSync(reportPath, report, 'utf-8')

  console.log(`\n✅ Verification complete. Report written to: ${reportPath}`)

  // Summary
  const verified = results.filter((r) => r.status === 'VERIFIED').length
  const notFound = results.filter((r) => r.status === 'NOT_FOUND').length
  const unable = results.filter((r) => r.status === 'UNABLE').length
  const noUrl = results.filter((r) => r.status === 'NO_URL').length

  console.log('\n📊 Summary:')
  console.log(`  ✅ Verified: ${verified}`)
  console.log(`  ❌ Not Found: ${notFound}`)
  console.log(`  ⚠️  Unable to Verify: ${unable}`)
  console.log(`  ⚠️  No URL: ${noUrl}`)
  console.log(`  📝 Total Sources: ${results.length}`)
}

function generateMarkdownReport(results: VerificationResult[]): string {
  const timestamp = new Date().toISOString()

  let md = `# Journey Source Verification Report\n\n`
  md += `**Last Updated**: ${new Date().toLocaleString()}\n\n`
  md += `This report documents the verification status of all sources cited in "His Journey" timeline entries.\n\n`

  md += `## Summary\n\n`
  const verified = results.filter((r) => r.status === 'VERIFIED').length
  const notFound = results.filter((r) => r.status === 'NOT_FOUND').length
  const unable = results.filter((r) => r.status === 'UNABLE').length
  const noUrl = results.filter((r) => r.status === 'NO_URL').length

  md += `| Status | Count |\n`
  md += `|--------|-------|\n`
  md += `| ✅ Verified | ${verified} |\n`
  md += `| ❌ Not Found | ${notFound} |\n`
  md += `| ⚠️ Unable to Verify | ${unable} |\n`
  md += `| ⚠️ No URL | ${noUrl} |\n`
  md += `| **Total** | **${results.length}** |\n\n`

  md += `## Detailed Results\n\n`

  // Group by content entry
  const byContent = results.reduce((acc, result) => {
    if (!acc[result.contentSlug]) {
      acc[result.contentSlug] = []
    }
    acc[result.contentSlug].push(result)
    return {}
  }, {} as Record<string, VerificationResult[]>)

  for (const [slug, sources] of Object.entries(byContent)) {
    md += `### ${slug}\n\n`

    for (const source of sources) {
      const statusIcon =
        source.status === 'VERIFIED'
          ? '✅'
          : source.status === 'NOT_FOUND'
          ? '❌'
          : '⚠️'

      md += `${statusIcon} **${source.status}**\n`
      md += `- **Source**: ${source.sourceTitle}\n`
      if (source.sourceUrl) {
        md += `- **URL**: ${source.sourceUrl}\n`
      }
      if (source.statusCode) {
        md += `- **Status Code**: ${source.statusCode}\n`
      }
      if (source.error) {
        md += `- **Error**: ${source.error}\n`
      }
      md += `- **Verified At**: ${source.verifiedAt.toLocaleString()}\n\n`
    }
  }

  md += `---\n\n`
  md += `*This report is automatically generated by \`scripts/verify-journey-sources.ts\`. Run \`npm run verify:journey-sources\` to update.*\n`

  return md
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
