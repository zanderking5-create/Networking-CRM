import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { createInteractionAction } from "@/app/interactions/actions";
import { createNoteAction } from "@/app/notes/actions";
import { createTaskAction } from "@/app/tasks/actions";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { ContactCadenceEditor } from "@/components/contact-cadence-editor";
import { NotesList } from "@/components/notes-list";
import { TaskDueDateEditor } from "@/components/task-due-date-editor";
import { Timeline } from "@/components/timeline";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { RatingDots } from "@/components/ui/rating-dots";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Pill, Row, RowList, RowMain, RowTitle, SectionLabel } from "@/components/ui/row";
import { requireUser } from "@/lib/auth";
import { listCompanies } from "@/lib/db/companies";
import { getContact } from "@/lib/db/contacts";
import { listInteractionsForContact } from "@/lib/db/interactions";
import { listNotesForContact } from "@/lib/db/notes";
import { listOpenTasksForContact } from "@/lib/db/tasks";
import type { Company, Contact, Interaction, Note, Task } from "@/lib/db/types";
import { formatDate, toDatetimeLocal } from "@/lib/forms";
import { deleteContactAction, updateContactAction } from "../actions";

const selectClass =
  "h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70";

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

// Same "hidden until opened" pattern as the company page's "Add a role".
function AddSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="pt-3">
      <summary className="inline-flex cursor-pointer items-center rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        {label}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  let contact: Contact | null = null;
  let companies: Company[] = [];
  let interactions: Interaction[] = [];
  let openTasks: Task[] = [];
  let notes: Note[] = [];
  let loadError: string | null = null;
  try {
    [contact, companies, interactions, openTasks, notes] = await Promise.all([
      getContact(id),
      listCompanies(),
      listInteractionsForContact(id),
      listOpenTasksForContact(id),
      listNotesForContact(id),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  if (loadError) {
    return (
      <p className="text-sm text-destructive">
        Could not load this contact: {loadError}. If the tables don&apos;t
        exist yet, run the migration in supabase/migrations/ against your
        Supabase project.
      </p>
    );
  }
  if (!contact) notFound();

  const update = updateContactAction.bind(null, contact.id);
  const remove = deleteContactAction.bind(null, contact.id);
  const addTask = createTaskAction.bind(null, contact.id, contact.company_id);
  const addNote = createNoteAction.bind(null, contact.id, contact.company_id);
  const logInteraction = createInteractionAction.bind(null, contact.company_id);

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
            <ContactCadenceEditor
              contactId={contact.id}
              cadence={contact.cadence}
            />
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

            <AddSection label="Add a task">
              <form action={addTask} className="flex items-center gap-2">
                <Input name="title" placeholder="Task…" className="flex-1" required />
                <Input name="due_date" type="date" className="w-auto" />
                <Button size="sm" type="submit">
                  Add
                </Button>
              </form>
            </AddSection>
          </section>

          <section className="space-y-1">
            <SectionLabel count={notes.length}>Notes</SectionLabel>
            <NotesList
              items={notes.map((n) => ({
                id: n.id,
                body: n.body,
                created_at: n.created_at,
              }))}
            />

            <AddSection label="Add a note">
              <form action={addNote} className="space-y-2">
                <Textarea
                  name="body"
                  placeholder="A thought, research, anything worth remembering — not tied to a specific call or message…"
                  rows={4}
                  required
                />
                <Button size="sm" type="submit">
                  Save note
                </Button>
              </form>
            </AddSection>
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

            <AddSection label="Log an interaction">
              <form action={logInteraction} className="space-y-2">
                <input type="hidden" name="contact_id" value={contact.id} />
                <div className="flex gap-2">
                  <select name="direction" defaultValue="out" className={selectClass}>
                    <option value="out">Outreach (I reached out)</option>
                    <option value="in">Inbound (they reached out)</option>
                  </select>
                  <select name="channel" defaultValue="" className={selectClass}>
                    <option value="">Channel unknown</option>
                    <option value="email">Email</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="call">Call</option>
                    <option value="inperson">In person</option>
                  </select>
                </div>
                <Textarea name="summary" placeholder="What happened…" rows={3} />
                <div className="flex items-center gap-2">
                  <Input name="occurred_at" type="date" className="flex-1" />
                  <Input
                    name="warmth"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={5}
                    placeholder="New warmth (optional)"
                    className="flex-1"
                  />
                </div>
                <Button size="sm" type="submit">
                  Log interaction
                </Button>
              </form>
            </AddSection>
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

          <div className="border-t border-border/60 pt-4">
            <ConfirmDeleteForm
              action={remove}
              label="Delete Contact"
              warning="This also permanently deletes every interaction and open task tied to them."
            />
          </div>
        </aside>
      </div>
    </>
  );
}
