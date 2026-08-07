// Helpers for reading optional fields out of HTML form submissions,
// normalizing empty strings to null to match the nullable DB columns.

export function formText(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function formInt(form: FormData, key: string): number | null {
  const value = formText(form, key);
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formTimestamp(form: FormData, key: string): string | null {
  const value = formText(form, key);
  if (value === null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Format a timestamptz for an <input type="datetime-local"> defaultValue.
export function toDatetimeLocal(timestamp: string | null): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Compact relative age, e.g. "12d ago" — for dense table cells where the
// long form ("12 days ago") or an absolute date would dominate a column
// that's only meant to be scanned.
export function formatRelativeShort(
  value: string | null,
  emptyLabel = "never",
): string {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyLabel;

  const days = Math.floor(
    (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (days <= 0) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// Format a timestamptz or date string for display, e.g. "Aug 6, 2026".
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
