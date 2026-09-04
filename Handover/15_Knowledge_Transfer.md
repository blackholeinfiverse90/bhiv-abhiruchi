# Knowledge Transfer — gurukul-assesment

**Generated:** 2026-07-06

---

## What This Product Does

**Gurukul Assessment** is a student assessment platform for the BHIV/Blackhole ecosystem. Students complete intake forms, take field-based or multi-domain assessments with AI-generated feedback, and track progress. Admins manage students, dynamic forms, question banks, and global AI settings.

---

## Key Concepts

### Tiers (Seed → Tree → Sky)

Gurukul learning progression model. Stored on `students.tier` and in Gurukul module localStorage.

### Dynamic Forms

Admin builds intake forms stored as JSONB in `form_configurations`. `DynamicForm.jsx` renders active config on `/intake`.

### Field-Based Assessment

Questions mapped to study fields via `question_banks` + `question_field_mapping`. Student's field of study determines question set.

### 13-Domain System

Multi-select assessment across domains (IoT, Blockchain, AI/ML, etc.). Adaptive difficulty based on how many domains selected. See `13_DOMAIN_SYSTEM_README.md`.

### AI Toggle

Global switch in `ai_settings` table. When off, students see only admin-created questions; Groq generation skipped for questions (but may still run for evaluation/feedback).

---

## Architecture Decisions (Why)

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Frontend-only + Supabase | Fast development, no server ops | Security relies on RLS; API keys exposed |
| Groq from browser | Direct AI without backend | Key extractable; rate limits client-side |
| JSONB for form responses | Flexible dynamic forms | Harder to query/report |
| Clerk optional | SSO for students | Dual auth models (Clerk + admin custom) |
| Many SQL scripts | Iterative feature additions | Migration order confusion |

---

## Code Walkthrough (30 min)

### 1. Bootstrap (5 min)

- `main.jsx` → ClerkProvider → BrowserRouter → App
- `config/auth.js` — Clerk key logic

### 2. Routing (5 min)

- `App.jsx` — all routes and ProtectedRoute wrappers
- `ProtectedRoute.jsx` — Clerk gating
- `StudentRedirect.jsx` — ensures student record before assessment

### 3. Data layer (10 min)

- `supabaseClient.js` — connection
- `formConfigService.js` — intake forms
- `fieldBasedQuestionService.js` — question loading
- `scoringService.js` + `grokService.js` — evaluation pipeline

### 4. Admin (10 min)

- `Admin.jsx` — tabs: students, forms, question banks, analytics
- `QuestionBankManager.jsx` — AI toggle UI
- `config/admin.js` — login (note plain-text issue)

---

## Common Tasks for New Maintainer

### Add a new study field

1. Insert into `study_fields` (admin UI or SQL)
2. Map questions in `question_field_mapping`
3. Update `studyFields.js` if static fallback needed

### Add questions manually

1. Admin → Question Bank Manager → Add question
2. Or run SQL insert into `question_banks`

### Change intake form

1. Admin → Form Builder
2. Save configuration, set as active
3. Test on `/intake`

### Disable AI questions globally

1. Admin → Question Bank Manager → AI toggle OFF
2. Verify `ai_settings.ai_enabled = false`

### Deploy update

1. Merge to `main`
2. Netlify auto-builds (if connected)
3. Verify env vars unchanged
4. Smoke test production

---

## Integration Points

| System | Integration | Status |
|--------|-------------|--------|
| BHIV SSO (blackhole_auth) | Gurukul listed as product | Not wired in this repo |
| Supabase Auth (Google) | Documented in README | TODO: Verify Auth.jsx |
| Clerk | Active for student routes | Optional via env |
| Groq | Direct browser calls | Active |

---

## Documentation Map

| Need | Read |
|------|------|
| DB setup | `src/sql/SUPABASE_SETUP_GUIDE.md` |
| Multi-domain | `13_DOMAIN_SYSTEM_README.md` |
| AI settings | `AI_SETTINGS_SYSTEM.md` |
| Groq setup | `GROK_AI_SETUP_GUIDE.md` |
| System flows | `SYSTEM_FLOW_DIAGRAM.md` |
| Known bugs | `ERRORS_AND_BUGS.md` |
| Admin security | `src/docs/ADMIN_SECURITY_GUIDE.md` |

---

## Questions for Outgoing Team

1. What is the production Netlify URL?
2. Which Supabase project is canonical (is `eboqteuzjxsgeilkjzwd` still active)?
3. Which SQL scripts were run on production DB?
4. Are admin credentials in plain text or bcrypt in production?
5. Is Clerk using test or live keys in production?
6. Who owns Groq billing and quota limits?

---

## Recommended First Week

| Day | Focus |
|-----|-------|
| 1 | Local setup + SQL + smoke test all routes |
| 2 | Review security issues (10_Known_Issues.md) |
| 3 | Admin panel deep dive + form builder |
| 4 | Assignment + scoring + Groq flow |
| 5 | Multi-domain system + deployment verification |
