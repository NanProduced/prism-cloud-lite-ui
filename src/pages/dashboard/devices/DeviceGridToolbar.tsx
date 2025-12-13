import { useEffect, useMemo, useState } from 'react';
import { GROUP_COLUMN_PREFIX } from '@1771technologies/lytenyte-core';
import type { AggModelFn, Column, Grid, RowLeaf } from '@1771technologies/lytenyte-core/types';
import type { Device } from '@/types/device';
import type { DeviceCustomFieldDef } from '@/types/device-custom-field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, X, SlidersHorizontal, Layers, Sigma, RotateCcw, Check, Download, Maximize2, Zap, Camera, Power } from 'lucide-react';
import { PrismSortManagerDialog } from '@/components/lytenyte/PrismSortManagerDialog';
import { DeviceCustomFieldsSheet } from './DeviceCustomFieldsSheet';

interface DeviceGridToolbarProps {
  grid: Grid<Device>;
  defaultColumns: Column<Device>[];
  customFieldDefs: DeviceCustomFieldDef[];
  isProActive: boolean;
  onProActiveChange?: (next: boolean) => void;
  onCustomFieldDefsChange: (next: DeviceCustomFieldDef[]) => void;
  onCustomFieldCreate: (def: DeviceCustomFieldDef) => void;
  onCustomFieldDelete: (fieldId: number) => void;
}

const GLOBAL_SEARCH_COLUMN_ID = '__globalSearch';

