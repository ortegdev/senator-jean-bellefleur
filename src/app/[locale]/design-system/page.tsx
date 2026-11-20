import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder'
import { Wordmark } from '@/components/brand/Wordmark'
import { AffiliationBadge } from '@/components/brand/AffiliationBadge'
import { CoastlineConstellation, CoastlineLoader } from '@/components/design/CoastlineConstellation'
import { colors, contrastRatios } from '@/lib/design/colors'

export default function DesignSystemPage() {
  const t = useTranslations()

  // Test strings (longest phrases for layout testing)
  const testStrings = {
    ht: 'Inisyativ sipòtè endepandan, pa otorize pa oswa afilye ak kandida a, kanpay li a oswa nenpòt pati',
    fr: "Initiative de soutien indépendante, non autorisée par ou affiliée au candidat, sa campagne ou un parti",
    en: 'Independent supporter initiative, not authorized by or affiliated with the candidate, his campaign or any party',
  }

  return (
    <div className="min-h-screen bg-sandPaper py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <Wordmark variant="lockup" theme="light" className="mb-4" />
          <h1 className="font-display text-5xl font-bold text-ink">Design System</h1>
          <p className="mt-4 max-w-3xl text-lg text-ink-600">
            Living documentation for the Diaspora4Bellefleur visual identity. <br />
            Dignified Optimism, Sea and Salt.
          </p>
        </div>

        {/* Color Palette */}
        <section className="mb-24">
          <SectionHeader
            title="Color Palette"
            description="Brand colors with verified WCAG 2.2 AA contrast ratios"
            showDivider
          />

          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Deep Lagoon */}
            <Card>
              <CardHeader>
                <div className="mb-4 h-24 w-full rounded-lg bg-deepLagoon" />
                <CardTitle>Deep Lagoon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-600">Anchor, trust, depth</p>
                <code className="mt-2 block text-sm font-mono">#0F3D4A</code>
                <div className="mt-4 flex gap-2">
                  {[50, 100, 300, 500, 700, 900].map((shade) => (
                    <div
                      key={shade}
                      className="h-8 w-8 rounded"
                      style={{ backgroundColor: colors.deepLagoon[shade as keyof typeof colors.deepLagoon] }}
                      title={`${shade}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coral */}
            <Card>
              <CardHeader>
                <div className="mb-4 h-24 w-full rounded-lg bg-coral" />
                <CardTitle>Coral</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-600">Primary action, energy</p>
                <code className="mt-2 block text-sm font-mono">#C8432B</code>
                <div className="mt-4 flex gap-2">
                  {[50, 100, 300, 500, 600, 900].map((shade) => (
                    <div
                      key={shade}
                      className="h-8 w-8 rounded"
                      style={{ backgroundColor: colors.coral[shade as keyof typeof colors.coral] }}
                      title={`${shade}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sand Paper */}
            <Card>
              <CardHeader>
                <div className="mb-4 h-24 w-full rounded-lg bg-sandPaper ring-1 ring-inset ring-ink-200" />
                <CardTitle>Sand Paper</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-600">Background, warmth, canvas</p>
                <code className="mt-2 block text-sm font-mono">#FAF6EE</code>
              </CardContent>
            </Card>

            {/* Ink */}
            <Card>
              <CardHeader>
                <div className="mb-4 h-24 w-full rounded-lg bg-ink" />
                <CardTitle>Ink</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-600">Primary text, maximum contrast</p>
                <code className="mt-2 block text-sm font-mono">#0B1D24</code>
              </CardContent>
            </Card>

            {/* Sea Green */}
            <Card>
              <CardHeader>
                <div className="mb-4 h-24 w-full rounded-lg bg-seaGreen" />
                <CardTitle>Sea Green</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-600">Progress, success, growth</p>
                <code className="mt-2 block text-sm font-mono">#1F8A70</code>
              </CardContent>
            </Card>

            {/* Salt Gold */}
            <Card>
              <CardHeader>
                <div className="mb-4 h-24 w-full rounded-lg bg-saltGold" />
                <CardTitle>Salt Gold</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-600">Rare highlight, warning</p>
                <code className="mt-2 block text-sm font-mono">#EFB93F</code>
              </CardContent>
            </Card>
          </div>

          {/* Contrast Ratios */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>WCAG 2.2 Contrast Ratios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                {Object.entries(contrastRatios).map(([pair, ratio]) => (
                  <div key={pair} className="flex justify-between border-b border-ink-100 py-2">
                    <span className="text-ink-600">{pair}:</span>
                    <span className="font-mono font-semibold text-ink">{ratio}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Typography */}
        <section className="mb-24">
          <SectionHeader title="Typography" description="Fraunces (display) + Inter (body/UI)" showDivider />

          <div className="mt-8 space-y-12">
            {/* Type Scale */}
            <Card>
              <CardHeader>
                <CardTitle>Type Scale (Fluid with clamp())</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-ink-600 mb-2">Display 5xl</p>
                  <p className="font-display text-5xl font-bold">Jean Fritznel Bellefleur</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-2">Display 4xl</p>
                  <p className="font-display text-4xl font-bold">À Port-de-Paix, le cœur bat fort</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-2">Display 3xl</p>
                  <p className="font-display text-3xl font-bold">Nord-Ouest 2027</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-2">Display 2xl</p>
                  <p className="font-display text-2xl font-bold">Soutien pour le Sénateur</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-2">Body base (17-18px)</p>
                  <p className="text-base">
                    {testStrings.fr}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-2">Body small</p>
                  <p className="text-sm">{testStrings.ht}</p>
                </div>
              </CardContent>
            </Card>

            {/* Diacritic Test */}
            <Card>
              <CardHeader>
                <CardTitle>Diacritic Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  Lowercase: è ò à â ê î ô û ç œ<br />
                  Uppercase: È Ò À Â Ê Î Ô Û Ç Œ
                </p>
                <p className="mt-4 font-display text-2xl font-bold">
                  À Port-de-Paix, le cœur bat fort
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Components */}
        <section className="mb-24">
          <SectionHeader title="Component Library" description="All variants with accessibility features" showDivider />

          {/* Buttons */}
          <div className="mt-8 space-y-12">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-sm font-medium text-ink-600">Variants</p>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="primary">Primary Button</Button>
                      <Button variant="secondary">Secondary Button</Button>
                      <Button variant="tertiary">Tertiary Button</Button>
                      <Button variant="ghost">Ghost Button</Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-ink-600">Sizes (44px minimum tap target)</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm">Small (36px)</Button>
                      <Button size="md">Medium (44px)</Button>
                      <Button size="lg">Large (52px)</Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-ink-600">States</p>
                    <div className="flex flex-wrap gap-3">
                      <Button disabled>Disabled</Button>
                      <Button loading>Loading</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input label="Email Address" type="email" placeholder="your@email.com" required />
                <Input
                  label="With Error"
                  type="text"
                  error="This field is required"
                  defaultValue="invalid"
                />
                <Input
                  label="With Success"
                  type="text"
                  success="Looks good!"
                  defaultValue="valid@email.com"
                />
                <Input label="Disabled" type="text" disabled defaultValue="Disabled input" />
              </CardContent>
            </Card>

            {/* Image Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Image Placeholder (RULE 6: Complete Without Photo)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <ImagePlaceholder label="Candidate Photo (Pending Approval)" aspectRatio="4:3" size="md" />
                  <ImagePlaceholder label="Event Photo Placeholder" aspectRatio="16:9" size="md" />
                </div>
              </CardContent>
            </Card>

            {/* Affiliation Badge */}
            <Card>
              <CardHeader>
                <CardTitle>Affiliation Badge (RULE 1 & 7)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AffiliationBadge
                  status="INDEPENDENT"
                  text="Independent supporter initiative, not authorized by or affiliated with the candidate, his campaign or any party"
                />
                <AffiliationBadge
                  status="INDEPENDENT"
                  text="Independent"
                  variant="compact"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Coastline Constellation */}
        <section className="mb-24">
          <SectionHeader
            title="Coastline Constellation Motif"
            description="Original graphic linking Port-de-Paix to diaspora cities"
            showDivider
          />

          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Horizontal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-8">
                  <CoastlineConstellation variant="horizontal" opacity={0.3} className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Circular</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center bg-white p-8">
                  <CoastlineConstellation variant="circular" opacity={0.3} className="h-64 w-64" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loading State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <CoastlineLoader />
                  <CoastlineLoader className="scale-150" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Wordmark */}
        <section className="mb-24">
          <SectionHeader title="Wordmark" description="Typographic treatment only" showDivider />

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Full</CardTitle>
              </CardHeader>
              <CardContent>
                <Wordmark variant="full" theme="light" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Short (Mobile)</CardTitle>
              </CardHeader>
              <CardContent>
                <Wordmark variant="short" theme="light" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lockup with Tagline</CardTitle>
              </CardHeader>
              <CardContent>
                <Wordmark variant="lockup" theme="light" />
              </CardContent>
            </Card>

            <Card className="bg-deepLagoon">
              <CardHeader>
                <CardTitle className="text-sandPaper">Dark Theme</CardTitle>
              </CardHeader>
              <CardContent>
                <Wordmark variant="full" theme="dark" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Spacing */}
        <section className="mb-24">
          <SectionHeader title="Spacing Scale" description="Base-4 system with generous whitespace" showDivider />

          <Card className="mt-8">
            <CardContent>
              <div className="space-y-3">
                {[2, 4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 128].map((size) => (
                  <div key={size} className="flex items-center gap-4">
                    <span className="w-16 text-sm text-ink-600">{size}px</span>
                    <div className="h-4 bg-coral" style={{ width: `${size}px` }} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Long Text Testing */}
        <section className="mb-24">
          <SectionHeader
            title="Long Text Testing"
            description="Longest phrases in all locales for layout verification"
            showDivider
          />

          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Haitian Creole</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base">{testStrings.ht}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>French</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base">{testStrings.fr}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>English</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base">{testStrings.en}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Accessibility */}
        <section className="mb-24">
          <SectionHeader
            title="Accessibility Features"
            description="WCAG 2.2 Level AA compliance"
            showDivider
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✅ All contrast ratios documented and verified</p>
                <p>✅ No color-only information</p>
                <p>✅ Text resizable to 200%</p>
                <p>✅ Focus indicators 3px, visible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✅ Keyboard accessible</p>
                <p>✅ Tap targets minimum 44px</p>
                <p>✅ Clear disabled states</p>
                <p>✅ ARIA labels where needed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Motion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✅ Respects prefers-reduced-motion</p>
                <p>✅ No autoplay video</p>
                <p>✅ Pausable animations</p>
                <p>✅ 120-300ms durations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✅ Semantic HTML</p>
                <p>✅ Alt text for images</p>
                <p>✅ Skip links</p>
                <p>✅ Proper heading hierarchy</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-ink-200 pt-8 text-center text-sm text-ink-600">
          <p>Design System v1.0</p>
          <p className="mt-2">Dignified Optimism, Sea and Salt</p>
        </footer>
      </div>
    </div>
  )
}
