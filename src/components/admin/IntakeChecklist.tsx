'use client'

import { useState } from 'react'
import { IntakeChecklist as ChecklistItem } from '@prisma/client'

interface IntakeChecklistProps {
  items: ChecklistItem[]
}

export function IntakeChecklist({ items }: IntakeChecklistProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newSet = new Set(expandedItems)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedItems(newSet)
  }

  const completedCount = items.filter((item) => item.completed).length
  const requiredCount = items.filter((item) => item.required).length
  const completedRequired = items.filter((item) => item.required && item.completed).length

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink-700">
            {completedRequired} of {requiredCount} required items complete
          </span>
          <span className="text-ink-500">
            {completedCount} of {items.length} total
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-200">
          <div
            className="h-full bg-seaGreen-600 transition-all"
            style={{ width: `${(completedRequired / requiredCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`
              rounded-lg border p-4 transition-all
              ${item.completed ? 'border-seaGreen-300 bg-seaGreen-50' : 'border-ink-200 bg-white'}
            `}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div className="mt-0.5 flex-shrink-0">
                {item.completed ? (
                  <svg className="h-6 w-6 text-seaGreen-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-ink-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink-900">{item.title}</h3>
                  {item.required && (
                    <span className="rounded-full bg-coral-100 px-2 py-0.5 text-xs font-medium text-coral-800">
                      Required
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-600">{item.description}</p>

                {/* Completion Details */}
                {item.completed && (
                  <div className="mt-3 rounded bg-white p-3 text-sm">
                    <p className="text-ink-700">
                      <span className="font-medium">Completed by:</span> {item.completedBy}
                    </p>
                    {item.completedAt && (
                      <p className="mt-1 text-ink-600">
                        {new Date(item.completedAt).toLocaleDateString()}
                      </p>
                    )}
                    {item.evidenceUrl && (
                      <p className="mt-2">
                        <a
                          href={item.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-deepLagoon-700 hover:underline"
                        >
                          View Evidence →
                        </a>
                      </p>
                    )}
                    {item.verificationNotes && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-deepLagoon-700">
                          Verification Notes
                        </summary>
                        <p className="mt-1 text-ink-600">{item.verificationNotes}</p>
                      </details>
                    )}
                  </div>
                )}

                {/* Action Button (placeholder - would connect to server action) */}
                {!item.completed && (
                  <button
                    onClick={() => alert('Connect to server action to mark complete')}
                    className="mt-3 text-sm font-medium text-deepLagoon-700 hover:text-deepLagoon-900"
                  >
                    Mark as Complete →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
