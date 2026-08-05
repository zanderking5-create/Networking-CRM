import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Today</h1>
    </main>
  );
}
