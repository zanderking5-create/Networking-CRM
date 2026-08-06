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

function DirectionBadge({ direction }: { direction: string | null }) {
  if (!direction) return null;
  const isOut = direction === "out";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isOut ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground"
      }`}
    >
      {isOut ? "out" : "in"}
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
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-5 border-l border-border pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[23px] top-1 h-2 w-2 rounded-full bg-primary" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{formatDate(item.occurred_at)}</span>
            <DirectionBadge direction={item.direction} />
            {item.channel && (
              <span className="text-muted-foreground">{item.channel}</span>
            )}
            {item.contactName && (
              <span className="text-muted-foreground">· {item.contactName}</span>
            )}
          </div>
          {item.summary && (
            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
