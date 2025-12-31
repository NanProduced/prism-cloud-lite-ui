import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Crown, ShieldCheck, Zap, BarChart2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSettingsStore } from '@/store/settingsStore';
import { formatBytes } from '@better-upload/client/helpers';

export const SubscriptionWidget = () => {
  const { formatDateTime } = useTimeFormatter();
  const { setBillingOpen } = useSettingsStore();

  const { data: subRes, isLoading: subLoading } = useQuery({
    queryKey: ['user', 'subscription'],
    queryFn: () => apiClient.get('/user/subscription').then(res => res.data),
  });

  const { data: quotaRes, isLoading: quotaLoading } = useQuery({
    queryKey: ['user', 'quota', 'overview'],
    queryFn: () => apiClient.get('/user/quota/overview').then(res => res.data),
  });

  const sub = subRes?.data;
  const quota = quotaRes?.data;

  if (subLoading || quotaLoading) return <div className="h-full bg-muted animate-pulse rounded-lg" />;

  const tierColor = sub?.tier === 'PRO' ? 'bg-amber-500' : 'bg-slate-500';

  return (
    <div className="flex flex-col h-full gap-4 p-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${tierColor} text-white shadow-sm`}>
            <Crown className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Subscription</span>
            <span className="text-sm font-black tracking-tight">{sub?.tier || 'FREE'} PLAN</span>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold h-5 uppercase">
          {sub?.proActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="space-y-3 flex-1 overflow-auto">
        {(quota?.metrics || []).slice(0, 3).map((m: any) => (
          <div key={m.resource} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-muted-foreground uppercase">{m.resource.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-mono">
                {m.resource.includes('Bytes') ? formatBytes(m.used) : m.used} / {m.limit === -1 ? '鈭?' : (m.resource.includes('Bytes') ? formatBytes(m.limit) : m.limit)}
              </span>
            </div>
            <Progress value={m.percent || 0} className="h-1" />
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2">
        <div className="flex items-center justify-between text-[9px] text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Renews: {sub?.endAt ? formatDateTime(sub.endAt).split(' ')[0] : 'Never'}
          </span>
        </div>
        <button 
          onClick={() => setBillingOpen(true)}
          className="w-full py-2 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md shadow-indigo-200 dark:shadow-none uppercase flex items-center justify-center gap-2"
        >
          <Zap className="h-3 w-3 fill-white" />
          Upgrade Plan
        </button>
      </div>
    </div>
  );
};
