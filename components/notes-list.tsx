import { EmptyState, Row, RowList, RowMain, RowMeta, RowSubtitle, RowTitle } from "@/components/ui/row";
import { formatDate } from "@/lib/forms";

export type NoteListItem = {
  id: string;
  body: string;
  created_at: string;
  // Shown when set -- used on the company page, where one notes list spans
  // several contacts and each entry needs to say who it's about.
  contactName?: string | null;
};

export function NotesList({
  items,
  emptyMessage = "No notes yet. Add one below.",
}: {
  items: NoteListItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <RowList>
      {items.map((item) => (
        <Row key={item.id} className="items-start">
          <RowMain>
            {/* Notes are free-form textarea input, potentially several
                sentences -- preserve line breaks (whitespace-pre-wrap) and
                let them wrap rather than truncating to one line like a
                typical row title. */}
            <RowTitle className="whitespace-pre-wrap text-pretty font-normal">
              {item.body}
            </RowTitle>
            {item.contactName && <RowSubtitle>{item.contactName}</RowSubtitle>}
          </RowMain>
          <RowMeta>
            <span className="mt-0.5 whitespace-nowrap">{formatDate(item.created_at)}</span>
          </RowMeta>
        </Row>
      ))}
    </RowList>
  );
}
