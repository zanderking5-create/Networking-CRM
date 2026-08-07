-- Adds "cadence" to contacts: how often the user intends to keep in touch
-- with this person. Null means no cadence is set, which excludes the contact
-- from the /today "Going cold" list entirely.
-- Apply via the Supabase Dashboard SQL Editor (or `supabase db push`).

alter table public.contacts
  add column cadence text check (cadence in ('weekly', 'monthly', 'quarterly'));
