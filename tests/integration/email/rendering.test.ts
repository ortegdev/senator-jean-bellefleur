/**
 * Email Rendering Tests
 * 
 * Verifies that emails render correctly with the longest French and Creole strings
 * and that layouts don't break with long content
 */

import { describe, it, expect } from 'vitest'
import { receiptEmailHtml } from '@/lib/email/templates/receipt'
import { refundApprovedHtml } from '@/lib/email/templates/refund'
import { magicLinkEmailHtml } from '@/lib/email/templates/magic-link'
import { doubleOptInEmailHtml, confirmationEmailHtml } from '@/lib/email/templates/opt-in'
import { fundsRedirectedEmailHtml } from '@/lib/email/templates/funds-redirected'

/**
 * Test strings with longest expected content
 */
const LONGEST_STRINGS = {
  // Longest French sentence from templates
  fr: {
    sentence: 'Cela créera une demande de remboursement qui sera examinée par notre équipe. Nous traitons généralement les demandes de remboursement dans un délai de 3 à 5 jours ouvrables.',
    affiliation: 'Initiative de supporters indépendants, non autorisée par ou affiliée au candidat, sa campagne ou tout parti.',
    longName: 'Jean Fritznel Bellefleur, Candidat au Poste de Sénateur du Département du Nord-Ouest',
  },
  // Longest Creole sentence from templates
  ht: {
    sentence: 'Sa ap kreye yon demann ranbousman ki pral revize pa ekip nou an. Nou trètman demann ranbousman nan 3-5 jou travay anjeneral.',
    affiliation: 'Inisyativ sipòtè endepandan, pa otorize pa oswa afilie ak kandida a, kanpay li oswa nenpòt pati.',
    longName: 'Jean Fritznel Bellefleur, Kandida pou Senatè Depatman Nò-Dwès',
  },
}

