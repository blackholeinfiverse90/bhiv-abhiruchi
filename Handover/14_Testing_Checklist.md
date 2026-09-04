# Testing Checklist — gurukul-assesment

**Generated:** 2026-07-06

---

## Prerequisites

- [ ] Node.js 20+
- [ ] `.env.local` configured (Supabase + Groq + Clerk)
- [ ] Supabase SQL setup completed (see `07_Database_Details.md`)
- [ ] At least one admin row in `admins` table
- [ ] Dev server: `npm run dev`

---

## Smoke Tests (Manual)

### Home & Navigation

- [ ] `/` loads without errors
- [ ] Navigation links work (Home, Dashboard, Intake, Assignment, Admin)
- [ ] Language switcher (en/hi/mr) changes UI text
- [ ] Mobile menu opens/closes
- [ ] 404 page shows for invalid route

### Authentication (Clerk)

- [ ] `/sign-in` renders Clerk component
- [ ] Sign in redirects to intended page
- [ ] `/dashboard` blocked when signed out
- [ ] Sign out works from UserButton
- [ ] With Clerk disabled: protected routes accessible (document behavior)

### Student Intake

- [ ] `/intake` loads dynamic form from `form_configurations`
- [ ] Required field validation works
- [ ] Submit creates/updates row in Supabase `students`
- [ ] StudentRedirect sends new users to intake first
- [ ] Tier field accepts Seed/Tree/Sky

### Assignment

- [ ] `/assignment` loads questions for selected study field
- [ ] AI-generated questions appear when AI enabled
- [ ] AI questions hidden/dimmed when AI disabled
- [ ] Submit triggers scoring (Groq calls in network tab)
- [ ] Results saved to `assignment_attempts` and `assignment_responses`
- [ ] Results page shows score, feedback, category breakdown

### Multi-Domain Assessment

- [ ] `/multi-domain-test` shows DomainSelector
- [ ] Can select 1–13 domains
- [ ] Question difficulty adapts to domain count
- [ ] Results show per-domain breakdown
- [ ] AI assistance detection flags appear (if applicable)

### Dashboard

- [ ] `/dashboard` loads for signed-in user with attempts
- [ ] Recent attempts listed
- [ ] Stats calculated (average score, streaks, etc.)
- [ ] Empty state when no attempts

### Admin Panel

- [ ] `/admin` shows login when not authenticated
- [ ] Valid credentials grant access
- [ ] Invalid credentials show error toast
- [ ] Student list loads from Supabase
- [ ] Add/edit/delete student works
- [ ] Form builder saves to `form_configurations`
- [ ] Question bank CRUD works
- [ ] AI toggle persists to `ai_settings`
- [ ] Category managers load without errors

### Gurukul Module

- [ ] Gurukul tab visible in Layout
- [ ] Seed/Tree/Sky tiers navigable
- [ ] Progress persists in localStorage after refresh

---

## Automated Tests (Playwright)

```bash
npm run dev          # terminal 1
npx playwright test  # terminal 2
```

| Test file | Coverage |
|-----------|----------|
| `tests/ai-toggle.test.js` | AI toggle in Question Bank Manager |
| `tests/ai-settings-service.test.js` | AI settings service persistence |

- [ ] `ai-toggle.test.js` passes
- [ ] `ai-settings-service.test.js` passes

---

## Build Tests

```bash
npm run lint
npm run build
npm run preview
```

- [ ] ESLint passes (or document known warnings)
- [ ] Production build completes without errors
- [ ] Preview serves app correctly

---

## Security Tests

- [ ] Confirm `.env` / `.env.local` not in git
- [ ] Review Supabase RLS policies (document permissiveness)
- [ ] Verify admin password not logged to console
- [ ] Check Groq key not in committed files
- [ ] Test admin session behavior after browser restart

---

## Database Tests

Run in Supabase SQL Editor:

- [ ] `verify_installation.sql` returns success
- [ ] Active form configuration exists
- [ ] `ai_settings` seed row exists
- [ ] Question banks have data (if assignment tested)
- [ ] No orphaned assignment_responses (attempt_id FK valid)

---

## Deployment Tests (Production)

TODO: Verify production URL before running.

- [ ] Production site loads over HTTPS
- [ ] Env vars set in Netlify
- [ ] SPA routing works (refresh on `/admin` doesn't 404)
- [ ] Supabase calls succeed from production origin
- [ ] Clerk production key configured (not test fallback)

---

## Regression Areas (from Known Issues)

- [ ] QuestionBankManager renders without JSX errors
- [ ] No 406 errors on student queries with Clerk
- [ ] Form fields don't duplicate after config edits
- [ ] Groq rate limiting doesn't block normal assignment (small question set)

---

## Sign-off

| Role | Name | Date | Pass/Fail |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Reviewer | | | |
