// Default content per email type — used to seed `email_templates` and as fallback.
import { type EmailTemplate, type EmailTemplateType } from './types'

const HELP_URL = 'https://www.kreevo.online/help'

export const DEFAULT_TEMPLATES: Record<EmailTemplateType, EmailTemplate> = {
  confirmation: {
    type: 'confirmation',
    label: "Confirmation d'inscription",
    banner_url: null,
    banner_position: 'center',
    title: 'Confirme ton inscription',
    body:
      "Bienvenue sur Kreevo 👋\n\n" +
      "On est ravis de t'accueillir. Clique sur le bouton ci-dessous pour activer ton compte " +
      "et commencer à relever des challenges de design.\n\n" +
      'Ce lien expire dans 1 heure.',
    button_enabled: true,
    button_label: 'Confirmer mon compte',
    button_url: null,
    footer_text: "Centre d'aide",
    footer_link: HELP_URL,
  },
  recovery: {
    type: 'recovery',
    label: 'Réinitialisation du mot de passe',
    banner_url: null,
    banner_position: 'center',
    title: 'Réinitialise ton mot de passe',
    body:
      'Tu as demandé à réinitialiser ton mot de passe.\n\n' +
      'Clique sur le bouton ci-dessous pour en choisir un nouveau. ' +
      "Si tu n'es pas à l'origine de cette demande, ignore simplement cet email.\n\n" +
      'Ce lien expire dans 1 heure.',
    button_enabled: true,
    button_label: 'Choisir un nouveau mot de passe',
    button_url: null,
    footer_text: "Centre d'aide",
    footer_link: HELP_URL,
  },
  email_change: {
    type: 'email_change',
    label: "Changement d'adresse email",
    banner_url: null,
    banner_position: 'center',
    title: 'Confirme ta nouvelle adresse',
    body:
      'Tu as demandé à changer l’adresse email de ton compte Kreevo.\n\n' +
      'Clique sur le bouton ci-dessous pour confirmer cette nouvelle adresse.',
    button_enabled: true,
    button_label: 'Confirmer mon adresse',
    button_url: null,
    footer_text: "Centre d'aide",
    footer_link: HELP_URL,
  },
  contact_confirmation: {
    type: 'contact_confirmation',
    label: 'Accusé de réception (formulaire de contact)',
    banner_url: null,
    banner_position: 'center',
    title: 'Ton message est bien reçu',
    body:
      'Salut {{ prénom }},\n\n' +
      "Merci pour ton message — on l'a bien reçu et l'équipe te répondra sous 24 heures.\n\n" +
      'Ton message :\n{{ message }}\n\n' +
      'Besoin d’ajouter quelque chose ? Réponds simplement à cet email.',
    button_enabled: false,
    button_label: '',
    button_url: null,
    footer_text: "Centre d'aide",
    footer_link: HELP_URL,
  },
  broadcast: {
    type: 'broadcast',
    label: 'Message admin (broadcast)',
    banner_url: null,
    banner_position: 'center',
    title: '{{ titre }}',
    body: '{{ message }}',
    button_enabled: false,
    button_label: 'En savoir plus',
    button_url: 'https://www.kreevo.online',
    footer_text: "Centre d'aide",
    footer_link: HELP_URL,
  },
}
