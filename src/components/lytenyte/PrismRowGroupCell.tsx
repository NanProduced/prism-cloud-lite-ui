import type { CellRendererParams } from "@1771technologies/lytenyte-core/types";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrismRowGroupCell<T>({ row, grid }: CellRendererParams<T>) {
  if (row.kind !== "branch") return <div className="w-full h-full" />;

  const expanded = grid.api.rowGroupIsExpanded(row);
  const paddingLeft = 8 + row.depth * 16;

  return (
    <div
      className="flex items-center gap-1 w-full h-full -mx-2 pr-2"
      style={{ paddingLeft }}
    >
      <button
        type="button"
        className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent"
        aria-label={expanded ? "Collapse group" : "Expand group"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          grid.api.rowGroupToggle(row);
        }}
      >
        <ChevronRight
          className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")}
        />
      </button>
      <span className="truncate font-medium">{row.key ?? "—"}</span>
    </div>
  );
}

