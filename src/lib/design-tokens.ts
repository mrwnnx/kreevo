// ─── Types ────────────────────────────────────────────────────
export interface ModeTokens {
  '--background':            string
  '--foreground':            string
  '--card':                  string
  '--card-foreground':       string
  '--popover':               string
  '--popover-foreground':    string
  '--primary':               string
  '--primary-foreground':    string
  '--secondary':             string
  '--secondary-foreground':  string
  '--muted':                 string
  '--muted-foreground':      string
  '--accent':                string
  '--accent-foreground':     string
  '--destructive':           string
  '--border':                string
  '--input':                 string
  '--ring':                  string
  '--league-rookie':         string
  '--league-rising':         string
  '--league-pro':            string
  '--league-elite':          string
  '--league-legend':         string
  '--xp-from':               string
  '--xp-to':                 string
}

export interface RadiiTokens {
  button:  string
  card:    string
  input:   string
  badge:   string
  popover: string
}

export interface DesignTokens {
  light:  ModeTokens
  dark:   ModeTokens
  radii:  RadiiTokens
  font:   string
}

// ─── Font options ─────────────────────────────────────────────
export const FONT_OPTIONS = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap' },
  { value: 'Inter',             label: 'Inter',             url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { value: 'DM Sans',           label: 'DM Sans',           url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap' },
  { value: 'Outfit',            label: 'Outfit',            url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap' },
  { value: 'Manrope',           label: 'Manrope',           url: 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap' },
  { value: 'Poppins',           label: 'Poppins',           url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
] as const

// ─── Defaults ─────────────────────────────────────────────────
export const DEFAULT_TOKENS: DesignTokens = {
  light: {
    '--background':           '#ffffff',
    '--foreground':           '#1a1924',
    '--card':                 '#ffffff',
    '--card-foreground':      '#1a1924',
    '--popover':              '#ffffff',
    '--popover-foreground':   '#1a1924',
    '--primary':              '#1a1924',
    '--primary-foreground':   '#ffffff',
    '--secondary':            '#efeff4',
    '--secondary-foreground': '#3d3c4f',
    '--muted':                '#efeff4',
    '--muted-foreground':     '#71717a',
    '--accent':               '#efeff4',
    '--accent-foreground':    '#3d3c4f',
    '--destructive':          '#c0390b',
    '--border':               '#dcdce8',
    '--input':                '#dcdce8',
    '--ring':                 '#1a1924',
    '--league-rookie':        '#6b5a3a',
    '--league-rising':        '#5a5a6e',
    '--league-pro':           '#7a6a1a',
    '--league-elite':         '#1a3a7a',
    '--league-legend':        '#8a2020',
    '--xp-from':              '#6040c0',
    '--xp-to':                '#a050b0',
  },
  dark: {
    '--background':           '#0a0a0a',
    '--foreground':           '#ffffff',
    '--card':                 '#141414',
    '--card-foreground':      '#ffffff',
    '--popover':              '#1c1c1c',
    '--popover-foreground':   '#ffffff',
    '--primary':              '#7c3aed',
    '--primary-foreground':   '#ffffff',
    '--secondary':            '#1c1c1c',
    '--secondary-foreground': '#a1a1aa',
    '--muted':                '#141414',
    '--muted-foreground':     '#71717a',
    '--accent':               '#7c3aed',
    '--accent-foreground':    '#ffffff',
    '--destructive':          '#d04010',
    '--border':               '#1f1f1f',
    '--input':                '#222222',
    '--ring':                 '#7c3aed',
    '--league-rookie':        '#a08060',
    '--league-rising':        '#909099',
    '--league-pro':           '#c0a030',
    '--league-elite':         '#4060c0',
    '--league-legend':        '#c04040',
    '--xp-from':              '#7c3aed',
    '--xp-to':                '#c060d0',
  },
  radii: {
    button:  '9999px',
    card:    '0.75rem',
    input:   '0.5rem',
    badge:   '9999px',
    popover: '0.75rem',
  },
  font:   'Plus Jakarta Sans',
}

// ─── Migrate legacy tokens from DB (radius: string → radii: object) ───────────
export function normalizeTokens(raw: unknown): DesignTokens {
  const t = raw as Record<string, unknown>
  if (!t || !t.light || !t.dark) return DEFAULT_TOKENS
  if (!t.radii && typeof t.radius === 'string') {
    const base = t.radius as string
    return {
      ...(t as unknown as DesignTokens),
      radii: {
        button:  '9999px',
        card:    base,
        input:   base,
        badge:   '9999px',
        popover: base,
      },
    }
  }
  if (!t.radii) return { ...(t as unknown as DesignTokens), radii: DEFAULT_TOKENS.radii }
  return t as unknown as DesignTokens
}

// ─── CSS builder ──────────────────────────────────────────────
export function buildDesignCSS(tokens: DesignTokens): string {
  const safe = tokens ?? DEFAULT_TOKENS
  const toVars = (obj: ModeTokens) =>
    (Object.entries(obj ?? {}) as [string, string][]).map(([k, v]) => `${k}:${v}`).join(';')

  const radii = safe.radii ?? DEFAULT_TOKENS.radii
  const { button, card, input, badge, popover } = radii
  const radiiVars = `--radius-button:${button};--radius-card:${card};--radius-input:${input};--radius-badge:${badge};--radius-popover:${popover};--radius:${card}`
  const fontVar = `--font-space-grotesk:"${tokens.font}",system-ui,sans-serif`

  return [
    `:root{${toVars(safe.light ?? DEFAULT_TOKENS.light)};${radiiVars};${fontVar}}`,
    `.dark{${toVars(safe.dark ?? DEFAULT_TOKENS.dark)};${radiiVars};${fontVar}}`,
  ].join('')
}

