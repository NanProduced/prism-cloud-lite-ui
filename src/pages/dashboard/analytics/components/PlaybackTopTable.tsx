import { useMemo, useId, useEffect } from 'react';
import { useLyteNyte, useClientRowDataSource } from '@lytenyte/hooks/use-lytenyte-core';
import { LyteNyte } from '@lytenyte/components/lytenyte-core';
import type { CellRendererParams, Column } from '@1771technologies/lytenyte-core/types';
import { measureText } from '@1771technologies/lytenyte-shared';
import { PrismHeaderRenderer } from '@/components/lytenyte/PrismHeaderRenderer';
import { Film, Layers, Clock, Hash, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TopPlaybackItem } from '../types';

interface PlaybackTopTableProps {
  data: TopPlaybackItem[];
  type: 'program' | 'media';
  onSelect?: (item: TopPlaybackItem) => void;
  selectedId?: string;
  className?: string;
}

export function PlaybackTopTable({
  data,
  type,
  onSelect,
  selectedId,
  className,
}: PlaybackTopTableProps) {
  const gridId = useId();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const columns = useMemo<Column<TopPlaybackItem>[]>(
    () => [
      {
        id: 'rank',
        name: '#',
        type: 'number',
        width: 50,
        uiHints: {
          sortable: false,
          resizable: false,
          movable: false,
        },
        cellRenderer: ({ row }: CellRendererParams<TopPlaybackItem>) => {
          const item = row.data as TopPlaybackItem;
          if (!item) return null;
          const rank = data.findIndex((d) => d.id === item.id) + 1;
          return (
            <div className="flex items-center justify-center">
              <Badge
                variant={rank <= 3 ? 'default' : 'secondary'}
                className={cn(
                  'h-5 w-5 p-0 flex items-center justify-center text-[9px] font-bold',
                  rank === 1 && 'bg-amber-500',
                  rank === 2 && 'bg-slate-400',
                  rank === 3 && 'bg-amber-700'
                )}
              >
                {rank}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'name',
        name: type === 'program' ? 'Program Name' : 'Media Name',
        type: 'string',
        width: 250,
        field: 'name',
        pin: 'start',
        uiHints: {
          sortable: true,
          resizable: true,
          movable: false,
        },
        autosizeCellFn: ({ grid, row }) => {
          const item = row.data as TopPlaybackItem;
          if (row.kind !== 'leaf' || !item) return null;
          const text = item.name;
          const vp = grid.state.viewport.get() ?? undefined;
          return measureText(text, vp).width + 60;
        },
        cellRenderer: ({ row }: CellRendererParams<TopPlaybackItem>) => {
          const item = row.data as TopPlaybackItem;
          if (!item) return null;
          const isSelected = item.id === selectedId;
          return (
            <div
              className={cn(
                'flex items-center gap-2 px-1 cursor-pointer transition-colors',
                isSelected && 'text-primary'
              )}
              onClick={() => onSelect?.(item)}
            >
              {type === 'program' ? (
                <Layers className="h-3.5 w-3.5 opacity-40 shrink-0" />
              ) : (
                <Film className="h-3.5 w-3.5 opacity-40 shrink-0" />
              )}
              <span className="text-xs font-bold truncate">{item.name}</span>
              {isSelected && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
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
        cellRenderer: ({ row }: CellRendererParams<TopPlaybackItem>) => {
          const item = row.data as TopPlaybackItem;
          if (!item) return null;
          return (
            <div className="flex items-center gap-1.5 px-1">
              <Hash className="h-3 w-3 opacity-30" />
              <span className="text-xs font-bold tabular-nums text-foreground/80">
                {item.playCount.toLocaleString()}
              </span>
            </div>
          );
        },
      },
      {
        id: 'playSeconds',
        name: 'Play Time',
        type: 'number',
        width: 140,
        field: 'playSeconds',
        uiHints: {
          sortable: true,
          resizable: true,
          movable: false,
        },
        cellRenderer: ({ row }: CellRendererParams<TopPlaybackItem>) => {
          const item = row.data as TopPlaybackItem;
          if (!item) return null;
          return (
            <div className="flex items-center gap-1.5 px-1">
              <Clock className="h-3 w-3 opacity-30" />
              <span className="text-xs font-bold tabular-nums text-primary">
                {formatDuration(item.playSeconds)}
              </span>
            </div>
          );
        },
      },
    ],
    [data, type, selectedId, onSelect]
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

  // Auto-size columns on mount and when data changes
  useEffect(() => {
    if (data.length > 0) {
      const timer = setTimeout(() => {
        grid.actions.autosizeAllColumns();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [grid, data]);

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
