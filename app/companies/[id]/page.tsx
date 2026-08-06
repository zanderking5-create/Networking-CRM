import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Nav } from "@/components/nav";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { getCompany } from "@/lib/db/companies";
import { listContactsByCompany } from "@/lib/db/contacts";
import { listInteractionsForContacts } from "@/lib/db/interactions";
import { deleteCompanyAction, updateCompanyAction } from "../actions";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [company, contacts] = await Promise.all([
    getCompany(id),
    listContactsByCompany(id),
  ]);
  if (!company) notFound();

  const interactions = await listInteractionsForContacts(
    contacts.map((c) => c.id),
  );

  const update = updateCompanyAction.bind(null, company.id);
  const remove = deleteCompanyAction.bind(null, company.id);

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <Nav />
      <h1 className="text-2xl font-semibold">{company.name}</h1>

      <form action={update} className="space-y-3">
        <Field label="Name">
          <Input name="name" defaultValue={company.name} required />
        </Field>
        <Field label="Stage">
          <Input name="stage" defaultValue={company.stage ?? ""} />
        </Field>
        <Field label="Investors">
          <Input name="investors" defaultValue={company.investors ?? ""} />
        </Field>
        <Field label="Geography">
          <Input name="geography" defaultValue={company.geography ?? ""} />
        </Field>
        <Field label="Thesis fit notes">
          <textarea
            name="thesis_fit_notes"
            defaultValue={company.thesis_fit_notes ?? ""}
            rows={4}
            className="w-full rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </Field>
        <Field label="Founder delegation style">
          <Input
            name="founder_delegation_style"
            defaultValue={company.founder_delegation_style ?? ""}
          />
        </Field>
        <Field label="Autonomy scope">
          <Input
            name="autonomy_scope"
            defaultValue={company.autonomy_scope ?? ""}
          />
        </Field>
        <Field label="Social % (0-100)">
          <Input
            name="social_pct"
            type="number"
            min={0}
            max={100}
            defaultValue={company.social_pct ?? ""}
          />
        </Field>
        <Field label="Conviction (1-5) — how much you want this, independent of relationship warmth">
          <Input
            name="conviction"
            type="number"
            min={1}
            max={5}
            defaultValue={company.conviction ?? ""}
          />
        </Field>
        <Field label="Status">
          <Input name="status" defaultValue={company.status ?? ""} />
        </Field>
        <Field label="Website">
          <Input name="website" defaultValue={company.website ?? ""} />
        </Field>
        <Button type="submit">Save</Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Contacts</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No contacts linked to this company yet.
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <Link href={`/contacts/${contact.id}`} className="underline">
                  {contact.name}
                </Link>
                {contact.role && (
                  <span className="text-muted-foreground"> — {contact.role}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Interaction timeline</h2>
        <Timeline
          items={interactions.map((i) => ({
            id: i.id,
            occurred_at: i.occurred_at,
            direction: i.direction,
            channel: i.channel,
            summary: i.summary,
            contactName: i.contacts?.name,
          }))}
          emptyMessage="No interactions logged with any contact at this company yet."
        />
      </section>

      <form action={remove}>
        <Button variant="destructive" type="submit">
          Delete company
        </Button>
      </form>
    </main>
  );
}
