# Environment Guide — gurukul-assesment

**Generated:** 2026-07-06  
**Template:** `.env.example` (root)  
**Local dev:** `.env.local` (gitignored)

---

## Required Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_SUPABASE_URL` | Yes | None | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | None | Supabase anon/public key |
| `VITE_GROK_API_KEY` | For AI | None | Groq API key (browser-exposed) |

---

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SUPABASE_TABLE` | `students` | Primary student table name |
| `VITE_CLERK_PUBLISHABLE_KEY` | Hardcoded fallback in `auth.js` | Clerk publishable key |
| `VITE_ADMIN_USERNAME` | Documented only | Not used by active admin login code |
| `VITE_ADMIN_PASSWORD` | Documented only | Not used by active admin login code |

---

## Variable Details

### Supabase

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_SUPABASE_TABLE=students
```

- Read in `src/lib/supabaseClient.js`
- Missing values log a console warning at startup
- `FORM_CONFIG_TABLE` is hardcoded as `form_configurations`

### Groq (named GROK in env)

```env
VITE_GROK_API_KEY=gsk_...
```

- Read in `src/lib/grokService.js`
- Used for question generation, evaluation, and feedback
- **Security risk:** embedded in client bundle; anyone can extract it

### Clerk

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

- Read in `src/config/auth.js`
- Fallback if unset: `pk_test_cGxlYXNlZC16ZWJyYS01OC5jbGVyay5hY2NvdW50cy5kZXYk`
- Controls `CLERK_ENABLED` and `ProtectedRoute` behavior

---

## Local Setup

```bash
# Copy template
cp .env.example .env.local

# Edit values
# Restart dev server after changes (Vite loads env at startup)
npm run dev
```

Vite only exposes variables prefixed with `VITE_`.

---

## Production (Netlify)

Set all `VITE_*` variables in Netlify dashboard before deploy.

| Check | Action |
|-------|--------|
| Supabase URL/key | Match production Supabase project |
| Groq key | Use production key with rate limits |
| Clerk key | Use `pk_live_...`; remove code fallback |
| No secrets in git | Confirm `.env`, `.env.local` in `.gitignore` |

---

## Files Present in Repo

| File | Status |
|------|--------|
| `.env.example` | Committed — safe template |
| `.env` | Present locally — **do not commit** |
| `.env.local` | Present locally — **do not commit** |

> TODO: Verify `.env` / `.env.local` are not tracked in git history.

---

## Supabase Dashboard Settings

Not env vars, but required for full functionality:

| Setting | Location |
|---------|----------|
| Google OAuth client | Supabase Auth → Providers |
| Site URL / Redirect URLs | Supabase Auth → URL Configuration |
| RLS policies | SQL Editor / Table editor |
| Service role key | **Never** put in frontend env |

---

## Troubleshooting Env Issues

| Symptom | Fix |
|---------|-----|
| "Supabase URL or anon key is missing" | Add vars to `.env.local`, restart dev |
| Groq "API key missing" | Set `VITE_GROK_API_KEY` |
| Clerk not gating routes | Check `VITE_CLERK_PUBLISHABLE_KEY`; if unset, fallback key still enables Clerk |
| Env changes ignored | Restart Vite; clear browser cache |
