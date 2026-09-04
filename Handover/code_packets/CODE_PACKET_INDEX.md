# Code Packet Index — gurukul-assesment

**Generated:** 2026-07-06

---

## Tier 1 — Must Read (Core)

| File | Lines (approx) | Purpose |
|------|----------------|---------|
| `src/main.jsx` | 28 | Bootstrap, Clerk wrapper |
| `src/App.jsx` | 130 | Routes, toast config |
| `src/lib/supabaseClient.js` | 20 | DB client |
| `src/config/auth.js` | 5 | Clerk config + fallback |
| `src/config/admin.js` | 45 | Admin login (plain text) |
| `src/components/ProtectedRoute.jsx` | 18 | Auth gate |

---

## Tier 2 — Business Logic

| File | Purpose |
|------|---------|
| `src/lib/grokService.js` | Groq AI — questions, evaluation, feedback |
| `src/lib/scoringService.js` | Assignment scoring orchestration |
| `src/lib/fieldBasedQuestionService.js` | Question loading by study field |
| `src/lib/multiDomainAssessmentService.js` | 13-domain adaptive assessments |
| `src/lib/aiSettingsService.js` | Global AI toggle |
| `src/lib/aiAssistanceDetector.js` | AI usage detection |
| `src/lib/formConfigService.js` | Dynamic form CRUD |
| `src/lib/dynamicFieldService.js` | Study field management |
| `src/lib/dynamicQuestionCategoryService.js` | Question categories |
| `src/lib/adminService.js` | bcrypt admin CRUD (unused by login UI) |

---

## Tier 3 — Pages

| File | Route | Purpose |
|------|-------|---------|
| `src/pages/Home.jsx` | `/` | Landing |
| `src/pages/Auth.jsx` | `/sign-in`, `/sign-up` | Clerk pages |
| `src/pages/Dashboard.jsx` | `/dashboard` | Student stats |
| `src/pages/Intake.jsx` | `/intake` | Student intake |
| `src/pages/Assignment.jsx` | `/assignment` | Field assessment |
| `src/pages/MultiDomainTest.jsx` | `/multi-domain-test` | Domain assessment |
| `src/pages/Admin.jsx` | `/admin` | Admin panel (~1400 lines) |
| `src/pages/NotFound.jsx` | `*` | 404 |

---

## Tier 4 — Key Components

| File | Purpose |
|------|---------|
| `src/components/Layout.jsx` | Nav, i18n, Gurukul tab |
| `src/components/Gurukul.jsx` | Seed/Tree/Sky module |
| `src/components/DynamicForm.jsx` | Renders intake forms |
| `src/components/FormBuilder.jsx` | Admin form designer |
| `src/components/QuestionBankManager.jsx` | Question CRUD + AI toggle |
| `src/components/DomainSelector.jsx` | Multi-domain picker |
| `src/components/MultiDomainResults.jsx` | Domain result breakdown |
| `src/components/StudentRedirect.jsx` | Student record guard |
| `src/components/StudentAnalytics.jsx` | Admin analytics |

---

## Tier 5 — Data & Config

| File | Purpose |
|------|---------|
| `src/data/assignment.js` | Scoring constants, prompts, categories |
| `src/data/gurukul.js` | Gurukul schema + sample data |
| `src/data/studyFields.js` | Static study field fallback |
| `src/data/questionBanks.js` | Static question fallback |

---

## Tier 6 — Database SQL (Canonical)

| File | Run order |
|------|-----------|
| `src/sql/complete_supabase_setup.sql` | 1 — base |
| `src/sql/create_admins_table.sql` | 2 |
| `src/sql/create_question_banks_tables.sql` | 3 |
| `src/sql/create_assignment_tables.sql` | 4 |
| `src/sql/setup_ai_settings.sql` | 5 |
| `src/sql/migrate_to_13_domains.sql` | 6 (optional) |
| `src/sql/insert_70_domain_questions.sql` | 7 (optional) |
| `src/sql/verify_installation.sql` | Verify |

Alternative base: `src/sql/all_in_one_schema_setup.sql` (idempotent, safer for existing DBs)

---

## Tier 7 — Deployment & Config

| File | Purpose |
|------|---------|
| `netlify.toml` | Netlify build config |
| `vite.config.js` | Vite config |
| `.env.example` | Env template |
| `package.json` | Dependencies, scripts |

---

## Tier 8 — Tests

| File | Purpose |
|------|---------|
| `tests/ai-toggle.test.js` | AI toggle UI test |
| `tests/ai-settings-service.test.js` | AI settings service test |

---

## Debug / Non-Production (Skip unless debugging)

| File | Note |
|------|------|
| `src/lib/fieldBasedQuestionService_debug.js` | Debug variant |
| `src/components/Assignment.jsx.new` | Unmerged alternate |
| `src/components/ApiTest.jsx` | Dev utility |
| `src/components/EvaluationTest.jsx` | Dev utility |
| `src/components/RateLimitTest.jsx` | Dev utility |
| `src/test-domain-system.js` | Domain test helper |

---

## Reading Order for New Developer

```
Day 1: main.jsx → App.jsx → supabaseClient.js → auth.js → admin.js
Day 2: Intake.jsx → DynamicForm.jsx → formConfigService.js
Day 3: Assignment.jsx → fieldBasedQuestionService.js → scoringService.js → grokService.js
Day 4: Admin.jsx → QuestionBankManager.jsx → aiSettingsService.js
Day 5: MultiDomainTest.jsx → multiDomainAssessmentService.js → SQL setup scripts
```
