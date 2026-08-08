"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Ambiguity, ParseResult } from "@/lib/capture/schema";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/70";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  return (
    <span className="text-xs text-muted-foreground">
      {confidence} confidence
    </span>
  );
}

// Maps every field name that can appear in an ambiguity note -- both the
// clean parseResultSchema names and the flat wire-schema names the model
// sometimes echoes back verbatim (e.g. "person_company_name", "channel") --
// to a human label, so the UI never shows a raw schema key.
const FIELD_LABELS: Record<string, string> = {
  matched_contact_id: "Matched contact",
  matched_company_id: "Matched company",
  contact_name_if_new: "Contact name",
  person_name: "Name",
  name: "Name",
  company_name: "Company",
  person_company_name: "Company",
  role: "Role",
  type: "Type",
  contact_type: "Type",
  warmth: "Warmth",
  hook: "Hook",
  source: "Source",
  linkedin_url: "LinkedIn URL",
  email: "Email",
  stage: "Stage",
  investors: "Investors",
  geography: "Geography",
  thesis_fit_notes: "Thesis fit notes",
  founder_delegation_style: "Founder delegation style",
  autonomy_scope: "Autonomy scope",
  social_pct: "Social %",
  status: "Status",
  website: "Website",
  direction: "Direction",
  channel: "Channel",
  summary: "Summary",
  occurred_at: "Occurred on",
  follow_up_task: "Follow-up task",
  follow_up_title: "Follow-up title",
  follow_up_due_date: "Follow-up due date",
  suggested_warmth: "Suggested warmth",
  warmth_reason: "Warmth reason",
  title: "Title",
  task_title: "Title",
  due_date: "Due date",
  task_due_date: "Due date",
};

// The model can put any string it wants in an ambiguity's `field` -- the
// map above only covers names we anticipate. Anything unrecognized still
// doesn't render as a raw key: snake_case becomes Title Case instead.
function fieldLabel(field: string): string {
  return (
    FIELD_LABELS[field] ??
    field.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
  );
}

