import { createClient } from "@/lib/supabase-server";
import type { Company, CompanyInsert, CompanyUpdate } from "./types";

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
