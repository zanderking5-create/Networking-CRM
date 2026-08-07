import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { EmptyState, Pill, Row, RowList, RowMain, RowMeta, RowSubtitle, RowTitle } from "@/components/ui/row";
import { formatDate } from "@/lib/forms";

export type TimelineEntry = {
  id: string;
  occurred_at: string;
  direction: string | null;
  channel: string | null;
  summary: string | null;
  // Shown when set — used on the company page, where one timeline spans
  // several contacts and each entry needs to say who it was with.
  contactName?: string | null;
};

function directionLabel(direction: string | null): string | null {
  if (direction === "out") return "Outreach";
  if (direction === "in") return "Inbound";
  return null;
}

// Direction as a glyph, matching the leading-anchor slot every other row type
// uses (checkbox on tasks, avatar on people/companies). Stays neutral —
// direction is a fact, not a status worth coloring.
function DirectionMark({ direction }: { direction: string | null }) {
  const Icon = direction === "in" ? ArrowDownLeft : ArrowUpRight;
  return (
    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
      <Icon
        aria-hidden="true"
        strokeWidth={2}
        className="size-3.5 text-secondary-foreground/70"
      />
    </span>
  );
}

export function Timeline({
  items,
  emptyMessage = "No interactions yet.",
}: {
  items: TimelineEntry[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <RowList>
      {items.map((item) => {
        const context = [directionLabel(item.direction), item.contactName]
          .filter(Boolean)
          .join(" · ");
        return (
          <Row key={item.id} className="items-start">
            <DirectionMark direction={item.direction} />
            <RowMain>
              <RowTitle className="whitespace-normal text-pretty">
                {item.summary ?? "Interaction"}
              </RowTitle>
              {context && <RowSubtitle>{context}</RowSubtitle>}
            </RowMain>
            <RowMeta>
              {item.channel && <Pill>{item.channel}</Pill>}
              <span className="mt-0.5">{formatDate(item.occurred_at)}</span>
            </RowMeta>
          </Row>
        );
      })}
    </RowList>
  );
}
