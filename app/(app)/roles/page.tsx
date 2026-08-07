import Link from "next/link";
import { RoleStatusEditor } from "@/components/role-status-editor";
import { DisplayHeading } from "@/components/ui/heading";
import { RatingDots } from "@/components/ui/rating-dots";
import { EmptyState, RowMain, RowMeta, RowSubtitle, RowTitle, SectionLabel } from "@/components/ui/row";
import { requireUser } from "@/lib/auth";
import { listAllRoles } from "@/lib/db/roles";
import type { RoleBoardCard } from "@/lib/db/roles";
import { ROLE_STATUSES } from "@/lib/roles";

function daysInStage(statusChangedAt: string): number {
  const ms = Date.now() - new Date(statusChangedAt).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

// A pipeline board's cards stack their content vertically in a narrow
// column -- a fundamentally different shape than Row's one-line
// primary/secondary/meta layout, so this isn't a Row/RowList case the way
// every other list in the app is. It still reuses Row's sub-primitives
// (RowMain/RowTitle/RowSubtitle/RowMeta/RatingDots) for the parts that are
// just typography, rather than hand-rolling those too. Deliberately no
// `stretch` on RowTitle: a card has two separate links (title, company)
// plus the stage-editor form below, and stretch's full-row overlay would
// swallow clicks on all of them.
function RoleCard({ role }: { role: RoleBoardCard }) {
  const days = daysInStage(role.status_changed_at);

  return (
    <div className="space-y-2.5 rounded-lg border border-border/60 p-3">
      <RowMain>
        <RowTitle href={`/roles/${role.id}`}>
          {role.title ?? "Untitled role"}
        </RowTitle>
        {role.companies && (
          <RowSubtitle>
            <Link
              href={`/companies/${role.companies.id}`}
              className="transition-colors hover:text-primary"
            >
              {role.companies.name}
            </Link>
          </RowSubtitle>
        )}
      </RowMain>

      <RowMeta>
        <RatingDots value={role.conviction} label="Conviction" />
        <span>{days === 1 ? "1 day" : `${days} days`} in stage</span>
      </RowMeta>

      <RoleStatusEditor roleId={role.id} status={role.status} />
    </div>
  );
}

export default async function RolesBoardPage() {
  await requireUser();

  let roles: RoleBoardCard[] = [];
  let loadError: string | null = null;
  try {
    roles = await listAllRoles();
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  const columns = ROLE_STATUSES.map((s) => ({
    status: s.value,
    label: s.label,
    roles: roles.filter((role) => role.status === s.value),
  }));

  return (
    <>
      <DisplayHeading className="text-3xl">Roles</DisplayHeading>

      {loadError ? (
        <p className="text-sm text-destructive">
          Could not load roles: {loadError}. If the tables don&apos;t exist
          yet, run the migration in supabase/migrations/ against your
          Supabase project.
        </p>
      ) : roles.length === 0 ? (
        <EmptyState>
          No roles tracked yet — add one from a company page.
        </EmptyState>
      ) : (
        // Bleeds past the content column like the /companies pipeline
        // table, and scrolls horizontally rather than crushing four
        // columns into a narrow viewport.
        <div className="-mx-3 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-6 px-3">
            {columns.map((column) => (
              <div key={column.status} className="w-64 shrink-0 space-y-3">
                <SectionLabel count={column.roles.length}>
                  {column.label}
                </SectionLabel>
                {column.roles.length === 0 ? (
                  <EmptyState>None</EmptyState>
                ) : (
                  <div className="space-y-2.5">
                    {column.roles.map((role) => (
                      <RoleCard key={role.id} role={role} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
