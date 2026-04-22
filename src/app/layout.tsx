import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google"
import Script from "next/script"
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${spaceMono.variable} h-full antialiased`}>
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
