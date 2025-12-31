import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDeviceCommandLogs } from '@/services/logApi';
import { useMessageStore } from '@/store/messageStore';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Terminal, Bell, CheckCircle2, XCircle, Clock, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const RecentActivityWidget = () => {
  const { formatRelative } = useTimeFormatter();
  const { recentMessages } = useMessageStore();

  const { data: logsRes } = useQuery({
    queryKey: ['device-command-logs', { page: 0, size: 10 }],
    queryFn: () => getDeviceCommandLogs({ page: 0, size: 10 }),
  });

  const activities = useMemo(() => {
    const logs = (logsRes?.data?.items || []).map(log => ({
      id: `log-${log.operationId}`,
      type: 'COMMAND',
      title: log.actionType,
      subtitle: log.deviceName,
      status: log.status,
      time: log.createdAt,
      icon: Terminal,
    }));

    const messages = (recentMessages || []).slice(0, 5).map(msg => ({
      id: `msg-${msg.id}`,
      type: 'MESSAGE',
      title: msg.kind === 'TASK' ? 'New Task' : 'Notification',
      subtitle: msg.type,
      status: msg.status || 'INFO',
      time: msg.createdAt,
      icon: Bell,
    }));

    return [...logs, ...messages].sort((a, b) => 
      new Date(b.time).getTime() - new Date(a.time).getTime()
    ).slice(0, 10);
  }, [logsRes, recentMessages]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'SUCCEEDED':
      case 'COMPLETED':
        return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
      case 'FAILED':
      case 'EXPIRED':
      case 'REJECTED':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'WAITING':
      case 'PUBLISHED':
      case 'DISPATCHED':
        return <Clock className="h-3 w-3 text-amber-500" />;
      default:
        return <Info className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <ScrollArea className="h-full pr-3">
      <div className="space-y-3">
        {activities.map((item) => (
          <div key={item.id} className="flex items-start gap-3 group">
            <div className="mt-0.5 p-1.5 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
              <item.icon className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold truncate">{item.title}</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatRelative(item.time)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-muted-foreground truncate">{item.subtitle}</span>
                {getStatusIcon(item.status as string)}
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="py-10 text-center text-xs text-muted-foreground opacity-50">
            No recent activity
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
