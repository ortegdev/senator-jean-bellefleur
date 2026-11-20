import { prisma } from '@/lib/db/prisma'
import { IntakeChecklist } from '@/components/admin/IntakeChecklist'
import { IntakeSubmissions } from '@/components/admin/IntakeSubmissions'

// Force dynamic rendering (don't generate at build time)
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Campaign Facts Intake | Admin',
  description: 'Review and process campaign fact submissions',
}

export default async function IntakePage() {
  // Fetch checklist items
  const checklistItems = await prisma.intakeChecklist.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  // Fetch pending submissions
  const submissions = await prisma.intakeSubmission.findMany({
    where: {
      status: {
        in: ['PENDING', 'IN_REVIEW', 'NEEDS_MORE'],
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  // Count by status
  const statusCounts = await prisma.intakeSubmission.groupBy({
    by: ['status'],
    _count: true,
  })

  return (
    <div className="min-h-screen bg-sandPaper-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-ink-900">
            Campaign Facts Intake
          </h1>
          <p className="mt-2 text-ink-600">
            Review submissions from the campaign or candidate. Only publish content after verifying
            evidence.
          </p>
        </div>

        {/* Status Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {statusCounts.map((count) => (
            <div
              key={count.status}
              className="rounded-lg border border-ink-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-medium text-ink-600">{count.status}</p>
              <p className="mt-1 text-2xl font-bold text-ink-900">{count._count}</p>
            </div>
          ))}
        </div>

        {/* Required Facts Checklist */}
        <section className="mb-12">
          <h2 className="mb-4 font-display text-2xl font-bold text-ink-900">
            Required Facts Checklist
          </h2>
          <p className="mb-6 text-sm text-ink-600">
            Track verification of essential candidate information. Items marked incomplete will
            prevent publishing related content.
          </p>
          <IntakeChecklist items={checklistItems} />
        </section>

        {/* Pending Submissions */}
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-ink-900">
            Pending Submissions
          </h2>
          <IntakeSubmissions submissions={submissions} />
        </section>

        {/* Instructions */}
        <div className="mt-12 rounded-xl border-2 border-dashed border-deepLagoon-300 bg-deepLagoon-50 p-6">
          <h3 className="font-semibold text-deepLagoon-900">⚠️ Important Rules</h3>
          <ul className="mt-3 space-y-2 text-sm text-deepLagoon-800">
            <li>• Editors can create content entries from verified submissions</li>
            <li>• Only OWNER role can publish content (makes it visible on site)</li>
            <li>• All published content MUST have at least one source</li>
            <li>• Quotes require exact source citation and date</li>
            <li>• Do NOT publish unverified claims</li>
            <li>• Mark submissions as REJECTED if evidence is insufficient</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
