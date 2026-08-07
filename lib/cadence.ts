// Keep-in-touch cadence. One source of truth for the allowed values, their
// interval in days, and their display label — the DB CHECK constraint in
// supabase/migrations/20260807090000_add_contact_cadence.sql must stay in
// sync with CADENCE_OPTIONS.

export const CADENCE_OPTIONS = [
  { value: "weekly", label: "Every week", days: 7 },
  { value: "monthly", label: "Every month", days: 30 },
  { value: "quarterly", label: "Every quarter", days: 90 },
] as const;

export type Cadence = (typeof CADENCE_OPTIONS)[number]["value"];

export function isCadence(value: string | null): value is Cadence {
  return CADENCE_OPTIONS.some((option) => option.value === value);
}

export function cadenceDays(value: string | null): number | null {
  return CADENCE_OPTIONS.find((option) => option.value === value)?.days ?? null;
}

export function cadenceLabel(value: string | null): string | null {
  return CADENCE_OPTIONS.find((option) => option.value === value)?.label ?? null;
}
