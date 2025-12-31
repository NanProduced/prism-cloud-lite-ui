import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { formatBytes } from '@better-upload/client/helpers';
import { HardDrive, PieChart } from 'lucide-react';

export const StorageLedgerWidget = () => {
  const { data: ledgerRes, isLoading } = useQuery({
    queryKey: ['user', 'quota', 'storage', 'ledger'],
    queryFn: () => apiClient.get('/user/quota/storage/ledger').then(res => res.data),
  });

  const sources = useMemo(() => {
    if (!ledgerRes?.data?.sources) return [];
    return ledgerRes.data.sources.sort((a: any, b: any) => b.usedBytes - a.usedBytes);
  }, [ledgerRes]);

  const totalUsed = useMemo(() => 
    sources.reduce((acc: number, curr: any) => acc + curr.usedBytes, 0),
    [sources]
  );

  if (isLoading) return <div className="h-full bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-bold">{formatBytes(totalUsed)} Used</span>
        </div>
        <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="space-y-2 flex-1 overflow-auto pr-2">
        {sources.map((source: any) => (
          <div key={source.source} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-muted-foreground capitalize">
                {source.source ? source.source.toLowerCase().replace('_', ' ') : 'Unknown'}
              </span>
              <span>{formatBytes(source.usedBytes)}</span>
            </div>
            <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all" 
                style={{ width: `${(source.usedBytes / (totalUsed || 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
