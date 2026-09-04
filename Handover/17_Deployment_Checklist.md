# Deployment Checklist — gurukul-assesment

**Generated:** 2026-07-06

---

## Pre-Deploy

### Code

- [ ] All changes merged to `main`
- [ ] `npm run lint` passes (or warnings documented)
- [ ] `npm run build` succeeds locally
- [ ] No console errors on smoke test (`npm run preview`)
- [ ] Playwright tests pass (optional but recommended)
- [ ] No secrets in committed files

### Database (Supabase)

- [ ] Production Supabase project identified
- [ ] Required SQL scripts applied (see `07_Database_Details.md`)
- [ ] `verify_installation.sql` passes
- [ ] Admin user exists in `admins` table
- [ ] Active `form_configurations` row exists
- [ ] `ai_settings` seed row exists
- [ ] Question banks populated (if assessments required)
- [ ] Database backup taken before schema changes

### Environment

- [ ] `VITE_SUPABASE_URL` — production project URL
- [ ] `VITE_SUPABASE_ANON_KEY` — production anon key
- [ ] `VITE_SUPABASE_TABLE` — `students` (or custom)
- [ ] `VITE_GROK_API_KEY` — production Groq key
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` — live key (`pk_live_...`)
- [ ] Hardcoded Clerk fallback removed from `auth.js` (recommended)

---

## Netlify Deploy

### Setup (first time)

- [ ] Connect GitHub repo to Netlify
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Node version: 20 (`netlify.toml`)
- [ ] Set all `VITE_*` environment variables
- [ ] Configure SPA redirect (`/* /index.html 200`)
- [ ] Custom domain configured — TODO: Verify domain

### Deploy

- [ ] Trigger deploy (push to `main` or manual)
- [ ] Build log shows no errors
- [ ] Deploy preview tested (if PR deploy)
- [ ] Production deploy promoted

---

## Post-Deploy Verification

### Functional

- [ ] Production URL loads — TODO: Verify URL
- [ ] `/` home page OK
- [ ] Clerk sign-in works (production instance)
- [ ] `/intake` form loads and submits
- [ ] `/assignment` completes and saves results
- [ ] `/admin` login works
- [ ] Gurukul tab works

### Technical

- [ ] HTTPS enforced
- [ ] No Supabase connection errors in console
- [ ] Groq API calls return 200
- [ ] SPA routing: refresh on `/admin` works
- [ ] Mobile layout acceptable

### External config

- [ ] Supabase Auth redirect URLs include production domain
- [ ] Clerk allowed origins include production domain
- [ ] Google OAuth redirect URIs updated (if used)

---

## Rollback Readiness

- [ ] Previous Netlify deploy ID noted
- [ ] Supabase backup timestamp recorded
- [ ] Rollback procedure reviewed (`18_Rollback_Guide.md`)

---

## Communication

- [ ] Stakeholders notified of deploy window
- [ ] Known issues communicated (`10_Known_Issues.md` security items)
- [ ] Support contact available during deploy

---

## Deploy Log Template

| Field | Value |
|-------|-------|
| Date | |
| Deployer | |
| Git commit | |
| Netlify deploy ID | |
| Supabase project ref | |
| Env vars changed? | Yes / No |
| SQL migrations run? | Yes / No — list scripts |
| Smoke test result | Pass / Fail |
| Rollback needed? | Yes / No |

---

## Quick Deploy Commands

```bash
# Local verification
npm ci
npm run build
npm run preview

# Git push triggers Netlify (if connected)
git push origin main
```

Manual Netlify CLI (if installed):

```bash
netlify deploy --prod --dir=dist
```

> TODO: Verify Netlify CLI linked to correct site.
