# Known Issues — gurukul-assesment

**Generated:** 2026-07-06  
**Also see:** `ERRORS_AND_BUGS.md` (repo root)

---

## Critical

### 1. Plain-text admin password comparison

**File:** `src/config/admin.js`  
**Used by:** `src/pages/Admin.jsx`

Admin login queries Supabase with:

```javascript
.eq("password", password)  // plain text match
```

Admin credentials stored/compared in plain text. Separate `adminService.js` implements bcrypt but is **not wired to the login UI**.

**Impact:** Credential exposure via DB leak, network inspection, or localStorage (admin session stores password).

---

### 2. Groq API key exposed in frontend

**File:** `src/lib/grokService.js`  
**Env:** `VITE_GROK_API_KEY`

All Groq calls originate from the browser. Key is visible in bundled JS and DevTools.

**Impact:** Key abuse, quota exhaustion, billing risk.

---

### 3. Permissive Supabase RLS policies

**Files:** `complete_supabase_setup.sql`, `all_in_one_schema_setup.sql`, fix scripts

Most policies: `FOR ALL USING (true)` with anon key.

**Impact:** Anyone with anon key can read/write all tables (students, admins, question banks).

---

### 4. Hardcoded Clerk publishable key fallback

**File:** `src/config/auth.js`

```javascript
const FALLBACK_KEY = 'pk_test_cGxlYXNlZC16ZWJyYS01OC5jbGVyay5hY2NvdW50cy5kZXYk'
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || FALLBACK_KEY
```

Clerk is always enabled unless env explicitly set to empty string (which still may not disable due to fallback).

**Impact:** Unintended auth to dev Clerk instance in production builds.

---

## High

### 5. Dual admin auth implementations

| Path | Method |
|------|--------|
| `config/admin.js` | Plain text — **active** |
| `lib/adminService.js` | bcrypt hash — **inactive for login** |

Risk of confusion during maintenance and security fixes.

---

### 6. RLS 406 errors with Clerk

**Docs:** `RLS_POLICY_FIX_GUIDE.md`, `fix_rls_for_clerk.sql`

Supabase queries return 406 when RLS policies expect `auth.uid()` but Clerk users are not Supabase auth users.

**Example URL from docs:**
`GET .../rest/v1/students?select=*&email=eq....` → 406

---

### 7. QuestionBankManager JSX error (historical)

**File:** `src/components/QuestionBankManager.jsx`  
**Reported:** `ERRORS_AND_BUGS.md`, `test-results/`

"Adjacent JSX elements must be wrapped" at ~line 148.

**Status:** TODO: Verify — may have been fixed since test-results were captured.

---

### 8. Admin session stores password in localStorage

**File:** `src/config/admin.js` — `isAdmin()` re-validates using stored username + password.

**Impact:** XSS could exfiltrate admin credentials.

---

## Medium

### 9. SQL migration script sprawl

40+ scripts with overlapping CREATE/DROP operations. Running wrong script on production can drop data (`complete_supabase_setup.sql` drops `students`).

---

### 10. Naming confusion: grokService uses Groq

File and env vars say "GROK" but API is Groq (`api.groq.com`). Model: `llama3-8b-8192`.

---

### 11. Gurukul data not persisted to Supabase

**File:** `src/components/Gurukul.jsx`

Progress in localStorage only — lost on device change/clear.

---

### 12. ProtectedRoute bypass when Clerk disabled

**File:** `src/components/ProtectedRoute.jsx`

If `CLERK_ENABLED` is false, all protected routes are open without authentication.

---

### 13. Rate limiting is client-side only

**File:** `grokService.js`

3-second delay between requests is trivially bypassed; no server enforcement.

---

## Low

### 14. README is Vite boilerplate

Minimal product documentation at repo root.

---

### 15. Stale test-results committed

`test-results/` may contain paths from another machine (`C:\Users\Microsoft\Desktop\frontend\`).

---

### 16. Duplicate/unused files

- `src/components/Assignment.jsx.new`
- `src/lib/fieldBasedQuestionService_debug.js`
- Root-level SQL files duplicate `src/sql/`

---

### 17. bcryptjs in frontend

`adminService.js` imports bcrypt in browser bundle — unusual for client-side admin creation.

---

## Issue Priority Matrix

| Priority | Count | Action |
|----------|-------|--------|
| Critical | 4 | Block production until mitigated |
| High | 4 | Fix in first maintenance sprint |
| Medium | 5 | Plan for next release |
| Low | 4 | Backlog cleanup |
