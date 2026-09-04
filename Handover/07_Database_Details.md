# Database Details — gurukul-assesment

**Generated:** 2026-07-06  
**Database:** Supabase (PostgreSQL)  
**Setup guide:** `src/sql/SUPABASE_SETUP_GUIDE.md`

---

## Overview

All persistent data lives in Supabase. Schema is defined across **40+ SQL files** in `src/sql/`. There is no ORM — the app uses Supabase JS client directly.

---

## Recommended Setup Order

Run in Supabase SQL Editor:

| Step | Script | Purpose |
|------|--------|---------|
| 1 | `complete_supabase_setup.sql` OR `all_in_one_schema_setup.sql` | Base: students, form_configurations |
| 2 | `create_admins_table.sql` | Admin users |
| 3 | `create_question_banks_tables.sql` | Question bank system |
| 4 | `create_assignment_tables.sql` | Assignment attempts/responses |
| 5 | `setup_ai_settings.sql` | Global AI toggle |
| 6 | `setup_dynamic_study_fields.sql` | Study fields seed |
| 7 | `setup_dynamic_question_categories_complete.sql` | Question categories |
| 8 | `migrate_to_13_domains.sql` | 13-domain system |
| 9 | `insert_70_domain_questions.sql` | Domain question seed data |
| 10 | `verify_installation.sql` | Validation queries |

> **Note:** Many fix/migration scripts overlap. Prefer idempotent scripts (`IF NOT EXISTS`, `CREATE OR REPLACE`). Do not run destructive scripts (`DROP TABLE`) on production without backup.

---

## Core Tables

### `students`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| user_id | TEXT | Clerk user ID |
| name | TEXT | |
| email | TEXT UNIQUE | |
| student_id | TEXT | |
| grade | TEXT | |
| tier | TEXT | CHECK: Seed, Tree, Sky |
| responses | JSONB | Dynamic form answers |
| created_at, updated_at | TIMESTAMPTZ | Auto-trigger |

### `form_configurations`

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g. `default_config` |
| name | TEXT | |
| description | TEXT | |
| fields | JSONB | Form field definitions |
| is_active | BOOLEAN | One active config for intake |

### `admins`

| Column | Type | Notes |
|--------|------|-------|
| username | TEXT | Login identifier |
| password | TEXT | Plain text (legacy path) |
| password_hash | TEXT | bcrypt (adminService path) |

> **Inconsistency:** Active Admin.jsx login uses plain `password` column via `config/admin.js`.

### `study_fields`

| Column | Type | Notes |
|--------|------|-------|
| field_id | TEXT PK | e.g. domain slug |
| name | TEXT | Display name |
| icon, color, description | TEXT | UI metadata |
| is_active | BOOLEAN | |

Extended columns in `create_question_banks_tables.sql`: `subcategories`, `question_weights`, `difficulty_distribution` (JSONB).

### `question_banks`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| question_id | TEXT UNIQUE | Business key |
| category | TEXT | |
| difficulty | TEXT | |
| question_text | TEXT | |
| options | JSONB | MCQ options |
| correct_answer | TEXT | |
| explanation | TEXT | |
| vedic_connection | TEXT | Gurukul theme |
| modern_application | TEXT | |
| tags | JSONB | |
| is_active | BOOLEAN | |
| created_by | TEXT | `admin` or `ai` |

### `question_field_mapping`

Maps questions to study fields/domains.

| Column | Type |
|--------|------|
| question_id | TEXT FK → question_banks |
| field_id | TEXT FK → study_fields |
| weight | INTEGER |
| is_primary | BOOLEAN |

### `assignment_attempts`

| Column | Type | Notes |
|--------|------|-------|
| user_id | TEXT | Clerk ID |
| student_id | UUID FK | → students |
| total_score, max_score, percentage | DECIMAL | |
| grade | TEXT | |
| category_scores | JSONB | Per-category breakdown |
| overall_feedback | TEXT | |
| strengths, improvement_areas | JSONB | |
| evaluated_at | TIMESTAMPTZ | |

### `assignment_responses`

Per-question evaluation detail linked to `attempt_id`.

### `ai_settings`

| Column | Type | Notes |
|--------|------|-------|
| setting_key | TEXT UNIQUE | `global_question_generation` |
| ai_enabled | BOOLEAN | Global AI toggle |

### `background_selections`

Stores field_of_study, class_level, learning_goals per user_id.

### Additional tables (SQL-defined)

| Table | Source script |
|-------|---------------|
| `dynamic_question_categories` | `all_in_one_schema_setup.sql` |
| `question_usage_stats` | `create_question_banks_tables.sql` |
| `question_categories` | Referenced in app code |
| `form_categories` | Referenced in CategoryManager |

---

## Row Level Security (RLS)

Most tables have RLS **enabled** with permissive policies:

```sql
CREATE POLICY "Allow all operations for authenticated users on students"
  ON students FOR ALL USING (true);
```

**Risk:** Anon key + permissive RLS = broad public access.

Fix scripts:

- `fix_rls_policies.sql`
- `fix_rls_for_clerk.sql`
- `ai_settings_relax_rls.sql`
- `safe_rls_fix.sql`

See `RLS_POLICY_FIX_GUIDE.md` for Clerk + 406 errors.

---

## Indexes

Performance indexes on:

- `students`: email, user_id, tier, responses (GIN)
- `question_banks`: category, difficulty, active
- `assignment_attempts`: user_id, created_at, percentage
- JSONB columns: GIN indexes where queried

---

## Verification Queries

From `verify_installation.sql` / `SUPABASE_SETUP_GUIDE.md`:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('students', 'form_configurations', 'question_banks');

SELECT name, email, tier FROM students LIMIT 5;

SELECT name, is_active FROM form_configurations WHERE is_active = true;

SELECT setting_key, ai_enabled FROM ai_settings;
```

---

## Backup & Migration

| Action | Method |
|--------|--------|
| Backup | Supabase dashboard → Database → Backups |
| Export schema | `complete_database_schema_export.sql` |
| Point-in-time recovery | Supabase Pro plan feature — TODO: Verify plan |

---

## Known Schema Issues

1. Overlapping migration scripts — risk of duplicate policies/triggers
2. `study_fields` schema differs between scripts (columns added incrementally)
3. Plain-text admin passwords may exist alongside `password_hash`
4. Form field repetition fixed by `fix_form_field_repetition.sql` — monitor

See `ERRORS_AND_BUGS.md` and `DATABASE_SCHEMA_FIX.md`.
