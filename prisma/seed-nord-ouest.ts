/**
 * Nord-Ouest Department Seed Data
 *
 * TEMPORARILY DISABLED: Commune, PressKit models not yet in schema
 * TODO: Design and add these models
 *
 * Usage: npm run db:seed:nord-ouest
 */

import { prisma } from '../src/lib/db/prisma'

async function main() {
  console.log('🗺️  Nord-Ouest seed DISABLED (models not in schema yet)\n')
  console.log('TODO: Add Commune and PressKit models to prisma/schema.prisma\n')
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
