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
