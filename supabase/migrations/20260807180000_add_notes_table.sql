-- Adds "notes": a standing thought or observation with no event attached --
-- distinct from an interaction, which is always a timestamped call/email/
-- message. Notes are for research, thesis-fit thinking, and anything else
-- worth writing down that didn't happen at a specific moment.
-- Apply via the Supabase Dashboard SQL Editor (or `supabase db push`).

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index notes_contact_id_idx on public.notes (contact_id);
create index notes_company_id_idx on public.notes (company_id);

alter table public.notes enable row level security;

-- Matches the single-user policy on every other table.
create policy "authenticated_full_access" on public.notes
  for all to authenticated using (true) with check (true);
