"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createTask, updateTaskDueDate, updateTaskStatus } from "@/lib/db/tasks";
import { formText } from "@/lib/forms";

// The only manual task-creation path outside /capture -- a contact or
// company detail page's "Add a task" form. due_date comes straight from an
// <input type="date">, already the YYYY-MM-DD shape the `date` column wants.
export async function createTaskAction(
  contactId: string | null,
  companyId: string | null,
  formData: FormData,
) {
  await requireUser();
  const title = formText(formData, "title");
  if (!title) return;

  await createTask({
    contact_id: contactId,
    company_id: companyId,
    title,
    due_date: formText(formData, "due_date"),
  });

  if (contactId) revalidatePath(`/contacts/${contactId}`);
  if (companyId) revalidatePath(`/companies/${companyId}`);
  revalidatePath("/today");
}

export async function markTaskDoneAction(taskId: string) {
  await requireUser();
  await updateTaskStatus(taskId, "done");
  revalidatePath("/today");
  revalidatePath("/contacts");
}

export async function snoozeTaskAction(taskId: string, days: number) {
  await requireUser();
  const newDueDate = new Date();
  newDueDate.setDate(newDueDate.getDate() + days);
  await updateTaskDueDate(taskId, newDueDate.toISOString().slice(0, 10));
  revalidatePath("/today");
  revalidatePath("/contacts");
}

export async function setTaskDueDateAction(taskId: string, formData: FormData) {
  await requireUser();
  const dueDate = formData.get("due_date");
  if (typeof dueDate !== "string" || dueDate === "") return;
  await updateTaskDueDate(taskId, dueDate);
  revalidatePath("/today");
  revalidatePath("/contacts");
}
