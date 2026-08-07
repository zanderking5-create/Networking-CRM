import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { RatingDots } from "@/components/ui/rating-dots";
import { Pill, SectionLabel } from "@/components/ui/row";
import { requireUser } from "@/lib/auth";
import { listContacts } from "@/lib/db/contacts";
import { getRole } from "@/lib/db/roles";
import { ROLE_SOURCES, ROLE_STATUSES, roleSourceLabel, roleStatusLabel } from "@/lib/roles";
import { deleteRoleAction, updateRoleAction } from "../actions";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70";

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

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [role, contacts] = await Promise.all([getRole(id), listContacts()]);
  if (!role) notFound();

  const update = updateRoleAction.bind(null, role.id);
  const remove = deleteRoleAction.bind(null, role.id, role.company_id);

  return (
    <>
      <header className="space-y-2">
        <DisplayHeading className="text-3xl">
          {role.title ?? "Untitled role"}
        </DisplayHeading>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {role.companies && (
            <Link
              href={`/companies/${role.companies.id}`}
              className="transition-colors hover:text-primary"
            >
              {role.companies.name}
            </Link>
          )}
          <Pill>{roleStatusLabel(role.status)}</Pill>
          {role.source && <span>{roleSourceLabel(role.source)}</span>}
          {role.contacts && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                via{" "}
                <Link
                  href={`/contacts/${role.contacts.id}`}
                  className="transition-colors hover:text-primary"
                >
                  {role.contacts.name}
                </Link>
              </span>
            </>
          )}
          {role.conviction != null && (
            <span className="flex items-center gap-1.5">
              <span className="text-xs">Conviction</span>
              <RatingDots value={role.conviction} label="Conviction" />
            </span>
          )}
        </div>
      </header>

      <form action={update}>
        <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-10">
            <section className="space-y-4">
              <SectionLabel>Operating conditions</SectionLabel>
              <Field label="Autonomy scope">
                <textarea
                  name="autonomy_scope"
                  defaultValue={role.autonomy_scope ?? ""}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
                />
              </Field>
              <Field label="Founder delegation style">
                <textarea
                  name="founder_delegation_style"
                  defaultValue={role.founder_delegation_style ?? ""}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
                />
              </Field>
              <Field label="Social % (0-100) — how externally facing the seat is">
                <Input
                  name="social_pct"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  defaultValue={role.social_pct ?? ""}
                />
              </Field>
            </section>

            <section className="space-y-4">
              <SectionLabel>Notes</SectionLabel>
              <textarea
                name="notes"
                defaultValue={role.notes ?? ""}
                rows={6}
                className="w-full rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70"
              />
            </section>
          </div>

          <aside className="space-y-4">
            <SectionLabel>Details</SectionLabel>
            <Field label="Title">
              <Input name="title" defaultValue={role.title ?? ""} />
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={role.status} className={selectClass}>
                {ROLE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Conviction (1-5) — how much you want this seat">
              <Input
                name="conviction"
                type="number"
                inputMode="numeric"
                min={1}
                max={5}
                defaultValue={role.conviction ?? ""}
              />
            </Field>
            <Field label="Source">
              <select
                name="source"
                defaultValue={role.source ?? ""}
                className={selectClass}
              >
                <option value="">Unknown</option>
                {ROLE_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Referrer — who got you in">
              <select
                name="referrer_contact_id"
                defaultValue={role.referrer_contact_id ?? ""}
                className={selectClass}
              >
                <option value="">No referrer</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Job URL">
              <Input name="job_url" defaultValue={role.job_url ?? ""} />
            </Field>
            <Button type="submit">Save</Button>
          </aside>
        </div>
      </form>

      <ConfirmDeleteForm action={remove} label="Delete Role" />
    </>
  );
}
