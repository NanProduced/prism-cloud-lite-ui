import { useEffect, useMemo, useState } from "react";
import type {
  Column,
  Grid,
  SortDateColumnSort,
  SortModelItem,
  SortNumberColumnSort,
  SortStringColumnSort,
} from "@1771technologies/lytenyte-core/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Trash2 } from "lucide-react";

type SortOrder = "asc" | "desc";
type SortOn =
  | "default"
  | "caseInsensitive"
  | "trimWhitespace"
  | "ignorePunctuation"
  | "absoluteValue"
  | "dateOnly"
  | "dateTime";

type DraftSort = {
  id: string;
  columnId: string;
  order: SortOrder;
  sortOn: SortOn;
};

function sortKindForColumn<T>(
  column: Column<T>
): SortModelItem<T>["sort"]["kind"] {
  switch (column.type) {
    case "number":
      return "number";
    case "date":
    case "datetime":
      return "date";
    default:
      return "string";
  }
}

function defaultSortOnForColumn<T>(column: Column<T>): SortOn {
  const kind = sortKindForColumn(column);
  if (kind === "number") return "default";
  if (kind === "date") return column.type === "datetime" ? "dateTime" : "dateOnly";
  return "default";
}

function sortOnOptionsForColumn<T>(
  column: Column<T>
): { value: SortOn; label: string }[] {
  const kind = sortKindForColumn(column);
  if (kind === "number") {
    return [
      { value: "default", label: "Value" },
      { value: "absoluteValue", label: "Absolute value" },
    ];
  }
  if (kind === "date") {
    return [
      { value: "dateOnly", label: "Date only" },
      { value: "dateTime", label: "Date & time" },
    ];
  }
  return [
    { value: "default", label: "Default" },
    { value: "caseInsensitive", label: "Case insensitive" },
    { value: "trimWhitespace", label: "Trim whitespace" },
    { value: "ignorePunctuation", label: "Ignore punctuation" },
  ];
}

function sortOnFromModelItem<T>(item: SortModelItem<T>, column?: Column<T>): SortOn {
  if (!column) return "default";
  const kind = item.sort.kind;
  if (kind === "number") {
    const options = (item.sort as SortNumberColumnSort).options;
    return options?.absoluteValue ? "absoluteValue" : "default";
  }
  if (kind === "date") {
    const options = (item.sort as SortDateColumnSort).options;
    return options?.includeTime ? "dateTime" : "dateOnly";
  }
  if (kind === "string") {
    const options = (item.sort as SortStringColumnSort).options;
    if (options?.caseInsensitive) return "caseInsensitive";
    if (options?.trimWhitespace) return "trimWhitespace";
    if (options?.ignorePunctuation) return "ignorePunctuation";
    return "default";
  }
  return "default";
}

