import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { createInteractionAction } from "@/app/interactions/actions";
import { createNoteAction } from "@/app/notes/actions";
import { createTaskAction } from "@/app/tasks/actions";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { NotesList } from "@/components/notes-list";
import { TaskDueDateEditor } from "@/components/task-due-date-editor";
import { Timeline } from "@/components/timeline";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { RatingDots } from "@/components/ui/rating-dots";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Pill, Row, RowList, RowMain, RowMeta, RowSubtitle, RowTitle, SectionLabel } from "@/components/ui/row";
import { requireUser } from "@/lib/auth";
import { getCompany } from "@/lib/db/companies";
import { listContacts, listContactsByCompany } from "@/lib/db/contacts";
import { listInteractionsForContacts } from "@/lib/db/interactions";
import type { InteractionWithContact } from "@/lib/db/interactions";
import { listNotesForCompany } from "@/lib/db/notes";
import type { NoteWithContact } from "@/lib/db/notes";
import { listRolesForCompany } from "@/lib/db/roles";
import type { RoleWithReferrer } from "@/lib/db/roles";
import { listOpenTasksForCompany } from "@/lib/db/tasks";
import type { Company, Contact, ContactWithCompany, Task } from "@/lib/db/types";
import { formatDate } from "@/lib/forms";
import { ROLE_SOURCES, ROLE_STATUSES, roleSourceLabel, roleStatusLabel } from "@/lib/roles";
import { createRoleAction } from "../../roles/actions";
import { deleteCompanyAction, updateCompanyAction } from "../actions";

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

