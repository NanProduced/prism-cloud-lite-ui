import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { Crown, ShieldCheck, Zap, BarChart2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useSettingsStore } from '@/store/settingsStore';
import { formatBytes, cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export const SubscriptionWidget = () => {
  const { t } = useTranslation();
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

  const isPro = sub?.tier === 'PRO';
  const isUltra = sub?.tier === 'ULTRA';
  
  const tierColor = isPro ? 'bg-gradient-to-br from-amber-400 to-amber-600' : isUltra ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600' : 'bg-slate-500';

  return (
    <div className={cn(
      "flex flex-col h-full gap-4 p-1 transition-all duration-700",
      isPro && "bg-amber-50/20 dark:bg-amber-500/5",
      isUltra && "bg-violet-50/20 dark:bg-violet-500/5"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg text-white shadow-md", tierColor)}>
            <Crown className={cn("h-4 w-4", isPro && "fill-current")} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">{t('dashboard.widgets.subscription.title')}</span>
            <span className={cn(
              "text-sm font-bold tracking-tight",
              isPro && "text-amber-600 dark:text-amber-400",
              isUltra && "text-violet-600 dark:text-violet-400"
            )}>
              {t('dashboard.widgets.subscription.plan', { tier: sub?.tier || 'FREE' })}
            </span>
          </div>
        </div>
        <Badge variant="outline" className={cn(
          "text-[10px] font-bold h-5 uppercase border-none",
          sub?.proActive ? "bg-emerald-100 text-emerald-700 shadow-sm" : "bg-slate-100 text-slate-500"
        )}>
          {sub?.proActive ? t('dashboard.widgets.subscription.active') : t('dashboard.widgets.subscription.inactive')}
        </Badge>
      </div>

      <div className="space-y-3 flex-1 overflow-auto">
        {(quota?.metrics || []).map((m: any) => (
          <div key={m.resource} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-muted-foreground uppercase">{m.resource.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-mono font-bold">
                {m.resource.includes('Bytes') ? formatBytes(m.used) : m.used} / {m.limit === -1 ? '∞' : (m.resource.includes('Bytes') ? formatBytes(m.limit) : m.limit)}
              </span>
            </div>
            <Progress 
              value={m.percent || 0} 
              className={cn(
                "h-1", 
                isPro ? "[&>div]:bg-amber-500" : isUltra ? "[&>div]:bg-violet-500" : ""
              )} 
            />
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2">
        {isPro || isUltra ? (
          <div className="p-2 rounded-xl bg-background/60 border border-border/40 backdrop-blur-sm">
             <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/80">
               <ShieldCheck className={cn("h-3.5 w-3.5", isPro ? "text-amber-500" : "text-violet-500")} />
               {t('dashboard.widgets.subscription.premiumSupport')}
             </div>
             <p className="text-[9px] text-muted-foreground mt-1 px-5">
               {t('dashboard.widgets.subscription.renewsOn', { date: sub?.endAt ? formatDateTime(sub.endAt).split(' ')[0] : t('dashboard.widgets.subscription.never') })}
             </p>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[9px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1 px-1">
              <ShieldCheck className="h-3 w-3" />
              {t('dashboard.widgets.subscription.renewsOn', { date: t('dashboard.widgets.subscription.never') })}
            </span>
          </div>
        )}
        
        <button 
          onClick={() => setBillingOpen(true)}
          className={cn(
            "w-full py-2 text-[10px] font-bold rounded-lg transition-all shadow-md flex items-center justify-center gap-2",
            isPro ? "bg-amber-500 hover:bg-amber-600 text-white" : 
            isUltra ? "bg-violet-600 hover:bg-violet-700 text-white" : 
            "bg-indigo-600 hover:bg-indigo-700 text-white"
          )}
        >
          <Zap className="h-3 w-3 fill-current" />
          {isPro || isUltra ? t('dashboard.widgets.subscription.extend') : t('dashboard.widgets.subscription.upgrade')}
        </button>
      </div>
    </div>
  );
};