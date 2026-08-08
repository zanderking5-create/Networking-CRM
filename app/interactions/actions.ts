"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { updateContact } from "@/lib/db/contacts";
import { createInteraction } from "@/lib/db/interactions";
import { formInt, formText, formTimestamp } from "@/lib/forms";

// The only manual interaction-logging path outside /capture. contact_id
// always comes from the form itself (a hidden field on the contact page, a
// <select> over the company's contacts on the company page) rather than
// being bound, since interactions.contact_id is NOT NULL and the contact
// page's "this contact" isn't always the same record the company page
// would pick.
export async function createInteractionAction(
  companyId: string | null,
  formData: FormData,
) {
  await requireUser();
  const contactId = formText(formData, "contact_id");
  if (!contactId) return;

  const occurredAt = formTimestamp(formData, "occurred_at") ?? new Date().toISOString();
  const warmth = formInt(formData, "warmth");

  await createInteraction({
    contact_id: contactId,
    company_id: companyId,
    direction: formText(formData, "direction"),
    channel: formText(formData, "channel"),
    summary: formText(formData, "summary"),
    occurred_at: occurredAt,
  });

  // Mirrors what the capture flow's interaction path does -- a logged
  // interaction is a real touch, so it has to move last_touch_at or "Going
  // cold" would keep counting this contact as overdue despite it.
  await updateContact(contactId, {
    ...(warmth !== null ? { warmth } : {}),
    last_touch_at: occurredAt,
  });

  revalidatePath(`/contacts/${contactId}`);
  if (companyId) revalidatePath(`/companies/${companyId}`);
  revalidatePath("/today");
}
