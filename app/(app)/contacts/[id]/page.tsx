import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { TaskDueDateEditor } from "@/components/task-due-date-editor";
import { Timeline } from "@/components/timeline";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { RatingDots } from "@/components/ui/rating-dots";
import { EmptyState, Pill, Row, RowList, RowMain, RowTitle, SectionLabel } from "@/components/ui/row";
import { requireUser } from "@/lib/auth";
import { listCompanies } from "@/lib/db/companies";
import { getContact } from "@/lib/db/contacts";
import { listInteractionsForContact } from "@/lib/db/interactions";
import { listOpenTasksForContact } from "@/lib/db/tasks";
import { formatDate, toDatetimeLocal } from "@/lib/forms";
import { deleteContactAction, updateContactAction } from "../actions";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
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

  const company = companies.find((c) => c.id === contact.company_id) ?? null;

  return (
    <>
      <header className="flex items-start gap-4">
        <Avatar name={contact.name} kind="person" size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <DisplayHeading className="text-3xl">{contact.name}</DisplayHeading>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {company && (
              <Link
                href={`/companies/${company.id}`}
                className="transition-colors hover:text-primary"
              >
                {company.name}
              </Link>
            )}
            {company && contact.role && <span aria-hidden="true">·</span>}
            {contact.role && <span>{contact.role}</span>}
            {contact.type && <Pill>{contact.type}</Pill>}
            {contact.warmth != null && (
              <span className="flex items-center gap-1.5">
                <span className="text-xs">Warmth</span>
                <RatingDots value={contact.warmth} label="Warmth" />
              </span>
            )}
          </div>
        </div>
      </header>

      {/* History is what you open a contact to read, so it leads; the edit
          form moves into a rail rather than sitting between you and it. */}
      <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          <section className="space-y-1">
            <SectionLabel count={openTasks.length}>Open tasks</SectionLabel>
            {openTasks.length === 0 ? (
              <EmptyState>No open tasks.</EmptyState>
            ) : (
              <RowList>
                {openTasks.map((task) => (
                  <Row key={task.id}>
                    <RowMain>
                      <RowTitle>{task.title}</RowTitle>
                    </RowMain>
                    <TaskDueDateEditor
                      taskId={task.id}
                      dueDate={task.due_date}
                      label={task.due_date ? formatDate(task.due_date) : "No due date"}
                      labelClassName="text-xs text-muted-foreground"
                    />
                  </Row>
                ))}
              </RowList>
            )}
          </section>

          <section className="space-y-1">
            <SectionLabel count={interactions.length}>Interaction timeline</SectionLabel>
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
        </div>

        <aside className="space-y-3">
          <SectionLabel>Details</SectionLabel>
          <form action={update} className="space-y-4">
        <Field label="Name">
          <Input name="name" defaultValue={contact.name} required />
        </Field>
        <Field label="Company">
          <select
            name="company_id"
            defaultValue={contact.company_id ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
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
        <Field label="Type (operator, finance, recruiter)">
          <Input name="type" defaultValue={contact.type ?? ""} />
        </Field>
        <Field label="Warmth (1-5)">
          <Input
            name="warmth"
            type="number"
            inputMode="numeric"
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

          <form action={remove} className="border-t border-border/60 pt-4">
            <Button variant="destructive" size="sm" type="submit">
              Delete Contact
            </Button>
          </form>
        </aside>
      </div>
    </>
  );
}
