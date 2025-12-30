import { useMemo, useId } from 'react';
import { useLyteNyte, useClientRowDataSource } from '@lytenyte/hooks/use-lytenyte-core';
import { LyteNyte } from '@lytenyte/components/lytenyte-core';
import type { CellRendererParams, Column } from '@1771technologies/lytenyte-core/types';
import { measureText } from '@1771technologies/lytenyte-shared';
import { PrismHeaderRenderer } from '@/components/lytenyte/PrismHeaderRenderer';
import { Clock, Calendar, Timer, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import type { DeviceSession } from '../types';

interface DeviceSessionsTableProps {
  data: DeviceSession[];
  className?: string;
}

export function DeviceSessionsTable({ data, className }: DeviceSessionsTableProps) {
  const gridId = useId();
  const { formatDateTime } = useTimeFormatter();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const copySessionTime = (session: DeviceSession) => {
    const start = formatDateTime(session.startedAt);
    const end = session.endedAt ? formatDateTime(session.endedAt) : 'ongoing';
    navigator.clipboard.writeText(`${start} — ${end}`);
    toast.success('Session time range copied');
  };

  const columns = useMemo<Column<DeviceSession>[]>(
    () => [
      {
        id: 'startedAt',
        name: 'Started',
        type: 'string',
        width: 150,
        field: 'startedAt',
        uiHints: {
          sortable: true,
          resizable: true,
          movable: false,
        },
        cellRenderer: ({ row }: CellRendererParams<DeviceSession>) => {
          const item = row.data as DeviceSession;
          if (!item) return null;
          return (
            <div className="flex items-center gap-1.5 px-1">
              <Calendar className="h-3 w-3 opacity-30" />
              <span className="text-xs font-medium tabular-nums">
                {formatDateTime(item.startedAt)}
              </span>
            </div>
          );
        },
      },
      {
        id: 'endedAt',
        name: 'Ended',
        type: 'string',
        width: 150,
        field: 'endedAt',
        uiHints: {
          sortable: true,
          resizable: true,
          movable: false,
        },
        cellRenderer: ({ row }: CellRendererParams<DeviceSession>) => {
          const item = row.data as DeviceSession;
          if (!item) return null;
          const isOngoing = !item.endedAt;
          return (
            <div className="flex items-center gap-1.5 px-1">
              {isOngoing ? (
                <Badge variant="default" className="text-[9px] bg-emerald-500 h-5 gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Online
                </Badge>
              ) : (
                <>
                  <Clock className="h-3 w-3 opacity-30" />
                  <span className="text-xs font-medium tabular-nums">
                    {formatDateTime(item.endedAt)}
                  </span>
                </>
              )}
            </div>
          );
        },
      },
      {
        id: 'durationSeconds',
        name: 'Duration',
        type: 'number',
        width: 100,
        field: 'durationSeconds',
        uiHints: {
          sortable: true,
          resizable: true,
          movable: false,
        },
        cellRenderer: ({ row }: CellRendererParams<DeviceSession>) => {
          const item = row.data as DeviceSession;
          if (!item) return null;
          return (
            <div className="flex items-center gap-1.5 px-1">
              <Timer className="h-3 w-3 opacity-30" />
              <span className="text-xs font-bold tabular-nums text-primary">
                {formatDuration(item.durationSeconds)}
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        name: '',
        type: 'string',
        width: 50,
        uiHints: {
          sortable: false,
          resizable: false,
          movable: false,
        },
        cellRenderer: ({ row }: CellRendererParams<DeviceSession>) => {
          const item = row.data as DeviceSession;
          if (!item) return null;
          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copySessionTime(item)}
                title="Copy time range"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
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
