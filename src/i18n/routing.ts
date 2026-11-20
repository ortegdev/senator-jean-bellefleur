import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['ht', 'fr', 'en'],
  defaultLocale: 'ht',
  localePrefix: 'always', // Always use locale prefix (/ht, /fr, /en)
  pathnames: {
    // Pathnames are the same across locales
    '/': '/',
    '/about': '/about',
    '/nord-ouest': '/nord-ouest',
    '/news': '/news',
    '/get-involved': '/get-involved',
    '/contribute': '/contribute',
    '/privacy': '/privacy',
    '/terms': '/terms',
  },
})

export type Pathnames = keyof typeof routing.pathnames
export type Pathname = (typeof routing.pathnames)[Pathnames]

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
