import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40">
      <h1 className="text-2xl font-semibold tracking-tight text-primary">
        Networking CRM
      </h1>
      <Button nativeButton={false} render={<Link href="/login">Log In</Link>} />
    </main>
  );
}
