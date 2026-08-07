import { cn } from "@/lib/utils";

// Monogram avatar. People get a circle, companies a rounded square — the
// same distinction Attio/Folk use so the two entity types read apart at a
// glance without needing a label. Deliberately monochrome: color in this
// app is reserved for conviction/warmth, so avatars stay neutral.

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizes = {
  sm: "size-7 text-[0.625rem]",
  md: "size-9 text-xs",
  lg: "size-12 text-sm",
};

export function Avatar({
  name,
  kind = "person",
  size = "sm",
  className,
}: {
  name: string;
  kind?: "person" | "company";
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center bg-secondary font-semibold tracking-wide text-secondary-foreground/80",
        kind === "person" ? "rounded-full" : "rounded-md",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
