// Hand-written row types matching supabase/migrations/20260805020000_init_crm_schema.sql.
// The migration file is the source of truth; update both together.

export type Company = {
  id: string;
  name: string;
  stage: string | null;
  investors: string | null;
  geography: string | null;
  thesis_fit_notes: string | null;
  founder_delegation_style: string | null;
  autonomy_scope: string | null;
  social_pct: number | null;
  status: string | null;
  website: string | null;
  conviction: number | null; // 1-5, how much the user wants this opportunity
  created_at: string;
};

export type CompanyInsert = { name: string } & Partial<
  Omit<Company, "id" | "name" | "created_at">
>;
export type CompanyUpdate = Partial<Omit<Company, "id" | "created_at">>;

export type Contact = {
  id: string;
  name: string;
  company_id: string | null;
  role: string | null;
  type: string | null; // operator | finance | recruiter
  warmth: number | null; // 1-5
  hook: string | null;
  source: string | null;
  linkedin_url: string | null;
  email: string | null;
  last_touch_at: string | null;
  cadence: string | null; // weekly | monthly | quarterly; null = not tracked
  created_at: string;
};

export type ContactInsert = { name: string } & Partial<
  Omit<Contact, "id" | "name" | "created_at">
>;
export type ContactUpdate = Partial<Omit<Contact, "id" | "created_at">>;

export type ContactWithCompany = Contact & {
  companies: Pick<Company, "id" | "name"> | null;
};

// A specific seat being tracked, separate from the company. Role-level
// operating conditions (autonomy_scope, social_pct,
// founder_delegation_style) live here; the same columns still exist on
// companies pending a manual data migration.
export type Role = {
  id: string;
  company_id: string;
  title: string | null;
  status: string; // watching | in conversation | interviewing | closed
  conviction: number | null; // 1-5, how much the user wants THIS seat
  source: string | null; // warm intro | founder direct | recruiter | inbound | cold apply
  referrer_contact_id: string | null;
  job_url: string | null;
  autonomy_scope: string | null;
  social_pct: number | null;
  founder_delegation_style: string | null;
  notes: string | null;
  // Bumped whenever status changes — this is what makes stall detection work.
  status_changed_at: string;
  created_at: string;
  updated_at: string;
};

export type RoleInsert = { company_id: string } & Partial<
  Omit<Role, "id" | "company_id" | "created_at" | "updated_at">
>;
export type RoleUpdate = Partial<
  Omit<Role, "id" | "company_id" | "created_at" | "updated_at">
>;

export type Interaction = {
  id: string;
  contact_id: string;
  company_id: string | null;
  role_id: string | null;
  direction: string | null; // in | out
  channel: string | null; // email | linkedin | call | inperson
  summary: string | null;
  raw_text: string | null;
  occurred_at: string;
  created_at: string;
};

export type Task = {
  id: string;
  contact_id: string | null;
  company_id: string | null;
  role_id: string | null;
  title: string;
  due_date: string | null;
  status: string; // open | done | snoozed
  source_interaction_id: string | null;
  created_at: string;
};

// A standing thought or observation, not tied to any single event --
// distinct from an interaction, which always has a specific timestamped
// occurrence. Neither contact_id nor company_id is required, but a note
// created through the UI always has at least one: the contact/company
// detail page it was written from.
export type Note = {
  id: string;
  contact_id: string | null;
  company_id: string | null;
  body: string;
  created_at: string;
};
