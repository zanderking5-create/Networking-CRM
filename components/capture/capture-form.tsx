"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { confirmCaptureAction } from "@/lib/capture/actions";
import type { ParseResult } from "@/lib/capture/schema";
import { PreviewCard } from "./preview-card";

type Preview = { result: ParseResult; rawText: string };

export function CaptureForm() {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirming, startConfirm] = useTransition();
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleParse() {
    if (!text.trim() || parsing) return;
    setParsing(true);
    setParseError(null);
    setSavedMessage(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setParseError(data.error ?? "Something went wrong parsing that note.");
        return;
      }
      setPreview({ result: data.result, rawText: data.raw_text });
    } catch {
      setParseError("Network error — check your connection and try again.");
    } finally {
      setParsing(false);
    }
  }

  function handleConfirm() {
    if (!preview) return;
    setConfirmError(null);
    startConfirm(async () => {
      const outcome = await confirmCaptureAction(preview.result, preview.rawText);
      if (!outcome.ok) {
        setConfirmError(outcome.error);
        return;
      }
      setSavedMessage("Saved to the CRM.");
      setPreview(null);
      setText("");
    });
  }

  function handleCancel() {
    setPreview(null);
    setConfirmError(null);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow focus-within:shadow-md">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            "Paste a quick note — e.g. “Called Burke Griffin, went well — he’ll intro me to two people at Encord’s network, follow up in a week, and he said the technical bar is lower than I feared.”"
          }
          rows={5}
          disabled={parsing || !!preview}
          className="min-h-32 resize-none border-0 px-0 shadow-none focus-visible:border-0 focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
          <p className="text-xs text-muted-foreground">
            Nothing saves until you confirm.
          </p>
          {!preview && (
            <Button onClick={handleParse} disabled={parsing || !text.trim()}>
              {parsing ? "Parsing…" : "Parse Note"}
            </Button>
          )}
        </div>
      </div>

      {parseError && (
        <p aria-live="polite" className="text-sm text-destructive">
          {parseError}
        </p>
      )}
      {savedMessage && (
        <p aria-live="polite" className="text-sm font-medium text-primary">
          {savedMessage}
        </p>
      )}

      {preview && (
        <PreviewCard
          result={preview.result}
          onChange={(result) => setPreview({ ...preview, result })}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirming={confirming}
          confirmError={confirmError}
        />
      )}
    </div>
  );
}
