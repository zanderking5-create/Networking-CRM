import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold">Networking CRM</h1>
      <Button nativeButton={false} render={<Link href="/login">Log in</Link>} />
    </main>
  );
}
