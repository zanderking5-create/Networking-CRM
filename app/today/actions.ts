"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { updateTaskDueDate, updateTaskStatus } from "@/lib/db/tasks";

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
