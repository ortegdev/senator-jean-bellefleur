'use client'

import { useState } from 'react'

interface TestResult {
  result: 'ALLOW' | 'REVIEW' | 'DENY'
  reasons: string[]
  reasonDetails: Record<string, any>
  checkId: string
  requiresReview: boolean
}

export function TestConsoleClient() {
  const [donorEmail, setDonorEmail] = useState('test@example.com')
  const [donorFirstName, setDonorFirstName] = useState('Test')
  const [donorLastName, setDonorLastName] = useState('Donor')
  const [declaredCountry, setDeclaredCountry] = useState('US')
  const [amountDollars, setAmountDollars] = useState('7.00')
  const [cardType, setCardType] = useState<string>('credit')
  const [cardCountry, setCardCountry] = useState('US')
  
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/compliance/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorEmail,
          donorFirstName,
          donorLastName,
          declaredCountry,
          amountCents: Math.round(parseFloat(amountDollars) * 100),
          cardType: cardType || undefined,
          cardCountry: cardCountry || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Test failed')
      }

      const result = await response.json()
      setTestResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const presetScenarios = [
    {
      name: 'Valid Contribution',
      data: {
        donorEmail: 'valid@example.com',
        donorFirstName: 'Valid',
        donorLastName: 'Donor',
        declaredCountry: 'US',
        amountDollars: '7.00',
        cardType: 'credit',
        cardCountry: 'US',
      },
    },
    {
      name: 'Amount Too Low',
      data: {
        donorEmail: 'low@example.com',
        donorFirstName: 'Low',
        donorLastName: 'Amount',
        declaredCountry: 'US',
        amountDollars: '2.00',
        cardType: 'credit',
        cardCountry: 'US',
      },
    },
    {
      name: 'Amount Too High',
      data: {
        donorEmail: 'high@example.com',
        donorFirstName: 'High',
        donorLastName: 'Amount',
        declaredCountry: 'US',
        amountDollars: '50.00',
        cardType: 'credit',
        cardCountry: 'US',
      },
    },
    {
      name: 'Corporate Card',
      data: {
        donorEmail: 'corp@example.com',
        donorFirstName: 'Corporate',
        donorLastName: 'Card',
        declaredCountry: 'US',
        amountDollars: '7.00',
        cardType: 'corporate',
        cardCountry: 'US',
      },
    },
    {
      name: 'Sanctioned Country',
      data: {
        donorEmail: 'sanctioned@example.com',
        donorFirstName: 'Sanctioned',
        donorLastName: 'Country',
        declaredCountry: 'IR',
        amountDollars: '7.00',
        cardType: 'credit',
        cardCountry: 'IR',
      },
    },
    {
      name: 'Country Mismatch',
      data: {
        donorEmail: 'mismatch@example.com',
        donorFirstName: 'Country',
        donorLastName: 'Mismatch',
        declaredCountry: 'US',
        amountDollars: '7.00',
        cardType: 'credit',
        cardCountry: 'FR',
      },
    },
    {
      name: 'Sanctions Match (Test Pattern)',
      data: {
        donorEmail: 'sanctions@example.com',
        donorFirstName: 'SANCTIONS_MATCH',
        donorLastName: 'Test',
        declaredCountry: 'US',
        amountDollars: '7.00',
        cardType: 'credit',
        cardCountry: 'US',
      },
    },
  ]

  const loadScenario = (scenario: typeof presetScenarios[0]) => {
    setDonorEmail(scenario.data.donorEmail)
    setDonorFirstName(scenario.data.donorFirstName)
    setDonorLastName(scenario.data.donorLastName)
    setDeclaredCountry(scenario.data.declaredCountry)
    setAmountDollars(scenario.data.amountDollars)
    setCardType(scenario.data.cardType)
    setCardCountry(scenario.data.cardCountry)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Form */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-display text-xl font-semibold text-ink mb-4">
            Test Donation
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Donor Email
              </label>
              <input
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="w-full h-10 px-3 border border-deepLagoon-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={donorFirstName}
                  onChange={(e) => setDonorFirstName(e.target.value)}
                  className="w-full h-10 px-3 border border-deepLagoon-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={donorLastName}
                  onChange={(e) => setDonorLastName(e.target.value)}
                  className="w-full h-10 px-3 border border-deepLagoon-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  className="w-full h-10 px-3 border border-deepLagoon-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={declaredCountry}
                  onChange={(e) => setDeclaredCountry(e.target.value)}
                  placeholder="US, FR, HT, etc."
                  className="w-full h-10 px-3 border border-deepLagoon-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Card Type
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  className="w-full h-10 px-3 border border-deepLagoon-200 rounded-lg"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                  <option value="prepaid">Prepaid</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Card Country
                </label>
                <input
                  type="text"
                  value={cardCountry}
                  onChange={(e) => setCardCountry(e.target.value)}
                  placeholder="US, FR, etc."
                  className="w-full h-10 px-3 border border-deepLagoon-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleTest}
              disabled={isLoading}
              className="w-full h-12 bg-coral text-white rounded-lg font-medium hover:bg-coral/90 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Run Test'}
            </button>
          </div>
        </div>

        {/* Preset Scenarios */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-display text-xl font-semibold text-ink mb-4">
            Preset Scenarios
          </h2>
          <div className="space-y-2">
            {presetScenarios.map((scenario) => (
              <button
                key={scenario.name}
                type="button"
                onClick={() => loadScenario(scenario)}
                className="w-full text-left px-4 py-3 border border-deepLagoon-200 rounded-lg hover:bg-sandPaper transition-colors"
              >
                <span className="font-medium text-ink">{scenario.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        {error && (
          <div className="bg-coral/10 border border-coral rounded-xl p-6 mb-6">
            <p className="font-medium text-coral">{error}</p>
          </div>
        )}

        {testResult && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-display text-xl font-semibold text-ink mb-4">
              Test Result
            </h2>

            {/* Result Badge */}
            <div className="mb-6">
              <span
                className={`inline-block px-4 py-2 rounded-full font-semibold ${
                  testResult.result === 'ALLOW'
                    ? 'bg-seaGreen/10 text-seaGreen'
                    : testResult.result === 'REVIEW'
                    ? 'bg-saltGold/10 text-saltGold-700'
                    : 'bg-coral/10 text-coral'
                }`}
              >
                {testResult.result}
              </span>
              {testResult.requiresReview && (
                <span className="ml-3 text-sm text-ink/60">
                  → Manual review required
                </span>
              )}
            </div>

            {/* Reasons */}
            {testResult.reasons.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-ink mb-3">Reasons</h3>
                <ul className="space-y-2">
                  {testResult.reasons.map((reason, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-ink/80"
                    >
                      <span className="text-coral mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Details */}
            {Object.keys(testResult.reasonDetails).length > 0 && (
              <div>
                <h3 className="font-semibold text-ink mb-3">Details</h3>
                <pre className="bg-sandPaper rounded-lg p-4 text-xs overflow-auto">
                  {JSON.stringify(testResult.reasonDetails, null, 2)}
                </pre>
              </div>
            )}

            {/* Check ID */}
            <div className="mt-6 pt-6 border-t border-deepLagoon-100">
              <p className="text-xs text-ink/50">
                Check ID: {testResult.checkId}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
