# API Documentation — gurukul-assesment

**Generated:** 2026-07-06  
**Note:** This app has **no custom REST backend**. APIs are Supabase PostgREST + Groq OpenAI-compatible endpoints, called from the browser.

---

## Supabase REST API

**Base URL:** `{VITE_SUPABASE_URL}/rest/v1/`  
**Auth header:** `apikey: {VITE_SUPABASE_ANON_KEY}`  
**Client:** `@supabase/supabase-js` in `src/lib/supabaseClient.js`

---

## Tables Used by Application Code

| Table | Primary operations | Used by |
|-------|-------------------|---------|
| `students` | SELECT, INSERT, UPDATE, DELETE | Intake, Admin, StudentRedirect |
| `form_configurations` | SELECT, INSERT, UPDATE | FormConfigService, Admin |
| `admins` | SELECT, INSERT | adminAuth, adminService |
| `study_fields` | SELECT, INSERT, UPDATE, DELETE | dynamicFieldService |
| `question_banks` | SELECT, INSERT, UPDATE, DELETE | fieldBasedQuestionService, QuestionBankManager |
| `question_field_mapping` | SELECT, INSERT, DELETE | fieldBasedQuestionService |
| `question_categories` | SELECT, INSERT, UPDATE | dynamicQuestionCategoryService |
| `form_categories` | SELECT | CategoryManager |
| `assignment_attempts` | SELECT, INSERT | Dashboard, Assignment, scoringService |
| `assignment_responses` | INSERT | scoringService |
| `background_selections` | SELECT, UPSERT | backgroundSelectionService |
| `ai_settings` | SELECT, UPDATE | aiSettingsService |

---

## Common Supabase Patterns

### Load active form configuration

```javascript
supabase
  .from('form_configurations')
  .select('*')
  .eq('is_active', true)
  .single()
```

### Upsert student intake

```javascript
supabase
  .from('students')  // or VITE_SUPABASE_TABLE
  .upsert({ email, name, responses, tier, user_id })
```

### Admin login (current path — plain text)

```javascript
supabase
  .from('admins')
  .select('*')
  .eq('username', username)
  .eq('password', password)  // plain text — see Known Issues
  .single()
```

### Save assignment attempt

```javascript
supabase.from('assignment_attempts').insert({
  user_id, assignment_id, total_score, percentage, grade,
  category_scores, overall_feedback, ...
})
supabase.from('assignment_responses').insert([...])
```

### AI settings toggle

```javascript
supabase
  .from('ai_settings')
  .select('ai_enabled')
  .eq('setting_key', 'global_question_generation')
  .single()
```

---

## Groq API (OpenAI-compatible)

**Base URL:** `https://api.groq.com/openai/v1`  
**Service:** `src/lib/grokService.js`  
**Auth:** `Authorization: Bearer {VITE_GROK_API_KEY}`

### POST `/chat/completions`

**Request body (typical):**

```json
{
  "model": "llama3-8b-8192",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "max_tokens": 2000,
  "temperature": 0.7
}
```

**Used for:**

| Method (grokService) | Purpose |
|---------------------|---------|
| `generateQuestions()` | AI question generation |
| `evaluateResponse()` | Score user answers + explanations |
| `generateFeedback()` | Post-assessment recommendations |
| `generateSummary()` | Dashboard summaries |

**Rate limiting (client-side):**

- Minimum 3 seconds between requests
- Exponential backoff on 429 errors
- Max 3 retries per call

---

## Clerk API

Handled by `@clerk/clerk-react` SDK — no direct API calls in app code.

| Hook / Component | Usage |
|------------------|-------|
| `useUser()` | Dashboard user context |
| `SignedIn` / `SignedOut` | Route gating |
| `RedirectToSignIn` | ProtectedRoute redirect |
| `UserButton` | Layout header |

---

## Local Storage API (Client-side)

Not HTTP APIs, but data contracts:

| Key | Purpose |
|-----|---------|
| `admin` | Admin session JSON (username + password) |
| `is_admin` | sessionStorage flag for nav |
| `ai_question_generation_enabled` | AI toggle fallback |
| Gurukul keys | Progress in `gurukul.js` / Gurukul component |

---

## Error Responses

### Supabase

| Code | Meaning | Common cause |
|------|---------|--------------|
| 406 | Not Acceptable | RLS policy blocks query (see RLS_POLICY_FIX_GUIDE.md) |
| 401 | Unauthorized | Invalid anon key |
| PGRST116 | No rows | `.single()` with 0 rows |

### Groq

| Error | Handling |
|-------|----------|
| 429 Rate limit | Backoff + retry in grokService |
| Missing API key | Throws `API_KEY_MISSING` message |
| Invalid model | Check model name in grokService |

---

## No Backend Endpoints

This repository does **not** expose:

- `/api/*` routes
- Webhooks
- Server-side proxies for Groq or Supabase

Any future backend should proxy Groq calls and enforce admin auth server-side.
