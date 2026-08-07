-- Adds "roles": the specific seat being tracked, separated from the company.
-- A company can have several roles worth tracking at once, and a company can
-- be a networking source without being a target at all.
--
-- Apply via the Supabase Dashboard SQL Editor (or `supabase db push`).
-- NOTE: this file contains TWO independent blocks. Run them one at a time —
-- pasting the whole file at once is what produced the earlier 42P07.

-- ===== BLOCK 1: roles table =====================================

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text,
  status text not null default 'watching',
  conviction int check (conviction between 1 and 5),
  source text,
  referrer_contact_id uuid references public.contacts(id) on delete set null,
  job_url text,
  autonomy_scope text,
  social_pct int check (social_pct between 0 and 100),
  founder_delegation_style text,
  notes text,
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index roles_company_id_idx on public.roles (company_id);
create index roles_referrer_contact_id_idx on public.roles (referrer_contact_id);

alter table public.roles enable row level security;

-- Matches the single-user policy on the existing four tables.
create policy "authenticated_full_access" on public.roles
  for all to authenticated using (true) with check (true);

-- ===== BLOCK 2: link interactions and tasks to a role ===========

alter table public.interactions
  add column role_id uuid references public.roles(id) on delete set null;

alter table public.tasks
  add column role_id uuid references public.roles(id) on delete set null;

create index interactions_role_id_idx on public.interactions (role_id);
create index tasks_role_id_idx on public.tasks (role_id);
