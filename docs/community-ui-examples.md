# Community Layer UI Examples

Example React components and pages for the community layer features.

## Public Pages

### Chapter List Page (`/[locale]/chapters`)

```typescript
// app/[locale]/chapters/page.tsx
import { getApprovedChapters } from '@/lib/community/chapters'
import { useTranslations } from 'next-intl'

export default async function ChaptersPage() {
  const chapters = await getApprovedChapters()
  const t = useTranslations('chapters')

  // Group by country
  const byCountry = chapters.reduce((acc, chapter) => {
    if (!acc[chapter.country]) acc[chapter.country] = []
    acc[chapter.country].push(chapter)
    return acc
  }, {} as Record<string, typeof chapters>)

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>

      {Object.entries(byCountry).map(([country, chapterList]) => (
        <section key={country}>
          <h2>{getCountryName(country)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chapterList.map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function ChapterCard({ chapter }) {
  return (
    <a href={`/chapters/${chapter.slug}`} className="card">
      <h3>{chapter.name}</h3>
      <div className="stats">
        <div>
          <strong>{chapter.memberCount}</strong>
          <span>members</span>
        </div>
      </div>
      {chapter.organizerContactOptIn && (
        <div className="organizer">
          Contact: {chapter.organizerName}
        </div>
      )}
    </a>
  )
}
```

### Chapter Detail Page (`/[locale]/chapters/[slug]`)

```typescript
// app/[locale]/chapters/[slug]/page.tsx
import { getChapterBySlug, getChapterLeaderboard } from '@/lib/community/chapters'
import { notFound } from 'next/navigation'
import { AffiliationBadge } from '@/components/AffiliationBadge'

export default async function ChapterPage({ params }) {
  const chapter = await getChapterBySlug(params.slug)
  
  if (!chapter || chapter.status !== 'APPROVED' || chapter.suspended) {
    notFound()
  }

  const leaderboard = chapter.showLeaderboard 
    ? await getChapterLeaderboard(chapter.id, 20)
    : []

  return (
    <div>
      {/* Affiliation disclosure - REQUIRED on every page */}
      <AffiliationBadge />

      <header>
        <h1>{chapter.name}</h1>
        {chapter.organizerContactOptIn && (
          <div>
            Organized by {chapter.organizerName}
            <a href={`mailto:${chapter.organizerEmail}`}>Contact</a>
          </div>
        )}
      </header>

      <section>
        <h2>About This Chapter</h2>
        <div dangerouslySetInnerHTML={{ __html: chapter.descriptionEn }} />
      </section>

      <section>
        <h2>Chapter Stats</h2>
        <div className="stats-grid">
          <div className="stat">
            <strong>{chapter.memberCount}</strong>
            <span>Members</span>
          </div>
          <div className="stat">
            <strong>${(chapter.totalAmountCents / 100).toLocaleString()}</strong>
            <span>Total Raised</span>
          </div>
        </div>
      </section>

      {chapter.events.length > 0 && (
        <section>
          <h2>Upcoming Events</h2>
          {chapter.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>
      )}

      {chapter.showLeaderboard && leaderboard.length > 0 && (
        <section>
          <h2>Top Supporters</h2>
          <p className="text-muted">Ranked by number of contributions</p>
          <ol className="leaderboard">
            {leaderboard.map((entry, index) => (
              <li key={entry.slug}>
                <span className="rank">#{index + 1}</span>
                <a href={`/s/${entry.slug}`}>{entry.displayName}</a>
                <span className="count">{entry.contributionCount} contributions</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <JoinChapterButton chapterId={chapter.id} />
      </section>
    </div>
  )
}
```

### Supporter Page (`/[locale]/s/[slug]`)

