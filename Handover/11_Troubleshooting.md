# Troubleshooting — gurukul-assesment

**Generated:** 2026-07-06

---

## Startup / Build

### "Supabase URL or anon key is missing"

**Cause:** Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`  
**Fix:**
1. Create `.env.local` from `.env.example`
2. Add Supabase credentials from Dashboard → Settings → API
3. Restart `npm run dev`

---

### Vite build fails on JSX error

**Cause:** Syntax error in component (historically `QuestionBankManager.jsx`)  
**Fix:**
1. Read error overlay for file/line
2. Wrap adjacent JSX elements in fragment `<>...</>`
3. Run `npm run build` to verify

---

### Env vars not updating

**Cause:** Vite caches env at startup  
**Fix:** Stop dev server, edit `.env.local`, restart

---

## Supabase / Database

### "relation does not exist"

**Cause:** SQL setup not run  
**Fix:** Run `src/sql/complete_supabase_setup.sql` in Supabase SQL Editor

---

### 406 Not Acceptable on student queries

**Cause:** RLS policy mismatch with Clerk auth  
**Fix:**
1. Read `RLS_POLICY_FIX_GUIDE.md`
2. Run `fix_rls_for_clerk.sql` or `safe_rls_fix.sql`
3. Verify policy allows anon/authenticated reads needed by app

---

### "permission denied for table"

**Cause:** RLS blocking operation  
**Fix:**
1. Check Supabase Table Editor → RLS policies
2. Confirm anon key matches project
3. Review policy for INSERT/UPDATE on target table

---

### Form not loading on /intake

**Cause:** No active `form_configurations` row  
**Fix:**
```sql
SELECT id, name, is_active FROM form_configurations;
UPDATE form_configurations SET is_active = true WHERE id = 'default_config';
```

---

### Duplicate form fields

**Cause:** Historical form config corruption  
**Fix:** Run `src/sql/fix_form_field_repetition.sql`

---

## Authentication

### Clerk redirect loop

**Cause:** Missing sign-in route or wrong redirect URL  
**Fix:**
1. Confirm `/sign-in` route exists (`App.jsx`)
2. Add production URL to Clerk allowed origins
3. Check `ProtectedRoute` redirectUrl

---

### Dashboard empty / no data

**Cause:** Clerk user not linked to Supabase records  
**Fix:**
1. Complete `/intake` first (StudentRedirect creates student row)
2. Verify `students.user_id` matches Clerk user ID
3. Check `assignment_attempts.user_id` matches

---

### Admin login fails

**Cause:** No admin row or wrong password column  
**Fix:**
```sql
SELECT username, password, password_hash FROM admins;
```
- Active login uses **plain `password` column**
- Insert admin: see `create_admins_table.sql`
- If using bcrypt row only, login will fail — use plain text row or switch to adminService

---

## AI / Groq

### "API key missing" error

**Cause:** `VITE_GROK_API_KEY` not set  
**Fix:** Add key from https://console.groq.com/ to `.env.local`

---

### Groq 429 rate limit

**Cause:** Too many AI evaluation calls  
**Fix:**
1. Wait and retry (grokService has backoff)
2. Reduce questions per assignment
3. Upgrade Groq quota
4. Disable AI questions via admin toggle

---

### AI questions not appearing

**Cause:** Global AI disabled  
**Fix:**
1. Admin → Question Bank Manager → AI toggle
2. Check `ai_settings` table: `global_question_generation`
3. Clear localStorage key `ai_question_generation_enabled`

---

## Assignment / Scoring

### Evaluation hangs or times out

**Cause:** Sequential Groq calls with 2–3s delays per question  
**Fix:** Normal for large assignments; check browser console for errors

---

### Fallback scoring used

**Cause:** Groq evaluation failed for a question  
**Fix:** Check network tab for Groq errors; review `scoringService.js` fallback logs

---

## Deployment

### Netlify 404 on refresh

**Cause:** Missing SPA redirect  
**Fix:** Add `public/_redirects`:
```
/*    /index.html   200
```

---

### Production env vars missing

**Cause:** Netlify env not set before build  
**Fix:** Set all `VITE_*` vars in Netlify → redeploy

---

## Testing

### Playwright tests fail

**Cause:** Dev server not running or JSX errors  
**Fix:**
```bash
npm run dev          # terminal 1
npx playwright test  # terminal 2
```

---

## Diagnostic Tools (In App)

| Component | Route/Location | Purpose |
|-----------|----------------|---------|
| DatabaseTest | Admin panel tab | Supabase connectivity |
| DatabaseStatus | Admin | Table status |
| ApiTest | Dev component | API checks |
| verify_installation.sql | Supabase | DB validation |

---

## Escalation Checklist

When stuck, collect:

1. Browser console errors
2. Network tab (Supabase + Groq requests)
3. Supabase logs (Dashboard → Logs)
4. Env var names (not values) configured
5. SQL script version last run
6. Clerk user ID vs Supabase `students.user_id`
