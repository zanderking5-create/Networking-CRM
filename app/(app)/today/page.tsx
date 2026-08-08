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
import type { StalledRole } from "@/lib/db/roles";
import { listStalledRoles } from "@/lib/db/roles";
import { roleStatusLabel } from "@/lib/roles";
import { listDueTasks, listUpcomingTasks } from "@/lib/db/tasks";
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

function upcomingLabel(dueDate: string): string {
  const daysUntil = -overdueDays(dueDate);
  if (daysUntil === 1) return "Due tomorrow";
  return `Due in ${daysUntil} days`;
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

function TaskRow({
  task,
  dueDateLabel,
}: {
  task: TaskWithLinks;
  dueDateLabel: (dueDate: string) => string;
}) {
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
        {(task.contacts || task.companies) && (
          <RowSubtitle>
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
          </RowSubtitle>
        )}
      </RowMain>

      {/* The due-date editor renders a <details> internally, which can't
          nest inside RowSubtitle (a <p>) -- the browser silently closes the
          paragraph early and the intended styling never applies. RowMeta is
          a <div>, so it's a safe home for it. This is the shape the audit
          flagged as invalid HTML; don't move it back inside RowSubtitle. */}
      <RowMeta>
        <TaskDueDateEditor
          taskId={task.id}
          dueDate={task.due_date}
          label={dueDateLabel(task.due_date!)}
          labelClassName={isOverdue ? "font-medium text-foreground" : undefined}
        />
      </RowMeta>

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

function StalledRoleRow({ role }: { role: StalledRole }) {
  const days = role.days_since_status_change;
  return (
    <Row href={`/roles/${role.id}`}>
      <RowMain>
        <RowTitle href={`/roles/${role.id}`} stretch>
          {role.title ?? "Untitled role"}
        </RowTitle>
        <RowSubtitle>{role.companies?.name ?? "No company"}</RowSubtitle>
      </RowMain>
      <RowMeta>
        <Pill>{roleStatusLabel(role.status)}</Pill>
        <span>{days === 1 ? "1 day" : `${days} days`}</span>
      </RowMeta>
    </Row>
  );
}

function Section({
  title,
  count,
  emptyMessage,
  error,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <section>
      {/* No count here — the stat strip above already carries the numbers. */}
      <SectionLabel>{title}</SectionLabel>
      {error ? (
        <p className="text-sm text-destructive">Could not load: {error}.</p>
      ) : count === 0 ? (
        <EmptyState>{emptyMessage}</EmptyState>
      ) : (
        <RowList>{children}</RowList>
      )}
    </section>
  );
}

type SectionResult<T> = { data: T; error: string | null };

// Each of the five dashboard queries is independent, so one failing (a
// missing table, a bad query) degrades only its own section instead of
// blanking the whole page the way a single shared try/catch around
// Promise.all used to.
function unwrap<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
): SectionResult<T> {
  if (result.status === "fulfilled") return { data: result.value, error: null };
  const reason = result.reason;
  return {
    data: fallback,
    error: reason instanceof Error ? reason.message : String(reason),
  };
}

export default async function TodayPage() {
  await requireUser();

  const [dueResult, upcomingResult, coldResult, stalledCompanyResult, stalledRoleResult] =
    await Promise.allSettled([
      listDueTasks(),
      listUpcomingTasks(),
      listColdContacts(),
      listStalledHighConvictionCompanies(),
      listStalledRoles(),
    ]);

  const due = unwrap(dueResult, [] as TaskWithLinks[]);
  const upcoming = unwrap(upcomingResult, [] as TaskWithLinks[]);
  const cold = unwrap(coldResult, [] as ColdContact[]);
  const stalledCompanies = unwrap(stalledCompanyResult, [] as StalledCompany[]);
  const stalledRoles = unwrap(stalledRoleResult, [] as StalledRole[]);

  const anyError = [
    due.error,
    upcoming.error,
    cold.error,
    stalledCompanies.error,
    stalledRoles.error,
  ].some((error) => error !== null);

  const allClear =
    !anyError &&
    due.data.length === 0 &&
    upcoming.data.length === 0 &&
    cold.data.length === 0 &&
    stalledCompanies.data.length === 0 &&
    stalledRoles.data.length === 0;

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

      {allClear ? (
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
              No overdue tasks, nothing coming up in the next week, no
              relationships going cold, no stalled targets or roles. Nothing
              needs you right now.
            </p>
          </div>
        </div>
      ) : (
        <>
          <StatStrip
            stats={[
              { label: "Due", value: due.data.length },
              { label: "Upcoming", value: upcoming.data.length },
              { label: "Going Cold", value: cold.data.length },
              { label: "Stalled", value: stalledCompanies.data.length },
              { label: "Roles", value: stalledRoles.data.length },
            ]}
          />

          {/* Work you owe on the left, relationships to watch on the right —
              both visible at once instead of stacked three deep. */}
          <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-10">
              <Section
                title="Due"
                count={due.data.length}
                error={due.error}
                emptyMessage="No due-today or overdue follow-ups. Give a task a due date to see it here."
              >
                {due.data.map((task) => (
                  <TaskRow key={task.id} task={task} dueDateLabel={dueLabel} />
                ))}
              </Section>

              <Section
                title="Upcoming"
                count={upcoming.data.length}
                error={upcoming.error}
                emptyMessage="Nothing due in the next 7 days. Due dates inside that window show up here."
              >
                {upcoming.data.map((task) => (
                  <TaskRow key={task.id} task={task} dueDateLabel={upcomingLabel} />
                ))}
              </Section>
            </div>

            <aside className="space-y-10">
              <Section
                title="Going cold"
                count={cold.data.length}
                error={cold.error}
                emptyMessage="No contacts going cold. Set a cadence on a contact to start tracking it here."
              >
                {cold.data.map((contact) => (
                  <ColdContactRow key={contact.id} contact={contact} />
                ))}
              </Section>

              <Section
                title="High-conviction, stalled"
                count={stalledCompanies.data.length}
                error={stalledCompanies.error}
                emptyMessage="No high-conviction companies have gone quiet. Companies at conviction 4 or 5 show up here after 14 days of silence."
              >
                {stalledCompanies.data.map((company) => (
                  <StalledCompanyRow key={company.id} company={company} />
                ))}
              </Section>

              <Section
                title="Roles stalled"
                count={stalledRoles.data.length}
                error={stalledRoles.error}
                emptyMessage="No roles have stalled. Roles in conversation or interviewing show up here after 10 days without a stage change."
              >
                {stalledRoles.data.map((role) => (
                  <StalledRoleRow key={role.id} role={role} />
                ))}
              </Section>
            </aside>
          </div>
        </>
      )}
    </>
  );
}
