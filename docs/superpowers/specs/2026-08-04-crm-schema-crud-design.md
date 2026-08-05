# Milestone 2: CRM Schema + Basic CRUD — Design

Date: 2026-08-04
Status: Approved (user approved design in session before implementation)

## Goal

Data layer and functional CRUD for a single-user networking/job-search CRM.
Stack already in place: Next.js 16 (App Router, TypeScript), Supabase
(magic-link auth working), Tailwind v4, shadcn/ui, deployed on Vercel
(project `networking-crm`, domain networking-crm-mu.vercel.app).

Acceptance: add a company, add a contact linked to it, see both in list
views, open each detail page, edit a field, change persists after refresh —
all on the live Vercel URL.

## Schema (Supabase SQL migration)

Four tables: `companies`, `contacts`, `interactions`, `tasks` — columns
exactly as specified by the user, with these interpretations (approved):

- `interactions.contact_id` is **NOT NULL** (spec marked `tasks.contact_id`
  nullable but not this one; an interaction without a contact is
  meaningless). `ON DELETE CASCADE` as specified.
- `tasks.source_interaction_id` gets **ON DELETE SET NULL** (unspecified in
  the request; the Postgres default NO ACTION would block deleting any
  interaction referenced by a task).
- Check constraints encode the commented ranges: `warmth BETWEEN 1 AND 5`,
  `social_pct BETWEEN 0 AND 100`.
- Indexes on every FK column.
- RLS enabled on all four tables with a single policy each:
  `FOR ALL TO authenticated USING (true) WITH CHECK (true)`.

Security caveat: "authenticated = me" only holds while Supabase signups are
closed. After the owner's account exists, disable public signups
(Dashboard → Auth → Sign In / Up).

Execution: the assistant has no DB password or Management API token (anon
key cannot run DDL), so the migration is committed to
`supabase/migrations/` and applied by the user via the Dashboard SQL
Editor. List pages handle the missing-table error gracefully so the deploy
is verifiable before the migration runs.

## Data access layer

- `lib/db/types.ts` — hand-written row types for all four tables plus
  Insert/Update variants for companies and contacts (no generated types
  yet; single source of truth is the migration file).
- `lib/db/companies.ts`, `lib/db/contacts.ts` — `list`, `getById`,
  `create`, `update`, `delete`, using the existing cookie-based server
  client (`lib/supabase-server.ts`). Contacts list joins the company name
  (`select("*, companies(id, name)")`).
- Errors are thrown; list pages catch and display them.

## Mutations: Server Actions (approved over alternatives)

Server Components + `"use server"` actions with plain HTML forms.
Alternatives rejected: API route handlers + client fetch (more code, no
benefit at this scale); client-side supabase-js mutations (splits data
access across client/server, complicates revalidation). Actions call
`requireUser()` (redirect to /login) and then the data layer; RLS is the
backstop. `revalidatePath` after each mutation; delete redirects to the
list page.

## UI (functional, minimal styling)

- `components/nav.tsx` — Today / Contacts / Companies link row; added to
  /today as well since login lands there.
- `/companies` — table (name, stage, status, geography), rows link to
  detail; Add form (name*, stage, status, geography, website).
- `/companies/[id]` — all fields editable (textarea for thesis_fit_notes,
  number input 0–100 for social_pct), Save + Delete.
- `/contacts` — table (name, company, type, warmth), rows link to detail;
  Add form (name*, company dropdown of existing companies, type, warmth).
- `/contacts/[id]` — all fields editable (company dropdown, number input
  1–5 for warmth, datetime-local for last_touch_at), Save + Delete.
- Native `<select>`/`<textarea>` with minimal Tailwind classes; shadcn
  Button/Input elsewhere. Detail pages 404 via `notFound()` for unknown
  ids.

## Out of scope (later milestones)

Interactions/tasks data layer and UI, styling polish, generated Supabase
types, optimistic UI, pagination, search.
