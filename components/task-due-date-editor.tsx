import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { setTaskDueDateAction } from "@/app/tasks/actions";

// Click-to-reveal due date editor. Uses <details>/<summary> for the
// show/hide state so it needs no client JS, matching the plain
// server-action-form pattern used by the Done/+1d/+1wk quick actions.
export function TaskDueDateEditor({
  taskId,
  dueDate,
  label,
  labelClassName,
}: {
  taskId: string;
  dueDate: string | null;
  label: string;
  labelClassName?: string;
}) {
  const setDueDate = setTaskDueDateAction.bind(null, taskId);
  return (
    <details className="inline-block">
      <summary
        className={cn(
          "cursor-pointer list-none underline decoration-dotted [&::-webkit-details-marker]:hidden",
          labelClassName,
        )}
      >
        {label}
      </summary>
      <form action={setDueDate} className="mt-1.5 flex items-center gap-1.5">
        {/* Keyed on the value it reflects -- see the comment in
            contact-cadence-editor.tsx on why an uncontrolled input needs
            this to stay in sync after a revalidation. */}
        <Input
          key={dueDate ?? "none"}
          type="date"
          name="due_date"
          defaultValue={dueDate ?? ""}
          required
          className="h-7 w-auto text-xs"
        />
        <Button size="xs" type="submit">
          Set date
        </Button>
      </form>
    </details>
  );
}
