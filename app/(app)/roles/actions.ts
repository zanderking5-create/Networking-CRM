"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createRole, deleteRole, updateRole } from "@/lib/db/roles";
import { formInt, formText } from "@/lib/forms";

export async function createRoleAction(companyId: string, formData: FormData) {
  await requireUser();

  await createRole({
    company_id: companyId,
    title: formText(formData, "title"),
    status: formText(formData, "status") ?? "watching",
    conviction: formInt(formData, "conviction"),
    source: formText(formData, "source"),
    referrer_contact_id: formText(formData, "referrer_contact_id"),
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/today");
}

export async function updateRoleAction(id: string, formData: FormData) {
  await requireUser();

  const role = await updateRole(id, {
    title: formText(formData, "title"),
    status: formText(formData, "status") ?? "watching",
    conviction: formInt(formData, "conviction"),
    source: formText(formData, "source"),
    referrer_contact_id: formText(formData, "referrer_contact_id"),
    job_url: formText(formData, "job_url"),
    autonomy_scope: formText(formData, "autonomy_scope"),
    social_pct: formInt(formData, "social_pct"),
    founder_delegation_style: formText(formData, "founder_delegation_style"),
    notes: formText(formData, "notes"),
  });

  revalidatePath(`/roles/${id}`);
  revalidatePath(`/companies/${role.company_id}`);
  revalidatePath("/today");
}

// Status-only update, used by the RoleStatusEditor card control on the
// /roles pipeline board (and available to the company page's Roles list for
// the same quick-move-without-opening-the-full-form purpose).
export async function setRoleStatusAction(id: string, formData: FormData) {
  await requireUser();
  const status = formText(formData, "status");
  if (!status) return;

  const role = await updateRole(id, { status });

  revalidatePath("/roles");
  revalidatePath(`/roles/${id}`);
  revalidatePath(`/companies/${role.company_id}`);
  revalidatePath("/today");
}

export async function deleteRoleAction(id: string, companyId: string) {
  await requireUser();
  await deleteRole(id);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/today");
  redirect(`/companies/${companyId}`);
}
