# Repository Details — gurukul-assesment

**Generated:** 2026-07-06

---

## Git Information

| Item | Value |
|------|-------|
| **Remote (origin)** | https://github.com/blackholeinfiverse64/gurukul-assesment.git |
| **Default branch** | `main` |
| **Recent commits** | `1d58dae` Merge PR #1 (multi-domain assessment) |
| | `ecbdb9d` Add 13-domain multi-select assessment system |
| | `7f4c636` first commit |

---

## Naming Notes

| Context | Name |
|---------|------|
| GitHub repo | `gurukul-assesment` (spelling: "assesment") |
| npm package | `assesment-form` (`package.json`) |
| Product | Gurukul Assessment / BHIV Gurukul |

---

## Repository Layout

```
gurukul-assesment/
├── src/                    # React application source
│   ├── pages/              # Route pages
│   ├── components/         # UI + Gurukul module
│   ├── lib/                # Services (Supabase, Groq, scoring)
│   ├── config/             # auth.js, admin.js
│   ├── data/               # Static config (assignment, gurukul)
│   ├── sql/                # Supabase SQL scripts (40+)
│   └── docs/               # Admin security, form config guides
├── public/                 # Static assets (blackhole-logo.png)
├── tests/                  # Playwright tests
├── test-results/           # Playwright output (may contain stale errors)
├── netlify.toml            # Netlify build config
├── .env.example            # Env template
├── package.json
└── Handover/               # This handover package
```

---

## Key Entry Points

| File | Role |
|------|------|
| `src/main.jsx` | React bootstrap, ClerkProvider wrapper |
| `src/App.jsx` | Route definitions |
| `src/lib/supabaseClient.js` | Supabase client singleton |
| `src/lib/grokService.js` | Groq AI (questions, evaluation, feedback) |
| `src/lib/scoringService.js` | Assignment scoring orchestration |
| `src/pages/Admin.jsx` | Admin panel (students, forms, question banks) |
| `src/sql/complete_supabase_setup.sql` | Base DB setup script |

---

## Dependencies (Runtime)

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.1.1 | UI |
| vite | ^7.1.2 | Build tool |
| @supabase/supabase-js | ^2.55.0 | Database client |
| @clerk/clerk-react | ^5.23.2 | Optional auth |
| react-router-dom | ^6.28.0 | Routing |
| tailwindcss | ^4.1.11 | Styling |
| bcryptjs | ^3.0.2 | Admin password hashing (adminService only) |
| lucide-react | ^0.540.0 | Icons |
| react-hot-toast | ^2.6.0 | Notifications |

---

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

---

## External Services

| Service | Purpose | Config |
|---------|---------|--------|
| Supabase | PostgreSQL + REST API | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Groq | LLM for questions/feedback | `VITE_GROK_API_KEY` |
| Clerk | Student auth UI | `VITE_CLERK_PUBLISHABLE_KEY` |
| Netlify | Hosting | `netlify.toml` |

---

## Ownership / Access TODO

| System | Action |
|--------|--------|
| GitHub repo | Transfer admin to receiving team |
| Supabase project | Transfer org ownership; rotate anon/service keys |
| Groq console | Transfer API key ownership |
| Clerk dashboard | Transfer app; rotate publishable/secret keys |
| Netlify site | Transfer site + env vars |
| Google OAuth (Supabase) | Update OAuth redirect URLs for new domain |
