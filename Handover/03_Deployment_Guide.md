# Deployment Guide — gurukul-assesment

**Generated:** 2026-07-06

---

## Architecture Summary

Single **static SPA** deployed to a CDN host. All API calls go directly from the browser to:

- **Supabase** (data)
- **Groq** (AI)
- **Clerk** (auth, if enabled)

No server-side rendering or API proxy in this repo.

---

## Deployment Target: Netlify

**Source:** `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

### Netlify setup steps

1. Connect GitHub repo `blackholeinfiverse64/gurukul-assesment`
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Node version: 20
5. Add environment variables (see `05_Environment_Guide.md`)
6. Enable SPA redirect rule (if not auto-detected):

```
/*    /index.html   200
```

> TODO: Verify whether Netlify redirect is configured in dashboard or needs `public/_redirects`.

---

## Supabase Deployment

Database is hosted on Supabase — not deployed from this repo.

### Initial setup

1. Create Supabase project
2. Run SQL in order (see `07_Database_Details.md`):
   - `src/sql/complete_supabase_setup.sql` OR `all_in_one_schema_setup.sql`
   - `create_question_banks_tables.sql`
   - `create_assignment_tables.sql`
   - `setup_ai_settings.sql`
   - For multi-domain: `migrate_to_13_domains.sql`, `insert_70_domain_questions.sql`
3. Verify with `verify_installation.sql`

### Auth configuration

- Enable Google OAuth in Supabase Auth (if using Supabase sign-in)
- Add production site URL to **Redirect URLs**
- If using Clerk: apply RLS fixes from `fix_rls_for_clerk.sql` or `RLS_POLICY_FIX_GUIDE.md`

---

## Environment Variables (Production)

Set in Netlify **Site settings → Environment variables**:

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `VITE_SUPABASE_TABLE` | No | Default `students` |
| `VITE_GROK_API_KEY` | Yes (AI features) | Exposed to browser |
| `VITE_CLERK_PUBLISHABLE_KEY` | Optional | Remove hardcoded fallback in code before prod |

> **Security:** Do not set `VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD` in production build — admin login uses Supabase `admins` table.

---

## Build Verification

```bash
npm ci
npm run build
npm run preview
```

Checklist after build:

- [ ] `dist/index.html` exists
- [ ] No build errors
- [ ] Env vars baked into bundle (Vite `import.meta.env`)
- [ ] `/admin` loads
- [ ] Supabase connection works (no console warnings for missing keys)

---

## Production URL

| Item | Value |
|------|-------|
| **Deployed frontend** | TODO: Verify Netlify URL |
| **Supabase REST** | `https://<project-ref>.supabase.co/rest/v1/` |
| **Known project ref (docs)** | `eboqteuzjxsgeilkjzwd` — TODO: Verify still active |

---

## CI/CD

No GitHub Actions or CI pipeline found in repository.

Recommended:

- Add Netlify deploy previews on PR
- Add Playwright smoke test in CI (optional)

---

## Post-Deploy Checklist

1. Open production URL — home page loads
2. Test Clerk sign-in (if enabled)
3. Submit `/intake` form — row appears in Supabase `students`
4. Complete `/assignment` — rows in `assignment_attempts`
5. Login `/admin` — student list visible
6. Toggle AI settings in admin — persists to `ai_settings`
7. Verify Groq calls succeed (check browser network tab)

---

## Alternative Hosting

App is a standard Vite SPA. Also deployable to:

- Vercel (`vercel.json` not present — would need creation)
- Cloudflare Pages
- AWS S3 + CloudFront

Update Supabase and OAuth redirect URLs for any new domain.
