# Pending Work — gurukul-assesment

**Generated:** 2026-07-06  
**Source:** Code review, in-repo docs, test artifacts

---

## High Priority

| # | Item | Details |
|---|------|---------|
| 1 | **Unify admin authentication** | `Admin.jsx` uses `config/admin.js` (plain-text). `adminService.js` has bcrypt path but is unused by login UI. Pick one approach. |
| 2 | **Remove hardcoded Clerk test key** | `src/config/auth.js` fallback enables Clerk even without env var. Remove for production. |
| 3 | **Secure Groq API key** | Move Groq calls to a backend proxy; frontend key is extractable. |
| 4 | **Tighten Supabase RLS** | Current policies use `USING (true)` — overly permissive for anon key. |
| 5 | **Confirm production URL** | `netlify.toml` exists but no deployed URL documented. |
| 6 | **Fix QuestionBankManager JSX** | Documented in `ERRORS_AND_BUGS.md` — verify if still present. |

---

## Medium Priority

| # | Item | Details |
|---|------|---------|
| 7 | **Consolidate SQL migrations** | 40+ scripts with overlap; create single canonical migration path. |
| 8 | **Replace README** | Root README is Vite template stub; needs product documentation. |
| 9 | **Resolve admin env vars** | Docs mention `VITE_ADMIN_USERNAME/PASSWORD` but code queries Supabase `admins` table. |
| 10 | **Clean duplicate files** | `Assignment.jsx.new`, `fieldBasedQuestionService_debug.js`, root SQL duplicates. |
| 11 | **CI/CD pipeline** | No GitHub Actions; add build + Playwright smoke tests. |
| 12 | **Verify Supabase OAuth flow** | Google OAuth documented; confirm `Auth.jsx` implementation status. |
| 13 | **Gurukul Supabase sync** | Gurukul progress is localStorage only — may need cloud persistence. |

---

## Low Priority / Enhancements

| # | Item | Details |
|---|------|---------|
| 14 | **TypeScript migration** | Project is plain JSX; ESLint suggests TS template. |
| 15 | **i18n completion** | Layout has DOM-level translation hack; not all pages use `useI18n`. |
| 16 | **Remove debug/test components** | ApiTest, EvaluationTest, RateLimitTest, DatabaseTest from production nav. |
| 17 | **Package name alignment** | Rename npm package from `assesment-form` to match repo. |
| 18 | **SPA redirect file** | Add `public/_redirects` for Netlify if not configured in dashboard. |
| 19 | **Question usage stats** | `question_usage_stats` table defined but TODO: Verify app writes to it. |
| 20 | **Playwright test coverage** | Only 2 test files; expand to intake, assignment, admin flows. |

---

## Documentation Gaps

| Topic | Status |
|-------|--------|
| Production Netlify URL | TODO: Verify |
| Active Supabase project | Partial (`eboqteuzjxsgeilkjzwd` in docs) |
| Canonical SQL run order | Documented in Handover/07 — needs team confirmation |
| BHIV SSO integration | Not implemented in this repo (separate blackhole_auth product) |

---

## Suggested Next Sprint

1. Fix admin auth (bcrypt + server-side or Edge Function)
2. Deploy to Netlify with production env vars
3. Run full SQL setup on fresh Supabase project
4. Execute Playwright tests + manual QA checklist (`14_Testing_Checklist.md`)
5. Update README with product overview
