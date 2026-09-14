import { notFound } from 'next/navigation'

/**
 * Ferme un écran d'atelier en production.
 *
 * Six routes d'aperçu (design system, états, modals de dev, previews de
 * ligues et de leaderboard) sont livrées avec l'application : `/hero-preview`
 * était joignable **sans compte**, les autres par n'importe quel utilisateur
 * connecté. Elles restent utiles en local, donc 404 plutôt que suppression.
 *
 * À appeler en PREMIÈRE instruction du composant de page. Dans une page
 * `'use client'` le rendu serveur exécute quand même ce code au premier
 * chargement : le 404 est donc un vrai 404 HTTP, pas seulement un écran.
 *
 * ⚠️ Le garde-fou suit `NODE_ENV`, donc il ferme AUSSI ces écrans sur les
 * déploiements de préversion Vercel (qui construisent en production). Passer
 * à `VERCEL_ENV === 'production'` si on veut les garder ouverts en préversion.
 */
export function devOnly() {
  if (process.env.NODE_ENV === 'production') notFound()
}
