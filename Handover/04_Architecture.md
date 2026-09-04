# Architecture — gurukul-assesment

**Generated:** 2026-07-06

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (Vite / Netlify)                │
│  pages/  components/  lib/*Service.js  config/              │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               ▼                      ▼
    ┌──────────────────┐   ┌──────────────────┐
    │ Supabase Client  │   │ Groq API         │
    │ (PostgreSQL)     │   │ (browser direct) │
    └──────────────────┘   └──────────────────┘
               │
               ▼
    ┌──────────────────┐
    │ Clerk (optional) │
    │ Student auth     │
    └──────────────────┘
```

**No application backend.** All business logic runs in the browser.

---

## Request / Data Flow

### Student intake

```
User → /intake (ProtectedRoute + StudentRedirect)
  → DynamicForm loads active form_configurations
  → User submits → supabase.from('students').upsert(...)
  → Tier assigned (Seed/Tree/Sky) in responses JSONB
```

### Assignment evaluation

```
User → /assignment
  → fieldBasedQuestionService loads question_banks + mappings
  → aiSettingsService checks ai_settings (AI on/off)
  → grokService may generate supplemental questions
  → User submits answers
  → scoringService.evaluateAssignmentAttempt()
      → grokService for AI scoring + feedback
  → Results saved to assignment_attempts + assignment_responses
```

### Multi-domain assessment

```
User → /multi-domain-test
  → DomainSelector (1–13 domains)
  → multiDomainAssessmentService (adaptive difficulty)
  → aiAssistanceDetector (effort/context flags)
  → MultiDomainResults with domain breakdown
```

### Admin panel

```
User → /admin
  → adminAuth.login() queries admins table (plain-text compare in config/admin.js)
  → CRUD students, form builder, question banks
  → QuestionBankManager, CategoryManager, StudentAnalytics
```

---

## Auth Models

| Model | Used for | Implementation |
|-------|----------|----------------|
| **Clerk** | Student routes | `ProtectedRoute.jsx`, `CLERK_PUBLISHABLE_KEY` |
| **Supabase OAuth** | Google sign-in | Documented in README; TODO: Verify active flow in Auth.jsx |
| **Admin custom** | `/admin` | `adminAuth` + localStorage/sessionStorage |

When `CLERK_ENABLED` is false, `ProtectedRoute` passes through without auth.

---

## Core Services

| Service | File | Responsibility |
|---------|------|----------------|
| Supabase client | `supabaseClient.js` | DB connection, table constants |
| Grok (Groq) | `grokService.js` | Question gen, evaluation, feedback |
| Scoring | `scoringService.js` | Multi-criteria assignment scoring |
| Field questions | `fieldBasedQuestionService.js` | Load/filter questions by study field |
| Multi-domain | `multiDomainAssessmentService.js` | 13-domain adaptive assessments |
| AI settings | `aiSettingsService.js` | Global AI toggle (`ai_settings` table) |
| Form config | `formConfigService.js` | Dynamic intake forms |
| Dynamic fields | `dynamicFieldService.js` | Study field management |
| Dynamic categories | `dynamicQuestionCategoryService.js` | Question categories |
| Admin (bcrypt) | `adminService.js` | Admin CRUD with password_hash |
| Admin (legacy) | `config/admin.js` | Plain-text login — **used by Admin.jsx** |
| AI detection | `aiAssistanceDetector.js` | Flags low-effort responses |
| i18n | `i18n.js` | en/hi/mr translations |

---

## Frontend Route Map

Source: `src/App.jsx`

| Path | Component | Wrapper |
|------|-----------|---------|
| `/` | Home | Layout |
| `/sign-in`, `/sign-up` | Auth pages | Layout |
| `/dashboard` | Dashboard | ProtectedRoute |
| `/intake` | Intake | ProtectedRoute + StudentRedirect |
| `/assignment` | Assignment | ProtectedRoute + StudentRedirect |
| `/multi-domain-test` | MultiDomainTest | ProtectedRoute + StudentRedirect |
| `/admin` | Admin | None (own login) |
| `*` | NotFound | Layout |

---

## Gurukul Learning Module

- Component: `src/components/Gurukul.jsx`
- Sample data: `src/data/gurukul.js`
- Progress stored in **localStorage** (not Supabase)
- Tiers: Seed → Tree → Sky
- Accessible via Layout tabs (Students / Gurukul)

---

## State & Storage

| Data | Storage |
|------|---------|
| Student profiles, forms, assignments | Supabase PostgreSQL |
| Admin session | localStorage (`admin`) + sessionStorage (`is_admin`) |
| Gurukul progress | localStorage |
| AI toggle fallback | localStorage (`ai_question_generation_enabled`) |
| Clerk session | Clerk-managed |

---

## External API: Groq

| Property | Value |
|----------|-------|
| Base URL | `https://api.groq.com/openai/v1` |
| Model | `llama3-8b-8192` |
| Auth | Bearer `VITE_GROK_API_KEY` |
| Rate limiting | 3s min between requests + exponential backoff |

> File named `grokService.js` but uses **Groq**, not xAI Grok.

---

## Security Architecture (Current State)

| Area | Status |
|------|--------|
| RLS on Supabase tables | Enabled, mostly permissive (`USING (true)`) |
| Admin passwords | Plain-text compare in active login path |
| API keys | Groq + Supabase anon key in frontend bundle |
| Clerk | Hardcoded test key fallback in `auth.js` |

See `10_Known_Issues.md` for remediation priorities.
