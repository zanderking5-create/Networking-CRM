@AGENTS.md

# Networking CRM

A personal networking / job-search CRM for **one person**. There is exactly one
authenticated user (the repo owner). There is no multi-tenancy anywhere: no
`user_id` / `owner_id` column on any table, no per-row ownership checks, no
sharing or invitation model. Don't add one speculatively — the entire data model
and security posture assume a single account.

The app tracks companies the user is targeting, people at (or around) them,
every interaction, and the follow-ups those interactions generate. `/today` is
the home surface: what's due, who's going cold, which high-conviction targets
have stalled.

## Commands

```bash
npm run dev      # next dev
npm run build    # next build
npm run lint     # eslint
```

There is no test suite. `scripts/*.mjs` / `*.mts` are ad-hoc local check
scripts (schema probes, ranking-math checks, screenshot helpers); `scripts/` is
**gitignored on purpose** as defense-in-depth, since some of them prompt for the
Supabase service-role key.

## Stack

Confirmed against `package.json` — check it again rather than trusting this list
if versions matter.

- **Next.js 16.3.0**, App Router, React 19.2.8, TypeScript 5 (`strict`), path
  alias `@/*` → repo root.
- **Tailwind CSS v4** via `@tailwindcss/postcss`. No `tailwind.config.*` — all
  theming is CSS-first in `app/globals.css` (`@theme inline` + `:root` vars).
- **shadcn/ui** (`components.json`: style `base-nova`, base color `neutral`,
  RSC on) built on **@base-ui/react 1.7.0**. Note `components/ui/button.tsx`
  wraps the Base UI `Button` primitive — to render a link as a button use
  `<Button nativeButton={false} render={<Link href=… />} />`, not `asChild`.
- **lucide-react** for icons.
- **Supabase** (Postgres + auth) via `@supabase/ssr` 0.12.4 and
  `@supabase/supabase-js` 2.112.0.
- **@anthropic-ai/sdk 0.115.0** powers the natural-language capture box;
  model is pinned in `lib/anthropic.ts` (`claude-sonnet-5`), structured output
  via `zodOutputFormat` + **zod 4.4.3**.
- Deployed on **Vercel** (project `networking-crm`; `vercel.json` pins the
  framework preset to `nextjs` — that pin fixed a 404-on-every-route bug, leave
  it alone).

## Routes

| Route | Notes |
| --- | --- |
| `/` | Static splash with a Log In link |
| `/login` | Client component: email+password sign-in, plus password-reset request |
| `/reset-password` | Client component: sets a new password after the email link |
| `/auth/callback` | Exchanges the reset/confirm code for a session, redirects to `next` (default `/today`) |
| `/(app)/today` | Dashboard: due tasks, going-cold contacts, stalled high-conviction companies |
| `/(app)/capture` | Paste a note → Claude parses → editable preview → confirm |
| `/(app)/contacts`, `/(app)/contacts/[id]` | List + add form; detail with timeline, open tasks, edit rail |
| `/(app)/companies`, `/(app)/companies/[id]` | Sortable pipeline table; detail with roles, contacts, timeline, edit rail |
| `/(app)/roles/[id]` | Role detail: operating conditions, status, conviction, edit rail |
| `/api/parse` | POST-only route handler for the capture box (`maxDuration = 30`) |

`app/(app)/layout.tsx` provides the sidebar + centered content column. It is
presentation only — **auth is enforced per page** by `requireUser()`.

## Data model

Five tables, defined in `supabase/migrations/`. The migration files are the
source of truth; `lib/db/types.ts` is a **hand-written** mirror of them (no
generated Supabase types). Change both together.

Migrations are applied **by hand** through the Supabase Dashboard SQL Editor —
the app has no DB password or Management API token, and the anon key can't run
DDL. That's why list pages catch load errors and render a message pointing at
`supabase/migrations/`: it lets a deploy be verified before its migration has
been run. Keep that behavior when adding tables.

### `companies`
`id`, `name` (not null), `created_at`. Everything else nullable free text:
`stage`, `investors`, `geography`, `thesis_fit_notes`,
`founder_delegation_style`, `autonomy_scope`, `status`, `website`.
- `social_pct` — int 0–100, how externally-facing the role is. Null = unknown.
- `conviction` — int 1–5, **how much the user personally wants this
  opportunity**. Deliberately independent of any contact's relationship warmth.
  Null = unranked: it sorts last on `/companies` and is excluded from the
  stalled-targets list (which filters `conviction >= 4`).

