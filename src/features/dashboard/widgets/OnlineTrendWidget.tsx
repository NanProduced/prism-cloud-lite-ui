import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActiveDeviceCountBuckets } from '@/services/telemetryApi';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const OnlineTrendWidget = () => {
  const { data: trendRes, isLoading } = useQuery({
    queryKey: ['telemetry', 'active-device-count'],
    queryFn: () => getActiveDeviceCountBuckets({
      from: new Date(Date.now() - 7 * 86400000).toISOString(),
      to: new Date().toISOString(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      bucket: 'DAY'
    }),
  });

  const data = useMemo(() => {
    if (!Array.isArray(trendRes?.data)) return [];
    return trendRes.data.map((item: any) => ({
      name: String(item.bucketStart).slice(5, 10),
      value: item.activeDevices
    }));
  }, [trendRes]);

  if (isLoading) return <div className="h-full bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Online Uptime (7D)</span>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" hide />
            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip 
              contentStyle={{ fontSize: '10px', borderRadius: '8px' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
