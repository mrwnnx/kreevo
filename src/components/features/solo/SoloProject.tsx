'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Lock, Check, Clock, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ---------- options ---------- */
type Opt = { id: string; label: string; emoji?: string; desc?: string; steps?: number; hint?: string; maxOrder?: number; soon?: boolean }

const DOMAINS: Opt[] = [
  { id: 'ux', label: 'UX Design', emoji: '📱', desc: 'Recherche, parcours, wireframes' },
  { id: 'ui', label: 'UI Design', emoji: '🎨', desc: 'Écrans, design system, interfaces' },
  { id: 'graphic', label: 'Graphic Design', emoji: '✏️', desc: 'Identité, logo, print & social' },
  { id: 'dev', label: 'Dev', emoji: '💻', desc: 'Du design au code, intégration front', soon: true },
  { id: 'copywriting', label: 'Copywriting', emoji: '✍️', desc: 'UX writing, contenu, messages', soon: true },
  { id: 'video', label: 'Video editing', emoji: '🎬', desc: 'Montage, motion, reels', soon: true },
]
const SUBS: Record<string, Opt[]> = {
  ux: [
    { id: 'research', label: 'Recherche utilisateur' },
    { id: 'flows', label: 'Parcours & user flows' },
    { id: 'wireframe', label: 'Wireframing' },
    { id: 'ia', label: 'Architecture de l’information' },
    { id: 'usability', label: 'Tests d’utilisabilité' },
  ],
  ui: [
    { id: 'ds', label: 'Design system' },
    { id: 'mobile', label: 'Écrans mobiles' },
    { id: 'dashboard', label: 'Dashboard & data' },
    { id: 'landing', label: 'Landing page' },
    { id: 'dark', label: 'Mode sombre' },
  ],
  graphic: [
    { id: 'brand', label: 'Identité de marque' },
    { id: 'logo', label: 'Logo & logotype' },
    { id: 'poster', label: 'Affiche' },
    { id: 'social', label: 'Réseaux sociaux' },
    { id: 'packaging', label: 'Packaging' },
  ],
}
const LEVELS: Opt[] = [
  { id: 'junior', label: 'Junior', emoji: '🌱', desc: 'Je débute', steps: 3, hint: '3 challenges', maxOrder: 2 },
  { id: 'mid', label: 'Mid-level', emoji: '🚀', desc: 'J’ai de l’expérience', steps: 4, hint: '4 challenges', maxOrder: 4 },
  { id: 'confirme', label: 'Confirmé', emoji: '👑', desc: 'Je maîtrise', steps: 5, hint: '5 challenges', maxOrder: 6 },
]
const DIFF = ['Facile', 'Moyen', 'Soutenu', 'Avancé', 'Expert']
const DOMAIN_EMOJI: Record<string, string> = { ux: '📱', ui: '🎨', graphic: '✏️' }
// Pastel palettes mirrored from the real ChallengeCard (challenges/page.tsx).
const PASTELS: { top: string; pill: string }[] = [
  { top: 'bg-[hsl(263,85%,95%)] dark:bg-[hsl(263,40%,13%)]', pill: 'bg-[hsl(263,70%,86%)] text-[hsl(263,50%,32%)] dark:bg-[hsl(263,40%,24%)] dark:text-[hsl(263,65%,82%)]' },
  { top: 'bg-[hsl(217,91%,95%)] dark:bg-[hsl(217,40%,13%)]', pill: 'bg-[hsl(217,75%,86%)] text-[hsl(217,55%,30%)] dark:bg-[hsl(217,40%,24%)] dark:text-[hsl(217,70%,82%)]' },
  { top: 'bg-[hsl(190,80%,95%)] dark:bg-[hsl(190,40%,13%)]', pill: 'bg-[hsl(190,65%,84%)] text-[hsl(190,55%,28%)] dark:bg-[hsl(190,40%,24%)] dark:text-[hsl(190,65%,80%)]' },
  { top: 'bg-[hsl(25,95%,95%)] dark:bg-[hsl(25,40%,13%)]',   pill: 'bg-[hsl(25,80%,86%)] text-[hsl(25,60%,32%)] dark:bg-[hsl(25,40%,24%)] dark:text-[hsl(25,75%,82%)]' },
  { top: 'bg-[hsl(350,89%,95%)] dark:bg-[hsl(350,40%,13%)]', pill: 'bg-[hsl(350,75%,86%)] text-[hsl(350,55%,34%)] dark:bg-[hsl(350,40%,24%)] dark:text-[hsl(350,70%,82%)]' },
]

