/**
 * Contact page — form to reach support.
 * POST /api/help/contact → 1 email to support (support@kreevo.online).
 */

import type { Metadata } from 'next'
import { Mail, Clock, ShieldCheck } from 'lucide-react'
import { getHelpLang, HELP_T } from '@/lib/help/lang'
import { HelpBreadcrumb } from '@/components/help/HelpBreadcrumb'
import { ContactForm } from '@/components/help/ContactForm'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getHelpLang()
  const t = HELP_T[lang]
  return {
    title: `${t.contactCta} — ${t.siteName}`,
    description: t.contactBody,
    robots: { index: false, follow: true },
  }
}

export const dynamic = 'force-dynamic'

export default async function HelpContactPage() {
  const lang = await getHelpLang()
  const t = HELP_T[lang]

  const reassurance = lang === 'en'
    ? [
        { icon: Clock, label: 'Reply within 24 hours' },
        { icon: Mail, label: 'No spam, no follow-ups' },
        { icon: ShieldCheck, label: 'Your data stays private' },
      ]
    : [
        { icon: Clock, label: 'Réponse sous 24 heures' },
        { icon: Mail, label: 'Pas de spam, pas de relance' },
        { icon: ShieldCheck, label: 'Tes données restent privées' },
      ]

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <HelpBreadcrumb
        items={[
          { label: t.breadcrumbHome, href: '/help' },
          { label: t.contactCta },
        ]}
      />

      <header className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
          {t.contactTitle}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t.contactBody}
        </p>
      </header>

      {/* Reassurance row */}
      <div className="grid sm:grid-cols-3 gap-3">
        {reassurance.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3"
          >
            <Icon className="size-4 text-primary shrink-0" strokeWidth={2.4} />
            <span className="text-xs font-medium text-foreground leading-snug">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="rounded-[24px] border border-border bg-card p-6 sm:p-8">
        <ContactForm lang={lang} />
      </div>
    </div>
  )
}