describe('Email Rendering with Long Content', () => {
  describe('Receipt Email', () => {
    it('renders correctly with longest French strings', () => {
      const html = receiptEmailHtml({
        receiptId: 'rec_123',
        receiptNumber: 'REC-2026-000123',
        contributionId: 'cid_456',
        amountCents: 123456,
        currency: 'HTG',
        donationDate: new Date('2026-03-15T14:30:00Z'),
        paymentType: 'Credit Card',
        last4: '4242',
        donorName: 'Test Donor',
        donorEmail: 'test@example.com',
        isAnonymous: false,
        affiliationDisclosure: 'Initiative de supporters indépendants, non autorisée par ou affiliée au candidat, sa campagne ou tout parti.',
        taxDeductibleNote: 'Cette contribution n\'est pas déductible d\'impôt.',
        refundPolicy: 'Politique de remboursement',
        refundWindowDays: 30,
        refundMagicLink: 'https://example.com/refund/verify?token=abc123def456ghi789',
        refundExpiresAt: new Date('2026-04-14'),
        generatedAt: new Date(),
        locale: 'fr',
      })

      // Verify HTML is valid and contains expected content
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('REC-2026-000123')
      expect(html).toContain('HTG')
      expect(html).toContain('Credit Card')
      
      // Verify affiliation disclosure is present
      expect(html).toContain('Initiative de supporters indépendants')
      
      // Verify no width: 0 layout issues
      expect(html).not.toContain('width: 0')
      
      // Verify dark mode classes are present
      expect(html).toContain('dark-mode-bg')
      expect(html).toContain('dark-mode-text')
    })

    it('renders correctly with longest Creole strings', () => {
      const html = receiptEmailHtml({
        receiptId: 'rec_789',
        receiptNumber: 'REC-2026-000456',
        contributionId: 'cid_012',
        amountCents: 123456,
        currency: 'HTG',
        donationDate: new Date('2026-03-15T14:30:00Z'),
        paymentType: 'Debit Card',
        last4: '4242',
        donorName: 'Test Donor',
        donorEmail: 'test@example.com',
        isAnonymous: false,
        affiliationDisclosure: 'Inisyativ sipòtè endepandan, pa otorize pa oswa afilie ak kandida a, kanpay li oswa nenpòt pati.',
        taxDeductibleNote: 'Kontribisyon sa a pa dedwi nan taks.',
        refundPolicy: 'Règleman ranbousman',
        refundWindowDays: 30,
        refundMagicLink: 'https://example.com/refund/verify?token=xyz789',
        refundExpiresAt: new Date('2026-04-14'),
        generatedAt: new Date(),
        locale: 'ht',
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('REC-2026-000456')
      expect(html).toContain('Debit Card')
      expect(html).toContain('Inisyativ sipòtè endepandan')
      
      // No layout issues
      expect(html).not.toContain('width: 0')
    })
  })

  describe('Refund Emails', () => {
    it('renders approved refund email with long French content', () => {
      const html = refundApprovedHtml({
        locale: 'fr',
        receiptNumber: 'REC-2026-001234',
        amountCents: 123456,
        currency: 'HTG',
        refundMethod: 'Carte de crédit se terminant par 4242',
        estimatedArrival: '7-10 jours ouvrables',
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('REC-2026-001234')
      expect(html).toContain('HTG')
      
      // French-specific content
      expect(html).toContain('Remboursement')
    })

    it('renders approved refund email with long Creole content', () => {
      const html = refundApprovedHtml({
        locale: 'ht',
        receiptNumber: 'REC-2026-005678',
        amountCents: 123456,
        currency: 'HTG',
        refundMethod: 'Kat kredi ki fini pa 4242',
        estimatedArrival: '7-10 jou travay',
      })

      expect(html).toContain('REC-2026-005678')
      expect(html).toContain('Ranbousman')
    })
  })

  describe('Magic Link Email', () => {
    it('renders magic link email with long French strings', () => {
      const html = magicLinkEmailHtml({
        locale: 'fr',
        recipientEmail: 'test@example.com',
        magicLink: 'https://example.com/verify-refund/abc123def456ghi789jkl012mno345pqr678stu901',
        purpose: 'refund',
        expiresInHours: 720, // 30 days
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('abc123def456ghi789jkl012mno345pqr678stu901')
      
      // Long URL should be word-broken in styled box
      expect(html).toContain('word-break: break-all')
      expect(html).toContain('font-family: monospace')
      
      // French content
      expect(html).toContain('Vérifiez')
    })

    it('renders magic link email with long Creole strings', () => {
      const html = magicLinkEmailHtml({
        locale: 'ht',
        recipientEmail: 'test@example.com',
        magicLink: 'https://example.com/verify-refund/xyz789abc012def345ghi678jkl901mno234pqr567',
        purpose: 'refund',
        expiresInHours: 720,
      })

      expect(html).toContain('xyz789abc012def345ghi678jkl901mno234pqr567')
      expect(html).toContain('Verifye')
    })
  })

  describe('Opt-In Emails', () => {
    it('renders double opt-in email with long French waitlist text', () => {
      const html = doubleOptInEmailHtml({
        locale: 'fr',
        recipientEmail: 'test@example.com',
        confirmationLink: 'https://example.com/confirm/waitlist/token123',
        listType: 'waitlist',
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('Liste d\'Attente')
      expect(html).toContain('token123')
    })

    it('renders confirmation email with long Creole newsletter text', () => {
      const html = confirmationEmailHtml({
        locale: 'ht',
        recipientEmail: 'test@example.com',
        listType: 'newsletter',
        unsubscribeLink: 'https://example.com/unsubscribe/token456',
      })

      expect(html).toContain('Byenveni')
      expect(html).toContain('token456')
      expect(html).toContain('newsletter') // Lowercase in unsubscribe link
    })
  })

  describe('Funds Redirected Email', () => {
    it('renders funds redirected email with long French explanation', () => {
      const html = fundsRedirectedEmailHtml({
        locale: 'fr',
        recipientEmail: 'test@example.com',
        contributionAmount: '1 234,56 HTG',
        contributionDate: '15 mars 2026',
        receiptNumber: 'REC-2026-009876',
        redirectReason: 'Le candidat Jean Fritznel Bellefleur a retiré sa candidature au poste de Sénateur du Nord-Ouest. Conformément à la réglementation électorale haïtienne et aux conditions de notre plateforme, votre contribution sera redirigée.',
        redirectionDestination: 'Organisation de la Société Civile pour la Démocratie et le Développement du Nord-Ouest (OSCD-NO), une organisation à but non lucratif enregistrée en Haïti et dédiée au développement démocratique du département.',
        refundOption: 'optional',
        refundRequestLink: 'https://example.com/refund/request/token789',
        refundDeadline: '31 décembre 2026, 23:59 UTC',
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('REC-2026-009876')
      expect(html).toContain('1 234,56 HTG')
      
      // Long reason and destination should render without breaking layout
      expect(html).toContain('retiré sa candidature')
      expect(html).toContain('Organisation de la Société Civile')
      expect(html).toContain('31 décembre 2026')
      
      // Verify colored boxes render
      expect(html).toContain('background-color: #FEF3C7') // Warning box
      expect(html).toContain('background-color: #E0F2FE') // Info box
    })

    it('renders funds redirected email with long Creole explanation', () => {
      const html = fundsRedirectedEmailHtml({
        locale: 'ht',
        recipientEmail: 'test@example.com',
        contributionAmount: '1 234,56 HTG',
        contributionDate: '15 mas 2026',
        receiptNumber: 'REC-2026-005432',
        redirectReason: 'Kandida Jean Fritznel Bellefleur retire kandidati li pou pòs Senatè Nò-Dwès. Dapre règleman elektoral ayisyen ak kondisyon platfòm nou an, kontribisyon w ap redirije.',
        redirectionDestination: 'Òganizasyon Sosyete Sivil pou Demokrasi ak Devlopman Nò-Dwès (OSCD-NO), yon òganizasyon san bi likratif anrejistre ann Ayiti epi dedye ak devlopman demokratik depatman an.',
        refundOption: 'automatic',
      })

      expect(html).toContain('REC-2026-005432')
      expect(html).toContain('retire kandidati')
      expect(html).toContain('Òganizasyon Sosyete Sivil')
      
      // Automatic refund box
      expect(html).toContain('background-color: #DCFCE7') // Success box
    })
  })

  describe('Layout Integrity', () => {
    it('all emails have valid HTML structure', () => {
      const emails = [
        receiptEmailHtml({
          receiptId: 'rec_test',
          receiptNumber: 'TEST',
          contributionId: 'cid_test',
          amountCents: 10000,
          currency: 'HTG',
          donationDate: new Date(),
          paymentType: 'test',
          last4: '1234',
          donorName: 'Test',
          donorEmail: 'test@example.com',
          isAnonymous: false,
          affiliationDisclosure: 'test',
          taxDeductibleNote: 'test',
          refundPolicy: 'test',
          refundWindowDays: 30,
          refundMagicLink: 'https://example.com',
          refundExpiresAt: new Date(),
          generatedAt: new Date(),
          locale: 'fr',
        }),
        refundApprovedHtml({
          locale: 'ht',
          receiptNumber: 'TEST',
          amountCents: 10000,
          currency: 'HTG',
          refundMethod: 'test',
          estimatedArrival: 'test',
        }),
        magicLinkEmailHtml({
          locale: 'fr',
          recipientEmail: 'test@example.com',
          magicLink: 'https://example.com',
          purpose: 'refund',
          expiresInHours: 24,
        }),
      ]

      emails.forEach(html => {
        // Valid HTML structure
        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('<html lang=')
        expect(html).toContain('</html>')
        
        // Meta tags for email clients
        expect(html).toContain('<meta charset="utf-8">')
        expect(html).toContain('<meta name="viewport"')
        expect(html).toContain('<meta name="x-apple-disable-message-reformatting">')
        
        // Dark mode support
        expect(html).toContain('@media (prefers-color-scheme: dark)')
        expect(html).toContain('dark-mode-bg')
        
        // System font stack
        expect(html).toContain('-apple-system')
        expect(html).toContain('BlinkMacSystemFont')
        
        // Outlook VML namespace
        expect(html).toContain('xmlns:v="urn:schemas-microsoft-com:vml"')
        expect(html).toContain('xmlns:o="urn:schemas-microsoft-com:office:office"')
        
        // Affiliation disclosure in footer (in any language)
        const hasAffiliation = 
          html.includes('Initiative de supporters indépendants') ||
          html.includes('Inisyativ sipòtè endepandan') ||
          html.includes('Independent supporter initiative')
        expect(hasAffiliation).toBe(true)
      })
    })

    it('emails do not contain tracking pixels or third-party resources', () => {
      const html = receiptEmailHtml({
        receiptId: 'rec_test',
        receiptNumber: 'TEST',
        contributionId: 'cid_test',
        amountCents: 10000,
        currency: 'HTG',
        donationDate: new Date(),
        paymentType: 'test',
        last4: '1234',
        donorName: 'Test',
        donorEmail: 'test@example.com',
        isAnonymous: false,
        affiliationDisclosure: 'test',
        taxDeductibleNote: 'test',
        refundPolicy: 'test',
        refundWindowDays: 30,
        refundMagicLink: 'https://example.com',
        refundExpiresAt: new Date(),
        generatedAt: new Date(),
        locale: 'en',
      })

      // No tracking pixels
      expect(html).not.toContain('<img src="https://track')
      expect(html).not.toContain('analytics')
      expect(html).not.toContain('pixel')
      
      // No external resources
      expect(html).not.toContain('cdn.jsdelivr')
      expect(html).not.toContain('googleapis')
      expect(html).not.toContain('cloudflare')
      
      // No external font links
      expect(html).not.toContain('<link href="https://')
    })

    it('emails have proper line length for readability', () => {
      const html = receiptEmailHtml({
        receiptId: 'rec_test',
        receiptNumber: 'TEST',
        contributionId: 'cid_test',
        amountCents: 10000,
        currency: 'HTG',
        donationDate: new Date(),
        paymentType: 'test',
        last4: '1234',
        donorName: 'Test',
        donorEmail: 'test@example.com',
        isAnonymous: false,
        affiliationDisclosure: 'test',
        taxDeductibleNote: 'test',
        refundPolicy: 'test',
        refundWindowDays: 30,
        refundMagicLink: 'https://example.com',
        refundExpiresAt: new Date(),
        generatedAt: new Date(),
        locale: 'fr',
      })

      // Content table has max width
      expect(html).toContain('width="600"')
      
      // Responsive class exists
      expect(html).toContain('class="content-width"')
      
      // Mobile padding class exists
      expect(html).toContain('class="mobile-padding"')
    })

    it('buttons are bulletproof (work in Outlook)', () => {
      const html = magicLinkEmailHtml({
        locale: 'en',
        recipientEmail: 'test@example.com',
        magicLink: 'https://example.com/verify',
        purpose: 'refund',
        expiresInHours: 24,
      })

      // VML for Outlook
      expect(html).toContain('<!--[if mso]>')
      expect(html).toContain('<v:roundrect')
      expect(html).toContain('xmlns:v="urn:schemas-microsoft-com:vml"')
      
      // Standard button link
      expect(html).toContain('<a href="https://example.com/verify"')
      expect(html).toContain('background-color:#C8432B')
      expect(html).toContain('border-radius:6px')
    })
  })

  describe('Accessibility', () => {
    it('emails have proper semantic structure', () => {
      const html = fundsRedirectedEmailHtml({
        locale: 'en',
        recipientEmail: 'test@example.com',
        contributionAmount: '$100',
        contributionDate: 'Jan 1, 2026',
        receiptNumber: 'TEST',
        redirectReason: 'Test reason',
        redirectionDestination: 'Test destination',
        refundOption: 'none',
      })

      // Tables have role="presentation"
      expect(html).toContain('role="presentation"')
      
      // Headings use h2, h3
      expect(html).toContain('<h2 style=')
      expect(html).toContain('<h3 style=')
      
      // Proper heading hierarchy (h2 before h3)
      const h2Index = html.indexOf('<h2')
      const h3Index = html.indexOf('<h3')
      expect(h2Index).toBeLessThan(h3Index)
    })

    it('links have descriptive text', () => {
      const html = magicLinkEmailHtml({
        locale: 'en',
        recipientEmail: 'test@example.com',
        magicLink: 'https://example.com/verify',
        purpose: 'email-verification',
        expiresInHours: 24,
      })

      // Links have meaningful text, not "click here"
      expect(html).not.toContain('>Click here<')
      expect(html).not.toContain('>Click<')
      
      // Button has descriptive text
      expect(html).toContain('Verify Email Address')
    })
  })
})
