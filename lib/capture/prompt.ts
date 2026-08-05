import type { ExistingCompany, ExistingContact } from "./schema";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function buildSystemPrompt(
  existingContacts: ExistingContact[],
  existingCompanies: ExistingCompany[],
): string {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const weekday = WEEKDAYS[today.getUTCDay()];

  const contactsList = existingContacts.length
    ? existingContacts
        .map(
          (c) =>
            `- id=${c.id} name="${c.name}"${c.company_name ? ` company="${c.company_name}"` : ""}`,
        )
        .join("\n")
    : "(none yet)";

  const companiesList = existingCompanies.length
    ? existingCompanies.map((c) => `- id=${c.id} name="${c.name}"`).join("\n")
    : "(none yet)";

  return `You parse freeform notes for a personal networking / job-search CRM. The user pastes a quick note after a call, email, LinkedIn message, or research session, and you turn it into one structured record they can review and edit before it saves.

Today's date is ${todayIso} (${weekday}). Resolve every relative date ("in a week", "next Tuesday", "tomorrow") against this date and output an absolute ISO date (YYYY-MM-DD).

Classify the note into exactly one of four types and extract only that type's fields:
- "contact" — the note is primarily about a person: a new contact, or new info about an existing one (role, warmth, a hook, how you met, etc).
- "company" — the note is primarily about a company: stage, investors, geography, thesis fit, how the founder delegates, status, etc.
- "interaction" — the note describes something that happened with a person: a call, email, LinkedIn message, or in-person meeting. If the note implies a next step ("follow up in a week", "send him the doc Friday", "circle back after his trip"), also fill in follow_up_task.
- "task" — the note is a to-do with no interaction attached: something to do by some date, optionally tied to a contact or company.

Matching existing records: below are the contacts and companies already in the CRM. When the note names one of them, set matched_contact_id / matched_company_id to that exact id — do not invent an id that isn't in these lists. If the note names someone who isn't in the list, leave matched_contact_id null and put their name in contact_name_if_new (interaction/task) or in the contact's name field (contact type). If you're choosing between two similarly-named people, pick the more likely one and add an ambiguity note rather than leaving it unmatched.

Existing contacts:
${contactsList}

Existing companies:
${companiesList}

For "interaction" notes, direction is "out" if the user did the outreach (called, emailed, messaged them) and "in" if the other person initiated. Make your best call from phrasing like "called X" (out) vs "X reached out" / "X emailed me" (in); if it's genuinely unclear, still pick one and flag it in ambiguities.

Use the confidence field for your overall read on the note, and ambiguities for specific fields you had to guess at, invented, or left uncertain — an empty array is fine when nothing is ambiguous. Never fabricate specifics (dates, numbers, names) that aren't in the note or derivable from it; leave a field null instead.`;
}
