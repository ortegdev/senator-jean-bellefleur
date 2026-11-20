import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Diaspora4Bellefleur',
  description: 'Support Jean Fritznel Bellefleur for Senator of Nord-Ouest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
