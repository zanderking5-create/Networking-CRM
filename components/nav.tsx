import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex gap-4 border-b border-border pb-3 text-sm">
      <Link href="/today" className="hover:underline">
        Today
      </Link>
      <Link href="/capture" className="hover:underline">
        Capture
      </Link>
      <Link href="/contacts" className="hover:underline">
        Contacts
      </Link>
      <Link href="/companies" className="hover:underline">
        Companies
      </Link>
    </nav>
  );
}
