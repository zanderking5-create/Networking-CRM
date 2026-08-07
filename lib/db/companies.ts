import { sortCompanies, type CompanySort } from "@/lib/company-sort";
import { createClient } from "@/lib/supabase-server";
import type { Company, CompanyInsert, CompanyUpdate } from "./types";

export type StalledCompany = Company & { last_interaction_at: string | null };

export type CompanyActivity = {
  contact_count: number;
  last_interaction_at: string | null;
};

// The one definition of "has anything happened at this company lately",
// shared by the /today stalled watchlist and the /companies pipeline table
// so the two can't drift: an interaction counts toward a company when it's
// tagged to the company directly OR to any contact who works there.
//
// Computed in app code rather than SQL since it combines two tables the JS
// client can't aggregate across in one call; company counts here are small
// enough that this stays cheap.
//
// Every requested id gets an entry, so callers can read the map without
// having to decide what a missing key means.
export async function getCompanyActivity(
  companyIds: string[],
): Promise<Map<string, CompanyActivity>> {
  const activity = new Map<string, CompanyActivity>(
    companyIds.map((id) => [id, { contact_count: 0, last_interaction_at: null }]),
  );
  if (companyIds.length === 0) return activity;

  const supabase = await createClient();

  const { data: contactsData, error: contactsError } = await supabase
    .from("contacts")
    .select("id, company_id")
    .in("company_id", companyIds);
  if (contactsError) throw new Error(contactsError.message);
  const contactToCompany = new Map<string, string>();
  for (const contact of contactsData ?? []) {
    if (!contact.company_id) continue;
    contactToCompany.set(contact.id, contact.company_id);
    const entry = activity.get(contact.company_id);
    if (entry) entry.contact_count += 1;
  }
  const contactIds = [...contactToCompany.keys()];

  const orClauses = [`company_id.in.(${companyIds.join(",")})`];
  if (contactIds.length > 0) {
    orClauses.push(`contact_id.in.(${contactIds.join(",")})`);
  }
  const { data: interactionsData, error: interactionsError } = await supabase
    .from("interactions")
    .select("company_id, contact_id, occurred_at")
    .or(orClauses.join(","));
  if (interactionsError) throw new Error(interactionsError.message);

  for (const interaction of interactionsData ?? []) {
    const companyId =
      interaction.company_id ??
      (interaction.contact_id ? contactToCompany.get(interaction.contact_id) : null);
    if (!companyId) continue;
    const entry = activity.get(companyId);
    if (!entry) continue;
    if (
      !entry.last_interaction_at ||
      interaction.occurred_at > entry.last_interaction_at
    ) {
      entry.last_interaction_at = interaction.occurred_at;
    }
  }

  return activity;
}

// High-conviction companies (conviction >= 4) with no interaction -- direct
// or via any of their contacts -- in the last 14 days.
export async function listStalledHighConvictionCompanies(): Promise<
  StalledCompany[]
> {
  const supabase = await createClient();

  const { data: companiesData, error: companiesError } = await supabase
    .from("companies")
    .select("*")
    .gte("conviction", 4);
  if (companiesError) throw new Error(companiesError.message);
  const companies = (companiesData ?? []) as Company[];
  if (companies.length === 0) return [];

  const activity = await getCompanyActivity(companies.map((c) => c.id));

  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return companies
    .map((company) => ({
      ...company,
      last_interaction_at: activity.get(company.id)?.last_interaction_at ?? null,
    }))
    .filter(
      (company) =>
        !company.last_interaction_at ||
        new Date(company.last_interaction_at).getTime() < cutoff,
    )
    .sort((a, b) => (b.conviction ?? 0) - (a.conviction ?? 0));
}

export type CompanyPipelineRow = Company & CompanyActivity;

// The /companies table. Ordering happens here, on the server, driven by the
// sort in the URL -- but deliberately not as a SQL ORDER BY: two sortable
// columns (contact count, last interaction) are cross-table rollups, and
// even the default sort tiebreaks a real column against one of those
// rollups, so no single ORDER BY could express it. Sorting the assembled
// list in one place also keeps every column agreeing on where nulls land.
export async function listCompanyPipeline(
  sort: CompanySort,
): Promise<CompanyPipelineRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  const companies = (data ?? []) as Company[];
  if (companies.length === 0) return [];

  const activity = await getCompanyActivity(companies.map((c) => c.id));
  const rows = companies.map((company) => ({
    ...company,
    contact_count: activity.get(company.id)?.contact_count ?? 0,
    last_interaction_at: activity.get(company.id)?.last_interaction_at ?? null,
  }));

  return sortCompanies(rows, sort);
}

// Ranked by conviction (highest first, nulls last) so the list reads as a
// target list, with recency as the tiebreaker.
export async function listCompanies(): Promise<Company[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("conviction", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Company[];
}

export async function getCompany(id: string): Promise<Company | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Company | null;
}

// Case-insensitive exact-name lookup, used by the capture flow to avoid
// creating a duplicate company when the parser didn't confidently match one.
export async function findCompanyByName(name: string): Promise<Company | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .ilike("name", name)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Company | null;
}

export async function createCompany(input: CompanyInsert): Promise<Company> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Company;
}

export async function updateCompany(
  id: string,
  input: CompanyUpdate,
): Promise<Company> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Company;
}

export async function deleteCompany(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