```typescript
// app/[locale]/s/[slug]/page.tsx
import { getSupporterPageBySlug, getSupporterPageStats } from '@/lib/community/supporter-pages'
import { notFound } from 'next/navigation'
import { AffiliationBadge } from '@/components/AffiliationBadge'

export default async function SupporterPage({ params }) {
  const page = await getSupporterPageBySlug(params.slug)
  
  if (!page || page.status !== 'ACTIVE' || page.suspended) {
    notFound()
  }

  const stats = await getSupporterPageStats(params.slug)

  return (
    <div>
      {/* Affiliation disclosure - REQUIRED */}
      <AffiliationBadge />

      <header className="supporter-header">
        <h1>{page.showName ? page.displayName : 'Anonymous Supporter'}</h1>
        
        <div className="supporter-stats">
          <div className="stat">
            <strong>{stats.contributionCount}</strong>
            <span>contributions</span>
          </div>
          <div className="stat">
            <strong>{stats.referralCount}</strong>
            <span>supporters referred</span>
          </div>
        </div>

        {page.showRootsCommune && page.donor.rootsCommune && (
          <div className="roots-badge">
            🏠 Family roots: {getCommuneName(page.donor.rootsCommune)}
          </div>
        )}

        {page.showChapterMembership && stats.chapters.length > 0 && (
          <div className="chapters">
            <span>Member of:</span>
            {stats.chapters.map((chapter) => (
              <a key={chapter.slug} href={`/chapters/${chapter.slug}`}>
                {chapter.name}
              </a>
            ))}
          </div>
        )}
      </header>

      {page.storyEn && (
        <section className="supporter-story">
          <h2>Why I Support</h2>
          <p>{page.storyEn}</p>
        </section>
      )}

      <section className="share-section">
        <h3>Support via this page</h3>
        <p>
          When you contribute through this link, {page.showName ? page.displayName : 'this supporter'} 
          will be credited for referring you.
        </p>
        <a 
          href={`/contribute?ref=${page.slug}`}
          className="btn-primary"
        >
          Make a Contribution
        </a>
      </section>

      {/* Report button (anonymous) */}
      <ReportButton supporterPageId={page.id} />
    </div>
  )
}
```

### Roots by Commune Visualization

```typescript
// app/[locale]/nord-ouest/page.tsx
import { getNordOuestRootsAggregates } from '@/lib/community/roots'

export default async function NordOuestPage() {
  const aggregates = await getNordOuestRootsAggregates()

  return (
    <div>
      <h1>Nord-Ouest Department</h1>
      
      <section>
        <h2>Supporters by Commune</h2>
        <p className="text-muted">
          Supporters who have identified their family's commune of origin.
          Counts below 5 are suppressed for privacy.
        </p>

        <div className="roots-grid">
          {aggregates.map((agg) => (
            <div key={agg.communeSlug} className="commune-card">
              <h3>{agg.nameEn}</h3>
              <div className="count">
                {agg.supporterCount !== null ? (
                  <>
                    <strong>{agg.supporterCount}</strong>
                    <span>supporters</span>
                  </>
                ) : (
                  <span className="text-muted">Fewer than 5</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Optional: Interactive map */}
      <section>
        <h2>Map</h2>
        <RootsMap aggregates={aggregates} />
      </section>
    </div>
  )
}
```

## Admin Pages

### Chapter Approval Queue (`/admin/chapters`)

```typescript
// app/admin/chapters/page.tsx
import { getPendingChapters } from '@/lib/community/chapters'
import { requireAuth, requireRole } from '@/lib/auth'

export default async function AdminChaptersPage() {
  await requireAuth()
  await requireRole(['OWNER', 'ADMIN'])

  const pending = await getPendingChapters()

  return (
    <div>
      <h1>Chapter Requests</h1>

      <div className="tabs">
        <button className="active">Pending</button>
        <button>Approved</button>
        <button>Rejected</button>
      </div>

      {pending.length === 0 ? (
        <p>No pending chapter requests</p>
      ) : (
        <div className="requests-list">
          {pending.map((chapter) => (
            <ChapterRequestCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChapterRequestCard({ chapter }) {
  return (
    <div className="request-card">
      <h3>{chapter.name}</h3>
      <dl>
        <dt>Location</dt>
        <dd>{chapter.city}, {chapter.state} {chapter.country}</dd>
        
        <dt>Organizer</dt>
        <dd>{chapter.organizerName} ({chapter.organizerEmail})</dd>
        
        <dt>Requested</dt>
        <dd>{new Date(chapter.requestedAt).toLocaleDateString()}</dd>
      </dl>

      {chapter.descriptionEn && (
        <div className="description">
          <strong>Description:</strong>
          <p>{chapter.descriptionEn}</p>
        </div>
      )}

      <div className="actions">
        <form action="/api/admin/chapters/approve" method="POST">
          <input type="hidden" name="chapterId" value={chapter.id} />
          <button type="submit" className="btn-approve">
            Approve
          </button>
        </form>

        <form action="/api/admin/chapters/reject" method="POST">
          <input type="hidden" name="chapterId" value={chapter.id} />
          <button type="submit" className="btn-reject">
            Reject
          </button>
        </form>
      </div>
    </div>
  )
}
```

