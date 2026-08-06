import { createClient } from "@/lib/supabase-server";
import type { Task } from "./types";

export async function listOpenTasksForContact(
  contactId: string,
): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("contact_id", contactId)
    .eq("status", "open")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

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
