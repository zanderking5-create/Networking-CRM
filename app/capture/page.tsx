import { CaptureForm } from "@/components/capture/capture-form";
import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/auth";

export default async function CapturePage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-3xl space-y-10 p-8 sm:p-10">
      <Nav />
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Capture</h1>
        <p className="text-sm text-muted-foreground">
          Paste a note. Claude drafts a contact, company, interaction, or task —
          you review and edit before anything saves.
        </p>
      </div>
      <CaptureForm />
    </main>
  );
}
