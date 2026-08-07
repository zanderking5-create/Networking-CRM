import { cadenceDays } from "@/lib/cadence";
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

export type ColdContact = ContactWithCompany & {
  cadence_days: number;
  // Days since last touch; null when the contact has never been touched.
  days_since_touch: number | null;
};

// Contacts overdue against their own keep-in-touch cadence. Each contact
// carries its own threshold, so the comparison can't be a single WHERE
// clause — we fetch the ones that opted in (cadence not null) and evaluate
// per row. A personal CRM's contact list is small enough that this stays
// cheap.
//
// Ranking is by overdue *ratio* (days elapsed / cadence interval), not by
// absolute days, so being three weeks past a weekly cadence outranks being
// one week past a quarterly one. Never-touched contacts rank first.
export async function listColdContacts(): Promise<ColdContact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, companies(id, name)")
    .not("cadence", "is", null);
  if (error) throw new Error(error.message);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const scored = ((data ?? []) as ContactWithCompany[]).flatMap((contact) => {
    const interval = cadenceDays(contact.cadence);
    // Guards against a cadence value the CHECK constraint would reject.
    if (interval === null) return [];

    const daysSince =
      contact.last_touch_at === null
        ? null
        : Math.floor((now - new Date(contact.last_touch_at).getTime()) / dayMs);

    // Never touched counts as maximally overdue; otherwise it has to be past
    // the contact's own interval to qualify.
    const ratio = daysSince === null ? Infinity : daysSince / interval;
    if (ratio <= 1) return [];

    const cold: ColdContact = {
      ...contact,
      cadence_days: interval,
      days_since_touch: daysSince,
    };
    return [{ cold, ratio }];
  });

  return scored.sort((a, b) => b.ratio - a.ratio).map(({ cold }) => cold);
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