// Same "hidden until opened" pattern as "Add a role" below.
function AddSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="pt-3">
      <summary className="inline-flex cursor-pointer items-center rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        {label}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  let company: Company | null = null;
  let contacts: Contact[] = [];
  let roles: RoleWithReferrer[] = [];
  let allContacts: ContactWithCompany[] = [];
  let openTasks: Task[] = [];
  let interactions: InteractionWithContact[] = [];
  let notes: NoteWithContact[] = [];
  let loadError: string | null = null;
  try {
    [company, contacts, roles, allContacts, openTasks] = await Promise.all([
      getCompany(id),
      listContactsByCompany(id),
      listRolesForCompany(id),
      listContacts(),
      listOpenTasksForCompany(id),
    ]);
    const contactIds = contacts.map((c) => c.id);
    [interactions, notes] = await Promise.all([
      listInteractionsForContacts(contactIds),
      listNotesForCompany(id, contactIds),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  if (loadError) {
    return (
      <p className="text-sm text-destructive">
        Could not load this company: {loadError}. If the tables don&apos;t
        exist yet, run the migration in supabase/migrations/ against your
        Supabase project.
      </p>
    );
  }
  if (!company) notFound();

  const update = updateCompanyAction.bind(null, company.id);
  const remove = deleteCompanyAction.bind(null, company.id);
  const addRole = createRoleAction.bind(null, company.id);
  const addTask = createTaskAction.bind(null, null, company.id);
  const addNote = createNoteAction.bind(null, null, company.id);
  const logInteraction = createInteractionAction.bind(null, company.id);

  return (
    <>
      <header className="flex items-start gap-4">
        <Avatar name={company.name} kind="company" size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <DisplayHeading className="text-3xl">{company.name}</DisplayHeading>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {company.stage && <span>{company.stage}</span>}
            {company.stage && company.geography && <span aria-hidden="true">·</span>}
            {company.geography && <span>{company.geography}</span>}
            {company.status && <Pill>{company.status}</Pill>}
            {company.conviction != null && (
              <span className="flex items-center gap-1.5">
                <span className="text-xs">Conviction</span>
                <RatingDots value={company.conviction} label="Conviction" />
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Contacts and history lead; the edit form moves into a rail rather
          than sitting between you and them. */}
      <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          <section className="space-y-1">
            <SectionLabel count={roles.length}>Roles</SectionLabel>
            {roles.length === 0 ? (
              <EmptyState>
                No roles tracked here yet. Add the specific seat below.
              </EmptyState>
            ) : (
              <RowList>
                {roles.map((role) => (
                  <Row key={role.id} href={`/roles/${role.id}`}>
                    <RowMain>
                      <RowTitle href={`/roles/${role.id}`} stretch>
                        {role.title ?? "Untitled role"}
                      </RowTitle>
                      <RowSubtitle>
                        {[roleSourceLabel(role.source), role.contacts?.name && `via ${role.contacts.name}`]
                          .filter(Boolean)
                          .join(" · ") || "No source recorded"}
                      </RowSubtitle>
                    </RowMain>
                    <RowMeta>
                      <Pill>{roleStatusLabel(role.status)}</Pill>
                      <RatingDots value={role.conviction} label="Conviction" />
                    </RowMeta>
                  </Row>
                ))}
              </RowList>
            )}

            <details className="pt-3">
              <summary className="inline-flex cursor-pointer items-center rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                Add a role
              </summary>
              <form action={addRole} className="mt-3 space-y-2">
                <Input name="title" placeholder="Title (e.g. BizOps Lead)…" />
                <label className="sr-only" htmlFor="new-role-status">
                  Status
                </label>
                <select
                  id="new-role-status"
                  name="status"
                  defaultValue="watching"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
                >
                  {ROLE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="new-role-source">
                  Source
                </label>
                <select
                  id="new-role-source"
                  name="source"
                  defaultValue=""
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
                >
                  <option value="">Source unknown</option>
                  {ROLE_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="new-role-referrer">
                  Referrer
                </label>
                <select
                  id="new-role-referrer"
                  name="referrer_contact_id"
                  defaultValue=""
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
                >
                  <option value="">No referrer</option>
                  {allContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
                <Input
                  name="conviction"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={5}
                  placeholder="Conviction (1-5)"
                />
                <Button type="submit">Add Role</Button>
              </form>
            </details>
          </section>

          <section className="space-y-1">
            <SectionLabel count={contacts.length}>Contacts</SectionLabel>
            {contacts.length === 0 ? (
              <EmptyState>
                No contacts linked to this company yet. Add one from Contacts
                and pick this company.
              </EmptyState>
            ) : (
              <RowList>
                {contacts.map((contact) => (
                  <Row key={contact.id} href={`/contacts/${contact.id}`}>
                    <Avatar name={contact.name} kind="person" />
                    <RowMain>
                      <RowTitle href={`/contacts/${contact.id}`} stretch>
                        {contact.name}
                      </RowTitle>
                      {contact.role && <RowSubtitle>{contact.role}</RowSubtitle>}
                    </RowMain>
                  </Row>
                ))}
              </RowList>
            )}
          </section>

          <section className="space-y-1">
            <SectionLabel count={openTasks.length}>Open tasks</SectionLabel>
            {openTasks.length === 0 ? (
              <EmptyState>No open tasks. Add one below.</EmptyState>
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
                contactName: n.contacts?.name,
              }))}
              emptyMessage="No notes about this company or anyone here yet. Add one below."
            />

            <AddSection label="Add a note">
              <form action={addNote} className="space-y-2">
                <Textarea
                  name="body"
                  placeholder="Thesis fit, research, anything worth remembering about this company…"
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
                contactName: i.contacts?.name,
              }))}
              emptyMessage={
                contacts.length > 0
                  ? "No interactions logged with anyone here yet. Log one below."
                  : "No interactions logged with anyone here yet. Add a contact to this company first."
              }
            />

            {contacts.length > 0 && (
              <AddSection label="Log an interaction">
                <form action={logInteraction} className="space-y-2">
                  <label className="sr-only" htmlFor="log-interaction-contact">
                    Contact
                  </label>
                  <select
                    id="log-interaction-contact"
                    name="contact_id"
                    defaultValue=""
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
                    required
                  >
                    <option value="" disabled>
                      Who was it with?
                    </option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
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
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <SectionLabel>Details</SectionLabel>
          <form action={update} className="space-y-4">
        <Field label="Name">
          <Input name="name" defaultValue={company.name} required />
        </Field>
        <Field label="Stage">
          <Input name="stage" defaultValue={company.stage ?? ""} />
        </Field>
        <Field label="Investors">
          <Input name="investors" defaultValue={company.investors ?? ""} />
        </Field>
        <Field label="Geography">
          <Input name="geography" defaultValue={company.geography ?? ""} />
        </Field>
        <Field label="Thesis fit notes">
          <textarea
            name="thesis_fit_notes"
            defaultValue={company.thesis_fit_notes ?? ""}
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
          />
        </Field>
        <Field label="Founder delegation style">
          <Input
            name="founder_delegation_style"
            defaultValue={company.founder_delegation_style ?? ""}
          />
        </Field>
        <Field label="Autonomy scope">
          <Input
            name="autonomy_scope"
            defaultValue={company.autonomy_scope ?? ""}
          />
        </Field>
        <Field label="Social % (0-100)">
          <Input
            name="social_pct"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            defaultValue={company.social_pct ?? ""}
          />
        </Field>
        <Field label="Conviction (1-5) — independent of relationship warmth">
          <Input
            name="conviction"
            type="number"
            inputMode="numeric"
            min={1}
            max={5}
            defaultValue={company.conviction ?? ""}
          />
        </Field>
        <Field label="Status">
          <Input name="status" defaultValue={company.status ?? ""} />
        </Field>
        <Field label="Website">
          <Input name="website" defaultValue={company.website ?? ""} />
        </Field>
            <Button type="submit">Save</Button>
          </form>

          <div className="border-t border-border/60 pt-4">
            <ConfirmDeleteForm
              action={remove}
              label="Delete Company"
              warning="This also permanently deletes every role tracked here."
            />
          </div>
        </aside>
      </div>
    </>
  );
}