export function DeviceGridToolbar({
  grid,
  defaultColumns,
  customFieldDefs,
  isProActive,
  onProActiveChange,
  onCustomFieldDefsChange,
  onCustomFieldCreate,
  onCustomFieldDelete,
}: DeviceGridToolbarProps) {
  const [quickSearch, setQuickSearch] = useState('');

  const columns = grid.state.columns.useValue();
  const selectedIds = grid.state.rowSelectedIds.useValue();
  const selectedLeafDevices = useMemo<Device[]>(() => {
    const rows = grid.api.rowSelected();
    return rows
      .filter((r): r is RowLeaf<Device> => r.kind === 'leaf')
      .map((r) => r.data)
      .filter((d): d is Device => d != null);
  }, [grid, selectedIds]);
  const selectedCount = selectedLeafDevices.length;
  const baseColumns = useMemo(
    () =>
      columns.filter(
        (c) =>
          !c.id.startsWith(GROUP_COLUMN_PREFIX) &&
          c.id !== GLOBAL_SEARCH_COLUMN_ID
      ),
    [columns]
  );

  const rowGroupModel = grid.state.rowGroupModel.useValue();
  const rowGroupIds = useMemo(
    () =>
      rowGroupModel.map((g) => (typeof g === 'string' ? g : g.id)),
    [rowGroupModel]
  );
  const aggModel = grid.state.aggModel.useValue();

  const groupableColumns = baseColumns.filter((c) => c.uiHints?.rowGroupable);
  const numericAggColumns = baseColumns.filter((c) => c.uiHints?.aggsAllowed?.length);

  useEffect(() => {
    if (rowGroupIds.length === 0) return;

    grid.state.aggModel.set((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const col of baseColumns) {
        const def = col.uiHints?.aggDefault;
        if (!def) continue;
        if (next[col.id]) continue;
        next[col.id] = { fn: def as AggModelFn<Device> };
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [baseColumns, grid, rowGroupIds.length]);

  const handleToggleColumn = (colId: string) => {
    grid.state.columns.set((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, hide: !c.hide } : c))
    );
  };

  const handleAddGroup = (colId: string) => {
    grid.state.rowGroupModel.set((prev) => {
      const ids = prev.map((g) => (typeof g === 'string' ? g : g.id));
      if (ids.includes(colId)) return prev;
      return [...prev, colId];
    });
  };

  const handleRemoveGroup = (colId: string) => {
    grid.state.rowGroupModel.set((prev) =>
      prev.filter((g) => (typeof g === 'string' ? g !== colId : g.id !== colId))
    );
  };

  const handleSetAgg = (colId: string, fn?: AggModelFn<Device>) => {
    grid.state.aggModel.set((prev) => {
      const next = { ...prev };
      if (!fn) {
        delete next[colId];
      } else {
        next[colId] = { fn };
      }
      return next;
    });
  };

  const handleResetAll = () => {
    grid.state.columns.set(defaultColumns);
    grid.state.filterModel.set({});
    grid.state.sortModel.set([]);
    grid.state.rowGroupModel.set([]);
    grid.state.aggModel.set({});
    grid.api.rowSelectAll({ deselect: true });
  };

  const handleAutosizeAll = (includeHeader: boolean) => {
    grid.api.columnAutosize({ includeHeader });
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async (includeHeader: boolean) => {
    const blob = await grid.api.exportCsvFile({ includeHeader });
    downloadBlob(blob, includeHeader ? 'devices-grid-with-headers.csv' : 'devices-grid.csv');
  };

  const handleExportExcel = async () => {
    const { data, headers } = await grid.api.exportDataRect();
    const XLSX = await import('xlsx');

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Devices');

    const array = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([array], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadBlob(blob, 'devices-grid.xlsx');
  };

  const runBulkAction = (action: 'wake-sleep' | 'reboot' | 'screenshot') => {
    if (selectedCount === 0) return;
    const deviceIds = selectedLeafDevices.map((d) => d.id);
    toast(`Bulk action: ${action}`, {
      description: `Selected ${deviceIds.length} devices (not wired yet).`,
    });
  };

  const handleQuickSearchChange = (value: string) => {
    setQuickSearch(value);
    const q = value.trim().toLowerCase();
    grid.state.filterModel.set((prev) => {
      const next = { ...prev };
      if (!q) {
        delete next[GLOBAL_SEARCH_COLUMN_ID];
        return next;
      }
      next[GLOBAL_SEARCH_COLUMN_ID] = {
        kind: 'func',
        func: ({ data }) => {
          if (!data) return true;
          return (
            data.deviceName.toLowerCase().includes(q) ||
            data.alias?.toLowerCase().includes(q) ||
            data.model.toLowerCase().includes(q) ||
            data.firmwareVersion.toLowerCase().includes(q) ||
            data.serialNumber?.toLowerCase().includes(q) ||
            data.networkType.toLowerCase().includes(q) ||
            (data.currentProgram?.name.toLowerCase().includes(q) ?? false) ||
            data.tags.some((t) => t.name.toLowerCase().includes(q))
          );
        },
      };
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Quick search…"
            value={quickSearch}
            onChange={(e) => handleQuickSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Badge variant="secondary" className="h-9 px-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Selected</span>
              <span className="font-semibold">{selectedCount}</span>
              <button
                type="button"
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => grid.api.rowSelectAll({ deselect: true })}
              >
                Clear
              </button>
            </Badge>
          )}
          <ColumnsPopover columns={baseColumns} onToggle={handleToggleColumn} />
          <DeviceCustomFieldsSheet
            customFieldDefs={customFieldDefs}
            isProActive={isProActive}
            onProActiveChange={onProActiveChange}
            onCustomFieldDefsChange={onCustomFieldDefsChange}
            onCustomFieldCreate={onCustomFieldCreate}
            onCustomFieldDelete={onCustomFieldDelete}
          />
          <GroupsPopover
            groupableColumns={groupableColumns}
            rowGroupModel={rowGroupIds}
            onAdd={handleAddGroup}
            onRemove={handleRemoveGroup}
          />
          <AggsPopover
            columns={numericAggColumns}
            aggModel={aggModel}
            onSetAgg={handleSetAgg}
          />

          <PrismSortManagerDialog grid={grid} columns={baseColumns} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" disabled={selectedCount === 0}>
                <Zap className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={selectedCount === 0} onSelect={() => runBulkAction('wake-sleep')}>
                <Power className="h-4 w-4" />
                Wake/Sleep
              </DropdownMenuItem>
              <DropdownMenuItem disabled={selectedCount === 0} onSelect={() => runBulkAction('reboot')}>
                <RotateCcw className="h-4 w-4" />
                Reboot
              </DropdownMenuItem>
              <DropdownMenuItem disabled={selectedCount === 0} onSelect={() => runBulkAction('screenshot')}>
                <Camera className="h-4 w-4" />
                Screenshot
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Maximize2 className="h-4 w-4" />
                Autosize
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => handleAutosizeAll(false)}>
                Autosize All Columns
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleAutosizeAll(true)}>
                Autosize All (Include Headers)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>CSV</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => handleExportCsv(false)}>
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExportCsv(true)}>
                Export CSV (With Headers)
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Excel</DropdownMenuLabel>
              <DropdownMenuItem onSelect={handleExportExcel}>
                Excel Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleResetAll}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {rowGroupIds.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" />
            Row Groups:
          </div>
          {rowGroupIds.map((g) => {
            const col = baseColumns.find((c) => c.id === g);
            const label = col?.name ?? g;
            return (
              <Badge key={g} variant="secondary" className="text-xs gap-1">
                {label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveGroup(g)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ColumnsPopover({
  columns,
  onToggle,
}: {
  columns: Column<Device>[];
  onToggle: (id: string) => void;
}) {
  const visibleCount = columns.filter((c) => !c.hide).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Columns
          <Badge variant="secondary" className="ml-1">
            {visibleCount}/{columns.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <ScrollArea className="h-64 pr-2">
          <div className="flex flex-col gap-1">
            {columns.map((c) => (
              <button
                key={c.id}
                type="button"
                className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
                onClick={() => onToggle(c.id)}
              >
                <span className="truncate">{c.name ?? c.id}</span>
                {!c.hide && <Check className="h-4 w-4 text-emerald-600" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function GroupsPopover({
  groupableColumns,
  rowGroupModel,
  onAdd,
  onRemove,
}: {
  groupableColumns: Column<Device>[];
  rowGroupModel: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const available = groupableColumns.filter((c) => !rowGroupModel.includes(c.id));
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Layers className="h-4 w-4" />
          Row Groups
          {rowGroupModel.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {rowGroupModel.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="flex flex-col gap-2">
          {rowGroupModel.length === 0 ? (
            <div className="text-xs text-muted-foreground px-1">
              No grouping applied
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {rowGroupModel.map((g) => {
                const col = groupableColumns.find((c) => c.id === g);
                return (
                  <div
                    key={g}
                    className="flex items-center justify-between rounded px-2 py-1 text-sm bg-muted/40"
                  >
                    <span className="truncate">{col?.name ?? g}</span>
                    <X className="h-4 w-4 cursor-pointer" onClick={() => onRemove(g)} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t pt-2">
            {available.length === 0 ? (
              <div className="text-xs text-muted-foreground px-1">
                No more groupable columns
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {available.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-accent"
                    onClick={() => onAdd(c.id)}
                  >
                    <span className="truncate">{c.name ?? c.id}</span>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AggsPopover({
  columns,
  aggModel,
  onSetAgg,
}: {
  columns: Column<Device>[];
  aggModel: Record<string, { fn: AggModelFn<Device> }>;
  onSetAgg: (colId: string, fn?: AggModelFn<Device>) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sigma className="h-4 w-4" />
          Aggregations
          {Object.keys(aggModel).length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {Object.keys(aggModel).length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="flex flex-col gap-2">
          {columns.length === 0 && (
            <div className="text-xs text-muted-foreground px-1">
              No aggregatable columns
            </div>
          )}
          {columns.map((c) => {
            const allowed = c.uiHints?.aggsAllowed ?? [];
            const current = aggModel[c.id]?.fn;
            return (
              <div key={c.id} className="flex items-center justify-between gap-2 px-1">
                <div className="text-sm truncate">{c.name ?? c.id}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                      {typeof current === 'string'
                        ? current
                        : current === undefined
                        ? 'none'
                        : 'custom'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSetAgg(c.id, undefined)}>
                      None
                    </DropdownMenuItem>
                    {allowed.map((fn) => (
                      <DropdownMenuItem key={fn} onClick={() => onSetAgg(c.id, fn)}>
                        {fn}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
