# Folder Structure — gurukul-assesment

**Generated:** 2026-07-06

---

## Root Directory

```
gurukul-assesment/
├── Handover/                 # Exit handover documentation (this package)
├── public/                   # Static assets
├── scripts/                  # Utility scripts
├── src/                      # Application source
├── tests/                    # Playwright tests
├── test-results/             # Playwright run artifacts
├── netlify.toml              # Netlify deployment config
├── vite.config.js            # Vite configuration
├── eslint.config.js          # ESLint rules
├── index.html                # SPA entry HTML
├── package.json
├── .env.example              # Environment template
└── *.md                      # Feature/docs markdown (40+ files)
```

---

## `src/` — Application Source

```
src/
├── main.jsx                  # React entry, ClerkProvider, BrowserRouter
├── App.jsx                   # Route definitions, Toaster config
├── index.css                 # Global styles (Tailwind)
├── test-domain-system.js     # Domain system test helper
│
├── pages/
│   ├── Home.jsx              # Landing page
│   ├── Auth.jsx              # Clerk sign-in/sign-up pages
│   ├── Dashboard.jsx         # Student dashboard (Clerk user)
│   ├── Intake.jsx            # Dynamic student intake form
│   ├── Assignment.jsx        # Field-based assignment page
│   ├── MultiDomainTest.jsx   # 13-domain assessment page
│   ├── Admin.jsx             # Admin panel (large file ~1400 lines)
│   └── NotFound.jsx          # 404 page
│
├── components/
│   ├── Layout.jsx            # Nav, header, Gurukul tab, i18n
│   ├── Gurukul.jsx           # Seed/Tree/Sky learning module
│   ├── DynamicForm.jsx       # Renders form_configurations fields
│   ├── FormBuilder.jsx       # Admin form designer
│   ├── QuestionBankManager.jsx
│   ├── QuestionCategoryManager.jsx
│   ├── CategoryManager.jsx
│   ├── DomainSelector.jsx    # Multi-domain picker
│   ├── MultiDomainAssignment.jsx
│   ├── MultiDomainResults.jsx
│   ├── Assignment.jsx        # Assignment UI component
│   ├── AssignmentResults.jsx
│   ├── StudentAnalytics.jsx
│   ├── StudentRedirect.jsx   # Ensures student record exists
│   ├── ProtectedRoute.jsx    # Clerk route guard
│   ├── ErrorBoundary.jsx
│   ├── DatabaseTest.jsx      # Admin DB diagnostics
│   ├── DatabaseStatus.jsx
│   ├── BackgroundSelectionConfig.jsx
│   ├── FormSectionsConfig.jsx
│   ├── EnhancedFormPreview.jsx
│   ├── UserProgress.jsx
│   ├── ApiTest.jsx           # Dev/test utilities
│   ├── EvaluationTest.jsx
│   └── RateLimitTest.jsx
│
├── config/
│   ├── auth.js               # Clerk key + CLERK_ENABLED
│   └── admin.js              # adminAuth (plain-text login)
│
├── data/
│   ├── assignment.js         # Categories, prompts, scoring constants
│   ├── gurukul.js            # Gurukul schema + sample content
│   ├── questionBanks.js      # Static question bank fallback
│   └── studyFields.js        # Static study field definitions
│
├── lib/
│   ├── supabaseClient.js     # Supabase singleton
│   ├── grokService.js        # Groq AI service (~700 lines)
│   ├── scoringService.js     # Assignment evaluation
│   ├── fieldBasedQuestionService.js
│   ├── multiDomainAssessmentService.js
│   ├── aiAssistanceDetector.js
│   ├── aiSettingsService.js
│   ├── adminService.js       # bcrypt admin CRUD
│   ├── formConfigService.js
│   ├── enhancedFormConfigService.js
│   ├── dynamicFieldService.js
│   ├── dynamicCategoryService.js
│   ├── dynamicQuestionCategoryService.js
│   ├── backgroundSelectionService.js
│   ├── formProgressionService.js
│   ├── fieldSpecificFormConfigs.js
│   ├── dynamicFieldSpecificFormConfigs.js
│   └── i18n.js               # en/hi/mr translations
│
├── docs/
│   ├── ADMIN_SECURITY_GUIDE.md
│   └── FORM_CONFIGURATION_SETUP.md
│
└── sql/                      # 40+ Supabase SQL scripts
    ├── complete_supabase_setup.sql
    ├── all_in_one_schema_setup.sql
    ├── SUPABASE_SETUP_GUIDE.md
    └── ... (migrations, fixes, seeds)
```

---

## `tests/`

```
tests/
├── ai-toggle.test.js           # AI toggle in Question Bank Manager
└── ai-settings-service.test.js # AI settings persistence
```

Run with Playwright (dev server must be running):

```bash
npx playwright test
```

---

## `Handover/`

```
Handover/
├── 01_README.md … 18_Rollback_Guide.md
├── review_packets/
│   └── REVIEW_PACKET_INDEX.md
├── code_packets/
│   └── CODE_PACKET_INDEX.md
├── Screenshots/
│   └── README.md
└── Videos/
    └── README.md
```

---

## Notable Root Markdown Files

| File | Topic |
|------|-------|
| `13_DOMAIN_SYSTEM_README.md` | Multi-domain assessment |
| `MULTI_DOMAIN_IMPLEMENTATION_GUIDE.md` | Integration guide |
| `SYSTEM_FLOW_DIAGRAM.md` | End-to-end flows |
| `GROK_AI_SETUP_GUIDE.md` | Groq setup |
| `AI_SETTINGS_SYSTEM.md` | AI toggle architecture |
| `FIELD_BASED_ASSESSMENT_SYSTEM.md` | Field-based questions |
| `ERRORS_AND_BUGS.md` | Known bugs |
| `RLS_POLICY_FIX_GUIDE.md` | Supabase RLS fixes |
| `IMPLEMENTATION_CHECKLIST.md` | Feature checklist |

---

## Files to Treat with Caution

| File | Reason |
|------|--------|
| `.env`, `.env.local` | Secrets |
| `src/lib/fieldBasedQuestionService_debug.js` | Debug variant |
| `src/components/Assignment.jsx.new` | Unmerged alternate |
| `test-results/` | Stale test artifacts |
| `diagnose_rls_issues.sql`, `safe_rls_fix.sql` (root) | Duplicate of src/sql |
