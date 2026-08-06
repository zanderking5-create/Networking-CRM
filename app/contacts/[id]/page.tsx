import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Nav } from "@/components/nav";
import { TaskDueDateEditor } from "@/components/task-due-date-editor";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { listCompanies } from "@/lib/db/companies";
import { getContact } from "@/lib/db/contacts";
import { listInteractionsForContact } from "@/lib/db/interactions";
import { listOpenTasksForContact } from "@/lib/db/tasks";
import { formatDate, toDatetimeLocal } from "@/lib/forms";
import { deleteContactAction, updateContactAction } from "../actions";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [contact, companies, interactions, openTasks] = await Promise.all([
    getContact(id),
    listCompanies(),
    listInteractionsForContact(id),
    listOpenTasksForContact(id),
  ]);
  if (!contact) notFound();

  const update = updateContactAction.bind(null, contact.id);
  const remove = deleteContactAction.bind(null, contact.id);

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <Nav />
      <h1 className="text-2xl font-semibold">{contact.name}</h1>

      <form action={update} className="space-y-3">
        <Field label="Name">
          <Input name="name" defaultValue={contact.name} required />
        </Field>
        <Field label="Company">
          <select
            name="company_id"
            defaultValue={contact.company_id ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">No company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role">
          <Input name="role" defaultValue={contact.role ?? ""} />
        </Field>
        <Field label="Type (operator | finance | recruiter)">
          <Input name="type" defaultValue={contact.type ?? ""} />
        </Field>
        <Field label="Warmth (1-5)">
          <Input
            name="warmth"
            type="number"
            min={1}
            max={5}
            defaultValue={contact.warmth ?? ""}
          />
        </Field>
        <Field label="Hook">
          <Input name="hook" defaultValue={contact.hook ?? ""} />
        </Field>
        <Field label="Source">
          <Input name="source" defaultValue={contact.source ?? ""} />
        </Field>
        <Field label="LinkedIn URL">
          <Input
            name="linkedin_url"
            defaultValue={contact.linkedin_url ?? ""}
          />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={contact.email ?? ""} />
        </Field>
        <Field label="Last touch">
          <Input
            name="last_touch_at"
            type="datetime-local"
            defaultValue={toDatetimeLocal(contact.last_touch_at)}
          />
        </Field>
        <Button type="submit">Save</Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Open tasks</h2>
        {openTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open tasks.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {openTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3">
                <span>{task.title}</span>
                <TaskDueDateEditor
                  taskId={task.id}
                  dueDate={task.due_date}
                  label={task.due_date ? formatDate(task.due_date) : "no due date"}
                  labelClassName="text-muted-foreground"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Interaction timeline</h2>
        <Timeline
          items={interactions.map((i) => ({
            id: i.id,
            occurred_at: i.occurred_at,
            direction: i.direction,
            channel: i.channel,
            summary: i.summary,
          }))}
        />
      </section>

      <form action={remove}>
        <Button variant="destructive" type="submit">
          Delete contact
        </Button>
      </form>
    </main>
  );
}