function modelFromDraft<T>(
  draft: DraftSort[],
  columnLookup: Map<string, Column<T>>
): SortModelItem<T>[] {
  const next: SortModelItem<T>[] = [];
  for (const d of draft) {
    const column = columnLookup.get(d.columnId);
    if (!column) continue;

    const kind = sortKindForColumn(column);
    const isDescending = d.order === "desc" ? true : undefined;

    if (kind === "number") {
      const options =
        d.sortOn === "absoluteValue" ? { absoluteValue: true } : undefined;
      next.push({
        columnId: column.id,
        isDescending,
        sort: { kind: "number", options },
      });
      continue;
    }

    if (kind === "date") {
      const includeTime =
        d.sortOn === "dateTime" ? true : d.sortOn === "dateOnly" ? false : column.type === "datetime";
      next.push({
        columnId: column.id,
        isDescending,
        sort: { kind: "date", options: { includeTime } },
      });
      continue;
    }

    const options =
      d.sortOn === "caseInsensitive"
        ? { caseInsensitive: true }
        : d.sortOn === "trimWhitespace"
          ? { trimWhitespace: true }
          : d.sortOn === "ignorePunctuation"
            ? { ignorePunctuation: true }
            : undefined;
    next.push({
      columnId: column.id,
      isDescending,
      sort: { kind: "string", options },
    });
  }
  return next;
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function PrismSortManagerDialog<T>({
  grid,
  columns,
  className,
}: {
  grid: Grid<T>;
  columns: Column<T>[];
  className?: string;
}) {
  const sortModel = grid.state.sortModel.useValue();
  const sortableColumns = useMemo(
    () => columns.filter((c) => c.uiHints?.sortable !== false),
    [columns]
  );
  const columnLookup = useMemo(() => {
    const map = new Map<string, Column<T>>();
    for (const c of sortableColumns) map.set(c.id, c);
    return map;
  }, [sortableColumns]);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftSort[]>([]);

  useEffect(() => {
    if (!open) return;
    setDraft(
      sortModel.map((s) => {
        const col = s.columnId ? columnLookup.get(s.columnId) : undefined;
        return {
          id: makeId(),
          columnId: s.columnId ?? "",
          order: s.isDescending ? "desc" : "asc",
          sortOn: sortOnFromModelItem(s, col),
        };
      })
    );
  }, [columnLookup, open, sortModel]);

  const addSort = () => {
    const first = sortableColumns[0];
    setDraft((prev) => [
      ...prev,
      {
        id: makeId(),
        columnId: first?.id ?? "",
        order: "asc",
        sortOn: first ? defaultSortOnForColumn(first) : "default",
      },
    ]);
  };

  const apply = () => {
    grid.state.sortModel.set(modelFromDraft(draft, columnLookup));
    setOpen(false);
  };

  const clear = () => {
    grid.state.sortModel.set([]);
    setDraft([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <ArrowUpDown className="h-4 w-4" />
          Sort
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle>Sort</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {draft.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No sorts applied.
            </div>
          ) : (
            <div className="grid gap-2">
              <div className="grid grid-cols-[1.6fr_1.4fr_0.9fr_auto] gap-2 text-xs font-semibold text-muted-foreground px-1">
                <div>Column</div>
                <div>Sort On</div>
                <div>Order</div>
                <div />
              </div>

              {draft.map((d) => {
                const col = columnLookup.get(d.columnId);
                const sortOnOptions = col ? sortOnOptionsForColumn(col) : [];
                const sortOnNormalized =
                  col && !sortOnOptions.some((o) => o.value === d.sortOn)
                    ? defaultSortOnForColumn(col)
                    : d.sortOn;

                return (
                  <div
                    key={d.id}
                    className="grid grid-cols-[1.6fr_1.4fr_0.9fr_auto] gap-2 items-center"
                  >
                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={d.columnId}
                      onChange={(e) => {
                        const nextColumnId = e.target.value;
                        const nextCol = columnLookup.get(nextColumnId);
                        setDraft((prev) =>
                          prev.map((p) =>
                            p.id === d.id
                              ? {
                                  ...p,
                                  columnId: nextColumnId,
                                  sortOn: nextCol
                                    ? defaultSortOnForColumn(nextCol)
                                    : "default",
                                }
                              : p
                          )
                        );
                      }}
                    >
                      {sortableColumns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name ?? c.id}
                        </option>
                      ))}
                    </select>

                    <select
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={sortOnNormalized}
                      onChange={(e) => {
                        const next = e.target.value as SortOn;
                        setDraft((prev) =>
                          prev.map((p) =>
                            p.id === d.id ? { ...p, sortOn: next } : p
                          )
                        );
                      }}
                      disabled={!col}
                    >
                      {sortOnOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant={d.order === "asc" ? "secondary" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() =>
                          setDraft((prev) =>
                            prev.map((p) =>
                              p.id === d.id ? { ...p, order: "asc" } : p
                            )
                          )
                        }
                        aria-label="Sort ascending"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={d.order === "desc" ? "secondary" : "outline"}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() =>
                          setDraft((prev) =>
                            prev.map((p) =>
                              p.id === d.id ? { ...p, order: "desc" } : p
                            )
                          )
                        }
                        aria-label="Sort descending"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() =>
                        setDraft((prev) => prev.filter((p) => p.id !== d.id))
                      }
                      aria-label="Remove sort"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={addSort}
              disabled={sortableColumns.length === 0}
            >
              <Plus className="h-4 w-4" />
              Add sort
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={clear}>
                Clear
              </Button>
              <Button type="button" onClick={apply} disabled={draft.length === 0}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
