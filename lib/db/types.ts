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
  created_at: string;
};

export type ContactInsert = { name: string } & Partial<
  Omit<Contact, "id" | "name" | "created_at">
>;
export type ContactUpdate = Partial<Omit<Contact, "id" | "created_at">>;

export type ContactWithCompany = Contact & {
  companies: Pick<Company, "id" | "name"> | null;
};

export type Interaction = {
  id: string;
  contact_id: string;
  company_id: string | null;
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
  title: string;
  due_date: string | null;
  status: string; // open | done | snoozed
  source_interaction_id: string | null;
  created_at: string;
};