### `roles`
A specific seat being tracked, separate from the company it's at — a company
can have several roles worth tracking at once, or be a networking source
without being a target at all. `id`, `company_id` → `companies(id)`
**NOT NULL**, `ON DELETE CASCADE` (deleting a company deletes its roles),
`created_at`, `updated_at`, plus:
- `title`, `job_url`, `notes` — nullable free text.
- `status` — `watching | in conversation | interviewing | closed`, defaults
  `'watching'`. **No CHECK constraint** (mirrors `tasks.status`) — only a
  `<select>` writes it. `lib/roles.ts` (`ROLE_STATUSES`) is the single source
  of truth for valid values and must stay in sync with the UI.
- `conviction` — int 1–5, how much the user wants *this seat*, independent of
  `companies.conviction`.
- `source` — `warm intro | founder direct | recruiter | inbound | cold apply`,
  free text; `lib/roles.ts` (`ROLE_SOURCES`) is the source of truth.
- `referrer_contact_id` → `contacts(id)` `ON DELETE SET NULL`.
- `autonomy_scope`, `social_pct`, `founder_delegation_style` — role-level
  duplicates of the same-named columns on `companies`. **Both copies are
  still live and independently edited** (`/companies/[id]` edits the
  company's, `/roles/[id]` edits the role's) pending a manual data migration
  to retire the company-level ones. Don't drop either side without doing
  that migration first.
- `status_changed_at` — timestamptz, bumped only when `status` actually
  changes (`updateRole` in `lib/db/roles.ts` reads the current value before
  writing, so re-saving the form without touching the dropdown doesn't reset
  the clock). This is what `listStalledRoles()` filters on.

### `contacts`
`id`, `name` (not null), `created_at`, plus:
- `company_id` → `companies(id)` `ON DELETE SET NULL`. Null = unaffiliated;
  the UI shows "No company".
