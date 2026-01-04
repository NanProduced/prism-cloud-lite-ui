import { Clock, ExternalLink } from 'lucide-react';
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
import type { DeviceSession } from '../types';
import { useTranslation } from 'react-i18next';

interface DeviceSessionsTableProps {
  data: DeviceSession[];
  className?: string;
}

export function DeviceSessionsTable({ data, className }: DeviceSessionsTableProps) {
  const { t } = useTranslation();
  const { formatDateTime } = useTimeFormatter();

  const formatDuration = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    let parts = [];
    if (hours > 0) parts.push(`${hours}${t('common.units.hour')}`);
    if (minutes > 0) parts.push(`${minutes}${t('common.units.minute')}`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}${t('common.units.second')}`);
    
    return parts.join(' ');
  };

  return (
    <ScrollArea className={cn("w-full h-full", className)}>
      <Table>
        <TableHeader className="bg-muted/30 sticky top-0 z-10">
          <TableRow>
            <TableHead className="text-[9px] font-bold tracking-widest">{t('analytics.common.startedAt')}</TableHead>
            <TableHead className="text-[9px] font-bold tracking-widest text-right">{t('analytics.common.duration')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((session) => (
            <TableRow key={session.sessionId} className="group hover:bg-muted/40 transition-colors border-none">
              <TableCell className="py-2.5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-foreground/80 tabular-nums">
                    {formatDateTime(session.startedAt)}
                  </span>
                  <span className="text-[8px] text-muted-foreground opacity-60">
                    {session.endedAt ? `${t('analytics.common.end')}: ${formatDateTime(session.endedAt)}` : t('analytics.common.stillActive')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[9px] font-bold tabular-nums border border-primary/10">
                  <Clock className="h-2.5 w-2.5 opacity-40" />
                  {formatDuration(session.durationSeconds)}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center text-[10px] font-medium text-muted-foreground italic">
                {t('analytics.common.noSessionHistory')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}