import { createClient } from "@/lib/supabase-server";
import type { Contact, Interaction } from "./types";

export type InteractionWithContact = Interaction & {
  contacts: Pick<Contact, "id" | "name"> | null;
};

export async function listInteractionsForContact(
  contactId: string,
): Promise<Interaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("contact_id", contactId)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Interaction[];
}

// Combined timeline across a set of contacts (e.g. every contact at a
// company), newest first, with the contact's name attached so each entry
// can say who it was with.
export async function listInteractionsForContacts(
  contactIds: string[],
): Promise<InteractionWithContact[]> {
  if (contactIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interactions")
    .select("*, contacts(id, name)")
    .in("contact_id", contactIds)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as InteractionWithContact[];
}

export type InteractionInsert = {
  contact_id: string;
  company_id?: string | null;
  direction?: string | null;
  channel?: string | null;
  summary?: string | null;
  raw_text?: string | null;
  occurred_at?: string | null;
};

export async function createInteraction(
  input: InteractionInsert,
): Promise<Interaction> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interactions")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Interaction;
}
