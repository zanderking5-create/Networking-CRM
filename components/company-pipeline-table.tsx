import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { RatingDots } from "@/components/ui/rating-dots";
import {
  COMPANY_SORT_COLUMNS,
  companySortHref,
  type CompanySort,
  type CompanySortColumn,
  type SortableCompany,
} from "@/lib/company-sort";
import { formatRelativeShort } from "@/lib/forms";
import { cn } from "@/lib/utils";

// The target list as a table: one line per company, ranked, scannable top to
// bottom. Same visual language as the row lists elsewhere — hairline
// separators, muted small-caps headers, no card wrappers, no per-row borders
// — just held to a column grid so conviction and staleness line up down the
// page. Color stays reserved for the conviction dots.

// Rows are structural, so the preview harness and the page can share this
// component without either one owning the DB row type.
export type CompanyPipelineTableRow = SortableCompany & { id: string };

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

function SortHeader({
  column,
  sort,
}: {
  column: CompanySortColumn;
  sort: CompanySort;
}) {
  const active = sort.key === column.key;
  // Inactive headers still render an arrow, just transparent — it keeps the
  // label from shifting when a column becomes active, and fades in on hover
  // to advertise that the header is clickable at all.
  const Chevron = active && sort.direction === "asc" ? ChevronUp : ChevronDown;

  return (
    <th
      scope="col"
      aria-sort={active ? ARIA_SORT[sort.direction] : "none"}
      className={cn(
        "px-3 pb-2.5 font-normal",
        column.align === "right" ? "text-right" : "text-left",
      )}
    >
      <Link
        href={companySortHref(column.key, sort)}
        className={cn(
          "group/sort inline-flex items-center gap-1 rounded-sm text-[0.6875rem] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
          // On right-aligned columns the arrow goes on the outside, so the
          // label itself stays flush with the numbers beneath it.
          column.align === "right" && "flex-row-reverse",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {column.label}
        <Chevron
          aria-hidden="true"
          strokeWidth={2.5}
          className={cn(
            "size-3 shrink-0 transition-opacity",
            active ? "opacity-60" : "opacity-0 group-hover/sort:opacity-40",
          )}
        />
      </Link>
    </th>
  );
}

function Blank() {
  return <span className="text-muted-foreground/50">—</span>;
}

export function CompanyPipelineTable({
  rows,
  sort,
}: {
  rows: CompanyPipelineTableRow[];
  sort: CompanySort;
}) {
  return (
    // Bleeds 12px past the content column so a row's hover state extends
    // past the text, matching the -mx-3 row lists. Narrow viewports scroll
    // the table rather than crushing six columns.
    <div className="-mx-3 overflow-x-auto">
      <table className="w-full min-w-[48rem] text-sm">
        <thead>
          <tr className="border-b border-border/60">
            {COMPANY_SORT_COLUMNS.map((column) => (
              <SortHeader key={column.key} column={column} sort={sort} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="relative border-b border-border/60 transition-colors last:border-0 hover:bg-muted/50"
            >
              <td className="px-3 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={row.name} kind="company" />
                  {/* Stretched overlay makes the whole row one click target
                      while keeping a single focusable element per row. */}
                  <Link
                    href={`/companies/${row.id}`}
                    className="truncate rounded-sm font-medium text-foreground transition-colors after:absolute after:inset-0 after:content-[''] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                  >
                    {row.name}
                  </Link>
                </div>
              </td>

              <td className="px-3 py-4">
                <RatingDots value={row.conviction} label="Conviction" />
              </td>

              <td className="px-3 py-4 text-right tabular-nums">
                {row.contact_count > 0 ? (
                  <span className="text-foreground">{row.contact_count}</span>
                ) : (
                  <span className="text-muted-foreground/50">0</span>
                )}
              </td>

              <td
                className={cn(
                  "whitespace-nowrap px-3 py-4 text-right tabular-nums",
                  row.last_interaction_at
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50",
                )}
              >
                {formatRelativeShort(row.last_interaction_at)}
              </td>

              <td className="whitespace-nowrap px-3 py-4 text-muted-foreground">
                {row.stage || <Blank />}
              </td>

              <td className="px-3 py-4 text-muted-foreground">
                {row.investors ? (
                  <span className="block max-w-[16rem] truncate">
                    {row.investors}
                  </span>
                ) : (
                  <Blank />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
