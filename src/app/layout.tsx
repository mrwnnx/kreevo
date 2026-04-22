import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google"
import Script from "next/script"
import { buildDesignCSS, FONT_OPTIONS } from "@/lib/design-tokens"
import { getDesignTokens } from "@/lib/design-tokens.server"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "Kreevo — Design Challenges & Leagues",
  description: "Weekly design challenges, AI feedback, and a league system that rewards your progress.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tokens = await getDesignTokens()
  const designCSS = buildDesignCSS(tokens)
  const fontOption = FONT_OPTIONS.find(f => f.value === tokens.font)
  const isCustomFont = tokens.font !== 'Plus Jakarta Sans' && fontOption

  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${spaceMono.variable} h-full antialiased`}>
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
