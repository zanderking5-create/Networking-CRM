import Link from "next/link";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <Nav />
      <h1 className="text-2xl font-semibold">Companies</h1>

      {loadError ? (
        <p className="text-sm text-destructive">
          Could not load companies: {loadError}. If the tables don&apos;t exist
          yet, run the migration in supabase/migrations/ against your Supabase
          project.
        </p>
      ) : companies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No companies yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Stage</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Geography</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-b border-border">
                <td className="py-2">
                  <Link href={`/companies/${company.id}`} className="underline">
                    {company.name}
                  </Link>
                </td>
                <td className="py-2">{company.stage ?? "—"}</td>
                <td className="py-2">{company.status ?? "—"}</td>
                <td className="py-2">{company.geography ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Add company</h2>
        <form action={createCompanyAction} className="space-y-2">
          <Input name="name" placeholder="Name *" required />
          <Input name="stage" placeholder="Stage (e.g. Seed, Series A)" />
          <Input name="status" placeholder="Status (e.g. researching, active)" />
          <Input name="geography" placeholder="Geography" />
          <Input name="website" placeholder="Website" />
          <Button type="submit">Add company</Button>
        </form>
      </section>
    </main>
  );
}
