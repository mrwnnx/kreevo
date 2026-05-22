'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { renderEmail } from '@/lib/email/render'
import { TEMPLATE_VARIABLES, PREVIEW_GOTRUE } from '@/lib/email/variables'
import { isAuthType, type EmailTemplate, type EmailTemplateType } from '@/lib/email/types'
import { saveTemplate } from '@/app/(admin)/admin/emails/templates/actions'
import { Loader2, Check, Plus, Lock } from 'lucide-react'

const inputCls =
  'w-full h-10 rounded-md border border-input bg-transparent dark:bg-input/30 px-3 text-sm transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'

// Build the live preview HTML: fill our vars with samples, then resolve GoTrue tokens for readability.
function previewHtml(tpl: EmailTemplate): string {
  const vars: Record<string, string> = {}
  for (const v of TEMPLATE_VARIABLES[tpl.type]) {
    if (!v.key.startsWith('.')) vars[v.key] = v.sample
  }
  let html = renderEmail(tpl, { vars })
  html = html.replace(/\{\{\s*(\.[^}]+?)\s*\}\}/g, (m, k: string) => PREVIEW_GOTRUE[k.trim()] ?? m)
  return html
}

export function EmailTemplateEditor({
  initial,
  patConfigured,
}: {
  initial: EmailTemplate[]
  patConfigured: boolean
}) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initial)
  const [active, setActive] = useState<EmailTemplateType>(initial[0]?.type ?? 'confirmation')
  const [saving, startSave] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const tpl = templates.find(t => t.type === active)!
  const auth = isAuthType(tpl.type)
  const preview = useMemo(() => previewHtml(tpl), [tpl])

  function patch(changes: Partial<EmailTemplate>) {
    setTemplates(prev => prev.map(t => (t.type === active ? { ...t, ...changes } : t)))
    setMsg(null)
  }

  function insertVar(key: string) {
    const el = bodyRef.current
    const token = `{{ ${key} }}`
    if (!el) {
      patch({ body: tpl.body + token })
      return
    }
    const start = el.selectionStart ?? tpl.body.length
    const end = el.selectionEnd ?? tpl.body.length
    const next = tpl.body.slice(0, start) + token + tpl.body.slice(end)
    patch({ body: next })
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  function onSave() {
    setMsg(null)
    startSave(async () => {
      const res = await saveTemplate(tpl)
      if (res.error) {
        setMsg({ kind: 'err', text: res.error })
      } else if (res.authSync === 'saved') {
        setMsg({ kind: 'ok', text: 'Enregistré en base. ⚠️ Synchro Supabase non effectuée (PAT non configuré).' })
      } else if (res.authSync === 'synced') {
        setMsg({ kind: 'ok', text: 'Enregistré et synchronisé avec Supabase ✓' })
      } else {
        setMsg({ kind: 'ok', text: 'Enregistré ✓' })
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* type selector */}
      <div className="flex flex-wrap gap-2">
        {templates.map(t => (
          <button
            key={t.type}
            onClick={() => { setActive(t.type); setMsg(null) }}
            className={
              'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ' +
              (t.type === active
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'text-muted-foreground border-border hover:bg-muted/60')
            }
          >
            {t.label}
            {isAuthType(t.type) && <span className="ml-1.5 text-[10px] opacity-60">Auth</span>}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ---- FORM ---- */}
        <div className="space-y-5">
          {/* Banner */}
          <div className="space-y-2">
            <Label>Bannière (image)</Label>
            <ImageUpload
              bucket="email-banners"
              value={tpl.banner_url}
              onChange={url => patch({ banner_url: url })}
              maxSizeMB={5}
              className="aspect-[1120/200] w-full"
            />
            <p className="text-xs text-muted-foreground">Reco ~1120×200 px. Affichée sur toute la largeur, hauteur plafonnée à 100px. Laisser vide = pas de bannière.</p>
            {tpl.banner_url && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Cadrage :</span>
                {([['top', 'Haut'], ['center', 'Centre'], ['bottom', 'Bas']] as const).map(([pos, label]) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => patch({ banner_position: pos })}
                    className={
                      'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ' +
                      ((tpl.banner_position ?? 'center') === pos
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'text-muted-foreground border-border hover:bg-muted/60')
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="t-title">Titre</Label>
            <Input id="t-title" value={tpl.title} onChange={e => patch({ title: e.target.value })} />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="t-body">Corps</Label>
            <textarea
              id="t-body"
              ref={bodyRef}
              value={tpl.body}
              onChange={e => patch({ body: e.target.value })}
              rows={7}
              className={inputCls + ' h-auto py-2.5 leading-relaxed resize-y'}
              placeholder="Une ligne vide = nouveau paragraphe."
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Variables :</span>
              {TEMPLATE_VARIABLES[tpl.type].map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVar(v.key)}
                  title={v.desc}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs font-mono hover:bg-muted/60"
                >
                  <Plus className="size-3" /> {`{{ ${v.key} }}`}
                </button>
              ))}
            </div>
          </div>

          {/* Button */}
          <div className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <Label className="mb-0">Bouton</Label>
              {auth ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="size-3" /> lien verrouillé (lien d'action)
                </span>
              ) : (
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tpl.button_enabled}
                    onChange={e => patch({ button_enabled: e.target.checked })}
                  />
                  Activer
                </label>
              )}
            </div>
            {(auth || tpl.button_enabled) && (
              <div className="space-y-2">
                <Input
                  value={tpl.button_label}
                  onChange={e => patch({ button_label: e.target.value })}
                  placeholder="Libellé du bouton"
                />
                {!auth && (
                  <Input
                    value={tpl.button_url ?? ''}
                    onChange={e => patch({ button_url: e.target.value })}
                    placeholder="https://… (lien du bouton)"
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Label className="mb-0">Footer</Label>
            <Input
              value={tpl.footer_text}
              onChange={e => patch({ footer_text: e.target.value })}
              placeholder="Texte du footer"
            />
            <Input
              value={tpl.footer_link ?? ''}
              onChange={e => patch({ footer_link: e.target.value || null })}
              placeholder="https://… (lien du footer, optionnel)"
            />
          </div>

          {auth && !patConfigured && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Cet email est géré par Supabase. La synchro automatique nécessite la variable d'env
              <code className="mx-1">SUPABASE_MANAGEMENT_PAT</code>. Sans elle, l'enregistrement reste en base mais
              n'est pas poussé vers Supabase.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Enregistrer
            </Button>
            {msg && (
              <span className={'text-sm ' + (msg.kind === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-destructive')}>
                {msg.text}
              </span>
            )}
          </div>
        </div>

        {/* ---- PREVIEW ---- */}
        <div className="lg:sticky lg:top-6">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Aperçu live</p>
          <iframe
            title="Aperçu email"
            srcDoc={preview}
            className="w-full h-[640px] rounded-xl border border-border bg-white"
          />
        </div>
      </div>
    </div>
  )
}