export type SoloChallenge = {
  id: string; title: string; brief: string; emoji: string | null
  xp: number | null; days: number | null; slug: string | null; order: number
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function SoloProject({ name, challenges = [] }: { name?: string | null; challenges?: SoloChallenge[] }) {
  const [phase, setPhase] = useState('intro') // intro | domain | sub | level | gen | result
  const [pick, setPick] = useState<{ domain?: Opt; level?: Opt }>({})
  const [subPicks, setSubPicks] = useState<Opt[]>([])
  const [parcours, setParcours] = useState<SoloChallenge[]>([])
  const [started, setStarted] = useState(false)
  const genTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Draw a difficulty-ramped sequence from the real published challenges of the
  // chosen specialty (ux/ui → ux_ui, graphic → graphic), capped by the level's tier.
  function pickParcours(domainId: string, level: Opt): SoloChallenge[] {
    const specSlug = domainId === 'graphic' ? 'graphic' : 'ux_ui'
    const maxOrder = level.maxOrder ?? 8
    const steps = level.steps ?? 3
    const pool = challenges.filter((c) => c.slug === specSlug && c.order <= maxOrder).sort((a, b) => a.order - b.order)
    if (pool.length <= steps) return pool
    const out: SoloChallenge[] = []
    const seen = new Set<string>()
    for (let i = 0; i < steps; i++) {
      let idx = Math.round((i * (pool.length - 1)) / (steps - 1))
      while (seen.has(pool[idx]?.id) && idx < pool.length - 1) idx++
      const c = pool[idx]
      if (c && !seen.has(c.id)) { seen.add(c.id); out.push(c) }
    }
    return out
  }

  const onDomain = (o: Opt) => { setPick((s) => ({ ...s, domain: o })); setPhase('sub') }
  const toggleSub = (o: Opt) => setSubPicks((s) => (s.some((x) => x.id === o.id) ? s.filter((x) => x.id !== o.id) : [...s, o]))
  const onLevel = (o: Opt) => { setPick((s) => ({ ...s, level: o })); setPhase('recap') }
  const generate = () => {
    if (pick.domain && pick.level) setParcours(pickParcours(pick.domain.id, pick.level))
    setPhase('gen')
    if (genTimer.current) clearTimeout(genTimer.current)
    genTimer.current = setTimeout(() => setPhase('result'), reduced() ? 0 : 1900)
  }
  function back() {
    if (phase === 'domain') setPhase('intro')
    else if (phase === 'sub') setPhase('domain')
    else if (phase === 'level') setPhase('sub')
    else if (phase === 'recap') setPhase('level')
  }
  function startExperience() { setPhase('domain') }
  function reset() {
    if (genTimer.current) clearTimeout(genTimer.current)
    setPick({}); setSubPicks([]); setParcours([]); setStarted(false); setPhase('domain')
  }
  useEffect(() => () => { if (genTimer.current) clearTimeout(genTimer.current) }, [])

  /* ---------- step 1 : intro ---------- */
  const renderIntro = () => (
    <div className="solo-intro">
      <p className="solo-eyebrow r0">Exclusivité Pro</p>
      <h1 className="solo-display r1"><span>Solo</span><span className="b">Experience</span></h1>
      <p className="solo-body r2">Solo compose un parcours d’entraînement rien que pour toi. Tu choisis un domaine, une intention et ton niveau — on assemble ensuite une suite de <strong>challenges Kreevo réels</strong>, rangés en montée de difficulté, jusqu’à une <strong>simulation client</strong> au moment de rendre.</p>
      <button className="solo-start r3" onClick={startExperience}>Commencer <ArrowRight size={18} /></button>
    </div>
  )

  /* ---------- choice steps : domain / sub / level ---------- */
  const renderChoiceStep = (p: string) => {
    if (p === 'sub') {
      const opts = SUBS[pick.domain?.id ?? ''] ?? []
      return (
        <div className="solo-step">
          <button className="solo-back" onClick={back}><ArrowLeft size={15} /> Retour</button>
          <p className="solo-eyebrow r0">Focus</p>
          <h2 className="solo-q r1">Sur quoi veux-tu progresser en {pick.domain?.label} ?</h2>
          <p className="solo-qsub r1">Choisis un ou plusieurs focus.</p>
          <div className="solo-choices pills r2">
            {opts.map((o) => {
              const sel = subPicks.some((x) => x.id === o.id)
              return (
                <button key={o.id} className={cn('solo-pill', sel && 'sel')} aria-pressed={sel} onClick={() => toggleSub(o)}>
                  {sel && <Check className="pc" size={14} />}{o.label}
                </button>
              )
            })}
          </div>
          <button className="solo-next r2" disabled={subPicks.length === 0} onClick={() => setPhase('level')}>
            Continuer{subPicks.length > 0 ? ` · ${subPicks.length}` : ''} <ArrowRight size={18} />
          </button>
        </div>
      )
    }
    const meta =
      p === 'domain'
        ? { eyebrow: 'Domaine', heading: name ? `${name}, par quel domaine veux-tu commencer ?` : 'Par quel domaine veux-tu commencer ?', sub: '', opts: DOMAINS, onPick: onDomain }
        : { eyebrow: 'Niveau', heading: 'Et ton niveau aujourd’hui ?', sub: 'Sois honnête — c’est ce qui calibre la difficulté.', opts: LEVELS, onPick: onLevel }
    return (
      <div className="solo-step">
        <button className="solo-back" onClick={back}><ArrowLeft size={15} /> Retour</button>
        <p className="solo-eyebrow r0">{meta.eyebrow}</p>
        <h2 className="solo-q r1">{meta.heading}</h2>
        {meta.sub && <p className="solo-qsub r1">{meta.sub}</p>}
        <div className="solo-choices cards r2">
          {meta.opts.map((o) => (
            <button key={o.id} className={cn('solo-choice', o.soon && 'soon')} disabled={o.soon} onClick={() => meta.onPick(o)}>
              {o.emoji && <span className="ce">{o.emoji}</span>}
              <span className="ct">
                <span className="cl">{o.label}</span>
                {o.desc && <span className="cd">{o.desc}</span>}
              </span>
              {o.soon ? <span className="cs">Soon</span> : o.hint ? <span className="ch">{o.hint}</span> : null}
              {!o.soon && <ArrowRight className="ca" size={18} />}
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ---------- recap (before generating) ---------- */
  const renderRecapScreen = () => {
    const d = pick.domain, l = pick.level
    return (
      <div className="solo-step">
        <button className="solo-back" onClick={back}><ArrowLeft size={15} /> Retour</button>
        <p className="solo-eyebrow r0">Récap</p>
        <h2 className="solo-q r1">{name ? `${name}, on lance ton parcours ?` : 'On lance ton parcours ?'}</h2>
        <p className="solo-qsub r1">Voici ce que tu as choisi.</p>

        <div className="rsec r2">
          <h3 className="rh">{d?.emoji} Domaine</h3>
          <div className="rpills"><span className="rpill dom">{d?.label}</span></div>
        </div>

        <div className="rsec r2">
          <h3 className="rh">🎯 Focus</h3>
          <div className="rpills">
            {subPicks.map((s) => <span key={s.id} className="rpill foc">{s.label}</span>)}
          </div>
        </div>

        <div className="rsec r2">
          <h3 className="rh">{l?.emoji} Niveau</h3>
          <div className="rpills"><span className="rpill lvl">{l?.label} · {l?.steps} challenges</span></div>
        </div>

        <button className="solo-next r3" onClick={generate} disabled={subPicks.length === 0}>Générer mon parcours <Sparkles size={18} /></button>
      </div>
    )
  }

  /* ---------- generating ---------- */
  const renderGenSkeleton = () => {
    const n = pick.level?.steps ?? 3
    return (
      <div className="parcours-row gen" aria-hidden="true">
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="pcard rounded-[28px] border border-border bg-card overflow-hidden p-2">
            <div className="rounded-[20px] p-4 bg-muted/50 flex flex-col gap-4 flex-1">
              <span className="sk" style={{ width: 34, height: 34, borderRadius: 10 }} />
              <span className="sk" style={{ width: '78%', height: 15 }} />
              <div className="flex flex-col gap-1.5">
                <span className="sk" style={{ width: '100%', height: 9 }} />
                <span className="sk" style={{ width: '92%', height: 9 }} />
                <span className="sk" style={{ width: '58%', height: 9 }} />
              </div>
              <span className="sk mt-auto" style={{ width: 72, height: 22, borderRadius: 8 }} />
            </div>
            <div className="flex items-center justify-between mt-2 px-1.5">
              <span className="sk" style={{ width: 54, height: 11 }} />
              <span className="sk" style={{ width: 32, height: 32, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }
  const renderGenScreen = () => (
    <div className="solo-gen">
      <p className="solo-eyebrow r0">Génération</p>
      <h2 className="solo-q r1">Je compose ton parcours<span className="ell">…</span></h2>
      <div className="r2">{renderGenSkeleton()}</div>
    </div>
  )

  /* ---------- result ---------- */
  const renderCards = () => (
    <div className="parcours-row reveal">
      {parcours.map((c, i) => {
        const active = i === 0, last = i === parcours.length - 1
        const st = PASTELS[i % PASTELS.length]
        const cardCls = cn(
          'pcard group relative rounded-[28px] border bg-card overflow-hidden p-2 transition-all',
          active ? 'border-green-400 dark:border-green-600 shadow-sm shadow-green-500/10 hover:shadow-lg' : 'border-border opacity-70',
        )
        const inner = (
          <>
            <span className={cn('pnum', !active && 'lock')}>{active ? i + 1 : <Lock size={13} />}</span>
            <div className={cn('rounded-[20px] p-4 flex flex-col gap-4 flex-1', st.top)}>
              <div>
                <div className="text-3xl mb-4 leading-none">{c.emoji || DOMAIN_EMOJI[pick.domain!.id] || '🎯'}</div>
                <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2">{c.title}</h3>
                <p className="mt-1.5 text-sm text-foreground/70 leading-snug line-clamp-3">{c.brief}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-auto">
                <span className={cn('rounded-lg px-2.5 py-1 text-xs font-semibold', st.pill)}>{DIFF[Math.min(i, DIFF.length - 1)]}</span>
                {last && <span className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-white/70 dark:bg-white/10 text-violet-700 dark:text-violet-300">Simulation client</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                {c.xp != null && c.xp > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 dark:bg-white/10 px-2.5 py-1 font-bold text-foreground shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/xp-flash.svg" alt="" className="size-4" /> {c.xp} XP
                  </span>
                )}
                {c.days != null && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="size-4" /> {c.days} j</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 px-1.5 pb-0.5">
              {active
                ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400"><span className="size-1.5 rounded-full bg-green-500 animate-pulse" /> À faire</span>
                : <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Lock className="size-3" /> Verrouillé</span>}
              <span className={cn('size-8 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                active ? 'border-border text-foreground group-hover:bg-foreground group-hover:text-background' : 'border-border text-muted-foreground')}>
                {active ? <ArrowRight className="size-4" /> : <Lock className="size-4" />}
              </span>
            </div>
          </>
        )
        return active
          ? <Link key={c.id} href={`/dashboard/challenges/${c.id}`} className={cardCls}>{inner}</Link>
          : <div key={c.id} className={cardCls}>{inner}</div>
      })}
    </div>
  )
  const renderResultScreen = () => (
    <div className="solo-result">
      <div className="plan">
        <div className="plan-head r0">
          <span className="k">Ton parcours</span>
          <span className="n">{subPicks.length > 2 ? `${subPicks.length} focus` : subPicks.map((s) => s.label).join(' · ')} · {pick.level!.label} · {parcours.length} étapes</span>
        </div>
        {parcours.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 py-4">Aucun challenge disponible pour cette combinaison pour l’instant.</p>
        ) : renderCards()}
        <div className="sim">
          <span className="k"><Sparkles size={13} /> Simulation client à la soumission</span>
          <h3>Un vrai client, à la dernière étape</h3>
          <p>Quand tu rends l’ultime challenge, un client fictif réagit comme en agence : contraintes serrées, retours francs, parfois un changement de brief de dernière minute. À toi d’ajuster et de défendre tes choix.</p>
        </div>
      </div>
      <div className="cta-sticky">
        <button className="btn btn-primary" disabled={started} onClick={() => setStarted(true)}>
          {started ? <><Check size={18} /> Parcours démarré</> : <>Commencer le parcours <ArrowRight size={18} /></>}
        </button>
        <button className="btn btn-ghost" onClick={reset}><RefreshCw size={16} /> Refaire</button>
      </div>
    </div>
  )

  return (
    <div className={cn('kreevo-solo mx-auto w-full max-w-[680px] px-4 sm:px-6', phase === 'intro' ? '' : 'pt-6 pb-28')}>
      <style>{SOLO_CSS}</style>
      <div key={phase} className="solo-stage">
        {phase === 'intro' ? renderIntro()
          : phase === 'recap' ? renderRecapScreen()
          : phase === 'gen' ? renderGenScreen()
          : phase === 'result' ? renderResultScreen()
          : renderChoiceStep(phase)}
      </div>
    </div>
  )
}

const SOLO_CSS = `
.kreevo-solo{
  /* Refonte « verre » : surfaces translucides + filet #dcdce8 au lieu des
     couleurs opaques, pour laisser passer le fond pastel. Redéfinir ces trois
     tokens suffit — toutes les règles ci-dessous en héritent. */
  --k-card:rgba(255,255,255,.55); --k-ink:var(--foreground);
  --k-ink2:color-mix(in oklch, var(--foreground) 74%, white);
  --k-surface:rgba(255,255,255,.35); --k-mutedfg:var(--muted-foreground); --k-border:#dcdce8;
  --k-acc:var(--xp-from); --k-acc2:var(--xp-to);
  --sh:0 1px 2px rgba(20,20,30,.06); --sh-hover:0 6px 20px rgba(20,20,30,.09);
}

/* Flou d'arrière-plan des surfaces verre (refonte). */
.kreevo-solo .solo-choice,
.kreevo-solo .solo-pill,
.kreevo-solo .btn-ghost,
.kreevo-solo .sim{backdrop-filter:blur(59.18px);-webkit-backdrop-filter:blur(59.18px)}

/* ---- entrance ---- */
@keyframes soloRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes soloBlurIn{from{filter:blur(6px)}to{filter:blur(0)}}
.kreevo-solo .r0{animation:soloRise .55s cubic-bezier(.22,1,.36,1) both}
.kreevo-solo .r1{animation:soloRise .55s cubic-bezier(.22,1,.36,1) 90ms both}
.kreevo-solo .r2{animation:soloRise .55s cubic-bezier(.22,1,.36,1) 200ms both}
.kreevo-solo .r3{animation:soloRise .55s cubic-bezier(.22,1,.36,1) 320ms both}

/* ---- Step 1 : Solo Experience intro ---- */
.kreevo-solo .solo-intro{min-height:74vh;display:flex;flex-direction:column;align-items:flex-start;padding-top:clamp(48px,10vh,120px)}
.kreevo-solo .solo-eyebrow{margin:0;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--k-acc)}
.kreevo-solo .solo-display{margin:20px 0 0;display:flex;flex-direction:column;font-weight:600;letter-spacing:-.04em;line-height:.9;font-size:clamp(3.25rem,11vw,7rem);background:linear-gradient(90deg,var(--xp-from),#a78bfa,var(--xp-to),#f5b8f0,#2563eb,#7dd3fc,var(--xp-to),#a78bfa,var(--xp-from));background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:soloShimmer 12s linear infinite, soloBlurIn .62s ease 90ms both}
.kreevo-solo .solo-display>span{display:block}
.kreevo-solo .solo-display .b{opacity:.9}
.kreevo-solo .solo-body{margin:32px 0 0;max-width:52ch;font-size:17px;font-weight:500;line-height:1.6;color:var(--k-mutedfg)}
.kreevo-solo .solo-body strong{color:var(--k-ink);font-weight:600}
.kreevo-solo .solo-start{margin:40px 0 0;height:56px;padding:0 30px;border:none;border-radius:9999px;display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-family:inherit;font-weight:700;font-size:.9375rem;letter-spacing:-.01em;color:var(--background);background:var(--foreground);box-shadow:0 6px 18px rgba(20,20,30,.18);transition:filter .18s ease,transform .18s ease,opacity .18s ease}
.kreevo-solo .solo-start svg{transition:transform .18s ease}
.kreevo-solo .solo-start:hover{filter:brightness(1.06)}
.kreevo-solo .solo-start:hover svg{transform:translateX(3px)}
.kreevo-solo .solo-start:active{transform:scale(.985)}
.kreevo-solo .solo-start:focus-visible{outline:2px solid var(--xp-from);outline-offset:3px}

/* ---- Choice steps : domain / sub / level ---- */
.kreevo-solo .solo-step{min-height:70vh;display:flex;flex-direction:column;align-items:flex-start;padding-top:clamp(24px,6vh,72px)}
.kreevo-solo .solo-back{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--k-mutedfg);background:none;border:none;cursor:pointer;padding:6px 0;margin:0 0 14px;font-family:inherit}
.kreevo-solo .solo-back:hover{color:var(--k-ink)}
.kreevo-solo .solo-q{margin:14px 0 0;font-size:clamp(1.6rem,4.5vw,2.35rem);font-weight:600;letter-spacing:-.02em;line-height:1.15;color:var(--k-ink);max-width:20ch}
.kreevo-solo .solo-qsub{margin:8px 0 0;font-size:15px;color:var(--k-mutedfg);font-weight:500}
.kreevo-solo .solo-choices{margin-top:28px;width:100%}
.kreevo-solo .solo-choices.cards{display:grid;grid-template-columns:1fr;gap:12px;max-width:640px}
@media (min-width:560px){.kreevo-solo .solo-choices.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
.kreevo-solo .solo-choices.pills{display:flex;flex-wrap:wrap;gap:10px}
.kreevo-solo .solo-choice{position:relative;display:flex;align-items:center;gap:14px;text-align:start;background:var(--k-card);border:1px solid var(--k-border);border-radius:20px;padding:15px 18px;cursor:pointer;font-family:inherit;box-shadow:var(--sh);transition:border-color .18s ease,transform .18s ease,box-shadow .18s ease}
.kreevo-solo .solo-choice:hover{transform:translateY(-2px);border-color:color-mix(in oklch,var(--k-acc) 45%,var(--k-border));box-shadow:var(--sh-hover)}
.kreevo-solo .solo-choice:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in oklch,var(--k-acc) 40%,transparent)}
.kreevo-solo .solo-choice .ce{font-size:26px;line-height:1;flex:0 0 auto}
.kreevo-solo .solo-choice .ct{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.kreevo-solo .solo-choice .cl{font-size:16px;font-weight:700;color:var(--k-ink)}
.kreevo-solo .solo-choice .cd{font-size:13px;font-weight:500;color:var(--k-mutedfg)}
.kreevo-solo .solo-choice .ch{font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--k-acc);flex:0 0 auto}
.kreevo-solo .solo-choice .ca{color:var(--k-mutedfg);flex:0 0 auto;transition:transform .18s ease,color .18s ease}
.kreevo-solo .solo-choice:hover .ca{color:var(--k-ink);transform:translateX(3px)}
.kreevo-solo .solo-choice.soon{cursor:not-allowed;background:var(--k-surface);border-color:transparent;box-shadow:none}
.kreevo-solo .solo-choice.soon:hover{transform:none;border-color:transparent;box-shadow:none}
.kreevo-solo .solo-choice.soon .cl,.kreevo-solo .solo-choice.soon .cd,.kreevo-solo .solo-choice.soon .ce{opacity:.45}
.kreevo-solo .solo-choice .cs{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#2563eb;border-radius:9999px;padding:4px 10px;flex:0 0 auto;box-shadow:0 2px 8px rgba(37,99,235,.3)}
.kreevo-solo .solo-pill{display:inline-flex;align-items:center;gap:6px;background:var(--k-card);border:1px solid var(--k-border);color:var(--k-ink);padding:11px 18px;border-radius:9999px;font-size:14.5px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:var(--sh);transition:border-color .18s ease,transform .18s ease,background .18s ease,color .18s ease}
.kreevo-solo .solo-pill:hover{transform:translateY(-1px);border-color:color-mix(in oklch,var(--k-acc) 45%,var(--k-border))}
.kreevo-solo .solo-pill:focus-visible{outline:none;box-shadow:0 0 0 3px color-mix(in oklch,var(--k-acc) 40%,transparent)}
.kreevo-solo .solo-pill.sel{border-color:var(--k-acc);background:color-mix(in oklch,var(--k-acc) 12%,var(--k-card));color:var(--k-ink)}
.kreevo-solo .solo-pill .pc{color:var(--k-acc);flex:0 0 auto}
.kreevo-solo .solo-next{margin-top:26px;height:50px;padding:0 26px;border:none;border-radius:9999px;display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-family:inherit;font-weight:700;font-size:15px;color:var(--background);background:var(--foreground);box-shadow:0 6px 18px rgba(20,20,30,.18);transition:filter .18s ease,transform .18s ease,opacity .18s ease}
.kreevo-solo .solo-next svg{transition:transform .18s ease}
.kreevo-solo .solo-next:hover{filter:brightness(1.06)}
.kreevo-solo .solo-next:hover svg{transform:translateX(3px)}
.kreevo-solo .solo-next:active{transform:translateY(1px)}
.kreevo-solo .solo-next:disabled{opacity:.4;cursor:default;box-shadow:none;filter:none}
.kreevo-solo .solo-next:focus-visible{outline:2px solid var(--k-acc);outline-offset:3px}

/* ---- Recap (emoji sections + editable pills) ---- */
.kreevo-solo .rsec{margin-top:26px;width:100%}
.kreevo-solo .rh{margin:0;display:flex;align-items:center;gap:9px;font-size:21px;font-weight:600;color:var(--k-ink);letter-spacing:-.01em}
.kreevo-solo .rpills{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.kreevo-solo .rpill{display:inline-flex;align-items:center;gap:8px;border:none;border-radius:9999px;padding:11px 18px;font-size:15px;font-weight:600;font-family:inherit;color:var(--k-ink)}
.kreevo-solo .rpill.dom{background:color-mix(in oklch,var(--xp-from) 22%,var(--card))}
.kreevo-solo .rpill.foc{background:color-mix(in oklch,#22c55e 26%,var(--card))}
.kreevo-solo .rpill.lvl{background:color-mix(in oklch,#f59e0b 26%,var(--card))}

/* ---- Generating ---- */
.kreevo-solo .solo-gen{min-height:70vh;padding-top:clamp(24px,6vh,72px)}
.kreevo-solo .solo-gen .solo-q{margin-top:14px;margin-bottom:28px}
.kreevo-solo .solo-gen .ell{display:inline-block;animation:soloEll 1.2s steps(4,end) infinite;overflow:hidden;vertical-align:bottom;width:1.2ch;white-space:nowrap}
@keyframes soloEll{0%{width:0}100%{width:1.2ch}}

/* ---- Result ---- */
.kreevo-solo .solo-result{padding-top:8px}
.kreevo-solo .plan{padding:8px 0 4px}
.kreevo-solo .plan-head{display:flex;align-items:baseline;gap:8px;padding:4px 4px 14px}
.kreevo-solo .plan-head .k{font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;background:linear-gradient(90deg,var(--k-acc),var(--k-acc2));-webkit-background-clip:text;background-clip:text;color:transparent}
.kreevo-solo .plan-head .n{margin-left:auto;font-size:12px;color:var(--k-mutedfg);font-weight:600;font-variant-numeric:tabular-nums}
.kreevo-solo .parcours-row{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.kreevo-solo .parcours-row::-webkit-scrollbar{display:none}
.kreevo-solo .pcard{flex:0 0 260px;scroll-snap-align:start;display:flex;flex-direction:column}
.kreevo-solo .pnum{position:absolute;top:14px;right:14px;z-index:5;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;color:#fff;background:linear-gradient(150deg,var(--k-acc),var(--k-acc2));box-shadow:0 3px 10px color-mix(in oklch,var(--k-acc) 35%,transparent)}
.kreevo-solo .pnum.lock{background:var(--k-surface);color:var(--k-mutedfg);box-shadow:none}
.kreevo-solo .sk{position:relative;overflow:hidden;display:block;background:var(--k-surface);border-radius:8px}
.kreevo-solo .sk::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,color-mix(in oklch,var(--foreground) 8%,transparent),transparent);animation:soloSk 1.25s ease-in-out infinite}
.kreevo-solo .sim{margin:16px 0 4px;background:color-mix(in oklch,var(--k-acc) 8%,var(--k-card));border:1px solid color-mix(in oklch,var(--k-acc) 24%,var(--k-border));border-radius:24px;padding:20px}
.kreevo-solo .sim .k{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--k-acc);display:inline-flex;gap:6px;align-items:center}
.kreevo-solo .sim h3{margin:8px 0 6px;font-size:17px;font-weight:800;color:var(--k-ink);letter-spacing:-.015em}
.kreevo-solo .sim p{margin:0;font-size:14px;color:var(--k-ink2);line-height:1.55}
.kreevo-solo .cta-sticky{position:sticky;bottom:0;display:flex;gap:10px;padding:14px 0 20px;margin-top:8px;background:linear-gradient(to top,var(--background) 74%,transparent)}
.kreevo-solo .btn{border:none;cursor:pointer;font-weight:700;font-size:15px;padding:0 22px;height:50px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;transition:opacity .16s ease,box-shadow .16s ease,border-color .16s ease,color .16s ease}
.kreevo-solo .btn:active{transform:translateY(1px)}
.kreevo-solo .btn-primary{flex:1;background:var(--foreground);color:var(--background);box-shadow:0 6px 18px rgba(20,20,30,.18)}
.kreevo-solo .btn-primary:hover{opacity:.9}
.kreevo-solo .btn-ghost{flex:0 0 auto;background:var(--k-card);color:var(--k-ink2);border:1px solid var(--k-border)}
.kreevo-solo .btn-ghost:hover{border-color:color-mix(in oklch,var(--k-acc) 45%,var(--k-border));color:var(--k-ink)}

/* ---- card / skeleton motion ---- */
@keyframes soloSk{100%{transform:translateX(100%)}}
@keyframes soloCardDrop{0%{opacity:0;transform:translateY(12px) scale(.985)}70%{opacity:1;transform:translateY(-2px)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes soloChipIn{0%{opacity:0;transform:translateY(8px) scale(.96)}60%{opacity:1;transform:translateY(-1px) scale(1.01)}100%{opacity:1;transform:translateY(0) scale(1)}}
.kreevo-solo .parcours-row.reveal>*{animation:soloCardDrop .4s cubic-bezier(.2,.7,.2,1) both}
.kreevo-solo .parcours-row.reveal>*:nth-child(1){animation-delay:60ms}
.kreevo-solo .parcours-row.reveal>*:nth-child(2){animation-delay:150ms}
.kreevo-solo .parcours-row.reveal>*:nth-child(3){animation-delay:240ms}
.kreevo-solo .parcours-row.reveal>*:nth-child(4){animation-delay:330ms}
.kreevo-solo .parcours-row.reveal>*:nth-child(5){animation-delay:420ms}
.kreevo-solo .parcours-row.gen>*{animation:soloChipIn .34s cubic-bezier(.2,.7,.2,1) both}
.kreevo-solo .parcours-row.gen>*:nth-child(2){animation-delay:110ms}
.kreevo-solo .parcours-row.gen>*:nth-child(3){animation-delay:220ms}
.kreevo-solo .parcours-row.gen>*:nth-child(4){animation-delay:330ms}
.kreevo-solo .parcours-row.gen>*:nth-child(5){animation-delay:440ms}

@media (prefers-reduced-motion: reduce){
  .kreevo-solo *{animation:none !important;transition:none !important}
  .kreevo-solo .r0,.kreevo-solo .r1,.kreevo-solo .r2,.kreevo-solo .r3,.kreevo-solo .parcours-row>*{opacity:1 !important;transform:none !important;filter:none !important}
  .kreevo-solo .sk::after{display:none !important}
  .kreevo-solo .solo-gen .ell{width:auto !important}
}
`
