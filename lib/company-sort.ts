// Sort spec for the /companies pipeline table.
//
// It lives apart from the data layer because three places have to agree on
// the same set of keys: the URL search params on the way in, the header
// links on the way out, and the comparator in between. Keeping the spec in
// one table means adding a sortable column is a single edit.

export type SortDirection = "asc" | "desc";

// `align` is here rather than in the component because it follows from the
// data type, not the layout: numbers and dates right, text left.
export const COMPANY_SORT_COLUMNS = [
  { key: "name", label: "Company", align: "left", defaultDirection: "asc" },
  { key: "conviction", label: "Conviction", align: "left", defaultDirection: "desc" },
  { key: "contacts", label: "Contacts", align: "right", defaultDirection: "desc" },
  { key: "activity", label: "Last interaction", align: "right", defaultDirection: "desc" },
  { key: "stage", label: "Stage", align: "left", defaultDirection: "asc" },
  { key: "investors", label: "Investors", align: "left", defaultDirection: "asc" },
] as const satisfies readonly {
  key: string;
  label: string;
  align: "left" | "right";
  defaultDirection: SortDirection;
}[];

export type CompanySortColumn = (typeof COMPANY_SORT_COLUMNS)[number];
export type CompanySortKey = CompanySortColumn["key"];
export type CompanySort = { key: CompanySortKey; direction: SortDirection };

// Conviction first: the list is a target list before it's anything else.
export const DEFAULT_COMPANY_SORT: CompanySort = {
  key: "conviction",
  direction: "desc",
};

export function companySortColumn(key: CompanySortKey): CompanySortColumn {
  const column = COMPANY_SORT_COLUMNS.find((candidate) => candidate.key === key);
  return column ?? COMPANY_SORT_COLUMNS[1];
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// Anything unrecognized falls back to the default rather than erroring — a
// hand-edited or stale URL should still render the list.
export function parseCompanySort(params: RawSearchParams): CompanySort {
  const requested = firstValue(params.sort);
  const column = COMPANY_SORT_COLUMNS.find(
    (candidate) => candidate.key === requested,
  );
  if (!column) return DEFAULT_COMPANY_SORT;

  const direction = firstValue(params.dir);
  return {
    key: column.key,
    direction:
      direction === "asc" || direction === "desc"
        ? direction
        : column.defaultDirection,
  };
}

// Clicking the active column reverses it; clicking any other column starts
// at that column's natural direction (text A–Z, numbers and dates
// highest/most-recent first). The default sort gets a bare /companies so the
// canonical view has a clean URL.
export function companySortHref(
  key: CompanySortKey,
  current: CompanySort,
): string {
  const direction: SortDirection =
    current.key === key
      ? current.direction === "asc"
        ? "desc"
        : "asc"
      : companySortColumn(key).defaultDirection;

  if (
    key === DEFAULT_COMPANY_SORT.key &&
    direction === DEFAULT_COMPANY_SORT.direction
  ) {
    return "/companies";
  }
  return `/companies?${new URLSearchParams({ sort: key, dir: direction })}`;
}

// The shape the comparator needs — structural rather than the DB row type,
// so this module stays free of any dependency on the data layer.
export type SortableCompany = {
  name: string;
  conviction: number | null;
  stage: string | null;
  investors: string | null;
  contact_count: number;
  last_interaction_at: string | null;
};

function text(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function timestamp(value: string | null): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

const compareNumbers = (a: number, b: number) => a - b;
const compareText = (a: string, b: string) =>
  a.localeCompare(b, "en", { sensitivity: "base" });

// Missing values sort last in *both* directions. Flipping the arrow should
// reorder the companies you have data for, not float the blanks to the top.
function nullsLast<T>(
  a: T | null,
  b: T | null,
  direction: SortDirection,
  compare: (x: T, y: T) => number,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direction === "asc" ? compare(a, b) : -compare(a, b);
}

function primaryComparator({ key, direction }: CompanySort) {
  return (a: SortableCompany, b: SortableCompany): number => {
    switch (key) {
      case "name":
        return nullsLast(text(a.name), text(b.name), direction, compareText);
      case "conviction":
        return nullsLast(a.conviction, b.conviction, direction, compareNumbers);
      case "contacts":
        return nullsLast(
          a.contact_count,
          b.contact_count,
          direction,
          compareNumbers,
        );
      case "activity":
        return nullsLast(
          timestamp(a.last_interaction_at),
          timestamp(b.last_interaction_at),
          direction,
          compareNumbers,
        );
      case "stage":
        return nullsLast(text(a.stage), text(b.stage), direction, compareText);
      case "investors":
        return nullsLast(
          text(a.investors),
          text(b.investors),
          direction,
          compareText,
        );
    }
  };
}

// Every sort falls back to the default ranking, so rows tied on the chosen
// column still read as a target list instead of shuffling between requests.
function defaultComparator(a: SortableCompany, b: SortableCompany): number {
  return (
    nullsLast(a.conviction, b.conviction, "desc", compareNumbers) ||
    nullsLast(
      timestamp(a.last_interaction_at),
      timestamp(b.last_interaction_at),
      "desc",
      compareNumbers,
    ) ||
    compareText(a.name, b.name)
  );
}

export function sortCompanies<T extends SortableCompany>(
  rows: T[],
  sort: CompanySort,
): T[] {
  const primary = primaryComparator(sort);
  return [...rows].sort((a, b) => primary(a, b) || defaultComparator(a, b));
}
