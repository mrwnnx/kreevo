export interface SocialDef {
  key: string
  name: string
  placeholder: string
  iconText: string
  iconBg: string
  iconColor?: string
}

export const SOCIAL_DEFS: Record<string, SocialDef> = {
  behance: {
    key: 'behance',
    name: 'Behance',
    placeholder: 'https://behance.net/username',
    iconText: 'Bē',
    iconBg: '#1769FF',
  },
  dribbble: {
    key: 'dribbble',
    name: 'Dribbble',
    placeholder: 'https://dribbble.com/username',
    iconText: 'Dr',
    iconBg: '#EA4C89',
  },
  linkedin: {
    key: 'linkedin',
    name: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/username',
    iconText: 'in',
    iconBg: '#0A66C2',
  },
  instagram: {
    key: 'instagram',
    name: 'Instagram',
    placeholder: 'https://instagram.com/username',
    iconText: 'Ig',
    iconBg: '#E4405F',
  },
  twitter: {
    key: 'twitter',
    name: 'Twitter / X',
    placeholder: 'https://x.com/username',
    iconText: 'X',
    iconBg: '#000000',
  },
  pinterest: {
    key: 'pinterest',
    name: 'Pinterest',
    placeholder: 'https://pinterest.com/username',
    iconText: 'P',
    iconBg: '#E60023',
  },
  readcv: {
    key: 'readcv',
    name: 'Read.cv',
    placeholder: 'https://read.cv/username',
    iconText: 'rd',
    iconBg: '#000000',
  },
  bento: {
    key: 'bento',
    name: 'Bento',
    placeholder: 'https://bento.me/username',
    iconText: 'B',
    iconBg: '#FFCD00',
    iconColor: '#000000',
  },
  awwwards: {
    key: 'awwwards',
    name: 'Awwwards',
    placeholder: 'https://awwwards.com/@username',
    iconText: 'Aw',
    iconBg: '#000000',
  },
  arena: {
    key: 'arena',
    name: 'Are.na',
    placeholder: 'https://are.na/username',
    iconText: 'a',
    iconBg: '#000000',
  },
  cara: {
    key: 'cara',
    name: 'Cara',
    placeholder: 'https://cara.app/username',
    iconText: 'C',
    iconBg: '#FF6700',
  },
  tumblr: {
    key: 'tumblr',
    name: 'Tumblr',
    placeholder: 'https://username.tumblr.com',
    iconText: 't',
    iconBg: '#36465D',
  },
  github: {
    key: 'github',
    name: 'GitHub',
    placeholder: 'https://github.com/username',
    iconText: 'gh',
    iconBg: '#181717',
  },
  youtube: {
    key: 'youtube',
    name: 'YouTube',
    placeholder: 'https://youtube.com/@username',
    iconText: 'Yt',
    iconBg: '#FF0000',
  },
  tiktok: {
    key: 'tiktok',
    name: 'TikTok',
    placeholder: 'https://tiktok.com/@username',
    iconText: 'Tt',
    iconBg: '#000000',
  },
  website: {
    key: 'website',
    name: 'Personal site',
    placeholder: 'https://yourdomain.com',
    iconText: '🌐',
    iconBg: '#71717A',
  },
}

export const SUGGESTED_BY_SPECIALTY: Record<'ux_ui' | 'graphic', string[]> = {
  ux_ui: [
    'behance',
    'dribbble',
    'linkedin',
    'readcv',
    'bento',
    'awwwards',
    'arena',
    'twitter',
    'github',
    'website',
  ],
  graphic: [
    'behance',
    'dribbble',
    'instagram',
    'linkedin',
    'pinterest',
    'cara',
    'tumblr',
    'youtube',
    'tiktok',
    'awwwards',
    'twitter',
    'website',
  ],
}

export function slugifyPlatform(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32)
}

export function defForKey(key: string): SocialDef {
  return (
    SOCIAL_DEFS[key] ?? {
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      placeholder: 'https://...',
      iconText: key.slice(0, 2),
      iconBg: '#71717A',
    }
  )
}
