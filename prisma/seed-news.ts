/**
 * News System Seed Data
 *
 * TEMPORARILY DISABLED: NewsArticle, NewsSource, NewsQuery models not yet in schema
 * TODO: Add models from .kiro/steering/news-section.md data model section
 *
 * Usage: npm run db:seed:news
 */

import { prisma } from '../src/lib/db/prisma'

async function main() {
  console.log('📰 News system seed DISABLED (models not in schema yet)\n')
  console.log('TODO: Add NewsArticle, NewsSource, NewsQuery models to prisma/schema.prisma\n')
  console.log('See .kiro/steering/news-section.md for model specifications\n')
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
