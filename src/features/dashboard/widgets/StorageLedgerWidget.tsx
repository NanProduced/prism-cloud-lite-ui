import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { formatBytes, cn } from '@/lib/utils';
import { AlertTriangle, Database } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

export const StorageLedgerWidget = ({ layout }: { layout?: any }) => {
  const { t } = useTranslation();
  const { data: ledgerRes, isLoading } = useQuery({
    queryKey: ['user', 'quota', 'storage', 'ledger'],
    queryFn: () => apiClient.get('/user/quota/storage/ledger').then(res => res.data),
  });

  const ledger = ledgerRes?.data;
  const sources = useMemo(() => {
    if (!ledger?.sources) return [];
    return [...ledger.sources].sort((a: any, b: any) => b.totalBytes - a.totalBytes);
  }, [ledger]);

  // Layout-based display logic
  const isWide = useMemo(() => layout?.w > 1, [layout]);
  const isTall = useMemo(() => layout?.h > 2, [layout]);
  const showDetails = isWide || isTall || !layout; // Default to showing if no layout info

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 animate-pulse">
        <div className="w-24 h-24 rounded-full border-8 border-muted" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    );
  }

  const totalUsed = ledger?.ledgerTotalBytes || 0;
  const quotaBytes = ledger?.quotaBytes || 0;
  const isUnlimited = quotaBytes === -1;
  const percent = (!isUnlimited && quotaBytes > 0) ? Math.min(100, Math.round((totalUsed / quotaBytes) * 100)) : 0;
  const mismatch = ledger?.mismatchBytes || 0;

  // Donut chart constants
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className={cn(
      "flex h-full gap-6",
      isWide ? "flex-row items-center" : "flex-col items-center pt-2"
    )}>
      {/* Chart Section */}
      <div className={cn(
        "relative flex shrink-0 items-center justify-center transition-all duration-300",
        isWide ? "w-36 h-36" : "w-32 h-32"
      )}>
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          {/* Track circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="7"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000 ease-in-out",
              percent > 90 ? "text-red-500" : "text-blue-500"
            )}
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={cn(
            "font-black leading-none tracking-tighter",
            isWide ? "text-2xl" : "text-xl"
          )}>
            {isUnlimited ? '∞' : `${percent}%`}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1 opacity-70">
            {t('dashboard.widgets.storage.used')}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className={cn(
        "flex flex-col min-w-0 flex-1",
        isWide ? "h-full justify-center" : "items-center text-center w-full"
      )}>
        <div className={cn(showDetails ? "mb-4" : "mb-0")}>
          <div className={cn(
            "font-bold truncate text-foreground/90",
            isWide ? "text-2xl" : "text-xl"
          )}>
            {formatBytes(totalUsed)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-0.5 justify-center lg:justify-start">
            <span className="truncate">
              {isUnlimited 
                ? t('shell.storage.unlimited') 
                : t('dashboard.widgets.storage.usedOf', { quota: formatBytes(quotaBytes) })}
            </span>
            {mismatch !== 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{t('dashboard.widgets.storage.mismatch', { size: formatBytes(mismatch) })}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Breakdown - Only if Tall or Wide */}
        {showDetails && (
          <ScrollArea className="flex-1 -mr-2 pr-4 w-full">
            <div className="space-y-5 pb-2">
              {sources.map((source: any) => (
                <div key={source.sourceType} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Database className="h-3 w-3 text-muted-foreground/50" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                        {source.sourceType?.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/80">
                      {formatBytes(source.totalBytes)}
                    </span>
                  </div>
                  
                  {/* Categorized Progress Bar */}
                  <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden flex shadow-inner">
                    {source.items?.map((item: any, idx: number) => {
                      const colors = [
                        'bg-blue-500 dark:bg-blue-600', 
                        'bg-indigo-400 dark:bg-indigo-500', 
                        'bg-sky-400 dark:bg-sky-500', 
                        'bg-slate-300 dark:bg-slate-600'
                      ];
                      const width = (item.totalBytes / (source.totalBytes || 1)) * 100;
                      if (width < 1) return null;
                      return (
                        <div 
                          key={item.fileType}
                          className={cn(colors[idx % colors.length], "h-full transition-all")} 
                          style={{ width: `${width}%` }}
                          title={`${item.fileType}: ${formatBytes(item.totalBytes)}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Minimal indicator for small view */}
        {!showDetails && (
          <div className="mt-4 flex gap-1.5">
            {sources.slice(0, 3).map((_, i) => (
              <div key={i} className={cn("h-1 rounded-full", i === 0 ? "w-6 bg-blue-500" : "w-1.5 bg-muted")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
