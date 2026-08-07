import { Check, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { TaskDueDateEditor } from "@/components/task-due-date-editor";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/heading";
import { RatingDots } from "@/components/ui/rating-dots";
import { EmptyState, Pill, Row, RowList, RowMain, RowMeta, RowSubtitle, RowTitle, SectionLabel } from "@/components/ui/row";
import { requireUser } from "@/lib/auth";
import type { StalledCompany } from "@/lib/db/companies";
import { listStalledHighConvictionCompanies } from "@/lib/db/companies";
import type { ColdContact } from "@/lib/db/contacts";
import { listColdContacts } from "@/lib/db/contacts";
import { listDueTasks } from "@/lib/db/tasks";
import type { TaskWithLinks } from "@/lib/db/tasks";
import { cadenceLabel } from "@/lib/cadence";
import { formatDate } from "@/lib/forms";
import { markTaskDoneAction, snoozeTaskAction } from "@/app/tasks/actions";

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function overdueDays(dueDate: string): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return daysBetween(new Date(`${dueDate}T00:00:00Z`), today);
}

function dueLabel(dueDate: string): string {
  const days = overdueDays(dueDate);
  if (days <= 0) return "Due today";
  if (days === 1) return "Overdue by 1 day";
  return `Overdue by ${days} days`;
}

// Compact form — the watchlist lives in a narrow rail, where a full date
// plus a relative phrase would truncate before either finished.
function sinceLabel(dateStr: string | null, neverText: string): string {
  if (!dateStr) return neverText;
  const days = daysBetween(new Date(dateStr), new Date());
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 60) return `${days} days ago`;
  return formatDate(dateStr);
}

// Summary before detail: the three counts that decide whether this page
// needs you at all, readable before any individual row.
function StatStrip({
  stats,
}: {
  stats: { label: string; value: number }[];
}) {
  return (
    <dl className="flex items-center gap-10 border-y border-border/60 py-5">
      {stats.map(({ label, value }) => (
        <div key={label} className="space-y-1">
          <dd
            className={`font-serif text-3xl leading-none tabular-nums ${
              value > 0 ? "text-foreground" : "text-muted-foreground/40"
            }`}
          >
            {value}
          </dd>
          <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

function TaskRow({ task }: { task: TaskWithLinks }) {
  const markDone = markTaskDoneAction.bind(null, task.id);
  const snoozeDay = snoozeTaskAction.bind(null, task.id, 1);
  const snoozeWeek = snoozeTaskAction.bind(null, task.id, 7);

  const isOverdue = overdueDays(task.due_date!) > 0;

  return (
    <Row>
      {/* Completion reads as a checkbox, the shape people already associate
          with finishing a task — not a text link that happens to say "Done". */}
      <form action={markDone} className="flex">
        <button
          type="submit"
          aria-label={`Mark “${task.title}” done`}
          className="group/done flex size-5 shrink-0 items-center justify-center rounded-full border border-input transition-colors hover:border-primary hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
        >
          <Check
            aria-hidden="true"
            strokeWidth={3}
            className="size-3 text-transparent transition-colors group-hover/done:text-primary-foreground"
          />
        </button>
      </form>

      <RowMain>
        <RowTitle>{task.title}</RowTitle>
        <p className="truncate text-xs text-muted-foreground">
          <TaskDueDateEditor
            taskId={task.id}
            dueDate={task.due_date}
            label={dueLabel(task.due_date!)}
            labelClassName={isOverdue ? "font-medium text-foreground" : undefined}
          />
          {(task.contacts || task.companies) && (
            <>
              {" · "}
              {task.contacts && (
                <Link
                  href={`/contacts/${task.contacts.id}`}
                  className="transition-colors hover:text-primary"
                >
                  {task.contacts.name}
                </Link>
              )}
              {task.contacts && task.companies && " · "}
              {task.companies && (
                <Link
                  href={`/companies/${task.companies.id}`}
                  className="transition-colors hover:text-primary"
                >
                  {task.companies.name}
                </Link>
              )}
            </>
          )}
        </p>
      </RowMain>

      <div className="flex shrink-0 items-center gap-1">
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
    </Row>
  );
}

function ColdContactRow({ contact }: { contact: ColdContact }) {
  const cadence = cadenceLabel(contact.cadence);
  return (
    <Row href={`/contacts/${contact.id}`}>
      <Avatar name={contact.name} kind="person" />
      <RowMain>
        <RowTitle href={`/contacts/${contact.id}`} stretch>
          {contact.name}
        </RowTitle>
        <RowSubtitle>{contact.companies?.name ?? "No company"}</RowSubtitle>
      </RowMain>
      <RowMeta>
        {cadence && <Pill>{cadence}</Pill>}
        <span>{sinceLabel(contact.last_touch_at, "never")}</span>
      </RowMeta>
    </Row>
  );
}

function StalledCompanyRow({ company }: { company: StalledCompany }) {
  return (
    <Row href={`/companies/${company.id}`}>
      <Avatar name={company.name} kind="company" />
      <RowMain>
        <RowTitle href={`/companies/${company.id}`} stretch>
          {company.name}
        </RowTitle>
        <RowSubtitle>
          {sinceLabel(company.last_interaction_at, "no interactions yet")}
        </RowSubtitle>
      </RowMain>
      <RowMeta>
        <RatingDots value={company.conviction} label="Conviction" />
      </RowMeta>
    </Row>
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
    <section>
      {/* No count here — the stat strip above already carries the numbers. */}
      <SectionLabel>{title}</SectionLabel>
      {count === 0 ? <EmptyState>{emptyMessage}</EmptyState> : <RowList>{children}</RowList>}
    </section>
  );
}

export default async function TodayPage() {
  await requireUser();

  let dueTasks: TaskWithLinks[] = [];
  let coldContacts: ColdContact[] = [];
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

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <header className="space-y-1.5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {dateLabel}
        </p>
        <DisplayHeading>Today</DisplayHeading>
      </header>

      {loadError ? (
        <p className="text-sm text-destructive">
          Could not load your dashboard: {loadError}.
        </p>
      ) : allClear ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <CheckCircle2
            aria-hidden="true"
            strokeWidth={1.25}
            className="size-9 text-primary/70"
          />
          <div className="space-y-1">
            <p className="font-serif text-xl text-foreground">
              You&rsquo;re all caught up.
            </p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              No overdue tasks, no relationships going cold, no stalled top
              targets. Nothing needs you right now.
            </p>
          </div>
        </div>
      ) : (
        <>
          <StatStrip
            stats={[
              { label: "Due", value: dueTasks.length },
              { label: "Going Cold", value: coldContacts.length },
              { label: "Stalled", value: stalledCompanies.length },
            ]}
          />

          {/* Work you owe on the left, relationships to watch on the right —
              both visible at once instead of stacked three deep. */}
          <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Section
              title="Due"
              count={dueTasks.length}
              emptyMessage="No overdue or due-today follow-ups."
            >
              {dueTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </Section>

            <aside className="space-y-10">
              <Section
                title="Going cold"
                count={coldContacts.length}
                emptyMessage="No warm contacts going stale."
              >
                {coldContacts.map((contact) => (
                  <ColdContactRow key={contact.id} contact={contact} />
                ))}
              </Section>

              <Section
                title="High-conviction, stalled"
                count={stalledCompanies.length}
                emptyMessage="No high-conviction companies have gone quiet."
              >
                {stalledCompanies.map((company) => (
                  <StalledCompanyRow key={company.id} company={company} />
                ))}
              </Section>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
