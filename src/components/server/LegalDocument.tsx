/**
 * Shared Legal Document Layout
 * 
 * Features:
 * - Reading column max 68ch at 17-18px
 * - Sticky scroll-spy table of contents
 * - Heading anchors with copy-link
 * - Draft state banner (amber, persistent)
 * - [COUNSEL TO REVIEW] block styling
 * - Readable tables (stacked cards on mobile)
 * - Print stylesheet support
 * - Dark mode
 * - 200% zoom support
 * - Accessible (WCAG 2.2 AA)
 * 
 * CRITICAL: Does NOT edit or rewrite legal wording
 */

import { ReactNode } from 'react'

// ============================================================================
// Types
// ============================================================================

export interface LegalSection {
  id: string
  title: string
  level: number // 1, 2, or 3
  content: ReactNode
  needsReview?: boolean // [COUNSEL TO REVIEW] flag
}

export interface LegalDocumentProps {
  title: string
  locale: 'ht' | 'fr' | 'en'
  lastUpdated?: Date
  approved: boolean // If false, shows draft banner
  sections: LegalSection[]
  relatedDocuments?: Array<{
    href: string
    title: string
    description?: string
  }>
}

// ============================================================================
// Component
// ============================================================================

export function LegalDocument({
  title,
  locale,
  lastUpdated,
  approved,
  sections,
  relatedDocuments,
}: LegalDocumentProps) {
  // Generate table of contents from sections
  const toc = sections.filter((section) => section.level <= 2)

  return (
    <div className="legal-document-container">
      {/* Draft Banner (persistent, never hidden) */}
      {!approved && (
        <div
          className="draft-banner"
          role="alert"
          aria-live="polite"
        >
          <div className="draft-banner-content">
            <svg
              className="draft-banner-icon"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div className="draft-banner-text">
              <strong>Draft:</strong> Pending legal review
            </div>
          </div>
        </div>
      )}

      <div className="legal-document-layout">
        {/* Table of Contents (Sticky) */}
        <aside className="legal-toc" aria-label="Table of contents">
          <details className="legal-toc-mobile" open>
            <summary className="legal-toc-mobile-toggle">
              On this page
              <svg
                className="legal-toc-chevron"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>

            <nav className="legal-toc-nav">
              <ul className="legal-toc-list">
                {toc.map((section) => (
                  <li
                    key={section.id}
                    className={`legal-toc-item legal-toc-item-level-${section.level}`}
                  >
                    <a
                      href={`#${section.id}`}
                      className="legal-toc-link"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </aside>

        {/* Main Content */}
        <main className="legal-content">
          {/* Document Title */}
          <header className="legal-header">
            <h1 className="legal-title">{title}</h1>
            {lastUpdated && (
              <p className="legal-last-updated">
                Last updated:{' '}
                <time dateTime={lastUpdated.toISOString()}>
                  {lastUpdated.toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </p>
            )}
          </header>

          {/* Sections */}
          <div className="legal-sections">
            {sections.map((section) => (
              <LegalSection
                key={section.id}
                section={section}
                locale={locale}
              />
            ))}
          </div>

          {/* Related Documents */}
          {relatedDocuments && relatedDocuments.length > 0 && (
            <aside
              className="legal-related"
              aria-label="Related documents"
            >
              <h2 className="legal-related-title">Related documents</h2>
              <ul className="legal-related-list">
                {relatedDocuments.map((doc) => (
                  <li key={doc.href} className="legal-related-item">
                    <a
                      href={doc.href}
                      className="legal-related-link"
                    >
                      <span className="legal-related-link-title">
                        {doc.title}
                      </span>
                      {doc.description && (
                        <span className="legal-related-link-desc">
                          {doc.description}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </main>
      </div>
    </div>
  )
}

// ============================================================================
// Section Component
// ============================================================================

function LegalSection({
  section,
  locale,
}: {
  section: LegalSection
  locale: string
}) {
  const HeadingTag = `h${section.level + 1}` as keyof JSX.IntrinsicElements

  return (
    <section
      id={section.id}
      className={`legal-section ${section.needsReview ? 'legal-section-needs-review' : ''}`}
      aria-label={section.title}
    >
      {/* Heading with Anchor Link */}
      <HeadingTag className={`legal-heading legal-heading-${section.level}`}>
        <a
          href={`#${section.id}`}
          className="legal-heading-anchor"
          aria-label={`Link to ${section.title}`}
        >
          {section.title}
        </a>
        <button
          type="button"
          className="legal-heading-copy"
          onClick={(e) => {
            const url = new URL(window.location.href)
            url.hash = section.id
            navigator.clipboard.writeText(url.toString())

            // Visual feedback
            const btn = e.currentTarget
            const originalText = btn.getAttribute('aria-label')
            btn.setAttribute('aria-label', 'Copied!')
            setTimeout(() => {
              btn.setAttribute('aria-label', originalText || 'Copy link')
            }, 2000)
          }}
          aria-label="Copy link to this section"
        >
          <svg
            className="legal-heading-copy-icon"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
            />
          </svg>
        </button>
      </HeadingTag>

      {/* [COUNSEL TO REVIEW] indicator */}
      {section.needsReview && (
        <div className="legal-review-label" role="status">
          <svg
            className="legal-review-icon"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          Pending review
        </div>
      )}

      {/* Content (rendered as-is, no modification) */}
      <div className="legal-section-content">{section.content}</div>
    </section>
  )
}

// ============================================================================
// Table Component (Responsive)
// ============================================================================

export function LegalTable({
  headers,
  rows,
  caption,
}: {
  headers: string[]
  rows: string[][]
  caption?: string
}) {
  return (
    <div className="legal-table-wrapper">
      <table className="legal-table">
        {caption && <caption className="legal-table-caption">{caption}</caption>}
        <thead className="legal-table-thead">
          <tr>
            {headers.map((header, i) => (
              <th key={i} scope="col" className="legal-table-th">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="legal-table-tbody">
          {rows.map((row, i) => (
            <tr key={i} className="legal-table-tr">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="legal-table-td"
                  data-label={headers[j]}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// Callout Component
// ============================================================================

export function LegalCallout({
  children,
  type = 'info',
}: {
  children: ReactNode
  type?: 'info' | 'warning' | 'important'
}) {
  const icons = {
    info: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    ),
    warning: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
    important: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    ),
  }

  return (
    <div className={`legal-callout legal-callout-${type}`} role="note">
      <div className="legal-callout-icon" aria-hidden="true">
        {icons[type]}
      </div>
      <div className="legal-callout-content">{children}</div>
    </div>
  )
}

// ============================================================================
// Defined Term Component
// ============================================================================

export function DefinedTerm({ children }: { children: ReactNode }) {
  return <span className="legal-defined-term">{children}</span>
}
