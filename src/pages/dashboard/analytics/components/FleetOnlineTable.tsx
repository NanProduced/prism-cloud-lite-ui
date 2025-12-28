import { useMemo, useId } from 'react';
import { useLyteNyte, useClientRowDataSource } from '@lytenyte/hooks/use-lytenyte-core';
import { LyteNyte } from '@lytenyte/components/lytenyte-core';
import type { CellRendererParams, Column } from '@1771technologies/lytenyte-core/types';
import { measureText } from '@1771technologies/lytenyte-shared';
import { PrismHeaderRenderer } from '@/components/lytenyte/PrismHeaderRenderer';
import { Wifi, WifiOff, Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { OnlineTimeSummaryItem } from '@/services/telemetryApi';

interface FleetOnlineTableProps {
  data: OnlineTimeSummaryItem[];
  selectedDeviceId?: string;
  onSelectDevice?: (deviceId: string) => void;
  className?: string;
}

export function FleetOnlineTable({
  data,
  selectedDeviceId,
  onSelectDevice,
  className,
}: FleetOnlineTableProps) {
  const gridId = useId();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const columns = useMemo<Column<OnlineTimeSummaryItem>[]>(
    () => [
      {
        id: 'deviceId',
        name: 'Device',
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
          return measureText(text, vp).width + 60;
        },
        cellRenderer: ({ row }: CellRendererParams<OnlineTimeSummaryItem>) => {
          if (!row.data) return null;
          const isSelected = row.data.deviceId === selectedDeviceId;
          const onlineRate = row.data.onlineRate;
          return (
            <div
              className={cn(
                'flex items-center gap-2 px-1 cursor-pointer transition-colors',
                isSelected && 'text-primary'
              )}
              onClick={() => onSelectDevice?.(row.data!.deviceId)}
            >
              {onlineRate >= 0.9 ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : onlineRate >= 0.5 ? (
                <Activity className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              )}
              <span className="text-xs font-bold truncate font-mono">{row.data.deviceId}</span>
              {isSelected && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
            </div>
          );
        },
      },
      {
        id: 'onlineRate',
        name: 'Online Rate',
        type: 'number',
        width: 180,
        field: 'onlineRate',
        uiHints: {
          sortable: true,
          resizable: true,
          movable: false,
        },
        cellRenderer: ({ row }: CellRendererParams<OnlineTimeSummaryItem>) => {
          if (!row.data) return null;
          const rate = row.data.onlineRate;
          const percentage = Math.round(rate * 100);
          return (
            <div className="flex items-center gap-2 px-1">
              <Progress
                value={percentage}
                className={cn(
                  'h-2 flex-1',
                  rate >= 0.9 && '[&>div]:bg-emerald-500',
                  rate >= 0.5 && rate < 0.9 && '[&>div]:bg-amber-500',
                  rate < 0.5 && '[&>div]:bg-rose-500'
                )}
              />
              <Badge
                variant="secondary"
                className={cn(
                  'text-[9px] font-bold min-w-[40px] justify-center',
                  rate >= 0.9 && 'bg-emerald-500/10 text-emerald-600',
                  rate >= 0.5 && rate < 0.9 && 'bg-amber-500/10 text-amber-600',
                  rate < 0.5 && 'bg-rose-500/10 text-rose-600'
                )}
              >
                {percentage}%
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'onlineSeconds',
        name: 'Online Time',
        type: 'number',
        width: 120,
        field: 'onlineSeconds',
        uiHints: {
          sortable: true,
          resizable: true,
          movable: false,
        },
        cellRenderer: ({ row }: CellRendererParams<OnlineTimeSummaryItem>) => {
          if (!row.data) return null;
          return (
            <div className="flex items-center gap-1.5 px-1">
              <Wifi className="h-3 w-3 text-emerald-500 opacity-50" />
              <span className="text-xs font-bold tabular-nums text-emerald-600">
                {formatDuration(row.data.onlineSeconds)}
              </span>
            </div>
          );
        },
      },
      {
        id: 'offlineSeconds',
        name: 'Offline Time',
        type: 'number',
        width: 120,
        field: 'offlineSeconds',
        uiHints: {
          sortable: true,
          resizable: true,
          movable: false,
        },
        cellRenderer: ({ row }: CellRendererParams<OnlineTimeSummaryItem>) => {
          if (!row.data) return null;
          return (
            <div className="flex items-center gap-1.5 px-1">
              <WifiOff className="h-3 w-3 text-rose-500 opacity-50" />
              <span className="text-xs font-bold tabular-nums text-rose-600">
                {formatDuration(row.data.offlineSeconds)}
              </span>
            </div>
          );
        },
      },
    ],
    [selectedDeviceId, onSelectDevice]
  );

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
        return Math.ceil(textWidth + 24 + 30);
      },
    },
    rowSelectionMode: 'none',
    columnMarkerEnabled: false,
    floatingRowEnabled: false,
  });

  return (
    <div
      className={cn(
        'w-full h-full min-h-[300px] border rounded-xl overflow-hidden bg-background',
        className
      )}
    >
      <LyteNyte grid={grid} />
    </div>
  );
}
