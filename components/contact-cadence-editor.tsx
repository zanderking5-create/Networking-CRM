import { setContactCadenceAction } from "@/app/(app)/contacts/actions";
import { Button } from "@/components/ui/button";
import { CADENCE_OPTIONS, cadenceLabel } from "@/lib/cadence";
import { cn } from "@/lib/utils";

// Click-to-reveal cadence editor. Uses <details>/<summary> for the show/hide
// state so it needs no client JS, matching the plain server-action-form
// pattern used by TaskDueDateEditor.
export function ContactCadenceEditor({
  contactId,
  cadence,
  className,
}: {
  contactId: string;
  cadence: string | null;
  className?: string;
}) {
  const setCadence = setContactCadenceAction.bind(null, contactId);
  const label = cadenceLabel(cadence);

  return (
    <details className={cn("inline-block", className)}>
      <summary className="inline-flex cursor-pointer items-center rounded bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        {label ?? "Set cadence"}
      </summary>
      <form action={setCadence} className="mt-1.5 flex items-center gap-1.5">
        <label className="sr-only" htmlFor={`cadence-${contactId}`}>
          Keep-in-touch cadence
        </label>
        {/* Keyed on the value it reflects: `defaultValue` only applies at
            mount, so without this key a select left open across a
            server-action revalidation (edit this contact's cadence
            elsewhere, or resubmit this same form) keeps showing whatever
            the user last interacted with in this exact DOM node instead of
            the current saved value -- the pill (plain text, always fresh)
            and the select could then visibly disagree for the same
            contact. The key forces a remount so defaultValue re-applies. */}
        <select
          key={cadence ?? "none"}
          id={`cadence-${contactId}`}
          name="cadence"
          defaultValue={cadence ?? ""}
          className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
        >
          <option value="">No cadence</option>
          {CADENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
