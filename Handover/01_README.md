# Gurukul Assessment — Exit Handover README

**Document Version:** 1.0  
**Generated:** 2026-07-06  
**Repository:** gurukul-assesment  
**Product Names:** Gurukul Assessment, Assessment Form, BHIV Gurukul

---

## Product Overview

**gurukul-assesment** is a **frontend-only** React SPA for student intake, tiered learning (Seed → Tree → Sky), field-based and multi-domain assessments, and an admin panel. All persistent data lives in **Supabase (PostgreSQL)**; AI features call **Groq** directly from the browser.

There is **no custom backend server** in this repository.

---

## Purpose

Provide a platform that:

- Collects student intake via dynamic forms (`/intake`)
- Runs assignments and 13-domain multi-select assessments (`/assignment`, `/multi-domain-test`)
- Stores results in Supabase (`students`, `assignment_attempts`, etc.)
- Lets admins manage students, forms, question banks, and AI settings (`/admin`)
- Optionally gates student routes with **Clerk** auth
- Generates AI questions and feedback via **Groq** (`grokService.js`)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, React Router 6 |
| **Database** | Supabase (PostgreSQL) — client SDK only |
| **Auth** | Clerk (optional), Supabase OAuth (Google), custom admin login |
| **AI** | Groq API (`llama3-8b-8192`) via `VITE_GROK_API_KEY` |
| **Deployment** | Netlify (`netlify.toml`) — TODO: Verify production URL |
| **Testing** | Playwright (`tests/`) |

---

## Repository Information

| Item | Value |
|------|-------|
| **Repository Name** | gurukul-assesment |
| **npm package name** | assesment-form |
| **Remote URL** | https://github.com/blackholeinfiverse64/gurukul-assesment.git |
| **Main Branch** | `main` |
| **App root** | Repository root (single SPA) |

---

## Production URLs

| Service | URL | Source |
|---------|-----|--------|
| Frontend (Netlify) | TODO: Verify | `netlify.toml` present; no URL in repo |
| Supabase project | `https://eboqteuzjxsgeilkjzwd.supabase.co` | `RLS_POLICY_FIX_GUIDE.md` — TODO: Verify active project |
| Groq API | `https://api.groq.com/openai/v1` | `src/lib/grokService.js` |

---

## Build & Run

```bash
npm install
cp .env.example .env.local   # set Supabase, Groq, Clerk keys
npm run dev                  # http://localhost:5173
```

### Supabase setup

1. Create a Supabase project
2. Run `src/sql/complete_supabase_setup.sql` (base tables)
3. Run additional scripts as needed (see `07_Database_Details.md`):
   - `create_question_banks_tables.sql`
   - `create_assignment_tables.sql`
   - `setup_ai_settings.sql`
   - `migrate_to_13_domains.sql` + `insert_70_domain_questions.sql` (multi-domain)

### Production build

```bash
npm run build    # output: dist/
npm run preview  # local preview of dist/
```

---

## Application Routes

| Route | Page | Auth |
|-------|------|------|
| `/` | Home | Public |
| `/sign-in`, `/sign-up` | Clerk auth | Public |
| `/dashboard` | Student dashboard | Clerk (if enabled) |
| `/intake` | Student intake form | Clerk + StudentRedirect |
| `/assignment` | Field-based assignment | Clerk + StudentRedirect |
| `/multi-domain-test` | 13-domain assessment | Clerk + StudentRedirect |
| `/admin` | Admin panel | Custom admin login |
| `*` | NotFound | Public |

Source: `src/App.jsx`

---

## Handover Document Index

| # | Document | Purpose |
|---|----------|---------|
| 01 | README (this file) | Overview |
| 02 | Repository_Details | Git, structure, contacts |
| 03 | Deployment_Guide | Netlify + Supabase |
| 04 | Architecture | Data flow, services |
| 05 | Environment_Guide | Env vars |
| 06 | API_Documentation | Supabase + Groq operations |
| 07 | Database_Details | Tables, SQL scripts |
| 08 | Folder_Structure | Directory map |
| 09 | Pending_Work | Incomplete items |
| 10 | Known_Issues | Bugs and risks |
| 11 | Troubleshooting | Common fixes |
| 12 | REVIEW_PACKET | Quick review guide |
| 13 | Runtime_Evidence | What to capture |
| 14 | Testing_Checklist | QA steps |
| 15 | Knowledge_Transfer | Onboarding notes |
| 16 | Ownership_Transfer | Access checklist |
| 17 | Deployment_Checklist | Release steps |
| 18 | Rollback_Guide | Rollback procedures |

---

## Critical Handover Notes

1. **No backend** — RLS and anon key security are critical; current policies are permissive (`USING (true)`).
2. **Admin auth split** — `src/config/admin.js` uses plain-text password comparison; `src/lib/adminService.js` uses bcrypt — inconsistent.
3. **Groq key in frontend** — `VITE_GROK_API_KEY` is exposed to all clients.
4. **Hardcoded Clerk fallback** — `src/config/auth.js` ships a test publishable key.
5. **40+ SQL migration files** — canonical order documented in `07_Database_Details.md`.

---

## Related In-Repo Documentation

| File | Topic |
|------|-------|
| `13_DOMAIN_SYSTEM_README.md` | Multi-domain assessment |
| `src/sql/SUPABASE_SETUP_GUIDE.md` | Database setup |
| `GROK_AI_SETUP_GUIDE.md` | Groq integration |
| `ERRORS_AND_BUGS.md` | Known bugs |
| `SYSTEM_FLOW_DIAGRAM.md` | End-to-end flow |
