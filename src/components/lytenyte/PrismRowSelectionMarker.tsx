import type {
  CellRendererParams,
  HeaderCellRendererParams,
} from "@1771technologies/lytenyte-core/types";
import { Checkbox } from "@/components/ui/checkbox";

export function PrismRowSelectionMarkerHeaderRenderer<T>({
  grid,
}: HeaderCellRendererParams<T>) {
  const selectedIds = grid.state.rowSelectedIds.useValue();
  const allSelected = grid.state.rowDataSource.get().rowAreAllSelected();
  const checked: boolean | "indeterminate" = allSelected
    ? true
    : selectedIds.size > 0
      ? "indeterminate"
      : false;

  return (
    <div className="flex items-center justify-center w-full h-full -mx-2">
      <Checkbox
        checked={checked}
        aria-label={allSelected ? "Deselect all rows" : "Select all rows"}
        onCheckedChange={(next) => {
          if (next === true) grid.api.rowSelectAll();
          else grid.api.rowSelectAll({ deselect: true });
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function PrismRowSelectionMarkerCellRenderer<T>({
  grid,
  row,
  rowIndeterminate,
}: CellRendererParams<T>) {
  const selectedIds = grid.state.rowSelectedIds.useValue();
  const explicitlySelected = selectedIds.has(row.id);
  const allChildrenSelected =
    row.kind === "branch"
      ? grid.state.rowDataSource.get().rowAreAllSelected(row.id)
      : false;
  const checked = explicitlySelected || allChildrenSelected;
  const checkboxState: boolean | "indeterminate" = rowIndeterminate
    ? "indeterminate"
    : checked;

  return (
    <div className="flex items-center justify-center w-full h-full -mx-2">
      <Checkbox
        checked={checkboxState}
        aria-label={checked ? "Deselect row" : "Select row"}
        onCheckedChange={() => {
          const deselect = checkboxState === true;
          grid.api.rowSelect({
            selected: row.id,
            deselect,
            selectChildren: row.kind === "branch",
          });
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

