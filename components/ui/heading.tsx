import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Serif display heading — reserved for major page headings only (the Today
// dashboard title, contact/company names on detail pages). Everything else
// in the app stays sans-serif; this contrast is deliberate, not decorative.
export function DisplayHeading({
  children,
  className,
  as: As = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <As
      className={cn(
        "text-balance font-serif text-4xl font-medium tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </As>
  );
}
