import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, CAPTURE_MODEL } from "@/lib/anthropic";
import { buildSystemPrompt } from "@/lib/capture/prompt";
import { parseResultSchema, type ParseResult } from "@/lib/capture/schema";
import { listCompanies } from "@/lib/db/companies";
import { listContacts } from "@/lib/db/contacts";
import { createClient } from "@/lib/supabase-server";

export const maxDuration = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let text: string;
  try {
    const body = await request.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!text) {
    return Response.json({ error: "Paste some text to parse" }, { status: 400 });
  }

  let contacts, companies;
  try {
    [contacts, companies] = await Promise.all([listContacts(), listCompanies()]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: `Could not load existing contacts/companies: ${message}` },
      { status: 500 },
    );
  }

  const existingContacts = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    company_name: c.companies?.name ?? null,
  }));
  const existingCompanies = companies.map((c) => ({ id: c.id, name: c.name }));
  const contactIds = new Set(existingContacts.map((c) => c.id));
  const companyIds = new Set(existingCompanies.map((c) => c.id));

  const system = buildSystemPrompt(existingContacts, existingCompanies);

  let response;
  try {
    response = await anthropic.messages.parse({
      model: CAPTURE_MODEL,
      max_tokens: 4096,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(parseResultSchema),
      },
      system,
      messages: [{ role: "user", content: text }],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: "Anthropic API rate limit hit — try again in a moment." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json(
        { error: "Anthropic API key is missing or invalid. Check ANTHROPIC_API_KEY." },
        { status: 500 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json(
        { error: `Anthropic API error: ${error.message}` },
        { status: 502 },
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `Parse failed: ${message}` }, { status: 500 });
  }

  if (response.stop_reason === "refusal") {
    return Response.json(
      { error: "The model declined to process this note. Try rephrasing it." },
      { status: 422 },
    );
  }

  if (!response.parsed_output) {
    return Response.json(
      { error: "Could not parse a structured result from that note — try rephrasing or simplifying it." },
      { status: 422 },
    );
  }

  const result: ParseResult = response.parsed_output;

  // Defense against a hallucinated id: only trust matched_*_id values that
  // are actually in the lists we gave the model.
  if ("matched_contact_id" in result && result.matched_contact_id && !contactIds.has(result.matched_contact_id)) {
    result.matched_contact_id = null;
  }
  if (result.matched_company_id && !companyIds.has(result.matched_company_id)) {
    result.matched_company_id = null;
  }

  return Response.json({ result, raw_text: text });
}
