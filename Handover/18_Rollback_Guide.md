# Rollback Guide — gurukul-assesment

**Generated:** 2026-07-06

---

## Overview

This app has **two rollback surfaces**:

1. **Frontend** — Netlify static deploy (instant rollback)
2. **Database** — Supabase PostgreSQL (requires backup restore or reverse migration)

There is **no backend server** to roll back.

---

## Frontend Rollback (Netlify)

### Option A: Rollback to previous deploy (fastest)

1. Open Netlify dashboard → Site → **Deploys**
2. Find last known-good deploy
3. Click **⋯** → **Publish deploy**
4. Confirm rollback
5. Smoke test production URL

**Expected recovery time:** 1–5 minutes

### Option B: Revert git commit + redeploy

```bash
git revert <bad-commit-sha>
git push origin main
# Netlify auto-builds from reverted main
```

**Use when:** Bad code merged and you want git history to reflect rollback.

### Option C: Manual deploy of known-good build

```bash
git checkout <good-commit>
npm ci && npm run build
netlify deploy --prod --dir=dist
```

---

## Database Rollback (Supabase)

### Option A: Point-in-time recovery (if enabled)

1. Supabase Dashboard → Database → Backups
2. Select restore point before bad migration
3. Confirm restore (overwrites current DB)

> TODO: Verify Supabase plan includes PITR.

**Warning:** Restores entire database — affects all tables.

### Option B: Reverse migration SQL

For specific schema changes, run inverse scripts if available:

| Forward script | Rollback approach |
|----------------|-------------------|
| `migrate_to_13_domains.sql` | Restore from backup; no auto-reverse script |
| `complete_supabase_setup.sql` | **Destructive** — drops students table; never run as rollback |
| RLS fix scripts | Re-apply previous policy definitions from backup |

**Best practice:** Take Supabase backup before any SQL migration.

### Option C: Manual data fix

For bad data (not schema):

```sql
-- Example: deactivate bad form config
UPDATE form_configurations SET is_active = false WHERE id = 'bad_config';
UPDATE form_configurations SET is_active = true WHERE id = 'default_config';

-- Example: delete bad assignment attempts
DELETE FROM assignment_responses WHERE attempt_id IN (
  SELECT id FROM assignment_attempts WHERE created_at > '2026-07-06'
);
DELETE FROM assignment_attempts WHERE created_at > '2026-07-06';
```

---

## Environment Rollback

If bad env vars deployed:

1. Netlify → Site settings → Environment variables
2. Restore previous values (keep a redacted changelog)
3. **Trigger redeploy** (env vars baked at build time for Vite)
4. Verify app behavior

| Variable | Rollback note |
|----------|---------------|
| VITE_SUPABASE_URL | Must match DB being used |
| VITE_GROK_API_KEY | Revert to previous key if new key broken |
| VITE_CLERK_PUBLISHABLE_KEY | Revert to previous Clerk instance |

---

## Rollback Decision Matrix

| Symptom | Likely cause | Rollback action |
|---------|--------------|-----------------|
| Blank page after deploy | Build error / bad JS | Netlify deploy rollback |
| All API calls fail | Wrong Supabase URL/key | Fix env vars + redeploy |
| Admin login broken | DB migration / admin row deleted | DB restore or re-insert admin |
| Assignments fail scoring | Groq key/quota issue | Revert Groq key or disable AI toggle |
| 406 on all queries | Bad RLS migration | Run `safe_rls_fix.sql` or DB restore |
| Clerk auth broken | Wrong Clerk key | Revert Clerk env + redeploy |

---

## Rollback Verification

After any rollback:

- [ ] Home page loads
- [ ] Supabase queries succeed (check Network tab)
- [ ] Admin login works
- [ ] One intake submission succeeds
- [ ] One assignment completes (if Groq available)
- [ ] No new errors in browser console
- [ ] Document rollback in deploy log

---

## Prevention

1. **Always** take Supabase backup before SQL migrations
2. Use Netlify deploy previews for PRs
3. Keep env var changelog (names + date, not values)
4. Never run `DROP TABLE` scripts on production without backup
5. Test `npm run build` locally before pushing to `main`

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| Netlify admin | TODO: Verify |
| Supabase admin | TODO: Verify |
| Groq account owner | TODO: Verify |
| On-call developer | TODO: Verify |

---

## Rollback Log Template

| Field | Value |
|-------|-------|
| Incident date/time | |
| Symptom | |
| Root cause | |
| Rollback type | Netlify / DB / Env / Git revert |
| Deploy/backup restored to | |
| Verified by | |
| Follow-up fix ticket | |
