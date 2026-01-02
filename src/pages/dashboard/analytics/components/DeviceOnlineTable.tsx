import { Wifi, WifiOff, Activity, Network, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import type { OnlineTimeSummaryItem } from '@/services/telemetryApi';
import type { Device } from '@/types/device';
import { resolveDeviceStatus } from '@/types/device';

interface DeviceOnlineTableProps {
  data: OnlineTimeSummaryItem[];
  deviceMap?: Record<string, Device>;
  selectedDeviceId?: string;
  onSelectDevice?: (deviceId: string) => void;
  className?: string;
}

export function DeviceOnlineTable({
  data,
  deviceMap,
  selectedDeviceId,
  onSelectDevice,
  className,
}: DeviceOnlineTableProps) {
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
        <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
          <TableRow>
            <TableHead className="w-[220px] text-[10px] font-bold tracking-widest">Device</TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest">Status</TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest">Network</TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest text-right whitespace-nowrap">Total Online Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const isSelected = item.deviceId === selectedDeviceId;
            const deviceObj = deviceMap ? deviceMap[item.deviceId] : undefined;
            const name = deviceObj?.deviceName || 'Deleted Device';
            const status = deviceObj ? resolveDeviceStatus(deviceObj) : 'offline';
            const networkType = deviceObj?.networkType || 'Unknown';

            return (
              <TableRow 
                key={item.deviceId}
                className={cn(
                  "cursor-pointer group transition-colors",
                  isSelected ? "bg-primary/[0.03] hover:bg-primary/[0.05]" : "hover:bg-muted/40"
                )}
                onClick={() => onSelectDevice?.(item.deviceId)}
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl shrink-0 transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <Monitor className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={cn("text-xs font-bold truncate", isSelected && "text-primary")}>
                        {name}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-bold tracking-widest h-5 px-2",
                    status === 'online' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"
                  )}>
                    {status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground/60">
                    <Network className="h-3 w-3" />
                    <span className="text-[10px] font-bold">{networkType}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-[10px] font-bold text-primary tabular-nums bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                    {formatDuration(item.onlineSeconds)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
