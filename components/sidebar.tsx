"use client";

import { Building2, CalendarCheck, PenLine, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/capture", label: "Capture", icon: PenLine },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/companies", label: "Companies", icon: Building2 },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col px-4 py-8 sm:flex">
        <Link
          href="/today"
          className="mb-9 flex items-center gap-2 px-2.5 focus-visible:outline-none"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-primary font-serif text-xs font-semibold text-primary-foreground">
            N
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Networking CRM
          </span>
        </Link>

        <nav className="flex flex-col gap-px">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className={cn(
                    "size-4 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground/70 group-hover:text-muted-foreground",
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-4 py-2 sm:hidden">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <Icon
                aria-hidden="true"
                strokeWidth={1.75}
                className={cn("size-3.5", active ? "text-primary" : "text-muted-foreground/70")}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
