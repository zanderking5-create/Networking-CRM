import { cn } from "@/lib/utils";

// Visual 1-5 scale for conviction and warmth — the only two places in the
// app where color is meant to signal something. Filled dots in olive tints;
// everything else in the app (task rows, timeline, table headers) stays
// neutral.
export function RatingDots({
  value,
  max = 5,
  label,
  className,
}: {
  value: number | null;
  max?: number;
  label: string;
  className?: string;
}) {
  if (value == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="img"
      aria-label={`${label}: ${value} of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", i < value ? "bg-primary" : "bg-primary/30")}
        />
      ))}
    </span>
  );
}
