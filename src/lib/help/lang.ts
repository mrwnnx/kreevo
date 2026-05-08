import { cookies } from 'next/headers'

export type HelpLang = 'fr' | 'en'

export async function getHelpLang(): Promise<HelpLang> {
  const c = await cookies()
  const v = c.get('lang')?.value
  return v === 'en' ? 'en' : 'fr'
}

export const HELP_T = {
  fr: {
    siteName: 'Centre d\'aide Kreevo',
    heroTitle: 'Comment pouvons-nous vous aider ?',
    heroSubtitle: 'Trouve des réponses sur les challenges, soumissions, abonnements et plus.',
    searchPlaceholder: 'Recherche un article…',
    categoriesTitle: 'Parcourir par catégorie',
    popularTitle: 'Articles populaires',
    contactTitle: 'Tu n\'as pas trouvé ce que tu cherches ?',
    contactBody: 'Notre équipe répond en moins de 24h.',
    contactCta: 'Nous contacter',
    article: 'article',
    articles: 'articles',
    backHome: 'Retour à l\'accueil',
    notFound: 'Aucun article trouvé.',
    helpfulQuestion: 'Cet article a-t-il été utile ?',
    helpfulYes: 'Oui',
    helpfulNo: 'Non',
    relatedTitle: 'Articles liés',
    breadcrumbHome: 'Aide',
    lastUpdated: 'Mis à jour le',
    readMore: 'Lire l\'article →',
  },
  en: {
    siteName: 'Kreevo Help Center',
    heroTitle: 'How can we help?',
    heroSubtitle: 'Find answers about challenges, submissions, subscriptions and more.',
    searchPlaceholder: 'Search articles…',
    categoriesTitle: 'Browse by category',
    popularTitle: 'Popular articles',
    contactTitle: 'Didn\'t find what you were looking for?',
    contactBody: 'Our team replies in under 24 hours.',
    contactCta: 'Contact us',
    article: 'article',
    articles: 'articles',
    backHome: 'Back to home',
    notFound: 'No articles found.',
    helpfulQuestion: 'Was this article helpful?',
    helpfulYes: 'Yes',
    helpfulNo: 'No',
    relatedTitle: 'Related articles',
    breadcrumbHome: 'Help',
    lastUpdated: 'Last updated',
    readMore: 'Read article →',
  },
} as const

export type HelpDictionary = { [K in keyof (typeof HELP_T)['fr']]: string }
