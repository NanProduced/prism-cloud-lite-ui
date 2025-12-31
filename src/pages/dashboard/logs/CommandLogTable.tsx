import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Check, 
  Layers, 
  Search, 
  Monitor, 
  ShieldCheck, 
  Copy, 
  Activity 
} from 'lucide-react';
import { getDeviceCommandLogs } from '@/services/logApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from '@/store/notificationStore';
import type { CommandLogFilterParams, DeviceCommandLogListItem } from '@/types/log';

interface CommandLogTableProps {
  filters: CommandLogFilterParams;
}

export function CommandLogTable({ filters }: CommandLogTableProps) {
  const { formatDateTime } = useTimeFormatter();
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [selectedLog, setSelectedLog] = useState<DeviceCommandLogListItem | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filters]);

  const { data: logsRes, isLoading, isError } = useQuery({
    queryKey: ['command-logs', { ...filters, page, size: pageSize }],
    queryFn: () => getDeviceCommandLogs({ ...filters, page, size: pageSize }),
  });

  const logs = logsRes?.data?.items || [];
  const total = logsRes?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    let className = "text-[10px] font-bold px-1.5 h-5  tracking-tight";

    switch (s) {
      case 'SUCCESS':
        return <Badge variant="outline" className={cn(className, "bg-emerald-50 text-emerald-600 border-emerald-200")}>Success</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className={cn(className, "bg-rose-50 text-rose-600 border-rose-200")}>Failed</Badge>;
      case 'RUNNING':
        return <Badge variant="outline" className={cn(className, "bg-blue-50 text-blue-600 border-blue-200 animate-pulse")}>Running</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className={cn(className, "bg-amber-50 text-amber-600 border-amber-200")}>Pending</Badge>;
      default:
        return <Badge variant="outline" className={cn(className, "bg-muted text-muted-foreground")}>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        <p className="text-[10px] font-bold  tracking-widest text-muted-foreground/60">Audit Trail Retrieval...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-bold">Failed to load command logs</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden border rounded-2xl bg-card shadow-sm">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr className="border-b">
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Issued At</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Target Device</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Action Type</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Execution Status</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Audit Stats</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Method</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-muted-foreground italic text-sm">    
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <ShieldCheck className="h-8 w-8" />
                    <p>No command audit logs found for the current filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.logId} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold">{formatDateTime(log.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-bold  tracking-tight text-[10px] text-primary/80">{log.actionType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "p-1 rounded-md border shadow-sm",
                         log.accepted ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100 opacity-40"
                       )}>
                         <Check className={cn("h-3 w-3", log.accepted ? "text-emerald-500" : "text-slate-400")} title={log.accepted ? "Accepted by Service" : "Not accepted"} />
                       </div>
                       <div className={cn(
                         "p-1 rounded-md border shadow-sm",
                         log.covered ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100 opacity-40"
                       )}>
                         <Layers className={cn("h-3 w-3", log.covered ? "text-amber-500" : "text-slate-400")} title={log.covered ? "Overridden by newer command" : "Original state"} />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[9px] font-bold text-primary/60 ">
                      {log.sendMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
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
          {total} logs tracked in audit trail
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl overflow-hidden rounded-[2rem] p-0 border-none shadow-2xl">
          <div className="bg-primary/5 p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogHeader className="p-0 text-left">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    Command Log Audit Details
                  </DialogTitle>
                </DialogHeader>
                <p className="text-xs text-muted-foreground font-medium mt-1">Full execution payload and server-side audit information.</p>
              </div>
            </div>
          </div>

          {selectedLog && (
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border shadow-sm">
                  <p className="text-[10px] font-bold  tracking-widest text-muted-foreground">Operation ID</p>
                  <p className="text-xs font-mono font-bold break-all">{selectedLog.operationId}</p>
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border shadow-sm">
                  <p className="text-[10px] font-bold  tracking-widest text-muted-foreground">Queued ID</p>
                  <p className="text-xs font-mono font-bold">{selectedLog.queuedId || 'N/A'}</p>
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border shadow-sm">
                  <p className="text-[10px] font-bold  tracking-widest text-muted-foreground">Tracking Level</p>
                  <p className="text-xs font-bold  tracking-tight">{selectedLog.trackingLevel}</p>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-500" />
                    <p className="text-[10px] font-bold  tracking-widest text-rose-500">Error Message</p>
                  </div>
                  <div className="text-xs text-rose-600 bg-rose-50/50 p-4 rounded-2xl border border-rose-100 font-bold leading-relaxed shadow-sm">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <p className="text-[10px] font-bold  tracking-widest text-muted-foreground">Payload Data (JSON)</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold  gap-1.5"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedLog.payload, null, 2));
                      toast.success("Payload copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    Copy JSON
                  </Button>
                </div>
                <div className="bg-slate-950 rounded-2xl p-6 overflow-hidden border border-slate-800 shadow-xl group relative">
                  <pre className="text-xs text-emerald-400 font-mono overflow-auto max-h-[400px] custom-scrollbar leading-relaxed">
                    {JSON.stringify(selectedLog.payload || { info: "No payload recorded" }, null, 2)}       
                  </pre>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded border border-emerald-500/20  tracking-widest">Read-Only</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                 <Button variant="ghost" className="rounded-xl font-bold  tracking-widest text-xs" onClick={() => setSelectedLog(null)}>
                   Dismiss
                 </Button>
                 <Button className="rounded-xl font-bold  tracking-widest text-xs px-6" onClick={() => setSelectedLog(null)}>
                   Close Audit
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