// Ambiguities are the model flagging what it guessed at, not something
// broken -- destructive/error styling here overstates it, and is the only
// place in the app where color carries meaning beyond conviction/warmth.
function AmbiguityList({ items }: { items: Ambiguity[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
      {items.map((a, i) => (
        <li key={i}>
          <span className="font-medium text-foreground">{fieldLabel(a.field)}:</span>{" "}
          {a.note}
        </li>
      ))}
    </ul>
  );
}

type Props = {
  result: ParseResult;
  onChange: (result: ParseResult) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
  confirmError: string | null;
};

export function PreviewCard({
  result,
  onChange,
  onConfirm,
  onCancel,
  confirming,
  confirmError,
}: Props) {
  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight capitalize">{result.type} — preview</h2>
        <ConfidenceBadge confidence={result.confidence} />
      </div>

      <AmbiguityList items={result.ambiguities} />

      {result.type === "contact" && (
        <ContactFields result={result} onChange={onChange} />
      )}
      {result.type === "company" && (
        <CompanyFields result={result} onChange={onChange} />
      )}
      {result.type === "interaction" && (
        <InteractionFields result={result} onChange={onChange} />
      )}
      {result.type === "task" && (
        <TaskFields result={result} onChange={onChange} />
      )}

      {confirmError && <p className="text-sm text-destructive">{confirmError}</p>}

      <div className="flex gap-2">
        <Button onClick={onConfirm} disabled={confirming}>
          {confirming ? "Saving…" : "Confirm"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={confirming}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ContactFields({
  result,
  onChange,
}: {
  result: Extract<ParseResult, { type: "contact" }>;
  onChange: (result: ParseResult) => void;
}) {
  const c = result.contact;
  const setContact = (patch: Partial<typeof c>) =>
    onChange({ ...result, contact: { ...c, ...patch } });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {result.matched_contact_id
          ? "Will update the existing contact matched below — fields left blank here won't overwrite what's already saved."
          : "Will create a new contact."}
      </p>
      {result.matched_contact_id && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={false}
            onChange={() => onChange({ ...result, matched_contact_id: null })}
          />
          Not who I mean — create as a new contact instead
        </label>
      )}
      <Field label="Name">
        <Input value={c.name} onChange={(e) => setContact({ name: e.target.value })} />
      </Field>
      <Field label="Company">
        <Input
          value={c.company_name ?? ""}
          onChange={(e) => setContact({ company_name: e.target.value || null })}
        />
      </Field>
      <Field label="Role">
        <Input
          value={c.role ?? ""}
          onChange={(e) => setContact({ role: e.target.value || null })}
        />
      </Field>
      <Field label="Type">
        <select
          className={selectClass}
          value={c.type ?? ""}
          onChange={(e) => setContact({ type: (e.target.value || null) as typeof c.type })}
        >
          <option value="">—</option>
          <option value="operator">operator</option>
          <option value="finance">finance</option>
          <option value="recruiter">recruiter</option>
        </select>
      </Field>
      <Field label="Warmth (1-5)">
        <Input
          type="number"
          min={1}
          max={5}
          value={c.warmth ?? ""}
          onChange={(e) =>
            setContact({ warmth: e.target.value ? Number(e.target.value) : null })
          }
        />
      </Field>
      <Field label="Hook">
        <Input
          value={c.hook ?? ""}
          onChange={(e) => setContact({ hook: e.target.value || null })}
        />
      </Field>
      <Field label="Source">
        <Input
          value={c.source ?? ""}
          onChange={(e) => setContact({ source: e.target.value || null })}
        />
      </Field>
      <Field label="LinkedIn URL">
        <Input
          value={c.linkedin_url ?? ""}
          onChange={(e) => setContact({ linkedin_url: e.target.value || null })}
        />
      </Field>
      <Field label="Email">
        <Input
          value={c.email ?? ""}
          onChange={(e) => setContact({ email: e.target.value || null })}
        />
      </Field>
    </div>
  );
}

function CompanyFields({
  result,
  onChange,
}: {
  result: Extract<ParseResult, { type: "company" }>;
  onChange: (result: ParseResult) => void;
}) {
  const co = result.company;
  const setCompany = (patch: Partial<typeof co>) =>
    onChange({ ...result, company: { ...co, ...patch } });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {result.matched_company_id
          ? "Will update the existing company matched below — fields left blank here won't overwrite what's already saved."
          : "Will create a new company."}
      </p>
      {result.matched_company_id && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={false}
            onChange={() => onChange({ ...result, matched_company_id: null })}
          />
          Not who I mean — create as a new company instead
        </label>
      )}
      <Field label="Name">
        <Input value={co.name} onChange={(e) => setCompany({ name: e.target.value })} />
      </Field>
      <Field label="Stage">
        <Input
          value={co.stage ?? ""}
          onChange={(e) => setCompany({ stage: e.target.value || null })}
        />
      </Field>
      <Field label="Investors">
        <Input
          value={co.investors ?? ""}
          onChange={(e) => setCompany({ investors: e.target.value || null })}
        />
      </Field>
      <Field label="Geography">
        <Input
          value={co.geography ?? ""}
          onChange={(e) => setCompany({ geography: e.target.value || null })}
        />
      </Field>
      <Field label="Thesis fit notes">
        <Input
          value={co.thesis_fit_notes ?? ""}
          onChange={(e) => setCompany({ thesis_fit_notes: e.target.value || null })}
        />
      </Field>
      <Field label="Founder delegation style">
        <Input
          value={co.founder_delegation_style ?? ""}
          onChange={(e) =>
            setCompany({ founder_delegation_style: e.target.value || null })
          }
        />
      </Field>
      <Field label="Autonomy scope">
        <Input
          value={co.autonomy_scope ?? ""}
          onChange={(e) => setCompany({ autonomy_scope: e.target.value || null })}
        />
      </Field>
      <Field label="Social %">
        <Input
          type="number"
          min={0}
          max={100}
          value={co.social_pct ?? ""}
          onChange={(e) =>
            setCompany({ social_pct: e.target.value ? Number(e.target.value) : null })
          }
        />
      </Field>
      <Field label="Status">
        <Input
          value={co.status ?? ""}
          onChange={(e) => setCompany({ status: e.target.value || null })}
        />
      </Field>
      <Field label="Website">
        <Input
          value={co.website ?? ""}
          onChange={(e) => setCompany({ website: e.target.value || null })}
        />
      </Field>
    </div>
  );
}

