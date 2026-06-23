/**
 * Generic site-wide JSON-LD helpers.
 * Mirrors the pattern of `src/lib/help/jsonld.ts`: each helper returns a
 * plain JS object that the page serializes via `JSON.stringify` into a
 * `<script type="application/ld+json">` tag.
 */

import { siteUrl } from '@/lib/site'

type JsonLd = Record<string, unknown>

/**
 * Organization schema — emitted on the landing to feed Knowledge Graph
 * and to attach a canonical logo to brand mentions.
 */
export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kreevo',
    url: siteUrl(),
    logo: siteUrl('/favicon.ico'),
  }
}

/**
 * WebSite schema with a SearchAction that points at the help center search.
 * Enables the Google sitelinks search box for the kreevo.online query.
 */
export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kreevo',
    url: siteUrl(),
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

interface BlogPostingInput {
  title: string
  description: string
  url: string
  image: string | null
  datePublished: string
  dateModified: string
}

/**
 * BlogPosting schema for blog articles. `image` omitted when null.
 * Mirrors the help center `articleSchema` shape (publisher = Kreevo Organization).
 */
export function blogPostingSchema(input: BlogPostingInput): JsonLd {
  const ld: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    url: input.url.startsWith('http') ? input.url : siteUrl(input.url),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    publisher: {
      '@type': 'Organization',
      name: 'Kreevo',
      url: siteUrl(),
      logo: siteUrl('/favicon.ico'),
    },
  }
  if (input.image) ld.image = input.image
  return ld
}

interface ProfilePageInput {
  username: string
  name: string
  avatarUrl: string | null
  jobTitle: string | null
  city: string | null
  country: string | null
  sameAs: string[]
  awards: string[]
}

/**
 * ProfilePage + nested Person for designer pages.
 * Only includes filled fields — keys with empty/null values are omitted.
 */
export function profilePageSchema(input: ProfilePageInput): JsonLd {
  const person: JsonLd = {
    '@type': 'Person',
    name: input.name,
    url: siteUrl(`/u/${input.username}`),
  }

  if (input.avatarUrl) person.image = input.avatarUrl
  if (input.jobTitle) person.jobTitle = input.jobTitle

  if (input.city || input.country) {
    const address: JsonLd = { '@type': 'PostalAddress' }
    if (input.city) address.addressLocality = input.city
    if (input.country) address.addressCountry = input.country
    person.address = address
  }

  if (input.sameAs.length > 0) person.sameAs = input.sameAs
  if (input.awards.length > 0) person.award = input.awards

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: person,
  }
}
