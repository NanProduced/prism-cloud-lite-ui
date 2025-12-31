import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Crown, Calendar, ShieldCheck } from 'lucide-react';

export const SubscriptionWidget = () => {
  const { formatDateTime } = useTimeFormatter();
  const { data: subRes, isLoading } = useQuery({
    queryKey: ['user', 'subscription'],
    queryFn: () => apiClient.get('/user/subscription').then(res => res.data),
  });

  const sub = subRes?.data;

  if (isLoading) return <div className="h-full bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="flex flex-col h-full justify-between p-1">
      <div className="flex items-center justify-between">
        <Badge 
          variant={sub?.tier === 'PRO' ? 'default' : 'secondary'}
          className={sub?.tier === 'PRO' ? "bg-indigo-600" : ""}
        >
          {sub?.tier || 'FREE'} PLAN
        </Badge>
        <Crown className={sub?.tier === 'PRO' ? "h-4 w-4 text-amber-500" : "h-4 w-4 text-muted-foreground"} />
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Expires:</span>
          <span className="font-medium">{sub?.endAt ? formatDateTime(sub.endAt) : 'Never'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          <span className="text-muted-foreground">Status:</span>
          <span className="text-emerald-500 font-medium">{sub?.proActive ? 'Active' : 'N/A'}</span>
        </div>
      </div>

      <button className="mt-auto w-full py-1.5 text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors">
        UPGRADE PLAN
      </button>
    </div>
  );
};
