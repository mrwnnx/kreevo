import { listTemplates } from '@/lib/email/store'
import { DEFAULT_TEMPLATES } from '@/lib/email/defaults'
import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor'
import type { EmailTemplateType } from '@/lib/email/types'

export const dynamic = 'force-dynamic'

// Display order in the editor.
const ORDER: EmailTemplateType[] = [
  'confirmation',
  'recovery',
  'email_change',
  'contact_confirmation',
  'broadcast',
]

export default async function EmailTemplatesPage() {
  const rows = await listTemplates()
  const byType = new Map(rows.map(r => [r.type, r]))
  const templates = ORDER.map(t => byType.get(t) ?? DEFAULT_TEMPLATES[t])
  const patConfigured = !!process.env.SUPABASE_MANAGEMENT_PAT

  return (
    <div className="p-6 max-w-[1100px] mx-auto pb-16 space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Templates email</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Édite le contenu de chaque email. La structure (bannière, titre, corps, bouton, footer) reste fixe et on-brand.
        </p>
      </div>
      <EmailTemplateEditor initial={templates} patConfigured={patConfigured} />
    </div>
  )
}
