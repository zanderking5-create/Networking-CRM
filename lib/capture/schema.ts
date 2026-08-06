import { z } from "zod";

// Shape returned by the parser (app/api/parse) and re-validated on confirm
// (lib/capture/actions.ts). The user can edit any field in the preview card
// before it's sent back for confirmation, so both directions use this same
// schema as the contract.

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
