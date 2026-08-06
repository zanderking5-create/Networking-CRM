import Link from "next/link";

const linkClass =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function Nav() {
  return (
    <nav className="flex items-center justify-between border-b border-border pb-4">
      <span className="text-sm font-semibold tracking-tight text-primary">
        Networking CRM
      </span>
      <div className="flex items-center gap-1">
        <Link href="/today" className={linkClass}>
          Today
        </Link>
        <Link href="/capture" className={linkClass}>
          Capture
        </Link>
        <Link href="/contacts" className={linkClass}>
          Contacts
        </Link>
        <Link href="/companies" className={linkClass}>
          Companies
        </Link>
      </div>
    </nav>
  );
}
