import { randomBytes } from 'crypto'

/**
 * Jeton imprévisible du lien privé d'un brief (`/brief/<token>`). 24 octets
 * aléatoires en base64url — jamais un identifiant séquentiel ni un hash du
 * titre. Partagé par `saveBrief` (passage public→privé) et la route de
 * régénération `/api/briefs/[id]/token`.
 */
export function generateBriefAccessToken(): string {
  return randomBytes(24).toString('base64url')
}
