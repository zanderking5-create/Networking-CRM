import { createClient } from "@/lib/supabase-server";
import type {
  Contact,
  ContactInsert,
  ContactUpdate,
  ContactWithCompany,
} from "./types";

export async function listContacts(): Promise<ContactWithCompany[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, companies(id, name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContactWithCompany[];
}

// Warm relationships (warmth >= 4) going stale: never touched, or not
// touched in 30+ days. Never-touched contacts sort first as the most
// neglected, then oldest last_touch_at.
export async function listColdContacts(): Promise<ContactWithCompany[]> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, companies(id, name)")
    .gte("warmth", 4)
    .or(`last_touch_at.is.null,last_touch_at.lt.${cutoff}`)
    .order("last_touch_at", { ascending: true, nullsFirst: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ContactWithCompany[];
}

export async function listContactsByCompany(
  companyId: string,
): Promise<Contact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Contact[];
}

export async function getContact(id: string): Promise<Contact | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Contact | null;
}

// Case-insensitive exact-name lookup, used by the capture flow to avoid
// creating a duplicate contact when the parser didn't confidently match one.
export async function findContactByName(name: string): Promise<Contact | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .ilike("name", name)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Contact | null;
}

export async function createContact(input: ContactInsert): Promise<Contact> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Contact;
}

export async function updateContact(
  id: string,
  input: ContactUpdate,
): Promise<Contact> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Contact;
}

export async function deleteContact(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
