// Role vocabulary. Single source for the values, labels, and ordering used by
// the selects and the /today stall check.
//
// Deliberately not CHECK-constrained in the DB, matching tasks.status — the
// UI only ever writes these through a <select>, and keeping it loose avoids a
// migration every time the wording changes.

export const ROLE_STATUSES = [
  { value: "watching", label: "Watching" },
  { value: "in conversation", label: "In conversation" },
  { value: "interviewing", label: "Interviewing" },
  { value: "closed", label: "Closed" },
] as const;

export type RoleStatus = (typeof ROLE_STATUSES)[number]["value"];

// The statuses that represent live momentum — the only ones that can stall.
export const ACTIVE_ROLE_STATUSES: readonly string[] = [
  "in conversation",
  "interviewing",
];

// Days without a status change before an active role counts as stalled.
export const ROLE_STALL_DAYS = 10;

export const ROLE_SOURCES = [
  { value: "warm intro", label: "Warm intro" },
  { value: "founder direct", label: "Founder direct" },
  { value: "recruiter", label: "Recruiter" },
  { value: "inbound", label: "Inbound" },
  { value: "cold apply", label: "Cold apply" },
] as const;

export function roleStatusLabel(value: string | null): string | null {
  return ROLE_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function roleSourceLabel(value: string | null): string | null {
  return ROLE_SOURCES.find((s) => s.value === value)?.label ?? value;
}
