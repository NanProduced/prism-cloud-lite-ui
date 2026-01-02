import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPrograms } from '@/services/programApi';
import { getDeviceCommandLogs } from '@/services/logApi';
import { AlertCircle, FileEdit, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export const AttentionWidget = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { data: programsRes } = useQuery({
    queryKey: ['programs'],
    queryFn: () => getPrograms(),
  });

  const { data: logsRes } = useQuery({
    queryKey: ['device-command-logs', { statuses: ['FAILED', 'EXPIRED'] }],
    queryFn: () => getDeviceCommandLogs({ 
      page: 0, 
      size: 5, 
      statuses: ['FAILED', 'EXPIRED'] 
    }),
  });

  const unpublishedCount = useMemo(() => 
    (programsRes?.data || []).filter(p => p.unpublishedChanges).length, 
    [programsRes]
  );

  const failedCount = useMemo(() => logsRes?.data?.total || 0, [logsRes]);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div 
        onClick={() => navigate('/dashboard/programs?filter=unpublished')}
        className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors"
      >
        <div className="p-2 bg-amber-500 rounded-lg">
          <FileEdit className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{t('dashboard.widgets.attention.unpublished')}</div>
          <div className="text-xs text-muted-foreground">{t('dashboard.widgets.attention.pendingPrograms', { count: unpublishedCount })}</div>
        </div>
        <Badge variant="outline" className="bg-white dark:bg-black">{unpublishedCount}</Badge>
      </div>

      <div 
        onClick={() => navigate('/dashboard/logs?tab=terminal&statuses=FAILED,EXPIRED')}
        className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
      >
        <div className="p-2 bg-red-500 rounded-lg">
          <AlertCircle className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">{t('dashboard.widgets.attention.failedCommands')}</div>
          <div className="text-xs text-muted-foreground">{t('dashboard.widgets.attention.last24h')}</div>
        </div>
        <Badge variant="destructive">{failedCount}</Badge>
      </div>

      <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
        <span>{t('dashboard.widgets.attention.systemStatus')}</span>
        <span className="flex items-center gap-1 text-emerald-500">
          <Clock className="h-3 w-3" />
          {t('dashboard.widgets.attention.realtime')}
        </span>
      </div>
    </div>
  );
};
