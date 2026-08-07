"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formInt, formText, formTimestamp } from "@/lib/forms";
import {
  createContact,
  deleteContact,
  updateContact,
} from "@/lib/db/contacts";

export async function createContactAction(formData: FormData) {
  await requireUser();
  const name = formText(formData, "name");
  if (!name) throw new Error("Name is required");

  await createContact({
    name,
    company_id: formText(formData, "company_id"),
    type: formText(formData, "type"),
    warmth: formInt(formData, "warmth"),
  });

  revalidatePath("/contacts");
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
