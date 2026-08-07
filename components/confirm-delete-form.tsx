import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Click-to-reveal delete confirmation. Uses <details>/<summary> for the
// show/hide state, matching TaskDueDateEditor and ContactCadenceEditor, so a
// destructive action still needs no client JS. The summary reads as a plain
// destructive label; only opening it exposes the actual submit button, so a
// single misclick can no longer fire the delete.
export function ConfirmDeleteForm({
  action,
  label,
  warning,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  warning?: ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("group/delete", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center text-sm font-medium text-destructive underline decoration-dotted [&::-webkit-details-marker]:hidden">
        {label}
      </summary>
      <form action={action} className="mt-3 space-y-2">
        {warning && (
          <p className="max-w-sm text-xs text-muted-foreground">{warning}</p>
        )}
        <Button variant="destructive" size="sm" type="submit">
          Yes, delete — this can&rsquo;t be undone
        </Button>
      </form>
    </details>
  );
}
