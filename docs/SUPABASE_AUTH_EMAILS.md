# Supabase Auth Email Templates — Bilingual (FR/EN)

Templates HTML bilingues pour les emails transactionnels gérés par Supabase Auth.
À coller dans **Supabase Dashboard → Authentication → Email Templates**.

## How language detection works

L'app injecte la langue de l'user dans `raw_user_meta_data.lang` :

- **Au signup** : `signUpWithEmail()` passe `data: { username, full_name, lang }` (voir `src/app/(auth)/actions.ts`)
- **Au changement de langue** : `setLang()` appelle `supabase.auth.updateUser({ data: { lang } })` (voir `src/lib/i18n/actions.ts`)

Les templates utilisent `{{ if eq .Data.lang "en" }}…{{ else }}…{{ end }}` (Go template syntax).
**Default = FR** si `lang` absent (ex: invitations admin sans contexte).

## Variables Supabase disponibles

| Variable | Usage |
|---|---|
| `{{ .ConfirmationURL }}` | Lien de confirmation magic link/recovery/signup/email change |
| `{{ .Token }}` | OTP 6 chiffres |
| `{{ .TokenHash }}` | Token hashé (PKCE) |
| `{{ .SiteURL }}` | URL du site (configurée dans Supabase) |
| `{{ .Email }}` | Email du destinataire |
| `{{ .NewEmail }}` | Nouvel email (template "Change Email Address" uniquement) |
| `{{ .Data.lang }}` | Langue préférée (`fr` ou `en`) — injectée par notre app |
| `{{ .Data.username }}` | Username (signup) |

---

## 1. Confirm signup

**Subject (FR/EN combined)** :
```
{{ if eq .Data.lang "en" }}Confirm your Kreevo account{{ else }}Confirme ton compte Kreevo{{ end }}
```

**Body (HTML)** :
```html
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:auto;color:#0f172a;padding:24px">
  {{ if eq .Data.lang "en" }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Welcome to Kreevo 🎨</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">Confirm your email to activate your account and start your first design challenge.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Confirm my email →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">If the button doesn't work, copy this link into your browser:<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">If you didn't create a Kreevo account, you can ignore this email.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— The Kreevo team</p>
  {{ else }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Bienvenue sur Kreevo 🎨</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">Confirme ton email pour activer ton compte et démarrer ton premier challenge design.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Confirmer mon email →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">Si tu n'as pas créé de compte Kreevo, tu peux ignorer cet email.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— L'équipe Kreevo</p>
  {{ end }}
</div>
```

---

## 2. Reset Password

**Subject** :
```
{{ if eq .Data.lang "en" }}Reset your Kreevo password{{ else }}Réinitialise ton mot de passe Kreevo{{ end }}
```

**Body** :
```html
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:auto;color:#0f172a;padding:24px">
  {{ if eq .Data.lang "en" }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Reset your password 🔑</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">We received a request to reset your password. Click below to choose a new one — this link expires in 1 hour.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Reset my password →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">If the button doesn't work, copy this link into your browser:<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">If you didn't request this, ignore this email — your password won't change.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— The Kreevo team</p>
  {{ else }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Réinitialise ton mot de passe 🔑</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">On a reçu une demande de réinitialisation de ton mot de passe. Clique ci-dessous pour en choisir un nouveau — ce lien expire dans 1 heure.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Réinitialiser mon mot de passe →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">Si tu n'as pas fait cette demande, ignore cet email — ton mot de passe ne changera pas.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— L'équipe Kreevo</p>
  {{ end }}
</div>
```

---

## 3. Magic Link

**Subject** :
```
{{ if eq .Data.lang "en" }}Your Kreevo magic link{{ else }}Ton lien de connexion Kreevo{{ end }}
```

**Body** :
```html
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:auto;color:#0f172a;padding:24px">
  {{ if eq .Data.lang "en" }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Your magic link ✨</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">Click the button below to sign in to Kreevo. This link expires in 1 hour and can only be used once.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Sign in →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">If the button doesn't work, copy this link into your browser:<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">If you didn't request this, ignore this email.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— The Kreevo team</p>
  {{ else }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Ton lien de connexion ✨</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">Clique sur le bouton ci-dessous pour te connecter à Kreevo. Ce lien expire dans 1 heure et ne peut être utilisé qu'une seule fois.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Se connecter →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">Si tu n'as pas fait cette demande, ignore cet email.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— L'équipe Kreevo</p>
  {{ end }}
</div>
```

---

## 4. Change Email Address

**Subject** :
```
{{ if eq .Data.lang "en" }}Confirm your new Kreevo email{{ else }}Confirme ton nouvel email Kreevo{{ end }}
```

