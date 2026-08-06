import Link from "next/link";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { listCompanies } from "@/lib/db/companies";
import { listContacts } from "@/lib/db/contacts";
import type { Company, ContactWithCompany } from "@/lib/db/types";
import { createContactAction } from "./actions";

export default async function ContactsPage() {
  await requireUser();

  let contacts: ContactWithCompany[] = [];
  let companies: Company[] = [];
  let loadError: string | null = null;
  try {
    [contacts, companies] = await Promise.all([
      listContacts(),
      listCompanies(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-10 p-8 sm:p-10">
      <Nav />
      <h1 className="text-3xl font-semibold tracking-tight">Contacts</h1>

      {loadError ? (
        <p className="text-sm text-destructive">
          Could not load contacts: {loadError}. If the tables don&apos;t exist
          yet, run the migration in supabase/migrations/ against your Supabase
          project.
        </p>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="rounded-l-lg py-2 pl-2 font-medium">Name</th>
              <th className="py-2 font-medium">Company</th>
              <th className="py-2 font-medium">Type</th>
              <th className="rounded-r-lg py-2 font-medium">Warmth</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                className="border-b border-border transition-colors hover:bg-muted/40"
              >
                <td className="py-2 pl-2">
                  <Link href={`/contacts/${contact.id}`} className="text-primary underline">
                    {contact.name}
                  </Link>
                </td>
                <td className="py-2">{contact.companies?.name ?? "—"}</td>
                <td className="py-2">{contact.type ?? "—"}</td>
                <td className="py-2">{contact.warmth ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Add contact</h2>
        <form action={createContactAction} className="space-y-2">
          <Input name="name" placeholder="Name *" required />
          <select
            name="company_id"
            defaultValue=""
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
          >
            <option value="">No company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <Input
            name="type"
            placeholder="Type (operator | finance | recruiter)"
          />
          <Input
            name="warmth"
            type="number"
            min={1}
            max={5}
            placeholder="Warmth (1-5)"
          />
          <Button type="submit">Add contact</Button>
        </form>
      </section>
    </main>
  );
}
