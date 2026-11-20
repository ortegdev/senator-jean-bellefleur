'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { isBreaking, isNew } from '@/lib/data/news'

interface NewsArticle {
  id: string
  url: string
  headline: string
  outlet: string
  publishedAt: Date
  language: string
  contentType: string
}

interface NewsTickerProps {
  articles: NewsArticle[]
  locale: string
  intervalMs?: number
}

export function NewsTicker({
  articles,
  locale,
  intervalMs = 5000,
}: NewsTickerProps) {
  const t = useTranslations('news.ticker')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)

  const tickerRef = useRef<HTMLDivElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const advanceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    setIsPlaying(!mediaQuery.matches) // Start paused if reduced motion

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
      if (e.matches) {
        setIsPlaying(false)
      }
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // IntersectionObserver for visibility
  useEffect(() => {
    if (!tickerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.5 }
    )

    observer.observe(tickerRef.current)

    return () => observer.disconnect()
  }, [])

  // Visibility change (tab hidden)
  useEffect(() => {
    const handler = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // Determine if should be paused
  const shouldPause =
    isHovered || isFocused || isTouched || !isVisible || !isPlaying

  // Auto-advance logic
  useEffect(() => {
    if (articles.length < 2 || shouldPause) {
      // Clear existing timers
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current)
        advanceTimeoutRef.current = null
      }
      return
    }

    // Reset progress
    setProgress(0)

    // Progress bar update (60 FPS)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (intervalMs / 16.67))
        return next >= 100 ? 100 : next
      })
    }, 16.67)

    // Advance to next slide
    const advanceTimeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length)
    }, intervalMs)

    progressIntervalRef.current = progressInterval
    advanceTimeoutRef.current = advanceTimeout

    return () => {
      clearInterval(progressInterval)
      clearTimeout(advanceTimeout)
    }
  }, [currentIndex, shouldPause, articles.length, intervalMs])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isFocused) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isFocused, articles.length, currentIndex])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % articles.length)
    setProgress(0)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length)
    setProgress(0)
  }

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setProgress(0)
  }

  // Touch/swipe support
  const touchStartX = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsTouched(true)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      // Swipe threshold
      if (diff > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }

    setIsTouched(false)
  }

  if (articles.length === 0) return null

  // Static card if only 1 article
  if (articles.length === 1) {
    return (
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <ArticleCard article={articles[0]} locale={locale} t={t} />
        </div>
      </div>
    )
  }

  const currentArticle = articles[currentIndex]

  return (
    <div
      ref={tickerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={t('ariaLabel')}
      className="relative bg-white shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="absolute left-0 top-0 h-1 w-full bg-ink/5">
        <div
          className="h-full bg-coral transition-all"
          style={{
            width: `${progress}%`,
            transition: reducedMotion ? 'none' : undefined,
          }}
          aria-hidden="true"
        />
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Header with controls */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Label chip */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                isBreaking(currentArticle.publishedAt)
                  ? 'bg-coral text-white'
                  : isNew(currentArticle.publishedAt)
                  ? 'bg-sea-green text-white'
                  : 'bg-deep-lagoon/10 text-deep-lagoon'
              }`}
            >
              {isBreaking(currentArticle.publishedAt)
                ? t('breaking')
                : isNew(currentArticle.publishedAt)
                ? t('new')
                : t('latestCoverage')}
            </span>

            {/* Counter */}
            <span className="text-sm text-ink/60">
              {currentIndex + 1} {t('of')} {articles.length}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              aria-label={t('previous')}
              className="rounded-md p-2 text-deep-lagoon hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-deep-lagoon"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={togglePlayPause}
              aria-label={isPlaying ? t('pause') : t('play')}
              aria-pressed={isPlaying}
              className="rounded-md p-2 text-deep-lagoon hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-deep-lagoon"
            >
              {isPlaying ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={goToNext}
              aria-label={t('next')}
              className="rounded-md p-2 text-deep-lagoon hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-deep-lagoon"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Slides (stacked in grid) */}
        <div
          className="relative grid"
          style={{ minHeight: '120px' }}
          aria-live={shouldPause ? 'polite' : 'off'}
        >
          {articles.map((article, index) => (
            <div
              key={article.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} ${t('of')} ${articles.length}`}
              style={{
                gridArea: '1 / 1',
                opacity: index === currentIndex ? 1 : 0,
                transition: reducedMotion ? 'none' : 'opacity 0.3s ease-in-out',
                pointerEvents: index === currentIndex ? 'auto' : 'none',
              }}
            >
              <ArticleCard
                article={article}
                locale={locale}
                t={t}
                isFocusable={index === currentIndex}
              />
            </div>
          ))}
        </div>

        {/* Pagination dots */}
        <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`${t('goToSlide')} ${index + 1}`}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-deep-lagoon'
                  : 'bg-ink/20 hover:bg-ink/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface ArticleCardProps {
  article: {
    url: string
    headline: string
    outlet: string
    publishedAt: Date
    language: string
    contentType: string
  }
  locale: string
  t: (key: string) => string
  isFocusable?: boolean
}

function ArticleCard({ article, locale, t, isFocusable = true }: ArticleCardProps) {
  const publishDate = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(article.publishedAt))

  return (
    <div>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
        tabIndex={isFocusable ? 0 : -1}
      >
        <h3 className="line-clamp-2 font-display text-xl font-bold text-deep-lagoon group-hover:text-coral md:text-2xl">
          {article.headline}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink/70">
          <span className="font-semibold text-deep-lagoon">{article.outlet}</span>
          <span aria-hidden="true">•</span>
          <time dateTime={article.publishedAt.toISOString()}>{publishDate}</time>

          {article.contentType === 'OPINION_EDITORIAL' && (
            <>
              <span aria-hidden="true">•</span>
              <span className="italic text-ink/60">{t('opinion')}</span>
            </>
          )}

          {article.language !== locale && (
            <>
              <span aria-hidden="true">•</span>
              <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs uppercase">
                {article.language}
              </span>
            </>
          )}

          {/* External link icon */}
          <svg
            className="ml-auto h-4 w-4 text-coral opacity-0 transition-opacity group-hover:opacity-100"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </div>
      </a>
    </div>
  )
}
