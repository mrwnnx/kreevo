<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Les issues et specs vivent en markdown local sous `.scratch/<feature>/`.
Voir `docs/agents/issue-tracker.md`.

### Triage labels

Vocabulaire canonique par défaut : `needs-triage`, `needs-info`,
`ready-for-agent`, `ready-for-human`, `wontfix`.
Voir `docs/agents/triage-labels.md`.

### Domain docs

Single-context : `CONTEXT.md` à la racine + `docs/adr/`.
Voir `docs/agents/domain.md`.
