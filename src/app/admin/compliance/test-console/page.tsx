/**
 * Compliance Rules Test Console
 * 
 * Simulates donation attempts against active compliance rules.
 * Helps test rule configurations before going live.
 * 
 * COMPLIANCE role only.
 */

import { Metadata } from 'next'
import { TestConsoleClient } from '@/components/compliance/TestConsoleClient'

export const metadata: Metadata = {
  title: 'Compliance Test Console',
  description: 'Test compliance rules against simulated donations',
}

export default function TestConsolePage() {
  return (
    <div className="min-h-screen bg-sandPaper py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-ink">
            Compliance Test Console
          </h1>
          <p className="mt-2 text-ink/70">
            Simulate donation attempts to test compliance rules. Results show which rules would trigger.
          </p>
        </div>

        <TestConsoleClient />
      </div>
    </div>
  )
}
