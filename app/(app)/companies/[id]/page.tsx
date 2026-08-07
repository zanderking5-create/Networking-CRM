import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Timeline } from "@/components/timeline";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { RatingDots } from "@/components/ui/rating-dots";
import { EmptyState, Pill, Row, RowList, RowMain, RowSubtitle, RowTitle, SectionLabel } from "@/components/ui/row";
import { requireUser } from "@/lib/auth";
import { getCompany } from "@/lib/db/companies";
import { listContactsByCompany } from "@/lib/db/contacts";
import { listInteractionsForContacts } from "@/lib/db/interactions";
import { deleteCompanyAction, updateCompanyAction } from "../actions";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
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
    <>
      <header className="flex items-start gap-4">
        <Avatar name={company.name} kind="company" size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <DisplayHeading className="text-3xl">{company.name}</DisplayHeading>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {company.stage && <span>{company.stage}</span>}
            {company.stage && company.geography && <span aria-hidden="true">·</span>}
            {company.geography && <span>{company.geography}</span>}
            {company.status && <Pill>{company.status}</Pill>}
            {company.conviction != null && (
              <span className="flex items-center gap-1.5">
                <span className="text-xs">Conviction</span>
                <RatingDots value={company.conviction} label="Conviction" />
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Contacts and history lead; the edit form moves into a rail rather
          than sitting between you and them. */}
      <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          <section className="space-y-1">
            <SectionLabel count={contacts.length}>Contacts</SectionLabel>
            {contacts.length === 0 ? (
              <EmptyState>No contacts linked to this company yet.</EmptyState>
            ) : (
              <RowList>
                {contacts.map((contact) => (
                  <Row key={contact.id} href={`/contacts/${contact.id}`}>
                    <Avatar name={contact.name} kind="person" />
                    <RowMain>
                      <RowTitle href={`/contacts/${contact.id}`} stretch>
                        {contact.name}
                      </RowTitle>
                      {contact.role && <RowSubtitle>{contact.role}</RowSubtitle>}
                    </RowMain>
                  </Row>
                ))}
              </RowList>
            )}
          </section>

          <section className="space-y-1">
            <SectionLabel count={interactions.length}>Interaction timeline</SectionLabel>
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
        </div>

        <aside className="space-y-3">
          <SectionLabel>Details</SectionLabel>
          <form action={update} className="space-y-4">
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
            className="w-full rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
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
            inputMode="numeric"
            min={0}
            max={100}
            defaultValue={company.social_pct ?? ""}
          />
        </Field>
        <Field label="Conviction (1-5) — independent of relationship warmth">
          <Input
            name="conviction"
            type="number"
            inputMode="numeric"
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

          <form action={remove} className="border-t border-border/60 pt-4">
            <Button variant="destructive" size="sm" type="submit">
              Delete Company
            </Button>
          </form>
        </aside>
      </div>
    </>
  );
}