### Supporter Page Moderation (`/admin/supporter-pages/reports`)

```typescript
// app/admin/supporter-pages/reports/page.tsx
import { getPendingReports } from '@/lib/community/supporter-pages'
import { requireAuth, requireRole } from '@/lib/auth'

export default async function SupporterPageReportsPage() {
  await requireAuth()
  await requireRole(['OWNER', 'ADMIN', 'COMPLIANCE'])

  const reports = await getPendingReports()

  return (
    <div>
      <h1>Supporter Page Reports</h1>

      {reports.length === 0 ? (
        <p>No pending reports</p>
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReportCard({ report }) {
  return (
    <div className="report-card">
      <header>
        <h3>
          Report #{report.id.slice(0, 8)} - {report.reason}
        </h3>
        <time>{new Date(report.createdAt).toLocaleString()}</time>
      </header>

      <section>
        <strong>Reported Page:</strong>
        <a href={`/s/${report.supporterPage.slug}`} target="_blank">
          {report.supporterPage.displayName} (@{report.supporterPage.slug})
        </a>
      </section>

      {report.reasonDetails && (
        <section>
          <strong>Details:</strong>
          <p>{report.reasonDetails}</p>
        </section>
      )}

      <section>
        <strong>Reporter:</strong>
        <span>
          IP: {report.reporterIp}
          {report.reporterEmail && ` (${report.reporterEmail})`}
        </span>
      </section>

      <div className="actions">
        <a href={`/s/${report.supporterPage.slug}`} target="_blank" className="btn-secondary">
          View Page
        </a>
        
        <form action="/api/admin/supporter-pages/suspend" method="POST">
          <input type="hidden" name="pageId" value={report.supporterPage.id} />
          <input type="hidden" name="reportId" value={report.id} />
          <button type="submit" className="btn-warning">
            Suspend Page
          </button>
        </form>

        <form action="/api/admin/reports/dismiss" method="POST">
          <input type="hidden" name="reportId" value={report.id} />
          <button type="submit" className="btn-secondary">
            Dismiss Report
          </button>
        </form>
      </div>
    </div>
  )
}
```

## Supporter Dashboard (My Support)

### Create Supporter Page (`/[locale]/my-support/create-page`)

