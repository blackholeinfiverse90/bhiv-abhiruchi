# Review Packet Index — gurukul-assesment

**Generated:** 2026-07-06

---

## Primary Review Document

| Document | Path | Time |
|----------|------|------|
| **Review Packet** | `Handover/12_REVIEW_PACKET.md` | < 10 min |

---

## Supporting Documents (Read as needed)

| # | Document | When to read |
|---|----------|--------------|
| 01 | `01_README.md` | First — product overview |
| 04 | `04_Architecture.md` | Understanding data flow |
| 07 | `07_Database_Details.md` | DB review |
| 10 | `10_Known_Issues.md` | Security review |
| 14 | `14_Testing_Checklist.md` | QA validation |

---

## In-Repo Feature Docs

| Document | Topic |
|----------|-------|
| `13_DOMAIN_SYSTEM_README.md` | Multi-domain assessment |
| `SYSTEM_FLOW_DIAGRAM.md` | End-to-end flows |
| `src/sql/SUPABASE_SETUP_GUIDE.md` | Database setup |
| `ERRORS_AND_BUGS.md` | Bug catalog |

---

## Review Sequence (Recommended)

1. `12_REVIEW_PACKET.md` — checklist + flags
2. `01_README.md` — context
3. `10_Known_Issues.md` — security priorities
4. Local smoke: `npm run dev` → `/`, `/admin`, `/intake`
5. `04_Architecture.md` — if deeper review needed

---

## Items Requiring Verification

| Item | Status |
|------|--------|
| Production Netlify URL | TODO: Verify |
| Active Supabase project | Partial evidence in docs |
| Admin auth method in prod | TODO: Verify plain vs bcrypt |
| QuestionBankManager JSX fix | TODO: Verify build passes |
