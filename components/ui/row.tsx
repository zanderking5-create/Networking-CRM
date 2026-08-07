import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one row pattern reused across every list in the app (tasks, contacts,
// companies, timeline entries): optional leading avatar, primary text left,
// muted secondary text beneath, right-aligned metadata. No per-section
// borders — rows are separated by whitespace and a hairline divider.

export function RowList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border/60", className)}>{children}</div>
  );
}

// `href` makes the whole row one click target via a stretched overlay on the
// title link — full-row affordance with a single focusable element. Omit it
// for rows containing their own buttons, so the overlay can't cover them.
export function Row({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group/row relative -mx-3 flex items-center gap-3 rounded-lg px-3 py-3 transition-colors",
        href && "hover:bg-muted/50",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RowMain({ children }: { children: ReactNode }) {
  return <div className="min-w-0 flex-1 space-y-0.5">{children}</div>;
}

export function RowTitle({
  children,
  href,
  stretch = false,
  className,
}: {
  children: ReactNode;
  href?: string;
  stretch?: boolean;
  className?: string;
}) {
  const base = "block truncate text-sm font-medium text-foreground";
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
          stretch && "after:absolute after:inset-0 after:rounded-lg after:content-['']",
          className,
        )}
      >
        {children}
      </Link>
    );
  }
  return <p className={cn(base, className)}>{children}</p>;
}

export function RowSubtitle({ children }: { children: ReactNode }) {
  return <p className="truncate text-xs text-muted-foreground">{children}</p>;
}

export function RowMeta({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-muted-foreground">
      {children}
    </div>
  );
}

// Neutral metadata chip — structure without color. Color stays reserved for
// the conviction/warmth scales.
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

// Small, muted, letterspaced section organizer — a quiet label, not a header.
export function SectionLabel({
  children,
  count,
  action,
}: {
  children: ReactNode;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pb-1">
      <h2 className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {children}
        {typeof count === "number" && count > 0 && (
          <span className="tabular-nums text-muted-foreground/70">{count}</span>
        )}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 py-4 text-sm text-muted-foreground">
      {icon}
      <span>{children}</span>
    </div>
  );
}
