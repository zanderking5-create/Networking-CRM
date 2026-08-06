import { z } from "zod";

// Two schemas live here, and the split is deliberate:
//
// - captureWireSchema is what we send to the Anthropic structured-outputs API.
//   It has to be a single flat object. The API rejects `oneOf` outright, and
//   rejects `anyOf` when the schema also carries `$defs` -- which is exactly
//   what a Zod discriminated union compiles to either way. So the wire shape
//   is one object with a `type` discriminator and every type's fields present
//   but nullable.
//
// - parseResultSchema is the discriminated union the rest of the app works
//   with: the preview card renders off it and the confirm action re-validates
//   against it. It never goes over the wire, so it can be as strict as we like.
//
// wireToParseResult() converts the first into the second.

export const ambiguitySchema = z.object({
  field: z.string().describe("Which field this note applies to, e.g. 'warmth' or 'due_date'."),
  note: z.string().describe("What is unclear or uncertain about it, in one sentence."),
});

const confidenceSchema = z.enum(["high", "medium", "low"]);

export const contactFieldsSchema = z.object({
  name: z.string(),
  company_name: z.string().nullable(),
  role: z.string().nullable(),
  type: z.enum(["operator", "finance", "recruiter"]).nullable(),
  // The numeric min/max below are stripped from the schema sent to the API
  // (the SDK enforces them client-side), so the range has to be stated in the
  // description or the model has no way to know it.
  warmth: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullable()
    .describe("Warmth of the relationship as an integer from 1 (cold) to 5 (warm). Must be between 1 and 5."),
  hook: z.string().nullable(),
  source: z.string().nullable(),
  linkedin_url: z.string().nullable(),
  email: z.string().nullable(),
});

export const companyFieldsSchema = z.object({
  name: z.string(),
  stage: z.string().nullable(),
  investors: z.string().nullable(),
  geography: z.string().nullable(),
  thesis_fit_notes: z.string().nullable(),
  founder_delegation_style: z.string().nullable(),
  autonomy_scope: z.string().nullable(),
  social_pct: z
    .number()
    .int()
    .min(0)
    .max(100)
    .nullable()
    .describe("Percentage of the role that is social/external-facing, as an integer from 0 to 100. Must be between 0 and 100."),
  status: z.string().nullable(),
  website: z.string().nullable(),
});

const contactResultSchema = z.object({
  type: z.literal("contact"),
  matched_contact_id: z
    .string()
    .nullable()
    .describe("An id from the existing-contacts list if this note clearly refers to one of them, else null."),
  matched_company_id: z.string().nullable(),
  contact: contactFieldsSchema,
  confidence: confidenceSchema,
  ambiguities: z.array(ambiguitySchema),
});

const companyResultSchema = z.object({
  type: z.literal("company"),
  matched_company_id: z
    .string()
    .nullable()
    .describe("An id from the existing-companies list if this note clearly refers to one of them, else null."),
  company: companyFieldsSchema,
  confidence: confidenceSchema,
  ambiguities: z.array(ambiguitySchema),
});

const interactionResultSchema = z.object({
  type: z.literal("interaction"),
  matched_contact_id: z
    .string()
    .nullable()
    .describe("An id from the existing-contacts list if the note names someone already in the CRM, else null."),
  contact_name_if_new: z
    .string()
    .nullable()
    .describe("The person's name to use when creating a new contact, when matched_contact_id is null."),
  matched_company_id: z.string().nullable(),
  direction: z
    .enum(["in", "out"])
    .describe("'out' if the user initiated/did the outreach, 'in' if the other person reached out. Best guess; flag in ambiguities if unclear."),
  channel: z.enum(["email", "linkedin", "call", "inperson"]).nullable(),
  summary: z.string().describe("A concise one- or two-sentence summary of what happened."),
  occurred_at: z
    .string()
    .describe("ISO 8601 date (YYYY-MM-DD) this interaction happened. Default to today if the note doesn't say."),
  follow_up_task: z
    .object({
      title: z.string(),
      due_date: z
        .string()
        .describe("YYYY-MM-DD, resolved from relative phrasing like 'in a week' or 'next Tuesday' against today's date."),
    })
    .nullable()
    .describe("Non-null only if the note implies a follow-up action is needed."),
  suggested_warmth: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullable()
    .describe("A new warmth rating for the contact if this interaction should change it, else null. Must be an integer between 1 (cold) and 5 (warm)."),
  warmth_reason: z.string().nullable(),
  confidence: confidenceSchema,
  ambiguities: z.array(ambiguitySchema),
});

const taskResultSchema = z.object({
  type: z.literal("task"),
  matched_contact_id: z.string().nullable(),
  contact_name_if_new: z.string().nullable(),
  matched_company_id: z.string().nullable(),
  title: z.string(),
  due_date: z.string().nullable().describe("YYYY-MM-DD if a due date was mentioned or implied."),
  confidence: confidenceSchema,
  ambiguities: z.array(ambiguitySchema),
});

