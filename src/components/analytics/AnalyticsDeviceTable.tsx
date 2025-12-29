import { useMemo, useId } from 'react';
import { useLyteNyte, useClientRowDataSource } from '@lytenyte/hooks/use-lytenyte-core';
import { LyteNyte } from '@lytenyte/components/lytenyte-core';
import type {
  CellRendererParams,
  Column,
} from '@1771technologies/lytenyte-core/types';
import { measureText } from '@1771technologies/lytenyte-shared';
import { PrismHeaderRenderer } from '@/components/lytenyte/PrismHeaderRenderer';
import { Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsDeviceItem {
  deviceId: string;
  playCount: number;
}

interface AnalyticsDeviceTableProps {
  data: AnalyticsDeviceItem[];
  className?: string;
}

export function AnalyticsDeviceTable({ data, className }: AnalyticsDeviceTableProps) {
  const gridId = useId();

  const columns = useMemo<Column<AnalyticsDeviceItem>[]>(() => [
    {
      id: 'deviceId',
      name: 'Device ID',
      type: 'string',
      width: 200,
      field: 'deviceId',
      pin: 'start',
      uiHints: {
        sortable: true,
        resizable: true,
        movable: false,
      },
      autosizeCellFn: ({ grid, row }) => {
        if (row.kind !== 'leaf' || !row.data) return null;
        const text = row.data.deviceId;
        const vp = grid.state.viewport.get() ?? undefined;
        return measureText(text, vp).width + 36;
      },
      cellRenderer: ({ row }: CellRendererParams<AnalyticsDeviceItem>) => {
        if (!row.data) return null;
        const deviceId = String(row.data.deviceId);
        return (
          <div className="flex items-center gap-2 px-1">
             <Monitor className="h-3 w-3 opacity-40" />
             <span className="text-xs font-bold font-mono text-foreground/80 truncate">
               {deviceId}
             </span>
          </div>
        );
      },
    },
    {
      id: 'playCount',
      name: 'Play Count',
      type: 'number',
      width: 120,
      field: 'playCount',
      uiHints: {
        sortable: true,
        resizable: true,
        movable: false,
      },
      cellRenderer: ({ row }: CellRendererParams<AnalyticsDeviceItem>) => {
        if (!row.data) return null;
        const playCount = Number(row.data.playCount || 0);
        return (
          <span className="text-xs font-bold text-primary tabular-nums px-1">
            {playCount.toLocaleString()}
          </span>
        );
      },
    },
  ], []);

  const dataSource = useClientRowDataSource({ data, reflectData: true });

  const grid = useLyteNyte({
    gridId,
    columns,
    rowDataSource: dataSource,
    columnBase: {
      headerRenderer: PrismHeaderRenderer,
      autosizeHeaderFn: ({ grid, column }) => {
        const vp = grid.state.viewport.get() ?? undefined;
        const text = String(column.name ?? column.id ?? '');
        const textWidth = measureText(text, vp).width;
        // Padding + Sort button space
        return Math.ceil(textWidth + 24 + 30); 
      },
    },
    // Simplified features for analytics view
    rowSelectionMode: 'none',
    columnMarkerEnabled: false,
    floatingRowEnabled: false,
  });

  return (
    <div className={cn("w-full h-full min-h-[300px] border rounded-lg overflow-hidden bg-background shadow-sm", className)}>
      <LyteNyte grid={grid} />
    </div>
  );
}
