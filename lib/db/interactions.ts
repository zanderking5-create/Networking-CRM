import { createClient } from "@/lib/supabase-server";
import type { Interaction } from "./types";

export type InteractionInsert = {
  contact_id: string;
  company_id?: string | null;
  direction?: string | null;
  channel?: string | null;
  summary?: string | null;
  raw_text?: string | null;
  occurred_at?: string | null;
};

export async function createInteraction(
  input: InteractionInsert,
): Promise<Interaction> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interactions")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Interaction;
}
