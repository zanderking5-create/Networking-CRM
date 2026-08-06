import { createClient } from "@/lib/supabase-server";
import type { Company, Contact, Task } from "./types";

export type TaskWithLinks = Task & {
  contacts: Pick<Contact, "id" | "name"> | null;
  companies: Pick<Company, "id" | "name"> | null;
};

// Open tasks due today or earlier -- the "what do I owe" list for the Today
// dashboard, oldest due date first.
export async function listDueTasks(): Promise<TaskWithLinks[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("tasks")
    .select("*, contacts(id, name), companies(id, name)")
    .eq("status", "open")
    .not("due_date", "is", null)
    .lte("due_date", today)
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TaskWithLinks[];
}

export async function updateTaskStatus(id: string, status: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateTaskDueDate(
  id: string,
  dueDate: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: dueDate })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

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
