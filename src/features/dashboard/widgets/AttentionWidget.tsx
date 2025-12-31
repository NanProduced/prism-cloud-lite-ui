import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPrograms } from '@/services/programApi';
import { getDeviceCommandLogs } from '@/services/logApi';
import { AlertCircle, FileEdit, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export const AttentionWidget = () => {
  const navigate = useNavigate();
  
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
        className="flex items-center gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/30 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="p-2 bg-amber-500 rounded-lg">
          <FileEdit className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Unpublished Changes</div>
          <div className="text-xs text-muted-foreground">{unpublishedCount} programs pending</div>
        </div>
        <Badge variant="outline" className="bg-white dark:bg-black">{unpublishedCount}</Badge>
      </div>

      <div 
        onClick={() => navigate('/dashboard/logs?statuses=FAILED,EXPIRED')}
        className="flex items-center gap-3 p-3 rounded-xl border border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
      >
        <div className="p-2 bg-red-500 rounded-lg">
          <AlertCircle className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Failed Commands</div>
          <div className="text-xs text-muted-foreground">Last 24 hours</div>
        </div>
        <Badge variant="destructive">{failedCount}</Badge>
      </div>

      <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
        <span>System Status</span>
        <span className="flex items-center gap-1 text-emerald-500">
          <Clock className="h-3 w-3" />
          Real-time
        </span>
      </div>
    </div>
  );
};