function InteractionFields({
  result,
  onChange,
}: {
  result: Extract<ParseResult, { type: "interaction" }>;
  onChange: (result: ParseResult) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {result.matched_contact_id
          ? "Will log this interaction against the existing contact matched below."
          : `Will create a new contact${
              result.contact_name_if_new ? ` (${result.contact_name_if_new})` : ""
            } and log this interaction against them.`}
      </p>
      {result.matched_contact_id ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={false}
            onChange={() =>
              onChange({
                ...result,
                matched_contact_id: null,
                contact_name_if_new: result.contact_name_if_new ?? "",
              })
            }
          />
          Not who I mean — create as a new contact instead
        </label>
      ) : (
        <Field label="Contact name (new)">
          <Input
            value={result.contact_name_if_new ?? ""}
            onChange={(e) =>
              onChange({ ...result, contact_name_if_new: e.target.value || null })
            }
          />
        </Field>
      )}
      <Field label="Direction">
        <select
          className={selectClass}
          value={result.direction}
          onChange={(e) =>
            onChange({ ...result, direction: e.target.value as "in" | "out" })
          }
        >
          <option value="out">out (I reached out)</option>
          <option value="in">in (they reached out)</option>
        </select>
      </Field>
      <Field label="Channel">
        <select
          className={selectClass}
          value={result.channel ?? ""}
          onChange={(e) =>
            onChange({
              ...result,
              channel: (e.target.value || null) as typeof result.channel,
            })
          }
        >
          <option value="">—</option>
          <option value="email">email</option>
          <option value="linkedin">linkedin</option>
          <option value="call">call</option>
          <option value="inperson">in person</option>
        </select>
      </Field>
      <Field label="Summary">
        <Input
          value={result.summary}
          onChange={(e) => onChange({ ...result, summary: e.target.value })}
        />
      </Field>
      <Field label="Occurred on">
        <Input
          type="date"
          value={result.occurred_at.slice(0, 10)}
          onChange={(e) => onChange({ ...result, occurred_at: e.target.value })}
        />
      </Field>

      <fieldset className="space-y-3 rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-medium">Follow-up task</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={result.follow_up_task !== null}
            onChange={(e) =>
              onChange({
                ...result,
                follow_up_task: e.target.checked
                  ? { title: "Follow up", due_date: result.occurred_at.slice(0, 10) }
                  : null,
              })
            }
          />
          Create a follow-up task
        </label>
        {result.follow_up_task && (
          <>
            <Field label="Title">
              <Input
                value={result.follow_up_task.title}
                onChange={(e) =>
                  onChange({
                    ...result,
                    follow_up_task: { ...result.follow_up_task!, title: e.target.value },
                  })
                }
              />
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={result.follow_up_task.due_date.slice(0, 10)}
                onChange={(e) =>
                  onChange({
                    ...result,
                    follow_up_task: {
                      ...result.follow_up_task!,
                      due_date: e.target.value,
                    },
                  })
                }
              />
            </Field>
          </>
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-medium">Warmth</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={result.suggested_warmth !== null}
            onChange={(e) =>
              onChange({
                ...result,
                suggested_warmth: e.target.checked ? 3 : null,
              })
            }
          />
          Update warmth
        </label>
        {result.suggested_warmth !== null && (
          <Field label="New warmth (1-5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={result.suggested_warmth}
              onChange={(e) =>
                onChange({ ...result, suggested_warmth: Number(e.target.value) })
              }
            />
          </Field>
        )}
        {result.warmth_reason && (
          <p className="text-xs text-muted-foreground">{result.warmth_reason}</p>
        )}
      </fieldset>
    </div>
  );
}

function TaskFields({
  result,
  onChange,
}: {
  result: Extract<ParseResult, { type: "task" }>;
  onChange: (result: ParseResult) => void;
}) {
  return (
    <div className="space-y-3">
      {result.matched_contact_id ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={false}
            onChange={() =>
              onChange({
                ...result,
                matched_contact_id: null,
                contact_name_if_new: result.contact_name_if_new ?? "",
              })
            }
          />
          Not who I mean — unlink this contact
        </label>
      ) : (
        <Field label="Linked contact (optional)">
          <Input
            value={result.contact_name_if_new ?? ""}
            onChange={(e) =>
              onChange({ ...result, contact_name_if_new: e.target.value || null })
            }
          />
        </Field>
      )}
      <Field label="Title">
        <Input
          value={result.title}
          onChange={(e) => onChange({ ...result, title: e.target.value })}
        />
      </Field>
      <Field label="Due date">
        <Input
          type="date"
          value={result.due_date?.slice(0, 10) ?? ""}
          onChange={(e) => onChange({ ...result, due_date: e.target.value || null })}
        />
      </Field>
    </div>
  );
}
