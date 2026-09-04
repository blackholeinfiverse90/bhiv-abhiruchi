# Ownership Transfer — gurukul-assesment

**Generated:** 2026-07-06

---

## Transfer Checklist

### Source Code

- [ ] GitHub repo access granted: `blackholeinfiverse64/gurukul-assesment`
- [ ] Receiving team has admin/maintain role
- [ ] Branch protection rules documented — TODO: Verify
- [ ] All open PRs reviewed/merged/closed

### Hosting — Netlify

- [ ] Netlify site ownership transferred
- [ ] Custom domain DNS documented — TODO: Verify domain
- [ ] Build env vars exported (redacted copy of **names** only)
- [ ] Deploy hooks / auto-deploy from `main` confirmed

### Database — Supabase

- [ ] Supabase project ownership transferred
- [ ] Organization billing updated
- [ ] Anon key rotated post-transfer
- [ ] Service role key rotated (stored securely, **never** in frontend)
- [ ] Database backup verified before transfer
- [ ] RLS policies documented (see `07_Database_Details.md`)

### Authentication — Clerk

- [ ] Clerk application ownership transferred
- [ ] Publishable key updated in Netlify (remove hardcoded fallback in code)
- [ ] Secret keys stored securely (backend only if added later)
- [ ] Allowed origins updated for production domain

### AI — Groq

- [ ] Groq account/API key ownership transferred
- [ ] Usage limits and billing contact updated
- [ ] Key rotated after transfer (update Netlify env)

### OAuth — Google (Supabase)

- [ ] Google Cloud OAuth client ownership transferred
- [ ] Redirect URIs updated for new team/domain
- [ ] OAuth consent screen admin updated

---

## Credentials Inventory

| Credential | Location | Rotate on transfer? |
|------------|----------|---------------------|
| Supabase anon key | Netlify env, `.env.local` | Yes |
| Supabase service role | Supabase dashboard only | Yes |
| Groq API key | Netlify env, `.env.local` | Yes |
| Clerk publishable key | Netlify env, `auth.js` fallback | Yes |
| Clerk secret key | Clerk dashboard | Yes (if used) |
| Admin username/password | Supabase `admins` table | Yes |
| Google OAuth client secret | Google Cloud Console | Yes |

> **Never commit credentials.** Verify `.env` and `.env.local` are gitignored and not in history.

---

## Access Roles

| Person/Team | GitHub | Supabase | Netlify | Clerk | Groq |
|-------------|--------|----------|---------|-------|------|
| Outgoing lead | | | | | |
| Incoming lead | | | | | |
| Dev team | | | | | |
| QA | Read | Read | Read | — | — |

---

## Documentation Handover

| Deliverable | Location | Status |
|-------------|----------|--------|
| Handover package (18 docs) | `Handover/` | ✅ Created |
| Review packet | `Handover/12_REVIEW_PACKET.md` | ✅ |
| Code packet index | `Handover/code_packets/` | ✅ |
| Screenshots | `Handover/Screenshots/` | TODO: Capture |
| Demo video | `Handover/Videos/` | TODO: Optional |

---

## Support Period

| Item | Detail |
|------|--------|
| Outgoing contact | TODO: Verify name/email |
| Support window | TODO: Verify agreed period |
| Escalation channel | TODO: Verify (Slack/email) |
| Critical bug SLA | TODO: Verify |

---

## Post-Transfer Actions (Receiving Team)

1. Rotate all keys listed above
2. Remove Clerk fallback key from `src/config/auth.js`
3. Fix admin auth to use bcrypt (or Edge Function)
4. Tighten Supabase RLS policies
5. Confirm production URL and update docs
6. Run `14_Testing_Checklist.md` end-to-end
7. Capture runtime evidence (`13_Runtime_Evidence.md`)

---

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Outgoing owner | | | |
| Incoming owner | | | |
| Technical reviewer | | | |
