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