export const parseResultSchema = z.discriminatedUnion("type", [
  contactResultSchema,
  companyResultSchema,
  interactionResultSchema,
  taskResultSchema,
]);

export type ParseResult = z.infer<typeof parseResultSchema>;
export type ContactFields = z.infer<typeof contactFieldsSchema>;
export type CompanyFields = z.infer<typeof companyFieldsSchema>;
export type Ambiguity = z.infer<typeof ambiguitySchema>;

export type ExistingContact = {
  id: string;
  name: string;
  company_name: string | null;
};

export type ExistingCompany = {
  id: string;
  name: string;
};

// --- Wire schema (what the Anthropic API actually receives) -----------------
//
// One flat object, no nested objects except the `ambiguities` array, and no
// unions. Structured outputs requires every property to appear in `required`,
// so "not applicable to this note's type" is expressed as null rather than by
// omitting the key. Descriptions carry the per-type guidance, since the schema
// itself can no longer express "these fields belong to an interaction".
//
// Nothing here is nullable, on purpose. The API caps a schema at 16
// union-typed parameters and counts every `.nullable()` as one, which this
// schema would blow past. So "not applicable" is encoded as a sentinel the
// model can always produce -- "" for text, "none" for enums, 0 (or -1 where 0
// is a legitimate value) for numbers -- and mapped back to null below.

const wireString = (description: string) =>
  z.string().describe(`${description} Use an empty string if it does not apply to this note.`);

export const captureWireSchema = z.object({
  type: z
    .enum(["contact", "company", "interaction", "task"])
    .describe(
      "Which kind of record this note describes. Fill in only the fields listed for this type and leave every other field empty.",
    ),

  matched_contact_id: wireString(
    "An id copied exactly from the existing-contacts list when the note refers to someone already in the CRM.",
  ),
  matched_company_id: wireString(
    "An id copied exactly from the existing-companies list when the note refers to a company already in the CRM.",
  ),

  person_name: wireString(
    "The person's name. For type 'contact' this is who the record is about; for 'interaction' and 'task' it is who it involves. Fill this in even when matched_contact_id is set.",
  ),

  // type: "contact"
  person_company_name: wireString(
    "For type 'contact': the company this person works at, as written in the note.",
  ),
  role: wireString("For type 'contact': the person's job title or role."),
  contact_type: z
    .enum(["operator", "finance", "recruiter", "none"])
    .describe(
      "For type 'contact': which bucket this person falls into. Use 'none' if unclear or not applicable.",
    ),
  warmth: z
    .number()
    .int()
    .describe(
      "For type 'contact': how warm the relationship is, as an integer from 1 (cold) to 5 (warm). Use 0 if the note gives no signal.",
    ),
  hook: wireString(
    "For type 'contact': the personal hook or reason this person is worth staying close to.",
  ),
  source: wireString("For type 'contact': how you met or found this person."),
  linkedin_url: wireString("For type 'contact': their LinkedIn URL."),
  email: wireString("For type 'contact': their email address."),

  // type: "company"
  company_name: wireString(
    "For type 'company': the name of the company this note is about.",
  ),
  stage: wireString("For type 'company': funding stage, e.g. 'Seed' or 'Series A'."),
  investors: wireString("For type 'company': notable investors."),
  geography: wireString("For type 'company': where the company is based."),
  thesis_fit_notes: wireString(
    "For type 'company': why this company does or does not fit what you are looking for.",
  ),
  founder_delegation_style: wireString(
    "For type 'company': how the founder delegates.",
  ),
  autonomy_scope: wireString(
    "For type 'company': how much autonomy the role would carry.",
  ),
  social_pct: z
    .number()
    .int()
    .describe(
      "For type 'company': percentage of the role that is social or external-facing, as an integer from 0 to 100. Use -1 if the note gives no signal.",
    ),
  status: wireString("For type 'company': where this company sits in your pipeline."),
  website: wireString("For type 'company': the company website."),

  // type: "interaction"
  direction: z
    .enum(["in", "out", "none"])
    .describe(
      "For type 'interaction': 'out' if you initiated (you called, emailed, or messaged them), 'in' if they reached out to you. Make your best call; if it is genuinely unclear, still pick one and add an ambiguity note. Use 'none' only for non-interaction notes.",
    ),
  channel: z
    .enum(["email", "linkedin", "call", "inperson", "none"])
    .describe(
      "For type 'interaction': how the conversation happened. Use 'none' if the note does not say.",
    ),
  summary: wireString(
    "For type 'interaction': a concise one- or two-sentence summary of what happened.",
  ),
  occurred_at: wireString(
    "For type 'interaction': the date it happened as YYYY-MM-DD. Use today's date if the note does not say.",
  ),
  follow_up_title: wireString(
    "For type 'interaction': the title of the follow-up task, but only if the note implies a next step is needed. Leave empty when no follow-up is implied.",
  ),
  follow_up_due_date: wireString(
    "For type 'interaction': when the follow-up is due, as YYYY-MM-DD, resolved from relative phrasing like 'in a week' or 'next Tuesday'.",
  ),
  suggested_warmth: z
    .number()
    .int()
    .describe(
      "For type 'interaction': a new warmth rating for the contact if this interaction should change it. Integer from 1 (cold) to 5 (warm), or 0 to leave warmth unchanged.",
    ),
  warmth_reason: wireString(
    "For type 'interaction': one short sentence on why the warmth changed.",
  ),

  // type: "task"
  task_title: wireString("For type 'task': what needs to be done."),
  task_due_date: wireString(
    "For type 'task': when it is due as YYYY-MM-DD, resolved from any relative phrasing.",
  ),

  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Your overall confidence in this reading of the note."),
  ambiguities: z
    .array(
      z.object({
        field: z
          .string()
          .describe("Which field this note applies to, e.g. 'warmth' or 'due_date'."),
        note: z
          .string()
          .describe("What is unclear or uncertain about it, in one sentence."),
      }),
    )
    .describe(
      "Specific fields you guessed at or left uncertain. Use an empty array when nothing is ambiguous.",
    ),
});

