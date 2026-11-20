import { prisma } from '@/lib/db/prisma'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { getChecklistStatus } from '@/lib/launch-gate/checklist'
import { getCurrentMode, isKillSwitchActive } from '@/lib/launch-gate/mode'
import { getCandidateConfig } from '@/lib/config/candidate'

// Force dynamic rendering (don't generate at build time)
export const dynamic = 'force-dynamic'

/**
 * Launch Control Admin Page
 * 
 * Central dashboard for:
 * - Current launch mode
 * - Readiness checklist
 * - Affiliation status
 * - Candidacy status  
 * - Audit log
 * - Campaign calendar
 * 
 * OWNER role only
 */

export default async function LaunchControlPage() {
  const mode = await getCurrentMode()
  const killSwitch = await isKillSwitchActive()
  const checklistStatus = await getChecklistStatus()
  const candidate = await getCandidateConfig()

  // Get checklist items by category
  const checklist = await prisma.launchChecklistItem.findMany({
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  })

  const checklistByCategory = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, typeof checklist>)

  // Get recent audit log
  const auditLog = await prisma.auditLog.findMany({
    where: {
      action: {
        in: ['LAUNCH_MODE_CHANGED', 'KILL_SWITCH_ACTIVATED', 'KILL_SWITCH_DEACTIVATED', 'CHECKLIST_ITEM_UPDATED'],
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Calculate days until campaign start
  const now = new Date()
  const campaignStart = candidate.officialCampaignStart
  const daysUntilStart = campaignStart
    ? Math.ceil((campaignStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const getModeVariant = (currentMode: typeof mode) => {
    if (currentMode === 'DONATIONS_LIVE') return 'success'
    if (currentMode === 'WAITLIST') return 'info'
    return 'neutral'
  }

  const getCandidacyVariant = (status: typeof candidate.candidacyStatus) => {
    if (status === 'ON_FINAL_LIST') return 'success'
    if (status === 'REGISTERED_PRELIMINARY') return 'info'
    if (status === 'UNVERIFIED') return 'warning'
    return 'error'
  }

  return (
    <div className="min-h-screen bg-sandPaper py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Launch Control"
          description="Central dashboard for launch readiness and mode management"
          showDivider
        />

        {/* Kill Switch Alert */}
        {killSwitch && (
          <div className="mt-8 rounded-lg border-2 border-coral-600 bg-coral-50 p-6">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-coral-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-coral-800">Kill Switch Active</h3>
                <p className="mt-1 text-sm text-coral-700">
                  Donations are disabled. Mode will return to WAITLIST even if set to DONATIONS_LIVE.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Status Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Launch Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Launch Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getModeVariant(mode)} size="md" className="mb-4 text-base">
                {mode}
              </Badge>
              <div className="space-y-2 text-sm text-ink-600">
                <p>
                  <strong>INFO_ONLY:</strong> No payments, no data collection
                </p>
                <p>
                  <strong>WAITLIST:</strong> Email/WhatsApp signup, no payments
                </p>
                <p>
                  <strong>DONATIONS_LIVE:</strong> Full functionality
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Candidacy Status */}
          <Card>
            <CardHeader>
              <CardTitle>Candidacy Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getCandidacyVariant(candidate.candidacyStatus)} size="md" className="mb-4 text-base">
                {candidate.candidacyStatus}
              </Badge>
              {candidate.candidacyStatusVerifier && (
                <p className="text-sm text-ink-600">
                  Verified by: {candidate.candidacyStatusVerifier}
                </p>
              )}
              {candidate.candidacyStatusDate && (
                <p className="text-sm text-ink-600">
                  Date: {candidate.candidacyStatusDate.toLocaleDateString()}
                </p>
              )}
              {!candidate.candidacyEvidenceUrl && (
                <p className="mt-2 text-sm text-coral-600">
                  ⚠️ No evidence attached
                </p>
              )}
            </CardContent>
          </Card>

          {/* Campaign Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignStart && (
                <>
                  <p className="text-sm text-ink-600">Official Start Date</p>
                  <p className="text-2xl font-bold text-deepLagoon">
                    {campaignStart.toLocaleDateString()}
                  </p>
                  {daysUntilStart !== null && (
                    <p className="mt-2 text-sm text-ink-600">
                      {daysUntilStart > 0 ? `${daysUntilStart} days remaining` : 'Campaign started'}
                    </p>
                  )}
                </>
              )}
              {candidate.firstRoundDate && (
                <p className="mt-4 text-sm text-ink-600">
                  First Round: {candidate.firstRoundDate.toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Affiliation Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Affiliation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={candidate.affiliationStatus === 'AUTHORIZED' ? 'success' : 'info'}>
                {candidate.affiliationStatus}
              </Badge>
              <p className="text-sm text-ink-600">{candidate.affiliationText}</p>
            </div>
            {candidate.affiliationAgreementRef && (
              <p className="mt-2 text-sm text-ink-600">
                Agreement: {candidate.affiliationAgreementRef}
                {candidate.affiliationAgreementDate && 
                  ` (${candidate.affiliationAgreementDate.toLocaleDateString()})`
                }
              </p>
            )}
          </CardContent>
        </Card>

        {/* Launch Readiness Checklist */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Launch Readiness Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <ProgressBar
                value={checklistStatus.percentComplete}
                label="Overall Progress"
                showPercentage
                color="seaGreen"
                size="lg"
              />
              <p className="mt-2 text-sm text-ink-600">
                {checklistStatus.requiredCompleted} of {checklistStatus.required} required items complete
              </p>
            </div>

            {Object.entries(checklistByCategory).map(([category, items]) => (
              <div key={category} className="mb-8">
                <h3 className="mb-4 font-display text-lg font-bold text-deepLagoon">
                  {category.replace(/_/g, ' ')}
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 rounded-lg border-2 p-4 ${
                        item.checked
                          ? 'border-seaGreen-200 bg-seaGreen-50'
                          : item.required
                          ? 'border-coral-200 bg-white'
                          : 'border-ink-100 bg-white'
                      }`}
                    >
                      <div className="flex-shrink-0 pt-0.5">
                        {item.checked ? (
                          <svg className="h-5 w-5 text-seaGreen-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className={`h-5 w-5 rounded border-2 ${item.required ? 'border-coral-400' : 'border-ink-300'}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-ink">
                            {item.title}
                          </h4>
                          {item.required && !item.checked && (
                            <Badge variant="error" size="sm">Required</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-ink-600">{item.description}</p>
                        {item.checked && (
                          <div className="mt-2 text-xs text-ink-600">
                            <p>✓ Checked by: {item.checkedBy}</p>
                            {item.checkedAt && (
                              <p>Date: {item.checkedAt.toLocaleDateString()}</p>
                            )}
                            {item.documentRef && (
                              <p>Document: {item.documentRef}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Validation for DONATIONS_LIVE */}
        {!checklistStatus.allRequiredComplete && (
          <Card className="mt-6 border-2 border-coral-600">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <svg className="h-6 w-6 flex-shrink-0 text-coral-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold text-coral-800">DONATIONS_LIVE Cannot Be Activated</h3>
                  <p className="mt-1 text-sm text-coral-700">
                    All required checklist items must be complete and candidacy status must be verified before donations can be enabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Log */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity (Audit Log)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLog.length === 0 ? (
                <p className="text-sm text-ink-600">No activity yet</p>
              ) : (
                auditLog.map((log) => (
                  <div key={log.id} className="border-b border-ink-100 pb-3 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-ink">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-ink-600">
                          By: {log.userEmail || 'System'}
                        </p>
                        {log.reason && (
                          <p className="text-sm text-ink-600">Reason: {log.reason}</p>
                        )}
                      </div>
                      <p className="text-xs text-ink-500">
                        {log.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-8 bg-deepLagoon-50">
          <CardContent className="p-6">
            <h3 className="mb-2 font-display text-lg font-bold text-deepLagoon">
              ⚠️ OWNER Role Required
            </h3>
            <p className="text-sm text-ink-600">
              Mode changes, checklist updates, and kill switch operations require OWNER role.
              All changes are audit-logged with timestamp, user, and reason.
            </p>
            <p className="mt-2 text-sm text-ink-600">
              This is a read-only view. Interactive controls will be added in admin interface.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
