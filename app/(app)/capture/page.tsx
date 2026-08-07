import { CaptureForm } from "@/components/capture/capture-form";
import { DisplayHeading } from "@/components/ui/heading";
import { requireUser } from "@/lib/auth";

export default async function CapturePage() {
  await requireUser();

  return (
    <>
      <header className="space-y-2">
        <DisplayHeading className="text-3xl">Capture</DisplayHeading>
        <p className="max-w-prose text-sm text-muted-foreground">
          Paste a note. Claude drafts a contact, company, interaction, or task —
          you review and edit before anything saves.
        </p>
      </header>
      <CaptureForm />
    </>
  );
}
