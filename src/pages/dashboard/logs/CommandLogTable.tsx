import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Terminal, 
  Eye, 
  Check, 
  Layers, 
  Monitor, 
  ShieldCheck, 
} from 'lucide-react';
import { getDeviceCommandLogs } from '@/services/logApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import type { CommandLogFilterParams, DeviceCommandLogListItem } from '@/types/log';
import { useTranslation } from 'react-i18next';
import {
  deriveUserStatus,
  getActionTypeLabelKey,
  getStatusLabelKey,
  getUserStatusTone,
} from '@/features/logs/commandLogI18n';
import { CommandLogDetailDialog } from '@/features/logs/CommandLogDetailDialog';

interface CommandLogTableProps {
  filters: CommandLogFilterParams;
  searchText?: string;
}

export function CommandLogTable({ filters, searchText }: CommandLogTableProps) {
  const { formatDateTime } = useTimeFormatter();
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filters, searchText]);

  const { data: logsRes, isLoading, isError } = useQuery({
    queryKey: ['device-command-logs', { ...filters, page, size: pageSize }],
    queryFn: () => getDeviceCommandLogs({ ...filters, page, size: pageSize }),
  });

  const logs = logsRes?.data?.items || [];
  const total = logsRes?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const trimmedSearch = (searchText ?? '').trim();
  const visibleLogs = trimmedSearch
    ? logs.filter((log) => {
        const haystack = [
          log.deviceName,
          log.actionType,
          log.status,
          log.operationId,
          log.sendMethod ?? '',
          log.errorMessage ?? '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(trimmedSearch.toLowerCase());
      })
    : logs;

  const getStatusBadge = (log: Pick<DeviceCommandLogListItem, 'status' | 'trackingLevel' | 'accepted'>) => {
    const userStatus = deriveUserStatus({
      status: log.status,
      trackingLevel: log.trackingLevel,
      accepted: log.accepted,
    });
    const tone = getUserStatusTone(userStatus);
    const base = "text-[10px] font-bold px-1.5 h-5 tracking-tight";

    if (tone === 'success') {
      return (
        <Badge variant="outline" className={cn(base, "bg-emerald-500/10 text-emerald-600 border-emerald-500/20")}>
          {t(getStatusLabelKey(userStatus))}
        </Badge>
      );
    }
    if (tone === 'error') {
      return (
        <Badge variant="outline" className={cn(base, "bg-rose-500/10 text-rose-600 border-rose-500/20")}>
          {t(getStatusLabelKey(userStatus))}
        </Badge>
      );
    }
    if (tone === 'warning') {
      return (
        <Badge variant="outline" className={cn(base, "bg-amber-500/10 text-amber-600 border-amber-500/20")}>
          {t(getStatusLabelKey(userStatus))}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className={cn(base, "bg-muted text-muted-foreground")}>
        {t(getStatusLabelKey(userStatus))}
      </Badge>
    );
  };



  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        <p className="text-[10px] font-bold  tracking-widest text-muted-foreground/60">{t('logs.command.loading')}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-bold">{t('logs.command.loadFailed')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden border rounded-2xl bg-card shadow-sm">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr className="border-b">
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">{t('logs.command.table.issuedAt')}</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">{t('logs.command.table.device')}</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">{t('logs.command.table.actionType')}</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">{t('logs.command.table.status')}</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">{t('logs.command.table.audit')}</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">{t('logs.command.table.sendMethod')}</th>
              <th className="px-6 py-4 text-[10px] font-bold  tracking-widest text-muted-foreground">{t('logs.command.table.details')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visibleLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-muted-foreground italic text-sm">    
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <ShieldCheck className="h-8 w-8" />
                    <p>{t('logs.command.empty')}</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-muted/30 transition-colors">
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
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-bold  tracking-tight text-[10px] text-primary/80">{t(getActionTypeLabelKey(log.actionType))}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(log)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div 
                         className={cn(
                           "p-1 rounded-md border shadow-sm",
                           log.accepted ? "bg-emerald-500/10 border-emerald-500/20" : "bg-muted border-border opacity-40"
                         )}
                         title={log.accepted ? t('logs.command.accepted.true') : t('logs.command.accepted.false')}
                        >
                         <Check className={cn("h-3 w-3", log.accepted ? "text-emerald-500" : "text-muted-foreground")} />
                       </div>
                       <div 
                         className={cn(
                           "p-1 rounded-md border shadow-sm",
                           log.covered ? "bg-amber-500/10 border-amber-500/20" : "bg-muted border-border opacity-40"
                         )}
                         title={log.covered ? t('logs.command.covered.true') : t('logs.command.covered.false')}
                        >
                         <Layers className={cn("h-3 w-3", log.covered ? "text-amber-500" : "text-muted-foreground")} />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[9px] font-bold text-primary/60 ">
                      {log.sendMethod || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                      onClick={() => setSelectedLogId(log.id)}
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
          {t('logs.command.table.total', { total })}
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

      <CommandLogDetailDialog logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
    </div>
  );
}
