import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import Script from "next/script"
import { buildDesignCSS, FONT_OPTIONS } from "@/lib/design-tokens"
import { getDesignTokens } from "@/lib/design-tokens.server"
import { getLang, dirFor } from "@/lib/i18n/lang"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kreevo.online'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Kreevo — Design Challenges & Leagues",
  description: "Weekly design challenges, AI feedback, and a league system that rewards your progress.",
  twitter: {
    card: 'summary_large_image',
    title: 'Kreevo — Design Challenges & Leagues',
    description: 'Weekly design challenges, AI feedback, and a league system that rewards your progress.',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [tokens, lang] = await Promise.all([getDesignTokens(), getLang()])
  const designCSS = buildDesignCSS(tokens)
  const fontOption = FONT_OPTIONS.find(f => f.value === tokens.font)
  const isCustomFont = tokens.font !== 'Plus Jakarta Sans' && fontOption

  return (
    <html lang={lang} dir={dirFor(lang)} className={`${plusJakartaSans.variable} h-full antialiased`}>
      <head>
        {isCustomFont && (
          <link rel="stylesheet" href={fontOption.url} />
        )}
        <style dangerouslySetInnerHTML={{ __html: designCSS }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');})();` }}
        />
        {children}
      </body>
    </html>
  )
}
