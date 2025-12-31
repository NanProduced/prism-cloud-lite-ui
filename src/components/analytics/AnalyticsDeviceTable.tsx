import { useCallback, useMemo, useId } from 'react';
import { useLyteNyte, useClientRowDataSource } from '@lytenyte/hooks/use-lytenyte-core';
import { LyteNyte } from '@lytenyte/components/lytenyte-core';
import type {
  CellRendererParams,
  Column,
} from '@1771technologies/lytenyte-core/types';
import { measureText } from '@1771technologies/lytenyte-shared';
import { PrismHeaderRenderer } from '@/components/lytenyte/PrismHeaderRenderer';
import { Clock, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLyteNyteAutosize } from '@/hooks/use-lytenyte-autosize';

interface AnalyticsDeviceItem {
  deviceId: string | number;
  playCount: number;
  playSeconds?: number;
  lastPlayedAt?: string;
}

interface AnalyticsDeviceTableProps {
  data: AnalyticsDeviceItem[];
  deviceMap?: Record<string, string>;
  onOpenDevice?: (deviceId: string) => void;
  className?: string;
}

export function AnalyticsDeviceTable({ data, deviceMap, onOpenDevice, className }: AnalyticsDeviceTableProps) {
  const gridId = useId();

  const formatDuration = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  const formatDateTime = useCallback((iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }, []);

  const columns = useMemo<Column<AnalyticsDeviceItem>[]>(() => [
    {
      id: 'deviceId',
      name: 'Device',
      type: 'string',
      width: 280,
      field: 'deviceId',
      pin: 'start',
      uiHints: {
        sortable: true,
        resizable: true,
        movable: false,
      },
      autosizeCellFn: ({ grid, row }) => {
        if (row.kind !== 'leaf' || !row.data) return null;
        const deviceId = String(row.data.deviceId);
        const name = deviceMap ? (deviceMap[deviceId] || 'Deleted device') : '—';
        const vp = grid.state.viewport.get() ?? undefined;
        return Math.max(measureText(name, vp).width + 80, 200);
      },
      cellRenderer: ({ row }: CellRendererParams<AnalyticsDeviceItem>) => {
        if (!row.data) return null;
        const deviceId = String(row.data.deviceId);
        const name = deviceMap ? (deviceMap[deviceId] || 'Deleted device') : '—';
        const canOpen = Boolean(deviceMap?.[deviceId]) && typeof onOpenDevice === 'function';
        return (
          <div
            className={cn('flex items-center gap-2 px-1', canOpen && 'cursor-pointer')}
            onClick={() => (canOpen ? onOpenDevice?.(deviceId) : undefined)}
          >
             <Monitor className="h-3 w-3 opacity-40" />
             <div className="min-w-0 flex flex-col">
               <span className="text-xs font-bold text-foreground/80 truncate">
                 {name}
               </span>
             </div>
          </div>
        );
      },
    },
    {
      id: 'playCount',
      name: 'Plays',
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
    {
      id: 'playSeconds',
      name: 'Play Time',
      type: 'number',
      width: 130,
      field: 'playSeconds',
      uiHints: {
        sortable: true,
        resizable: true,
        movable: false,
      },
      cellRenderer: ({ row }: CellRendererParams<AnalyticsDeviceItem>) => {
        if (!row.data) return null;
        const seconds = typeof row.data.playSeconds === 'number' ? row.data.playSeconds : NaN;
        return (
          <span className="text-xs font-bold tabular-nums px-1">
            {formatDuration(seconds)}
          </span>
        );
      },
    },
    {
      id: 'lastPlayedAt',
      name: 'Last Played',
      type: 'datetime',
      width: 180,
      field: 'lastPlayedAt',
      uiHints: {
        sortable: true,
        resizable: true,
        movable: false,
      },
      cellRenderer: ({ row }: CellRendererParams<AnalyticsDeviceItem>) => {
        if (!row.data) return null;
        return (
          <div className="flex items-center gap-1.5 px-1 text-muted-foreground">
            <Clock className="h-3 w-3 opacity-40" />
            <span className="text-xs font-semibold tabular-nums">
              {formatDateTime(row.data.lastPlayedAt as string | undefined)}
            </span>
          </div>
        );
      },
    },
  ], [deviceMap, formatDateTime, formatDuration]);

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

  const { containerRef } = useLyteNyteAutosize(grid, [data.length, Boolean(onOpenDevice)]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full h-full min-h-0 border rounded-lg overflow-hidden bg-background shadow-sm", className)}
    >
      <LyteNyte grid={grid} />
    </div>
  );
}