export type CaptureWire = z.infer<typeof captureWireSchema>;

// Sentinel -> null. The wire schema cannot express nullability (see above),
// so "" means "not applicable" for text and "none" for enums.
function text(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function choice<T extends string>(value: T | "none"): T | null {
  return value === "none" ? null : (value as T);
}

// `unset` is the sentinel meaning "no value"; anything else is clamped into
// range, since the API strips numeric bounds from the schema and the DB has
// CHECK constraints that would reject an out-of-range value outright.
function num(
  value: number,
  min: number,
  max: number,
  unset: number,
): number | null {
  if (value === unset) return null;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// Narrows the flat wire object into the discriminated union the app uses.
export function wireToParseResult(wire: CaptureWire): ParseResult {
  const common = {
    confidence: wire.confidence,
    ambiguities: wire.ambiguities,
  };
  const matchedContactId = text(wire.matched_contact_id);
  const matchedCompanyId = text(wire.matched_company_id);

  switch (wire.type) {
    case "contact":
      return {
        type: "contact",
        matched_contact_id: matchedContactId,
        matched_company_id: matchedCompanyId,
        contact: {
          name: text(wire.person_name) ?? "",
          company_name: text(wire.person_company_name),
          role: text(wire.role),
          type: choice(wire.contact_type),
          warmth: num(wire.warmth, 1, 5, 0),
          hook: text(wire.hook),
          source: text(wire.source),
          linkedin_url: text(wire.linkedin_url),
          email: text(wire.email),
        },
        ...common,
      };

    case "company":
      return {
        type: "company",
        matched_company_id: matchedCompanyId,
        company: {
          name: text(wire.company_name) ?? "",
          stage: text(wire.stage),
          investors: text(wire.investors),
          geography: text(wire.geography),
          thesis_fit_notes: text(wire.thesis_fit_notes),
          founder_delegation_style: text(wire.founder_delegation_style),
          autonomy_scope: text(wire.autonomy_scope),
          social_pct: num(wire.social_pct, 0, 100, -1),
          status: text(wire.status),
          website: text(wire.website),
        },
        ...common,
      };

    case "interaction": {
      const followUpTitle = text(wire.follow_up_title);
      return {
        type: "interaction",
        matched_contact_id: matchedContactId,
        contact_name_if_new: matchedContactId ? null : text(wire.person_name),
        matched_company_id: matchedCompanyId,
        direction: choice(wire.direction) ?? "out",
        channel: choice(wire.channel),
        summary: text(wire.summary) ?? "",
        occurred_at: text(wire.occurred_at) ?? today(),
        follow_up_task: followUpTitle
          ? {
              title: followUpTitle,
              due_date: text(wire.follow_up_due_date) ?? today(),
            }
          : null,
        suggested_warmth: num(wire.suggested_warmth, 1, 5, 0),
        warmth_reason: text(wire.warmth_reason),
        ...common,
      };
    }

    case "task":
      return {
        type: "task",
        matched_contact_id: matchedContactId,
        contact_name_if_new: matchedContactId ? null : text(wire.person_name),
        matched_company_id: matchedCompanyId,
        title: text(wire.task_title) ?? "",
        due_date: text(wire.task_due_date),
        ...common,
      };
  }
}
