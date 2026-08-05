"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formInt, formText } from "@/lib/forms";
import {
  createCompany,
  deleteCompany,
  updateCompany,
} from "@/lib/db/companies";

export async function createCompanyAction(formData: FormData) {
  await requireUser();
  const name = formText(formData, "name");
  if (!name) throw new Error("Name is required");

  await createCompany({
    name,
    stage: formText(formData, "stage"),
    status: formText(formData, "status"),
    geography: formText(formData, "geography"),
    website: formText(formData, "website"),
  });

  revalidatePath("/companies");
}

export async function updateCompanyAction(id: string, formData: FormData) {
  await requireUser();
  const name = formText(formData, "name");
  if (!name) throw new Error("Name is required");

  await updateCompany(id, {
    name,
    stage: formText(formData, "stage"),
    investors: formText(formData, "investors"),
    geography: formText(formData, "geography"),
    thesis_fit_notes: formText(formData, "thesis_fit_notes"),
    founder_delegation_style: formText(formData, "founder_delegation_style"),
    autonomy_scope: formText(formData, "autonomy_scope"),
    social_pct: formInt(formData, "social_pct"),
    status: formText(formData, "status"),
    website: formText(formData, "website"),
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
}

export async function deleteCompanyAction(id: string) {
  await requireUser();
  await deleteCompany(id);
  revalidatePath("/companies");
  redirect("/companies");
}
