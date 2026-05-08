/**
 * JSON-LD helpers for the help center.
 */

import { siteUrl } from '@/lib/site'

interface BreadcrumbItem {
  name: string
  url?: string
}

export function breadcrumbList(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url.startsWith('http') ? item.url : siteUrl(item.url) } : {}),
    })),
  }
}

export function websiteWithSearch(name: string, langCode: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: siteUrl('/help'),
    inLanguage: langCode,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl('/help/search')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function articleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  langCode,
}: {
  title: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  langCode: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: url.startsWith('http') ? url : siteUrl(url),
    datePublished,
    dateModified,
    inLanguage: langCode,
    publisher: {
      '@type': 'Organization',
      name: 'Kreevo',
      url: siteUrl(),
    },
  }
}

/**
 * Detect H2 questions in markdown to optionally emit FAQPage schema.
 * Returns null if the article doesn't look Q&A.
 *
 * Heuristic: at least 2 H2 headings ending with `?` and followed by a paragraph.
 */
export function maybeFaqSchema(markdown: string): Record<string, unknown> | null {
  // Split by H2 headings
  const sections = markdown.split(/\n##\s+/).slice(1)
  const qa: { q: string; a: string }[] = []
  for (const sec of sections) {
    const newlineIdx = sec.indexOf('\n')
    if (newlineIdx === -1) continue
    const q = sec.slice(0, newlineIdx).trim()
    const a = sec.slice(newlineIdx + 1).trim()
    if (q.endsWith('?') && a.length > 20) {
      qa.push({ q, a: a.replace(/[#*_`>[\]()]/g, '').replace(/\s+/g, ' ').slice(0, 1000) })
    }
  }
  if (qa.length < 2) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}
