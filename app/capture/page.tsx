import { CaptureForm } from "@/components/capture/capture-form";
import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/auth";

export default async function CapturePage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <Nav />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Capture</h1>
        <p className="text-sm text-muted-foreground">
          Paste a note. Claude drafts a contact, company, interaction, or task —
          you review and edit before anything saves.
        </p>
      </div>
      <CaptureForm />
    </main>
  );
}
