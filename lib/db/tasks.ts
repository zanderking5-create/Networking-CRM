import { createClient } from "@/lib/supabase-server";
import type { Task } from "./types";

export type TaskInsert = {
  contact_id?: string | null;
  company_id?: string | null;
  title: string;
  due_date?: string | null;
  status?: string;
  source_interaction_id?: string | null;
};

export async function createTask(input: TaskInsert): Promise<Task> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Task;
}
