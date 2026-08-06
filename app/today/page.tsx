import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "@/components/nav";
import { TaskDueDateEditor } from "@/components/task-due-date-editor";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import type { StalledCompany } from "@/lib/db/companies";
import { listStalledHighConvictionCompanies } from "@/lib/db/companies";
import { listColdContacts } from "@/lib/db/contacts";
import { listDueTasks } from "@/lib/db/tasks";
import type { TaskWithLinks } from "@/lib/db/tasks";
import type { ContactWithCompany } from "@/lib/db/types";
import { formatDate } from "@/lib/forms";
import { markTaskDoneAction, snoozeTaskAction } from "@/app/tasks/actions";

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function dueLabel(dueDate: string): string {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00Z`);
  const overdueDays = daysBetween(due, today);
  if (overdueDays <= 0) return "Due today";
  if (overdueDays === 1) return "Overdue by 1 day";
  return `Overdue by ${overdueDays} days`;
}

function sinceLabel(dateStr: string | null, neverText: string): string {
  if (!dateStr) return neverText;
  const days = daysBetween(new Date(dateStr), new Date());
  if (days <= 0) return `${formatDate(dateStr)} (today)`;
  if (days === 1) return `${formatDate(dateStr)} (1 day ago)`;
  return `${formatDate(dateStr)} (${days} days ago)`;
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-4">{children}</div>
  );
}

function TaskCard({ task }: { task: TaskWithLinks }) {
  const markDone = markTaskDoneAction.bind(null, task.id);
  const snoozeDay = snoozeTaskAction.bind(null, task.id, 1);
  const snoozeWeek = snoozeTaskAction.bind(null, task.id, 7);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">{task.title}</p>
          <TaskDueDateEditor
            taskId={task.id}
            dueDate={task.due_date}
            label={dueLabel(task.due_date!)}
            labelClassName="text-sm text-destructive"
          />
          {(task.contacts || task.companies) && (
            <p className="text-sm text-muted-foreground">
              {task.contacts && (
                <Link href={`/contacts/${task.contacts.id}`} className="underline">
                  {task.contacts.name}
                </Link>
              )}
              {task.contacts && task.companies && " · "}
              {task.companies && (
                <Link href={`/companies/${task.companies.id}`} className="underline">
                  {task.companies.name}
                </Link>
              )}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <form action={markDone}>
            <Button size="xs" type="submit">
              Done
            </Button>
          </form>
          <form action={snoozeDay}>
            <Button size="xs" variant="outline" type="submit">
              +1d
            </Button>
          </form>
          <form action={snoozeWeek}>
            <Button size="xs" variant="outline" type="submit">
              +1wk
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}

function ColdContactCard({ contact }: { contact: ContactWithCompany }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <Link href={`/contacts/${contact.id}`} className="font-medium underline">
            {contact.name}
          </Link>
          {contact.companies && (
            <p className="text-sm text-muted-foreground">{contact.companies.name}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          warmth {contact.warmth}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Last touch: {sinceLabel(contact.last_touch_at, "never")}
      </p>
    </Card>
  );
}

function StalledCompanyCard({ company }: { company: StalledCompany }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <Link href={`/companies/${company.id}`} className="font-medium underline">
          {company.name}
        </Link>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          conviction {company.conviction}/5
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Last interaction: {sinceLabel(company.last_interaction_at, "no interactions yet")}
      </p>
    </Card>
  );
}

function Section({
  title,
  count,
  emptyMessage,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">
        {title}
        {count > 0 && <span className="ml-2 text-sm text-muted-foreground">{count}</span>}
      </h2>
      {count === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

export default async function TodayPage() {
  await requireUser();

  let dueTasks: TaskWithLinks[] = [];
  let coldContacts: ContactWithCompany[] = [];
  let stalledCompanies: StalledCompany[] = [];
  let loadError: string | null = null;
  try {
    [dueTasks, coldContacts, stalledCompanies] = await Promise.all([
      listDueTasks(),
      listColdContacts(),
      listStalledHighConvictionCompanies(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  const allClear =
    !loadError &&
    dueTasks.length === 0 &&
    coldContacts.length === 0 &&
    stalledCompanies.length === 0;

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <Nav />
      <h1 className="text-4xl font-bold">Today</h1>

      {loadError ? (
        <p className="text-sm text-destructive">
          Could not load your dashboard: {loadError}.
        </p>
      ) : allClear ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-lg font-medium">You&apos;re all caught up.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No overdue tasks, no relationships going cold, no stalled top
            targets. Nothing needs you right now.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <Section
            title="Due"
            count={dueTasks.length}
            emptyMessage="No overdue or due-today follow-ups."
          >
            {dueTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Section>

          <Section
            title="Going cold"
            count={coldContacts.length}
            emptyMessage="No warm contacts going stale."
          >
            {coldContacts.map((contact) => (
              <ColdContactCard key={contact.id} contact={contact} />
            ))}
          </Section>

          <Section
            title="High-conviction, stalled"
            count={stalledCompanies.length}
            emptyMessage="No high-conviction companies have gone quiet."
          >
            {stalledCompanies.map((company) => (
              <StalledCompanyCard key={company.id} company={company} />
            ))}
          </Section>
        </div>
      )}
    </main>
  );
}
