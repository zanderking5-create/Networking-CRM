"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isCadence } from "@/lib/cadence";
import { formInt, formText, formTimestamp } from "@/lib/forms";
import {
  createContact,
  deleteContact,
  updateContact,
} from "@/lib/db/contacts";

// Empty string (the "no cadence" option) and anything the DB CHECK
// constraint would reject both become null.
function formCadence(formData: FormData): string | null {
  const value = formText(formData, "cadence");
  return isCadence(value) ? value : null;
}

export async function createContactAction(formData: FormData) {
  await requireUser();
  const name = formText(formData, "name");
  if (!name) throw new Error("Name is required");

  await createContact({
    name,
    company_id: formText(formData, "company_id"),
    type: formText(formData, "type"),
    warmth: formInt(formData, "warmth"),
    cadence: formCadence(formData),
  });

  revalidatePath("/contacts");
}

export async function setContactCadenceAction(id: string, formData: FormData) {
  await requireUser();
  await updateContact(id, { cadence: formCadence(formData) });
  revalidatePath("/today");
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
}

export async function updateContactAction(id: string, formData: FormData) {
  await requireUser();
  const name = formText(formData, "name");
  if (!name) throw new Error("Name is required");

  await updateContact(id, {
    name,
    company_id: formText(formData, "company_id"),
    role: formText(formData, "role"),
    type: formText(formData, "type"),
    warmth: formInt(formData, "warmth"),
    hook: formText(formData, "hook"),
    source: formText(formData, "source"),
    linkedin_url: formText(formData, "linkedin_url"),
    email: formText(formData, "email"),
    last_touch_at: formTimestamp(formData, "last_touch_at"),
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
}

export async function deleteContactAction(id: string) {
  await requireUser();
  await deleteContact(id);
  revalidatePath("/contacts");
  redirect("/contacts");
}
