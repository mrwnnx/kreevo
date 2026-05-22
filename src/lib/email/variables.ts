import { type EmailTemplateType } from './types'

export interface TemplateVar {
  key: string // token inserted as {{ key }}
  desc: string
  sample: string // value used in the live preview
}

// Variables an admin may insert per email type.
// Auth types use GoTrue-imposed dotted variables; app types use our own.
export const TEMPLATE_VARIABLES: Record<EmailTemplateType, TemplateVar[]> = {
  confirmation: [{ key: '.Email', desc: "Email de l'utilisateur", sample: 'toi@exemple.com' }],
  recovery: [{ key: '.Email', desc: "Email de l'utilisateur", sample: 'toi@exemple.com' }],
  email_change: [
    { key: '.Email', desc: 'Ancienne adresse', sample: 'ancien@exemple.com' },
    { key: '.NewEmail', desc: 'Nouvelle adresse', sample: 'nouveau@exemple.com' },
  ],
  contact_confirmation: [{ key: 'prénom', desc: "Prénom de l'utilisateur", sample: 'Marwen' }],
  broadcast: [
    { key: 'prénom', desc: 'Prénom du destinataire', sample: 'Marwen' },
    { key: 'titre', desc: 'Titre du message', sample: 'Une grande nouvelle' },
    { key: 'message', desc: 'Corps du message', sample: 'Voici le contenu…' },
  ],
}

// Sample values for {{ .GoTrue }} tokens, used only to make the live preview readable.
export const PREVIEW_GOTRUE: Record<string, string> = {
  '.ConfirmationURL': '#',
  '.Email': 'toi@exemple.com',
  '.NewEmail': 'nouveau@exemple.com',
  '.Token': '123456',
  '.SiteURL': 'https://www.kreevo.online',
}
