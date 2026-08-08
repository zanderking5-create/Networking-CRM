import { CompanyPipelineTable } from "@/components/company-pipeline-table";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { EmptyState, SectionLabel } from "@/components/ui/row";
import { requireUser } from "@/lib/auth";
import { companySortColumn, parseCompanySort } from "@/lib/company-sort";
import { listCompanyPipeline } from "@/lib/db/companies";
import type { CompanyPipelineRow } from "@/lib/db/companies";
import { createCompanyAction } from "./actions";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUser();

  // Sort lives in the URL, not in client state — the ordering is applied
  // server-side, so the rendered page and the link you'd share always agree.
  const sort = parseCompanySort(await searchParams);

  let companies: CompanyPipelineRow[] = [];
  let loadError: string | null = null;
  try {
    companies = await listCompanyPipeline(sort);
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error);
  }

  return (
    <>
      <DisplayHeading className="text-3xl">Companies</DisplayHeading>

      <section>
        <SectionLabel count={companies.length}>
          Ranked by {companySortColumn(sort.key).label.toLowerCase()}
        </SectionLabel>
        {loadError ? (
          <p className="text-sm text-destructive">
            Could not load companies: {loadError}. If the tables don&apos;t exist
            yet, run the migration in supabase/migrations/ against your Supabase
            project.
          </p>
        ) : companies.length === 0 ? (
          <EmptyState>No companies yet. Add your first one below.</EmptyState>
        ) : (
          <CompanyPipelineTable rows={companies} sort={sort} />
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