```typescript
// app/[locale]/my-support/create-page/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateSlug } from '@/lib/community/supporter-pages'

export default function CreateSupporterPageForm() {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [story, setStory] = useState('')
  const [showName, setShowName] = useState(true)
  const [showRoots, setShowRoots] = useState(false)
  const [showChapters, setShowChapters] = useState(false)

  const handleSlugChange = async (value: string) => {
    // Convert to slug format
    const slugified = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setSlug(slugified)

    if (slugified.length >= 3) {
      const validation = await validateSlug(slugified)
      setSlugError(validation.valid ? '' : validation.error!)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch('/api/my-support/create-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        displayName,
        storyEn: story,
        showName,
        showRootsCommune: showRoots,
        showChapterMembership: showChapters,
      }),
    })

    if (response.ok) {
      router.push('/my-support')
    } else {
      const error = await response.json()
      alert(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create Your Supporter Page</h1>

      <div className="form-group">
        <label htmlFor="slug">
          Your Page URL *
          <small>This will be: {window.location.origin}/s/{slug || 'your-name'}</small>
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="john-doe"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9-]+"
        />
        {slugError && <span className="error">{slugError}</span>}
        <small>
          3-30 characters, lowercase letters, numbers, and hyphens only
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="displayName">Display Name *</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="John D."
          required
          maxLength={50}
        />
        <small>How you want your name to appear (e.g., first initial + last name)</small>
      </div>

      <div className="form-group">
        <label htmlFor="story">
          Your Story
          <small>Optional, 500 characters max</small>
        </label>
        <textarea
          id="story"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="Why I support Jean Fritznel Bellefleur..."
          maxLength={500}
          rows={4}
        />
        <small>{story.length}/500 characters</small>
      </div>

      <div className="form-group">
        <h3>Privacy Settings</h3>
        
        <label>
          <input
            type="checkbox"
            checked={showName}
            onChange={(e) => setShowName(e.target.checked)}
          />
          Show my display name publicly
        </label>

        <label>
          <input
            type="checkbox"
            checked={showRoots}
            onChange={(e) => setShowRoots(e.target.checked)}
          />
          Show my family's commune
        </label>

        <label>
          <input
            type="checkbox"
            checked={showChapters}
            onChange={(e) => setShowChapters(e.target.checked)}
          />
          Show my chapter memberships
        </label>
      </div>

      <button type="submit" className="btn-primary" disabled={!!slugError || !slug}>
        Create Page
      </button>
    </form>
  )
}
```

## Client Components

### Join Chapter Button

```typescript
// components/client/JoinChapterButton.tsx
'use client'

import { useState } from 'react'

export function JoinChapterButton({ chapterId }: { chapterId: string }) {
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(false)

  const handleJoin = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/chapters/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      })

      if (response.ok) {
        setJoined(true)
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      alert('Failed to join chapter')
    } finally {
      setLoading(false)
    }
  }

  if (joined) {
    return <p className="success">✓ You've joined this chapter!</p>
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className="btn-primary"
    >
      {loading ? 'Joining...' : 'Join This Chapter'}
    </button>
  )
}
```

### Report Button

```typescript
// components/client/ReportButton.tsx
'use client'

import { useState } from 'react'

export function ReportButton({ supporterPageId }: { supporterPageId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const response = await fetch('/api/supporter-pages/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supporterPageId,
        reason,
        reasonDetails: details,
      }),
    })

    if (response.ok) {
      setSubmitted(true)
      setTimeout(() => setShowModal(false), 2000)
    } else {
      alert('Failed to submit report')
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-text text-muted"
      >
        Report this page
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {submitted ? (
              <div>
                <h3>✓ Report Submitted</h3>
                <p>Thank you. We'll review this report.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3>Report this page</h3>
                
                <div className="form-group">
                  <label>Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="PROFANITY">Profanity or offensive language</option>
                    <option value="IMPERSONATION">Impersonation</option>
                    <option value="SPAM">Spam</option>
                    <option value="HARASSMENT">Harassment</option>
                    <option value="INAPPROPRIATE_CONTENT">Inappropriate content</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Additional details (optional)</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
```

## API Routes

### Approve Chapter

```typescript
// app/api/admin/chapters/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { approveChapter } from '@/lib/community/chapters'
import { requireAuth, requireRole } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  await requireRole(user, ['OWNER', 'ADMIN'])

  const { chapterId } = await request.json()

  try {
    await approveChapter(chapterId, user.id, user.email)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
```

### Create Supporter Page

```typescript
// app/api/my-support/create-page/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupporterPage } from '@/lib/community/supporter-pages'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  const input = await request.json()

  try {
    const page = await createSupporterPage({
      donorId: user.donorId,
      ...input,
    })

    return NextResponse.json({ page })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
```

---

These examples provide a complete reference for building the UI layer on top of the implemented community features.

