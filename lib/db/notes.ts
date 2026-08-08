import { createClient } from "@/lib/supabase-server";
import type { Contact, Note } from "./types";

export type NoteWithContact = Note & {
  contacts: Pick<Contact, "id" | "name"> | null;
};

export async function listNotesForContact(contactId: string): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Note[];
}

// Notes written directly on the company page plus every note belonging to
// one of its contacts -- same "direct or via a contact" aggregation
// getCompanyActivity and the interaction timeline already use, so this
// reads as the complete picture of the company rather than just what was
// typed on this exact page.
export async function listNotesForCompany(
  companyId: string,
  contactIds: string[],
): Promise<NoteWithContact[]> {
  const supabase = await createClient();
  const orClauses = [`company_id.eq.${companyId}`];
  if (contactIds.length > 0) {
    orClauses.push(`contact_id.in.(${contactIds.join(",")})`);
  }
  const { data, error } = await supabase
    .from("notes")
    .select("*, contacts(id, name)")
    .or(orClauses.join(","))
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as NoteWithContact[];
}

export type NoteInsert = {
  contact_id?: string | null;
  company_id?: string | null;
  body: string;
};

export async function createNote(input: NoteInsert): Promise<Note> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Note;
}
