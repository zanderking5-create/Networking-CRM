import { ACTIVE_ROLE_STATUSES, ROLE_STALL_DAYS } from "@/lib/roles";
import { createClient } from "@/lib/supabase-server";
import type { Company, Contact, Role, RoleInsert, RoleUpdate } from "./types";

export type RoleWithReferrer = Role & {
  contacts: Pick<Contact, "id" | "name"> | null;
};

export type StalledRole = Role & {
  companies: Pick<Company, "id" | "name"> | null;
  days_since_status_change: number;
};

export type RoleBoardCard = Role & {
  companies: Pick<Company, "id" | "name"> | null;
};

// Every role, for the /roles pipeline board -- grouped into status columns
// in app code (ROLE_STATUSES order), not fetched per-status, since a
// personal CRM's role count is small enough that one query beats four.
export async function listAllRoles(): Promise<RoleBoardCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*, companies(id, name)")
    .order("conviction", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoleBoardCard[];
}

export async function listRolesForCompany(
  companyId: string,
): Promise<RoleWithReferrer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*, contacts:referrer_contact_id(id, name)")
    .eq("company_id", companyId)
    .order("conviction", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoleWithReferrer[];
}

export type RoleWithLinks = Role & {
  companies: Pick<Company, "id" | "name"> | null;
  contacts: Pick<Contact, "id" | "name"> | null;
};

export async function getRole(id: string): Promise<RoleWithLinks | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*, companies(id, name), contacts:referrer_contact_id(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as RoleWithLinks | null;
}

export async function createRole(input: RoleInsert): Promise<Role> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Role;
}

// status_changed_at is maintained here rather than by the caller: it only
// moves when status actually changes, so re-saving the form without touching
// the dropdown doesn't reset the stall clock.
export async function updateRole(id: string, input: RoleUpdate): Promise<Role> {
  const supabase = await createClient();

  const patch: RoleUpdate & { updated_at: string; status_changed_at?: string } = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  if (input.status !== undefined) {
    const { data: current, error: readError } = await supabase
      .from("roles")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (current && current.status !== input.status) {
      patch.status_changed_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("roles")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Role;
}

export async function deleteRole(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("roles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Live roles that haven't moved in a while. Only "in conversation" and
// "interviewing" can stall — a watched or closed role isn't waiting on
// anything.
export async function listStalledRoles(): Promise<StalledRole[]> {
  const supabase = await createClient();
  const cutoff = new Date(
    Date.now() - ROLE_STALL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("roles")
    .select("*, companies(id, name)")
    .in("status", [...ACTIVE_ROLE_STATUSES])
    .lt("status_changed_at", cutoff)
    .order("status_changed_at", { ascending: true });
  if (error) throw new Error(error.message);

  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  return ((data ?? []) as (Role & { companies: Pick<Company, "id" | "name"> | null })[]).map(
    (role) => ({
      ...role,
      days_since_status_change: Math.floor(
        (now - new Date(role.status_changed_at).getTime()) / dayMs,
      ),
    }),
  );
}
