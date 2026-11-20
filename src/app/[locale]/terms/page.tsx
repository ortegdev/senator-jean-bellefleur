/**
 * Terms of Service Page
 * 
 * CRITICAL: This file contains legal wording that must NOT be edited,
 * rewritten, or shortened without legal counsel approval.
 * 
 * The layout and structure can be modified, but the actual legal text
 * must remain byte-identical to the approved source.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  LegalDocument,
  LegalSection,
  LegalTable,
  LegalCallout,
  DefinedTerm,
} from '@/components/server/LegalDocument'
import '@/app/styles/legal.css'

// ============================================================================
// Metadata
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const titles = {
    en: 'Terms of Service',
    fr: 'Conditions d\'utilisation',
    ht: 'Kondisyon Sèvis',
  }

  const title = titles[locale as keyof typeof titles] || titles.en

  return {
    title: `${title} | Diaspora4Bellefleur`,
    description: 'Terms of service for using the Diaspora4Bellefleur platform.',
  }
}

// ============================================================================
// Page Component
// ============================================================================

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeValue } = await params
  const locale = localeValue as 'ht' | 'fr' | 'en'

  if (!['ht', 'fr', 'en'].includes(locale)) {
    notFound()
  }

  // TODO: Fetch from database with approval status
  // For now, hardcoded approved = false to show draft banner
  const approved = false
  const lastUpdated = new Date('2024-01-15')

  // Define sections with legal content
  // CRITICAL: This is example structure - actual legal text must come from counsel
  const sections: LegalSection[] = [
    {
      id: 'acceptance',
      title: locale === 'en' ? 'Acceptance of Terms' : 
             locale === 'fr' ? 'Acceptation des conditions' :
             'Akseptasyon Kondisyon yo',
      level: 1,
      content: (
        <>
          <p>
            By accessing or using this website ("Site"), you agree to be bound by these Terms of Service 
            ("Terms"). If you do not agree to these Terms, you may not use the Site.
          </p>
          <p>
            These Terms constitute a binding legal agreement between you and the operators of this Site.
          </p>
        </>
      ),
    },
    {
      id: 'site-purpose',
      title: locale === 'en' ? 'Purpose and Affiliation' :
             locale === 'fr' ? 'Objectif et affiliation' :
             'Objektif ak Afilyasyon',
      level: 1,
      content: (
        <>
          <LegalCallout type="important">
            <p>
              <strong>This Site is an independent supporter initiative.</strong> It is not authorized by, 
              affiliated with, or controlled by Jean Fritznel Bellefleur, his campaign, any political party, 
              or any government entity.
            </p>
          </LegalCallout>
          <p>
            The Site's purpose is to provide information about Jean Fritznel Bellefleur's candidacy 
            for Senator of the Nord-Ouest department and to facilitate voluntary contributions from 
            eligible individuals.
          </p>
        </>
      ),
    },
    {
      id: 'eligibility',
      title: locale === 'en' ? 'Eligibility and User Conduct' :
             locale === 'fr' ? 'Éligibilité et conduite des utilisateurs' :
             'Elijibilite ak Konduit Itilizatè',
      level: 1,
      content: (
        <>
          <p>
            You must be at least 18 years old to use this Site. By using the Site, you represent and 
            warrant that you meet this age requirement.
          </p>
          <p>
            You agree to use the Site only for lawful purposes and in accordance with these Terms. 
            You agree not to:
          </p>
          <ul>
            <li>Violate any applicable local, state, national, or international law</li>
            <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with a person or entity</li>
            <li>Interfere with or disrupt the Site or servers or networks connected to the Site</li>
            <li>Attempt to gain unauthorized access to any portion of the Site or any other systems or networks</li>
            <li>Use any automated system to access the Site in a manner that sends more request messages to our servers than a human can reasonably produce</li>
          </ul>
        </>
      ),
    },
    {
      id: 'contributions',
      title: locale === 'en' ? 'Contributions and Compliance' :
             locale === 'fr' ? 'Contributions et conformité' :
             'Kontribisyon ak Konformite',
      level: 1,
      needsReview: true, // [COUNSEL TO REVIEW] example
      content: (
        <>
          <p>
            If you choose to make a contribution through the Site, you acknowledge and agree that:
          </p>
          <ol>
            <li>
              <strong>Your contribution is voluntary.</strong> You are not required to make a contribution 
              to use any non-contribution features of the Site.
            </li>
            <li>
              <strong>Contributions are subject to legal limits.</strong> You represent and warrant that 
              your contribution complies with all applicable election laws, including contribution limits 
              and eligibility requirements.
            </li>
            <li>
              <strong>Contributions may not be tax-deductible.</strong> Political contributions are generally 
              not tax-deductible. Consult your tax advisor.
            </li>
            <li>
              <strong>Refunds are governed by our Refund Policy.</strong> See our{' '}
              <a href={`/${locale}/refund-policy`}>Refund Policy</a> for details.
            </li>
          </ol>
          
          <LegalCallout type="warning">
            <p>
              <strong>[COUNSEL TO REVIEW]</strong> This section requires review of Haitian election law 
              contribution limits, eligibility requirements, and disclosure obligations.
            </p>
          </LegalCallout>
        </>
      ),
    },
    {
      id: 'intellectual-property',
      title: locale === 'en' ? 'Intellectual Property' :
             locale === 'fr' ? 'Propriété intellectuelle' :
             'Pwopriyete Entelektyèl',
      level: 1,
      content: (
        <>
          <p>
            The Site and its entire contents, features, and functionality (including but not limited to 
            all information, software, text, displays, images, video, and audio, and the design, selection, 
            and arrangement thereof) are owned by the Site operators, its licensors, or other providers of 
            such material and are protected by copyright, trademark, patent, trade secret, and other 
            intellectual property or proprietary rights laws.
          </p>
          <p>
            You may not reproduce, distribute, modify, create derivative works of, publicly display, 
            publicly perform, republish, download, store, or transmit any of the material on our Site, 
            except as follows:
          </p>
          <ul>
            <li>Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials</li>
            <li>You may store files that are automatically cached by your web browser for display enhancement purposes</li>
            <li>You may print or download one copy of a reasonable number of pages of the Site for your own personal, non-commercial use</li>
          </ul>
        </>
      ),
    },
    {
      id: 'disclaimers',
      title: locale === 'en' ? 'Disclaimers and Limitations of Liability' :
             locale === 'fr' ? 'Dénis de responsabilité et limitations de responsabilité' :
             'Deklarasyon ak Limitasyon Responsablite',
      level: 1,
      content: (
        <>
          <p>
            THE SITE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, 
            EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, 
            FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
          <p>
            WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE 
            CORRECTED, OR THAT THE SITE OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF VIRUSES OR 
            OTHER HARMFUL COMPONENTS.
          </p>
          
          <LegalCallout type="important">
            <p>
              <strong>Limitation of Liability:</strong> IN NO EVENT SHALL THE SITE OPERATORS, NOR THEIR 
              DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS 
              OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO 
              OR USE OF OR INABILITY TO ACCESS OR USE THE SITE.
            </p>
          </LegalCallout>
        </>
      ),
    },
    {
      id: 'privacy',
      title: locale === 'en' ? 'Privacy' :
             locale === 'fr' ? 'Confidentialité' :
             'Konfidansyalite',
      level: 1,
      content: (
        <>
          <p>
            Your use of the Site is also governed by our Privacy Policy. Please review our{' '}
            <a href={`/${locale}/privacy`}>Privacy Policy</a> to understand our practices regarding 
            your personal information.
          </p>
        </>
      ),
    },
    {
      id: 'changes',
      title: locale === 'en' ? 'Changes to Terms' :
             locale === 'fr' ? 'Modifications des conditions' :
             'Chanjman nan Kondisyon yo',
      level: 1,
      content: (
        <>
          <p>
            We reserve the right to modify these Terms at any time. We will provide notice of material 
            changes by posting the updated Terms on the Site with a new "Last Updated" date.
          </p>
          <p>
            Your continued use of the Site after any such changes constitutes your acceptance of the 
            new Terms. If you do not agree to the modified Terms, you must stop using the Site.
          </p>
        </>
      ),
    },
    {
      id: 'governing-law',
      title: locale === 'en' ? 'Governing Law and Jurisdiction' :
             locale === 'fr' ? 'Droit applicable et juridiction' :
             'Lwa ki Gouvène ak Jiridiksyon',
      level: 1,
      needsReview: true, // [COUNSEL TO REVIEW] - jurisdiction TBD
      content: (
        <>
          <p>
            <strong>[COUNSEL TO REVIEW]</strong> These Terms shall be governed by and construed in 
            accordance with the laws of [JURISDICTION TO BE DETERMINED], without regard to its conflict 
            of law provisions.
          </p>
          <p>
            Any legal action or proceeding arising under these Terms will be brought exclusively in the 
            courts located in [JURISDICTION TO BE DETERMINED], and the parties irrevocably consent to 
            personal jurisdiction and venue therein.
          </p>
        </>
      ),
    },
    {
      id: 'contact',
      title: locale === 'en' ? 'Contact Information' :
             locale === 'fr' ? 'Informations de contact' :
             'Enfòmasyon Kontak',
      level: 1,
      content: (
        <>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:support@diaspora4bellefleur.example">support@diaspora4bellefleur.example</a>
          </p>
        </>
      ),
    },
  ]

  // Related documents
  const relatedDocuments = [
    {
      href: `/${locale}/privacy`,
      title: locale === 'en' ? 'Privacy Policy' :
             locale === 'fr' ? 'Politique de confidentialité' :
             'Règleman sou Vi Prive',
      description: locale === 'en' ? 'How we collect and use your personal information' :
                   locale === 'fr' ? 'Comment nous collectons et utilisons vos informations personnelles' :
                   'Kijan nou kolekte epi itilize enfòmasyon pèsonèl ou',
    },
    {
      href: `/${locale}/refund-policy`,
      title: locale === 'en' ? 'Refund Policy' :
             locale === 'fr' ? 'Politique de remboursement' :
             'Règleman Ranbousman',
      description: locale === 'en' ? 'Request a refund for your contribution' :
                   locale === 'fr' ? 'Demander un remboursement pour votre contribution' :
                   'Mande ranbousman pou kontribisyon ou',
    },
    {
      href: `/${locale}/cookies`,
      title: locale === 'en' ? 'Cookie Policy' :
             locale === 'fr' ? 'Politique relative aux cookies' :
             'Règleman Cookie',
      description: locale === 'en' ? 'How we use cookies and tracking technologies' :
                   locale === 'fr' ? 'Comment nous utilisons les cookies et les technologies de suivi' :
                   'Kijan nou itilize cookies ak teknoloji suivi',
    },
  ]

  const title = locale === 'en' ? 'Terms of Service' :
                locale === 'fr' ? 'Conditions d\'utilisation' :
                'Kondisyon Sèvis'

  return (
    <LegalDocument
      title={title}
      locale={locale}
      lastUpdated={lastUpdated}
      approved={approved}
      sections={sections}
      relatedDocuments={relatedDocuments}
    />
  )
}
