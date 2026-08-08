import { setRoleStatusAction } from "@/app/(app)/roles/actions";
import { Button } from "@/components/ui/button";
import { ROLE_STATUSES, roleStatusLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";

// Click-to-reveal stage editor for a role card on the /roles pipeline board.
// Same <details>/<summary> show/hide pattern as TaskDueDateEditor and
// ContactCadenceEditor -- a plain server-action form, no client JS, no
// drag-and-drop. setRoleStatusAction -> updateRole() only bumps
// status_changed_at when the status actually changes, which is what keeps
// listStalledRoles()'s stall clock honest.
export function RoleStatusEditor({
  roleId,
  status,
  className,
}: {
  roleId: string;
  status: string;
  className?: string;
}) {
  const setStatus = setRoleStatusAction.bind(null, roleId);

  return (
    <details className={cn("inline-block", className)}>
      <summary className="inline-flex cursor-pointer items-center rounded bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        {roleStatusLabel(status)}
      </summary>
      <form action={setStatus} className="mt-1.5 flex items-center gap-1.5">
        <label className="sr-only" htmlFor={`role-status-${roleId}`}>
          Status
        </label>
        {/* Keyed on the value it reflects -- see the comment in
            contact-cadence-editor.tsx on why an uncontrolled select needs
            this to stay in sync after a revalidation. */}
        <select
          key={status}
          id={`role-status-${roleId}`}
          name="status"
          defaultValue={status}
          className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
        >
          {ROLE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button size="xs" type="submit">
          Save
        </Button>
      </form>
    </details>
  );
}
