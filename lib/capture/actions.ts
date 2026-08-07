"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createCompany,
  findCompanyByName,
  updateCompany,
} from "@/lib/db/companies";
import {
  createContact,
  findContactByName,
  updateContact,
} from "@/lib/db/contacts";
import { createInteraction } from "@/lib/db/interactions";
import { createTask } from "@/lib/db/tasks";
import { parseResultSchema, type ParseResult } from "./schema";

// Resolves a company id: use the parser's match if it gave one, otherwise
// look up (or create) a company by the free-text name the user typed/edited.
async function resolveCompanyId(
  matchedId: string | null,
  name: string | null,
): Promise<string | null> {
  if (matchedId) return matchedId;
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const existing = await findCompanyByName(trimmed);
  if (existing) return existing.id;
  const created = await createCompany({ name: trimmed });
  return created.id;
}

async function resolveContactId(
  matchedId: string | null,
  name: string | null,
  companyId: string | null,
): Promise<string | null> {
  if (matchedId) return matchedId;
  const trimmed = name?.trim();
  if (!trimmed) return null;
  const existing = await findContactByName(trimmed);
  if (existing) return existing.id;
  const created = await createContact({ name: trimmed, company_id: companyId });
  return created.id;
}

// Accepts a date-only (YYYY-MM-DD) or full ISO string; returns a timestamptz
// string, or null if it doesn't parse.
function toTimestamp(dateStr: string): string | null {
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// On create, a null is a real value -- "no answer yet" for a field the note
// didn't touch. On update it means something different: the note simply
// didn't mention that field, and the wire schema's sentinel mapping (see
// lib/capture/schema.ts) can't tell "not mentioned" apart from "clear this."
// Sending those nulls through an update would blank out whatever was already
// saved on every re-capture of an existing contact or company, so an update
// only ever patches the fields the note actually gave a value for. Clearing a
// field on purpose is still possible -- that's what the contact/company edit
// forms are for.
function definedOnly<T extends object>(fields: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== null),
  ) as Partial<T>;
}

export async function confirmCaptureAction(
  input: ParseResult,
  rawText: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUser();

  const parsed = parseResultSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "The edited preview no longer matches the expected shape — please re-parse.",
    };
  }
  const result = parsed.data;

  try {
    switch (result.type) {
      case "contact": {
        const companyId = await resolveCompanyId(
          result.matched_company_id,
          result.contact.company_name,
        );
        const fields = {
          name: result.contact.name,
          company_id: companyId,
          role: result.contact.role,
          type: result.contact.type,
          warmth: result.contact.warmth,
          hook: result.contact.hook,
          source: result.contact.source,
          linkedin_url: result.contact.linkedin_url,
          email: result.contact.email,
        };
        if (result.matched_contact_id) {
          await updateContact(result.matched_contact_id, definedOnly(fields));
        } else {
          await createContact(fields);
        }
        break;
      }

      case "company": {
        if (result.matched_company_id) {
          await updateCompany(result.matched_company_id, definedOnly(result.company));
        } else {
          await createCompany(result.company);
        }
        break;
      }

      case "interaction": {
        const companyId = result.matched_company_id;
        const contactId = await resolveContactId(
          result.matched_contact_id,
          result.contact_name_if_new,
          companyId,
        );
        if (!contactId) {
          return {
            ok: false,
            error: "An interaction needs a contact — add a name before confirming.",
          };
        }

        const occurredAt = toTimestamp(result.occurred_at) ?? new Date().toISOString();

        const interaction = await createInteraction({
          contact_id: contactId,
          company_id: companyId,
          direction: result.direction,
          channel: result.channel,
          summary: result.summary,
          raw_text: rawText,
          occurred_at: occurredAt,
        });

        if (result.follow_up_task) {
          const dueDate = toTimestamp(result.follow_up_task.due_date);
          await createTask({
            contact_id: contactId,
            company_id: companyId,
            title: result.follow_up_task.title,
            due_date: dueDate ? dueDate.slice(0, 10) : null,
            source_interaction_id: interaction.id,
          });
        }

        await updateContact(contactId, {
          ...(result.suggested_warmth !== null
            ? { warmth: result.suggested_warmth }
            : {}),
          last_touch_at: occurredAt,
        });
        break;
      }

      case "task": {
        const companyId = result.matched_company_id;
        const contactId = await resolveContactId(
          result.matched_contact_id,
          result.contact_name_if_new,
          companyId,
        );
        await createTask({
          contact_id: contactId,
          company_id: companyId,
          title: result.title,
          due_date: result.due_date,
        });
        break;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }

  revalidatePath("/contacts");
  revalidatePath("/companies");
  revalidatePath("/today");
  return { ok: true };
}
