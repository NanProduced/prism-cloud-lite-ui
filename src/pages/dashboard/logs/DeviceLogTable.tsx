import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Cpu,
  Clock
} from 'lucide-react';
import { getDeviceLogs } from '@/services/logApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import type { DeviceLogFilterParams, DeviceLogType } from '@/types/log';

interface DeviceLogTableProps {
  filters: DeviceLogFilterParams;
  logTypes: DeviceLogType[];
}

export function DeviceLogTable({ filters, logTypes }: DeviceLogTableProps) {
  const { formatDateTime } = useTimeFormatter();
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filters]);

  const { data: logsRes, isLoading, isError } = useQuery({
    queryKey: ['device-logs', { ...filters, page, size: pageSize }],
    queryFn: () => getDeviceLogs({ ...filters, page, size: pageSize }),
  });

  const logs = logsRes?.data?.items || [];
  const total = logsRes?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const getLevelBadge = (level: string) => {
    const l = level.toUpperCase();
    return (
      <Badge variant="outline" className={cn(
        "text-[10px] font-bold px-1.5 h-5",
        l === 'ERROR' && "bg-rose-50 text-rose-600 border-rose-200",
        l === 'WARN' && "bg-amber-50 text-amber-600 border-amber-200",
        l === 'INFO' && "bg-blue-50 text-blue-600 border-blue-200",
        l === 'DEBUG' && "bg-slate-50 text-slate-600 border-slate-200"
      )}>
        {l}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        <p className="text-[10px] font-bold  tracking-widest text-muted-foreground/60">Fetching Logs...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-bold">Failed to load logs</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden border rounded-2xl bg-card shadow-sm">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr className="border-b">
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Log Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Device Source</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Operation</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Level</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Content Message</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic text-sm">    
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <Search className="h-8 w-8" />
                    <p>No logs found for the selected criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.logId} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{formatDateTime(log.createTime)}</span>
                      {log.reportTime && (
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60 font-medium">
                          <Cpu className="h-2.5 w-2.5" />
                          <span>Reported: {formatDateTime(log.reportTime)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                         <Monitor className="h-4 w-4 text-primary/60" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{log.deviceName}</span>
                        <span className="text-[9px] text-muted-foreground opacity-50 font-mono tracking-tighter">ID: {log.deviceId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-primary/70 ">
                      {log.operationName || logTypes.find(t => t.id === log.operationId)?.operation || `Op #${log.operationId}`}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {getLevelBadge(log.level)}
                  </td>
                  <td className="px-6 py-3 text-xs text-muted-foreground max-w-md">
                    <p className="break-words line-clamp-2 group-hover:line-clamp-none transition-all leading-relaxed font-medium">
                      {log.content}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t bg-muted/5 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground font-bold  tracking-widest">
          {total > 0 ? (
            <>Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} entries</>
          ) : (
            <>0 entries found</>
          )}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg shadow-sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="bg-background border rounded-lg px-3 h-8 flex items-center text-[10px] font-bold shadow-inner">
              {page + 1} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg shadow-sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