**Body** :
```html
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:auto;color:#0f172a;padding:24px">
  {{ if eq .Data.lang "en" }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Confirm your new email 📧</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">You requested to change your Kreevo email from <b>{{ .Email }}</b> to <b>{{ .NewEmail }}</b>. Confirm this change to apply it.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Confirm new email →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">If the button doesn't work, copy this link into your browser:<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">If you didn't request this change, ignore this email and consider changing your password.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— The Kreevo team</p>
  {{ else }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Confirme ton nouvel email 📧</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">Tu as demandé à changer ton email Kreevo de <b>{{ .Email }}</b> à <b>{{ .NewEmail }}</b>. Confirme ce changement pour l'appliquer.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Confirmer le nouvel email →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">Si tu n'as pas demandé ce changement, ignore cet email et envisage de changer ton mot de passe.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— L'équipe Kreevo</p>
  {{ end }}
</div>
```

---

## 5. Invite User (admin → user)

**Subject** :
```
{{ if eq .Data.lang "en" }}You've been invited to Kreevo{{ else }}Tu es invité sur Kreevo{{ end }}
```

**Body** :
```html
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:auto;color:#0f172a;padding:24px">
  {{ if eq .Data.lang "en" }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">You're invited to Kreevo 🎨</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">An admin invited you to join Kreevo — the design arena where MENA designers compete, get AI feedback, and climb leagues from Stone to Legend.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Accept invitation →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">If the button doesn't work, copy this link into your browser:<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">— The Kreevo team</p>
  {{ else }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Tu es invité sur Kreevo 🎨</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">Un admin t'a invité à rejoindre Kreevo — l'arène design où les designers MENA s'affrontent, reçoivent du feedback IA, et grimpent les ligues de Stone à Legend.</p>
    <p style="margin:32px 0">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7c3aed;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;text-decoration:none">Accepter l'invitation →</a>
    </p>
    <p style="font-size:13px;color:#64748b;line-height:1.6">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><a href="{{ .ConfirmationURL }}" style="color:#7c3aed;word-break:break-all">{{ .ConfirmationURL }}</a></p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">— L'équipe Kreevo</p>
  {{ end }}
</div>
```

---

## 6. Reauthentication (sensitive action verification)

**Subject** :
```
{{ if eq .Data.lang "en" }}Your Kreevo verification code{{ else }}Ton code de vérification Kreevo{{ end }}
```

**Body** :
```html
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:auto;color:#0f172a;padding:24px">
  {{ if eq .Data.lang "en" }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Verification code 🔐</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">Use this 6-digit code to confirm a sensitive action on your account. It expires in 5 minutes.</p>
    <p style="margin:32px 0;text-align:center">
      <span style="display:inline-block;background:#f1f5f9;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;font-weight:700;font-size:32px;letter-spacing:0.4em;padding:16px 32px;border-radius:12px">{{ .Token }}</span>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">If you didn't request this code, ignore this email and consider changing your password.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— The Kreevo team</p>
  {{ else }}
    <h2 style="font-size:22px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em">Code de vérification 🔐</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155">Utilise ce code à 6 chiffres pour confirmer une action sensible sur ton compte. Il expire dans 5 minutes.</p>
    <p style="margin:32px 0;text-align:center">
      <span style="display:inline-block;background:#f1f5f9;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;font-weight:700;font-size:32px;letter-spacing:0.4em;padding:16px 32px;border-radius:12px">{{ .Token }}</span>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
    <p style="font-size:12px;color:#94a3b8">Si tu n'as pas demandé ce code, ignore cet email et envisage de changer ton mot de passe.</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:16px">— L'équipe Kreevo</p>
  {{ end }}
</div>
```

---

## Deployment checklist

- [ ] Open **Supabase Dashboard → Authentication → Email Templates**
- [ ] For each of the 6 templates: paste the **Subject** + **Body (HTML)** above
- [ ] Save each template
- [ ] Test by triggering each flow:
  - [ ] Signup (`/signup`) — Confirm signup email
  - [ ] Forgot password — Reset Password email
  - [ ] Magic link (if enabled) — Magic Link email
  - [ ] Change email in account settings — Change Email Address
  - [ ] Admin invite a user — Invite User
  - [ ] Sensitive action (e.g. delete account) — Reauthentication

## Notes

- **Default lang = FR** : if `.Data.lang` is missing or anything other than `"en"`, the FR branch is rendered.
- **Existing users** before this deploy won't have `lang` in their metadata until they change language once via the LangSwitcher (which now syncs to auth metadata) → they'll get FR emails until then.
- **Brand color** used: `#7c3aed` (violet-600). Change globally if you adjust the design system.
- The variables `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .ConfirmationURL }}`, `{{ .Token }}` are auto-filled by Supabase.
