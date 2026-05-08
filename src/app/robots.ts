import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/help'],
        disallow: ['/admin', '/api', '/dashboard', '/help/search', '/help/contact'],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
    host: siteUrl(),
  }
}
