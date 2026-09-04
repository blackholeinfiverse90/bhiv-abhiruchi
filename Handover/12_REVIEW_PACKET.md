# Review Packet — gurukul-assesment

**Generated:** 2026-07-06  
**Review Time:** < 10 minutes

---

## Entry Points

| File | Purpose |
|------|---------|
| `src/main.jsx` | App bootstrap, Clerk wrapper |
| `src/App.jsx` | All routes |
| `src/lib/supabaseClient.js` | Database client |
| `src/lib/grokService.js` | Groq AI integration |
| `src/lib/scoringService.js` | Assignment evaluation |
| `src/pages/Admin.jsx` | Admin panel |
| `src/pages/Intake.jsx` | Student intake |
| `src/pages/Assignment.jsx` | Field-based assessment |
| `src/sql/complete_supabase_setup.sql` | Base DB schema |

---

## Production URLs

| Surface | URL |
|---------|-----|
| Frontend (Netlify) | TODO: Verify |
| Supabase REST | `https://eboqteuzjxsgeilkjzwd.supabase.co/rest/v1/` — TODO: Verify |
| Groq API | `https://api.groq.com/openai/v1` |

---

## Core Flow

```
Optional Clerk sign-in
  → /intake (dynamic form → students table)
  → /assignment OR /multi-domain-test
  → grokService + scoringService evaluate
  → assignment_attempts saved
  → /dashboard shows stats

Admin: /admin (custom login)
  → manage students, forms, question banks, AI toggle
```

---

## Review Checklist (< 10 min)

- [ ] Read `Handover/01_README.md`
- [ ] `npm install && npm run dev` — app starts on :5173
- [ ] Confirm Supabase env vars set (no console warning)
- [ ] Open `/` — home page loads
- [ ] Open `/admin` — login form appears
- [ ] Skim `Handover/10_Known_Issues.md` (security items)
- [ ] Verify SQL setup guide: `src/sql/SUPABASE_SETUP_GUIDE.md`
- [ ] Check `netlify.toml` for deploy config
- [ ] Run `npx playwright test` (optional smoke)

---

## Review Flags

1. **No backend** — all security depends on Supabase RLS + key hygiene
2. **Plain-text admin auth** — critical security gap
3. **Groq key in frontend** — extractable from bundle
4. **Hardcoded Clerk test key** — may enable unintended auth
5. **40+ SQL scripts** — migration order unclear without Handover/07
6. **No CI/CD** — tests exist but not gated
7. **Production URL undocumented** — TODO: Verify Netlify deployment

---

## Key Verification Queries (Supabase)

| Check | Query | Expected |
|-------|-------|----------|
| Tables exist | `SELECT table_name FROM information_schema.tables WHERE table_schema='public' LIMIT 20` | students, form_configurations, etc. |
| Active form | `SELECT id, is_active FROM form_configurations WHERE is_active=true` | ≥1 row |
| AI settings | `SELECT * FROM ai_settings WHERE setting_key='global_question_generation'` | 1 row |
| Admin exists | `SELECT username FROM admins LIMIT 1` | ≥1 row (for admin login test) |

---

## Security Review Priorities

| # | Issue | Severity |
|---|-------|----------|
| 1 | Plain-text admin passwords | Critical |
| 2 | Permissive RLS (`USING true`) | Critical |
| 3 | VITE_GROK_API_KEY in browser | Critical |
| 4 | Clerk fallback key in source | High |
| 5 | Admin creds in localStorage | High |

---

## Handover Completeness

| Area | Status |
|------|--------|
| Architecture documented | ✅ |
| Env vars documented | ✅ |
| DB schema documented | ✅ |
| Production URL | TODO: Verify |
| Runtime screenshots | Pending — see Screenshots/ |
| Demo video | Pending — see Videos/ |
