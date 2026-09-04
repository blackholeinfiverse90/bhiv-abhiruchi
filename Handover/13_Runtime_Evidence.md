# Runtime Evidence — gurukul-assesment

**Generated:** 2026-07-06  
**Purpose:** Checklist of screenshots, logs, and recordings to capture for handover verification

---

## Required Screenshots

Save to `Handover/Screenshots/` with descriptive filenames.

| # | Screenshot | How to capture |
|---|------------|----------------|
| 1 | Home page | Navigate to `/` |
| 2 | Clerk sign-in | Navigate to `/sign-in` (if Clerk enabled) |
| 3 | Intake form | `/intake` with active form loaded |
| 4 | Intake submission success | Toast/confirmation after submit |
| 5 | Assignment in progress | `/assignment` with questions visible |
| 6 | Assignment results | Score breakdown after completion |
| 7 | Multi-domain selector | `/multi-domain-test` domain picker |
| 8 | Multi-domain results | Domain breakdown + AI detection flags |
| 9 | Student dashboard | `/dashboard` with stats |
| 10 | Admin login | `/admin` login form |
| 11 | Admin student list | Admin panel with students |
| 12 | Form builder | Admin → form configuration tab |
| 13 | Question bank manager | Admin → question banks + AI toggle |
| 14 | Gurukul module | Layout → Gurukul tab (Seed/Tree/Sky) |
| 15 | Supabase table data | Supabase dashboard → students table |
| 16 | Netlify deploy | Netlify dashboard showing successful deploy — TODO: Verify site exists |

---

## Required Console / Network Evidence

| # | Evidence | What to show |
|---|----------|--------------|
| 1 | Supabase connected | No "missing URL/key" warning in console |
| 2 | Student upsert | Network: POST/PATCH to `/rest/v1/students` → 201/200 |
| 3 | Assignment save | POST to `/rest/v1/assignment_attempts` → 201 |
| 4 | Groq call | POST to `api.groq.com/openai/v1/chat/completions` → 200 |
| 5 | AI settings read | GET `/rest/v1/ai_settings` → 200 |
| 6 | Admin login | GET `/rest/v1/admins` → 200 (do not capture password values) |

---

## Optional Video Walkthrough

Save to `Handover/Videos/` (see `Videos/README.md`).

Suggested 5–10 minute demo script:

1. Home → sign in (Clerk)
2. Complete intake form
3. Take short assignment (2–3 questions)
4. View dashboard results
5. Admin login → view student → toggle AI setting
6. Brief Gurukul module tour

---

## Build Evidence

```bash
npm run build
# Capture: terminal output showing successful build
# Capture: dist/ folder listing
```

---

## Database Evidence

Run in Supabase SQL Editor and screenshot results:

```sql
-- Setup verification
SELECT 'students' AS tbl, COUNT(*) FROM students
UNION ALL SELECT 'form_configurations', COUNT(*) FROM form_configurations
UNION ALL SELECT 'question_banks', COUNT(*) FROM question_banks
UNION ALL SELECT 'assignment_attempts', COUNT(*) FROM assignment_attempts
UNION ALL SELECT 'ai_settings', COUNT(*) FROM ai_settings;

-- Active form
SELECT id, name, is_active FROM form_configurations WHERE is_active = true;
```

---

## Test Evidence

```bash
npx playwright test
# Capture: test pass/fail summary
# If failures: screenshot error context (do not commit secrets)
```

---

## Environment Evidence (Redacted)

Document which env vars are **set** (not their values):

| Variable | Local | Netlify Prod |
|----------|-------|--------------|
| VITE_SUPABASE_URL | ☐ | ☐ TODO |
| VITE_SUPABASE_ANON_KEY | ☐ | ☐ TODO |
| VITE_GROK_API_KEY | ☐ | ☐ TODO |
| VITE_CLERK_PUBLISHABLE_KEY | ☐ | ☐ TODO |

---

## Evidence Status

| Category | Status |
|----------|--------|
| Screenshots | TODO: Capture before sign-off |
| Videos | TODO: Optional walkthrough |
| Build log | TODO: Capture on handover machine |
| DB queries | TODO: Run against production Supabase |
| Playwright results | TODO: Run fresh (ignore stale test-results/) |
