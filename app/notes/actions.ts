"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createNote } from "@/lib/db/notes";
import { formText } from "@/lib/forms";

export async function createNoteAction(
  contactId: string | null,
  companyId: string | null,
  formData: FormData,
) {
  await requireUser();
  const body = formText(formData, "body");
  if (!body) return;

  await createNote({ contact_id: contactId, company_id: companyId, body });

  if (contactId) revalidatePath(`/contacts/${contactId}`);
  if (companyId) revalidatePath(`/companies/${companyId}`);
}
