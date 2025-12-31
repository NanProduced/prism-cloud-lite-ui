import { Monitor, Clock, ChevronRight, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import type { Device } from '@/types/device';
import { resolveDeviceStatus } from '@/types/device';
import { Badge } from '@/components/ui/badge';

interface AnalyticsDeviceItem {
  deviceId: string | number;
  playCount: number;
  playSeconds?: number;
  lastPlayedAt?: string;
}

interface AnalyticsDeviceTableProps {
  data: AnalyticsDeviceItem[];
  deviceMap?: Record<string, Device>;
  onOpenDevice?: (deviceId: string) => void;
  className?: string;
}

export function AnalyticsDeviceTable({ data, deviceMap, onOpenDevice, className }: AnalyticsDeviceTableProps) {
  const { formatDateTime } = useTimeFormatter();

  const formatDuration = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <ScrollArea className={cn("w-full h-full", className)}>
      <Table>
        <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
          <TableRow>
            <TableHead className="text-[9px] font-bold tracking-widest">Device</TableHead>
            <TableHead className="text-[9px] font-bold tracking-widest px-2">Res</TableHead>
            <TableHead className="text-[9px] font-bold tracking-widest text-right whitespace-nowrap px-4">Performance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const deviceIdStr = String(item.deviceId);
            const deviceObj = deviceMap ? deviceMap[deviceIdStr] : undefined;
            const name = deviceObj?.deviceName || 'Deleted Device';
            const status = deviceObj ? resolveDeviceStatus(deviceObj) : 'offline';
            const resolution = deviceObj ? (typeof deviceObj.resolution === 'string' ? deviceObj.resolution : `${deviceObj.resolution.width}x${deviceObj.resolution.height}`) : '—';
            const canOpen = Boolean(deviceMap?.[deviceIdStr]);

            return (
              <TableRow 
                key={deviceIdStr} 
                className={cn(
                  "group hover:bg-muted/40 transition-colors border-none",
                  canOpen && "cursor-pointer"
                )}
                onClick={() => canOpen && onOpenDevice?.(deviceIdStr)}
              >
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300"
                    )} />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] font-bold truncate leading-tight group-hover:text-primary transition-colors">{name}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-2">
                   <div className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/10">
                     <Maximize2 className="h-2.5 w-2.5 opacity-40" />
                     {resolution}
                   </div>
                </TableCell>
                <TableCell className="text-right px-4">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold tabular-nums">{item.playCount.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-muted-foreground/40">Plays</span>
                    </div>
                    <span className="text-[9px] font-bold text-primary/80 tabular-nums">{formatDuration(item.playSeconds || 0)}</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}