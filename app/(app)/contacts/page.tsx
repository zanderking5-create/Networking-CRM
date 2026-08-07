import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { RatingDots } from "@/components/ui/rating-dots";
import { EmptyState, Pill, Row, RowList, RowMain, RowMeta, RowSubtitle, RowTitle, SectionLabel } from "@/components/ui/row";
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
    <>
      <DisplayHeading className="text-3xl">Contacts</DisplayHeading>

      <section>
        <SectionLabel count={contacts.length}>All contacts</SectionLabel>
        {loadError ? (
          <p className="text-sm text-destructive">
            Could not load contacts: {loadError}. If the tables don&apos;t exist
            yet, run the migration in supabase/migrations/ against your Supabase
            project.
          </p>
        ) : contacts.length === 0 ? (
          <EmptyState>No contacts yet — add your first one below.</EmptyState>
        ) : (
          <RowList>
            {contacts.map((contact) => (
              <Row key={contact.id} href={`/contacts/${contact.id}`}>
                <Avatar name={contact.name} kind="person" />
                <RowMain>
                  <RowTitle href={`/contacts/${contact.id}`} stretch>
                    {contact.name}
                  </RowTitle>
                  <RowSubtitle>
                    {contact.companies?.name ?? "No company"}
                  </RowSubtitle>
                </RowMain>
                <RowMeta>
                  {contact.type && <Pill>{contact.type}</Pill>}
                  <RatingDots value={contact.warmth} label="Warmth" />
                </RowMeta>
              </Row>
            ))}
          </RowList>
        )}
      </section>

      <section className="space-y-3">
        <SectionLabel>Add contact</SectionLabel>
        <form action={createContactAction} className="space-y-2">
          <Input name="name" placeholder="Name…" required />
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
          <Input name="type" placeholder="Type (operator, finance, recruiter)…" />
          <Input
            name="warmth"
            type="number"
            inputMode="numeric"
            min={1}
            max={5}
            placeholder="Warmth (1-5)"
          />
          <Button type="submit">Add Contact</Button>
        </form>
      </section>
    </>
  );
}
