import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { RatingDots } from "@/components/ui/rating-dots";
import { EmptyState, Pill, Row, RowList, RowMain, RowMeta, RowSubtitle, RowTitle, SectionLabel } from "@/components/ui/row";
import { requireUser } from "@/lib/auth";
import { listCompanies } from "@/lib/db/companies";
import type { Company } from "@/lib/db/types";
import { createCompanyAction } from "./actions";

export default async function CompaniesPage() {
  await requireUser();

  let companies: Company[] = [];
  let loadError: string | null = null;
  try {
    companies = await listCompanies();
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  return (
    <>
      <DisplayHeading className="text-3xl">Companies</DisplayHeading>

      <section>
        <SectionLabel count={companies.length}>Ranked by conviction</SectionLabel>
        {loadError ? (
          <p className="text-sm text-destructive">
            Could not load companies: {loadError}. If the tables don&apos;t exist
            yet, run the migration in supabase/migrations/ against your Supabase
            project.
          </p>
        ) : companies.length === 0 ? (
          <EmptyState>No companies yet — add your first one below.</EmptyState>
        ) : (
          <RowList>
            {companies.map((company) => {
              // Only render a subtitle when there is something to say — an
              // em-dash placeholder on every unfilled company reads as broken.
              const subtitle = [company.stage, company.geography]
                .filter(Boolean)
                .join(" · ");
              return (
                <Row key={company.id} href={`/companies/${company.id}`}>
                  <Avatar name={company.name} kind="company" />
                  <RowMain>
                    <RowTitle href={`/companies/${company.id}`} stretch>
                      {company.name}
                    </RowTitle>
                    {subtitle && <RowSubtitle>{subtitle}</RowSubtitle>}
                  </RowMain>
                  <RowMeta>
                    {company.status && <Pill>{company.status}</Pill>}
                    <RatingDots value={company.conviction} label="Conviction" />
                  </RowMeta>
                </Row>
              );
            })}
          </RowList>
        )}
      </section>

      <section className="space-y-3">
        <SectionLabel>Add company</SectionLabel>
        <form action={createCompanyAction} className="space-y-2">
          <Input name="name" placeholder="Name…" required />
          <Input name="stage" placeholder="Stage (e.g. Seed, Series A)…" />
          <Input name="status" placeholder="Status (e.g. researching, active)…" />
          <Input name="geography" placeholder="Geography…" />
          <Input name="website" placeholder="Website…" />
          <Input
            name="conviction"
            type="number"
            inputMode="numeric"
            min={1}
            max={5}
            placeholder="Conviction (1-5)"
          />
          <Button type="submit">Add Company</Button>
        </form>
      </section>
    </>
  );
}
