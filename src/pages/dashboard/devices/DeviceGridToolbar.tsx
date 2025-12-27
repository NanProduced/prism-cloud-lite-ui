import { useEffect, useMemo, useState } from 'react';
import { GROUP_COLUMN_PREFIX } from '@1771technologies/lytenyte-core';
import type { AggModelFn, Column, Grid, RowLeaf } from '@1771technologies/lytenyte-core/types';
import type { Device } from '@/types/device';
import type { DeviceCustomFieldDef } from '@/types/device-custom-field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/store/notificationStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, X, Layers, RotateCcw, Download, Zap, Camera, Power } from 'lucide-react';
import { PrismSortManagerDialog } from '@/components/lytenyte/PrismSortManagerDialog';
import { DeviceCustomFieldsSheet } from './DeviceCustomFieldsSheet';
import { DeviceGridDialog } from './DeviceGridDialog';

interface DeviceGridToolbarProps {
  grid: Grid<Device>;
  defaultColumns: Column<Device>[];
  customFieldDefs: DeviceCustomFieldDef[];
  isProActive: boolean;
  onBatchCommand: () => void;
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
  onBatchCommand,
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
  const aggColumns = baseColumns.filter((c) => c.uiHints?.aggsAllowed?.length);

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

  useEffect(() => {
    if (rowGroupIds.length > 0) return;
    grid.state.aggModel.set((prev) => (Object.keys(prev).length === 0 ? prev : {}));
  }, [grid, rowGroupIds.length]);

  const handleToggleColumn = (colId: string) => {
    grid.state.columns.set((prev) =>
      prev.map((c) => (c.id === colId ? { ...c, hide: !c.hide } : c))
    );
  };

  const handleSetPin = (colId: string, pin: 'start' | 'end' | null) => {
    grid.state.columns.set((prev) => prev.map((c) => (c.id === colId ? { ...c, pin } : c)));
  };

  const handleReorderColumns = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    grid.state.columns.set((prev) => {
      const isBase = (c: Column<Device>) =>
        !String(c.id).startsWith(GROUP_COLUMN_PREFIX) && String(c.id) !== GLOBAL_SEARCH_COLUMN_ID;

      const baseIds = prev.filter(isBase).map((c) => String(c.id));
      const fromIdx = baseIds.indexOf(fromId);
      const toIdx = baseIds.indexOf(toId);
      if (fromIdx < 0 || toIdx < 0) return prev;

      const nextBaseIds = baseIds.slice();
      const [moved] = nextBaseIds.splice(fromIdx, 1);
      nextBaseIds.splice(toIdx, 0, moved!);

      const baseById = new Map(prev.filter(isBase).map((c) => [String(c.id), c]));
      let i = 0;
      return prev.map((c) => {
        if (!isBase(c)) return c;
        const id = nextBaseIds[i++]!;
        return baseById.get(id) ?? c;
      });
    });
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
    if (rowGroupIds.length === 0) return;
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
          <DeviceGridDialog
            columns={baseColumns}
            groupableColumns={groupableColumns}
            aggColumns={aggColumns}
            rowGroupIds={rowGroupIds}
            aggModel={aggModel}
            onToggleColumn={handleToggleColumn}
            onSetPin={handleSetPin}
            onReorderColumn={handleReorderColumns}
            onAddGroup={handleAddGroup}
            onRemoveGroup={handleRemoveGroup}
            onSetAgg={handleSetAgg}
          />
          <DeviceCustomFieldsSheet
            customFieldDefs={customFieldDefs}
            isProActive={isProActive}
            onProActiveChange={onProActiveChange}
            onCustomFieldDefsChange={onCustomFieldDefsChange}
            onCustomFieldCreate={onCustomFieldCreate}
            onCustomFieldDelete={onCustomFieldDelete}
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
              <DropdownMenuItem onSelect={onBatchCommand}>
                <Zap className="h-4 w-4" />
                Batch Command
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
