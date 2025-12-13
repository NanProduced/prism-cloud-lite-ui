import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ChevronDown, Plus, Trash2 } from "lucide-react";

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

function SelectMenu({
  valueLabel,
  placeholder,
  disabled,
  contentClassName,
  children,
}: {
  valueLabel?: string;
  placeholder: string;
  disabled?: boolean;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full justify-between px-3 font-normal"
          disabled={disabled}
        >
          <span className={cn("truncate", !valueLabel && "text-muted-foreground")}>
            {valueLabel || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          "w-[var(--radix-popper-anchor-width)] max-w-[28rem]",
          contentClassName
        )}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
    const mapped = sortModel.map((s) => {
      const col = s.columnId ? columnLookup.get(s.columnId) : undefined;
      return {
        id: makeId(),
        columnId: s.columnId ?? "",
        order: (s.isDescending ? "desc" : "asc") as SortOrder,
        sortOn: sortOnFromModelItem(s, col),
      };
    });
    setDraft(
      mapped.length > 0
        ? mapped
        : [{ id: makeId(), columnId: "", order: "asc" as SortOrder, sortOn: "default" }]
    );
  }, [columnLookup, open, sortModel]);

  const addSort = () => {
    const selected = new Set(draft.map((d) => d.columnId).filter(Boolean));
    const nextCol = sortableColumns.find((c) => !selected.has(String(c.id)));
    setDraft((prev) => [
      ...prev,
      {
        id: makeId(),
        columnId: nextCol?.id ?? "",
        order: "asc" as SortOrder,
        sortOn: nextCol ? defaultSortOnForColumn(nextCol) : "default",
      },
    ]);
  };

  const apply = () => {
    const nextDraft = draft.filter((d) => Boolean(d.columnId));
    grid.state.sortModel.set(modelFromDraft(nextDraft, columnLookup));
    setOpen(false);
  };

  const clear = () => {
    grid.state.sortModel.set([]);
    setDraft([{ id: makeId(), columnId: "", order: "asc" as SortOrder, sortOn: "default" }]);
  };

  const hasValidSort = useMemo(() => {
    return modelFromDraft(draft.filter((d) => Boolean(d.columnId)), columnLookup).length > 0;
  }, [columnLookup, draft]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <ArrowUpDown className="h-4 w-4" />
          Sort
        </Button>
      </DialogTrigger>

      <DialogContent className="!w-[min(92vw,52rem)] !max-w-none p-0 overflow-hidden max-h-[85vh]">
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <DialogTitle>Sort</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 grid gap-3 overflow-auto">
          <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr_auto] gap-2 text-xs font-semibold text-muted-foreground">
            <div>Column</div>
            <div>Sort On</div>
            <div>Order</div>
            <div />
          </div>

          <div className="grid gap-2">
            {draft.map((d, idx) => {
              const col = d.columnId ? columnLookup.get(d.columnId) : undefined;
              const sortOnOptions = col ? sortOnOptionsForColumn(col) : [];
              const sortOnNormalized =
                col && !sortOnOptions.some((o) => o.value === d.sortOn)
                  ? defaultSortOnForColumn(col)
                  : d.sortOn;

              const usedByOthers = new Set(
                draft
                  .filter((x) => x.id !== d.id)
                  .map((x) => x.columnId)
                  .filter(Boolean)
              );

              return (
                <div key={d.id} className="grid grid-cols-[1.4fr_1.2fr_0.8fr_auto] gap-2 items-center">
                  <SelectMenu
                    valueLabel={col ? String(col.name ?? col.id) : undefined}
                    placeholder="Select…"
                    contentClassName="max-h-72"
                  >
                    <DropdownMenuCheckboxItem
                      checked={!d.columnId}
                      onSelect={() => {
                        setDraft((prev) =>
                          prev.map((p) =>
                            p.id === d.id
                              ? { ...p, columnId: "", sortOn: "default" }
                              : p
                          )
                        );
                      }}
                    >
                      Select…
                    </DropdownMenuCheckboxItem>
                    {sortableColumns.map((c) => {
                      const id = String(c.id);
                      const disabled = usedByOthers.has(id);
                      return (
                        <DropdownMenuCheckboxItem
                          key={id}
                          checked={d.columnId === id}
                          disabled={disabled}
                          onSelect={() => {
                            if (disabled) return;
                            setDraft((prev) =>
                              prev.map((p) =>
                                p.id === d.id
                                  ? { ...p, columnId: id, sortOn: defaultSortOnForColumn(c) }
                                  : p
                              )
                            );
                          }}
                        >
                          {String(c.name ?? c.id)}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </SelectMenu>

                  <SelectMenu
                    valueLabel={col ? (sortOnOptions.find((o) => o.value === sortOnNormalized)?.label ?? String(sortOnNormalized)) : undefined}
                    placeholder="Sort on…"
                    disabled={!col}
                    contentClassName="max-h-60"
                  >
                    <DropdownMenuRadioGroup
                      value={col ? String(sortOnNormalized) : ""}
                      onValueChange={(v) => {
                        if (!col) return;
                        const next = v as SortOn;
                        setDraft((prev) => prev.map((p) => (p.id === d.id ? { ...p, sortOn: next } : p)));
                      }}
                    >
                      {sortOnOptions.map((o) => (
                        <DropdownMenuRadioItem key={o.value} value={String(o.value)}>
                          {o.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </SelectMenu>

                  <SelectMenu
                    valueLabel={d.order === "asc" ? "Asc" : "Desc"}
                    placeholder="Order"
                    contentClassName="w-44"
                  >
                    <DropdownMenuRadioGroup
                      value={d.order}
                      onValueChange={(v) => {
                        const next = v as SortOrder;
                        setDraft((prev) => prev.map((p) => (p.id === d.id ? { ...p, order: next } : p)));
                      }}
                    >
                      <DropdownMenuRadioItem value="asc">Asc</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="desc">Desc</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </SelectMenu>

                  <div className="flex items-center justify-end gap-1">
                    {idx === draft.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={addSort}
                        disabled={sortableColumns.length === 0}
                        aria-label="Add sort"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        setDraft((prev) => {
                          const next = prev.filter((p) => p.id !== d.id);
                          return next.length > 0
                            ? next
                            : [{ id: makeId(), columnId: "", order: "asc" as SortOrder, sortOn: "default" }];
                        });
                      }}
                      aria-label="Remove sort"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={clear}>
              Clear
            </Button>
            <Button type="button" onClick={apply} disabled={!hasValidSort}>
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
