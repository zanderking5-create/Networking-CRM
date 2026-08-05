import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/auth";

export default async function TodayPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <Nav />
      <h1 className="text-4xl font-bold">Today</h1>
    </main>
  );
}
