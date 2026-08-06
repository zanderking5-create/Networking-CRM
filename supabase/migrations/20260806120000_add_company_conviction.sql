-- Adds "conviction" to companies: an integer 1-5 for how much the user
-- personally wants this opportunity -- an internal prioritization signal,
-- independent of any contact's relationship warmth.
-- Apply via the Supabase Dashboard SQL Editor (or `supabase db push`).

alter table public.companies
  add column conviction int check (conviction between 1 and 5);