- `role`, `hook` (why they're worth staying close to), `source` (how you met),
  `linkedin_url`, `email` — nullable free text.
- `type` — intended values `operator | finance | recruiter`, but **there is no
  CHECK constraint**; the manual edit form is a free-text input. Only the
  capture parser restricts it to the enum.
- `warmth` — int 1–5 (CHECK enforced). Null = unrated; `RatingDots` renders `—`.
- `last_touch_at` — timestamptz. Null = never touched, which counts as
  *maximally* overdue in the going-cold ranking. Only the capture flow's
  interaction path writes this automatically; otherwise it's edited by hand on
  the contact detail page.
- `cadence` — `weekly | monthly | quarterly` (CHECK enforced). **Null means the
  contact is excluded from the "Going cold" list entirely** — it's an explicit
  opt-in to being nagged, not a missing value to backfill. `lib/cadence.ts`
  (`CADENCE_OPTIONS`) is the single source for values, day intervals, and
  labels, and must stay in sync with the CHECK constraint.

### `interactions`
- `contact_id` → `contacts(id)` **NOT NULL**, `ON DELETE CASCADE`. An
  interaction without a person is meaningless.
- `company_id` → `companies(id)` `ON DELETE SET NULL` (denormalized; company
  timelines are assembled from the contacts' interactions, not this column).
- `role_id` → `roles(id)` `ON DELETE SET NULL`. Added so a future change
  wouldn't need another migration — **nothing reads or writes it yet.**
- `direction` (`in | out`), `channel` (`email | linkedin | call | inperson`),
  `summary` — all nullable, no CHECK constraints.
- `raw_text` — the original pasted note. Only the capture flow sets it.
- `occurred_at` not null, defaults to `now()`.

There is **no manual interaction-creation UI**. Interactions only enter the
system through `/capture`.

### `tasks`
- `contact_id` (nullable, cascade) and `company_id` (nullable, set null) — a
  task can float free of both.
- `role_id` → `roles(id)` `ON DELETE SET NULL`. Same as on `interactions`:
  **nothing reads or writes it yet.**
- `title` not null; `due_date` date, nullable — **a task with no due date never
  appears on `/today`** (`listDueTasks` filters `due_date is not null`).
- `status` text, default `'open'`. The comment says `open | done | snoozed`, but
  nothing ever writes `'snoozed'`: `snoozeTaskAction` pushes `due_date` forward
  by N days and leaves the status `open`. Don't assume the third state is live.
- `source_interaction_id` → `interactions(id)` `ON DELETE SET NULL`, set when
  capture derives a follow-up from an interaction.

### Derived views (computed in app code, not SQL)

The Supabase JS client can't express these in one query, and a personal CRM's
row counts are tiny, so they're deliberately computed in TypeScript:

- `listColdContacts()` (`lib/db/contacts.ts`) — contacts with a cadence set,
  ranked by overdue **ratio** (`daysSinceTouch / cadenceDays`), so three weeks
  past a weekly cadence outranks one week past a quarterly one. Never-touched
  contacts sort first (`Infinity`).
- `listStalledHighConvictionCompanies()` (`lib/db/companies.ts`) — conviction
  ≥ 4 with no interaction in 14 days, counting interactions attached either to
  the company directly or to any of its contacts.
- `listStalledRoles()` (`lib/db/roles.ts`) — roles with status `in
  conversation` or `interviewing` (`ACTIVE_ROLE_STATUSES`, the only statuses
  considered to have live momentum) whose `status_changed_at` is more than
  `ROLE_STALL_DAYS` (10) days old.

## Conventions — don't break these

**Server-rendered by default.** Every page under `app/(app)/` is an async
Server Component that calls `await requireUser()` and then reads through
`lib/db/*`. Data access is server-only; the browser Supabase client
(`lib/supabase.ts`) is used *only* for auth on `/login` and `/reset-password`.

**Mutations go through plain server-action forms.** `"use server"` actions live
in `app/(app)/contacts/actions.ts`, `app/(app)/companies/actions.ts`, and
`app/tasks/actions.ts`. The pattern is:

```tsx
const update = updateContactAction.bind(null, contact.id);
<form action={update}>…<Button type="submit">Save</Button></form>
```

Every action re-checks `requireUser()`, normalizes `FormData` through
`lib/forms.ts` (`formText` / `formInt` / `formTimestamp` turn empty strings into
`null` to match the nullable columns), then calls `revalidatePath()` for every
affected route. No client state, no optimistic UI, no fetch-from-client.

Where a control needs to show/hide, use `<details>/<summary>` rather than
reaching for `"use client"` — see `components/task-due-date-editor.tsx` and
`components/contact-cadence-editor.tsx`.

**The capture flow is the one intentional exception.** Only five client
components exist: `app/login/page.tsx`, `app/reset-password/page.tsx`,
`components/sidebar.tsx` (needs `usePathname`), and the capture pair
`components/capture/capture-form.tsx` + `preview-card.tsx`. Capture earns it: it
does a slow round trip to Claude, renders a fully editable draft, and saves
nothing until you press Confirm — which needs real client state and the only
client→server `fetch` in the app (`POST /api/parse`). (There is no command
palette in the codebase today; if one is added, it belongs in this same
exception category.)

**Auth: email + password, and signups are DISABLED in Supabase.** RLS is enabled
on all five tables with a single policy each —
`for all to authenticated using (true) with check (true)` — so *any*
authenticated user has full read/write access to *all* data. The login gate is
the only thing protecting it. Therefore:

- Never add a signup flow, invite flow, or anything that creates Supabase users
  from the app. New/replacement accounts are provisioned out-of-band by
  `scripts/create-admin-user.mjs`, which prompts for the service-role key
  interactively.
- Never loosen the RLS policies or grant the `anon` role access.
- `middleware.ts` only refreshes the session cookie — it does **not** gate
  routes. Route protection is `requireUser()` in each page and each action.
  Keep calling it in both places even though RLS is a backstop.

**Secrets live in `.env.local`** (gitignored via `.env*`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`ANTHROPIC_API_KEY`. The same values must exist in the Vercel project's
environment variables — `/api/parse` returns an explicit error naming the
missing key when `ANTHROPIC_API_KEY` is unset. The **service-role key is never
stored anywhere** — not in `.env.local`, not in Vercel, not in a commit.

## Capture pipeline (`/capture`)

1. `POST /api/parse` authenticates, then loads **all** contacts and companies
   and embeds them (id + name) in the system prompt (`lib/capture/prompt.ts`) so
   the model can match against existing records instead of duplicating them.
   Today's date is injected so relative dates ("next Tuesday") resolve.
2. The model returns a **flat wire object** (`captureWireSchema`), which
   `wireToParseResult()` narrows into the `parseResultSchema` discriminated
   union (`contact | company | interaction | task`).
3. Hallucinated `matched_*_id` values are dropped unless they appear in the
   lists that were sent to the model.
4. `PreviewCard` renders the draft as editable fields; `confirmCaptureAction`
   (`lib/capture/actions.ts`) re-validates against `parseResultSchema` and only
   then writes — resolving/creating the company and contact, inserting the
   interaction with its `raw_text`, creating any follow-up task, and bumping the
   contact's `last_touch_at` (and `warmth`, if the model suggested a change).
5. When a `contact` or `company` note matches an existing record,
   `confirmCaptureAction` only patches the fields the note actually gave a
   value for (`definedOnly()` drops the rest before the update). A field the
   note didn't mention comes back from `wireToParseResult()` as `null`, and a
   full-object update would otherwise blank out whatever was already saved
   there — this was a real data-loss bug (recapturing "Sarah got promoted to
   VP Eng" wiped her hook/source/warmth/etc.) before the guard was added. The
   `interaction` and `task` branches don't need this: they only ever create
   rows or touch specific known fields, never a full-object update.

The capture flow does not create or update `cadence` or `roles` — deliberately
deferred until the owner has used the roles UI directly and decided whether
the parser should manage them too.

**Do not "simplify" the two schemas in `lib/capture/schema.ts` into one.** The
split is forced by the structured-outputs API: it rejects `oneOf`, rejects
`anyOf` alongside `$defs` (which is what a Zod discriminated union compiles to),
caps a schema at 16 union-typed parameters (each `.nullable()` counts as one),
and strips numeric `min`/`max`. Hence the flat shape, the sentinel values
(`""` for text, `"none"` for enums, `0` / `-1` for numbers) mapped back to null,
and the ranges restated in `.describe()` text. The file's header comment
explains each constraint; read it before touching that schema.

## Visual system

Established in the "Rebuild the UI around a shared row/layout system" and
"Apply olive/sky-blue visual theme" commits — follow it rather than inventing
per-page styling.

- `components/ui/row.tsx` is the row primitive for every list that fits its
  shape — one primary line, one secondary line, right-aligned meta (tasks,
  contacts, timeline entries): `RowList` / `Row` / `RowMain` / `RowTitle` /
  `RowSubtitle` / `RowMeta` / `Pill` / `SectionLabel` / `EmptyState`. `Row
  href=…` + `RowTitle stretch` makes the whole row one click target with a
  single focusable element.
- `/companies` is the one deliberate exception: `components/company-pipeline-table.tsx`
  renders it as a `<table>`, not through `Row`. It has six independently
  sortable columns, and two of them (contact count, last interaction) are
  cross-table rollups that a single-primary/single-secondary row can't lay
  out. Sort state lives in the URL (`lib/company-sort.ts`) and is applied
  server-side, so the rendered page and a shared link always agree. Reach for
  `Row` first for any new list; only drop to a table if the column count and
  sortability genuinely don't fit it.
- **Color signals meaning, and only one meaning**: conviction and warmth, drawn
  as olive `RatingDots`. Pills, avatars, timeline marks, and status text stay
  neutral. Primary is deep olive; sky-blue is the focus ring / rare accent.
- `components/ui/heading.tsx` (`DisplayHeading`, Fraunces serif) is reserved for
  major page headings — the Today title and contact/company names. Everything
  else is Geist Sans. `components/ui/avatar.tsx` gives people circles and
  companies rounded squares.
- `app/globals.css` carries a fix comment on `--font-sans`: it must point at the
  `next/font` variable, not itself. A circular value silently fell back to the
  browser's default serif app-wide once already.
- Dark-mode variables exist under `.dark`, but nothing sets that class — there
  is no theme toggle yet.
