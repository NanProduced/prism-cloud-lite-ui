import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { formatBytes } from '@better-upload/client/helpers';
import { HardDrive, PieChart, Info, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const StorageLedgerWidget = () => {
  const { data: ledgerRes, isLoading } = useQuery({
    queryKey: ['user', 'quota', 'storage', 'ledger'],
    queryFn: () => apiClient.get('/user/quota/storage/ledger').then(res => res.data),
  });

  const ledger = ledgerRes?.data;
  const sources = useMemo(() => {
    if (!ledger?.sources) return [];
    return [...ledger.sources].sort((a: any, b: any) => b.totalBytes - a.totalBytes);
  }, [ledger]);

  if (isLoading) return <div className="h-full bg-muted animate-pulse rounded-lg" />;

  const totalUsed = ledger?.ledgerTotalBytes || 0;
  const quotaBytes = ledger?.quotaBytes || 0;
  const availableBytes = quotaBytes > 0 ? Math.max(0, quotaBytes - totalUsed) : null;
  const percent = quotaBytes > 0 ? Math.min(100, Math.round((totalUsed / quotaBytes) * 100)) : 0;
  const mismatch = ledger?.mismatchBytes || 0;

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex flex-col gap-2 px-1 mb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Cloud Storage</span>
              <span className="text-sm font-black tracking-tight">
                {formatBytes(totalUsed)} / {quotaBytes === -1 ? '鈭?' : formatBytes(quotaBytes)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {mismatch !== 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent className="text-[10px] max-w-[200px]">
                    Mismatch: {formatBytes(mismatch)} between ledger and quota service.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {quotaBytes > 0 && (
              <span className={cn(
                "text-[10px] font-black px-1.5 py-0.5 rounded",
                percent > 90 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              )}>
                {percent}%
              </span>
            )}
          </div>
        </div>
        {quotaBytes > 0 && (
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", percent > 90 ? "bg-red-500" : "bg-blue-500")}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4 py-2">
          {sources.map((source: any) => (
            <div key={source.sourceType} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-muted-foreground">
                  {source.sourceType?.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                  {source.totalCount} items • {formatBytes(source.totalBytes)}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                {source.items?.map((item: any, idx: number) => {
                  const colors = ['bg-blue-500', 'bg-indigo-400', 'bg-sky-400', 'bg-slate-300'];
                  const width = (item.totalBytes / (source.totalBytes || 1)) * 100;
                  if (width < 1) return null;
                  return (
                    <div 
                      key={item.fileType}
                      className={colors[idx % colors.length]} 
                      style={{ width: `${width}%` }}
                      title={`${item.fileType}: ${formatBytes(item.totalBytes)}`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {source.items?.slice(0, 3).map((item: any) => (
                  <div key={item.fileType} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="text-[8px] font-medium text-muted-foreground uppercase">{item.fileType.toLowerCase()}</span>
                    <span className="text-[8px] font-bold">{formatBytes(item.totalBytes)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
