-- Milestone 2: core CRM schema — companies, contacts, interactions, tasks.
-- Apply via the Supabase Dashboard SQL Editor (or `supabase db push`).

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stage text,
  investors text,
  geography text,
  thesis_fit_notes text,
  founder_delegation_style text,
  autonomy_scope text,
  social_pct int check (social_pct between 0 and 100),
  status text,
  website text,
  created_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_id uuid references public.companies(id) on delete set null,
  role text,
  type text, -- operator | finance | recruiter
  warmth int check (warmth between 1 and 5),
  hook text,
  source text,
  linkedin_url text,
  email text,
  last_touch_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  direction text, -- in | out
  channel text,   -- email | linkedin | call | inperson
  summary text,
  raw_text text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  title text not null,
  due_date date,
  status text not null default 'open', -- open | done | snoozed
  source_interaction_id uuid references public.interactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index contacts_company_id_idx on public.contacts (company_id);
create index interactions_contact_id_idx on public.interactions (contact_id);
create index interactions_company_id_idx on public.interactions (company_id);
create index tasks_contact_id_idx on public.tasks (contact_id);
create index tasks_company_id_idx on public.tasks (company_id);
create index tasks_source_interaction_id_idx on public.tasks (source_interaction_id);

alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.interactions enable row level security;
alter table public.tasks enable row level security;

-- Single-user app: any authenticated user has full access. Keep Supabase
-- signups disabled once the owner's account exists, or this policy grants
-- access to anyone who signs up.
create policy "authenticated_full_access" on public.companies
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on public.contacts
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on public.interactions
  for all to authenticated using (true) with check (true);
create policy "authenticated_full_access" on public.tasks
  for all to authenticated using (true) with check (true);
