'use client'

import { useState } from 'react'
import { IntakeSubmission } from '@prisma/client'

interface IntakeSubmissionsProps {
  submissions: IntakeSubmission[]
}

export function IntakeSubmissions({ submissions }: IntakeSubmissionsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)

  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-ink-200 bg-white p-8 text-center">
        <p className="text-ink-600">No pending submissions</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-3">
                <span
                  className={`
                    rounded-full px-3 py-1 text-xs font-medium
                    ${submission.status === 'PENDING' ? 'bg-saltGold-100 text-saltGold-800' : ''}
                    ${submission.status === 'IN_REVIEW' ? 'bg-deepLagoon-100 text-deepLagoon-800' : ''}
                    ${submission.status === 'NEEDS_MORE' ? 'bg-coral-100 text-coral-800' : ''}
                  `}
                >
                  {submission.status}
                </span>
                <span className="text-sm font-medium text-ink-700">{submission.category}</span>
                {submission.priority && (
                  <span className="rounded-full bg-coral-600 px-2 py-0.5 text-xs font-semibold text-white">
                    PRIORITY
                  </span>
                )}
              </div>

              {/* Submitted By */}
              <div className="mt-3">
                <p className="text-sm text-ink-600">
                  Submitted by: <span className="font-medium text-ink-900">{submission.submittedBy}</span>
                </p>
                <p className="text-xs text-ink-500">
                  {new Date(submission.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Facts */}
              <div className="mt-4 space-y-2">
                {submission.factTextEn && (
                  <div className="rounded bg-sandPaper-50 p-3">
                    <p className="text-xs font-medium text-ink-500">EN</p>
                    <p className="mt-1 text-sm text-ink-800">{submission.factTextEn}</p>
                  </div>
                )}
                {submission.factTextFr && (
                  <div className="rounded bg-sandPaper-50 p-3">
                    <p className="text-xs font-medium text-ink-500">FR</p>
                    <p className="mt-1 text-sm text-ink-800">{submission.factTextFr}</p>
                  </div>
                )}
                {submission.factTextHt && (
                  <div className="rounded bg-sandPaper-50 p-3">
                    <p className="text-xs font-medium text-ink-500">HT</p>
                    <p className="mt-1 text-sm text-ink-800">{submission.factTextHt}</p>
                  </div>
                )}
              </div>

              {/* Evidence */}
              {submission.evidenceUrls.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-ink-600">Evidence Files:</p>
                  <ul className="mt-2 space-y-1">
                    {submission.evidenceUrls.map((url, index) => (
                      <li key={index}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-deepLagoon-700 hover:underline"
                        >
                          {url.split('/').pop() || `Evidence ${index + 1}`} →
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {submission.evidenceNotes && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-ink-700">
                    Evidence Notes
                  </summary>
                  <p className="mt-2 text-sm text-ink-600">{submission.evidenceNotes}</p>
                </details>
              )}

              {/* Review Notes */}
              {submission.reviewNotes && (
                <div className="mt-4 rounded-lg bg-deepLagoon-50 p-3">
                  <p className="text-xs font-medium text-deepLagoon-800">Review Notes:</p>
                  <p className="mt-1 text-sm text-deepLagoon-700">{submission.reviewNotes}</p>
                  {submission.reviewedBy && (
                    <p className="mt-1 text-xs text-deepLagoon-600">
                      by {submission.reviewedBy} on{' '}
                      {submission.reviewedAt && new Date(submission.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => alert('Connect to server action to create content entry')}
              className="rounded-md bg-seaGreen-600 px-4 py-2 text-sm font-medium text-white hover:bg-seaGreen-700"
            >
              Create Content Entry
            </button>
            <button
              onClick={() => alert('Connect to server action to request more info')}
              className="rounded-md bg-saltGold-600 px-4 py-2 text-sm font-medium text-white hover:bg-saltGold-700"
            >
              Request More Evidence
            </button>
            <button
              onClick={() => alert('Connect to server action to reject')}
              className="rounded-md bg-coral-600 px-4 py-2 text-sm font-medium text-white hover:bg-coral-700"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
