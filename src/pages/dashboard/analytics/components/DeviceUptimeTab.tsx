import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wifi, Clock, TrendingUp, MonitorSmartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import {
  getOnlineTimeSummary,
  getActiveDeviceCountBuckets,
  getConcurrencyBuckets,
  getDeviceSessions,
  type PlaybackBucket,
} from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { DeviceOnlineTable } from './DeviceOnlineTable';
import { DeviceSessionsTable } from './DeviceSessionsTable';
import type { DeviceSession } from '../types';
import type { Device } from '@/types/device';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DeviceUptimeTabProps {
  from: string;
  to: string;
  tz: string;
  bucket: PlaybackBucket;
  deviceMap?: Record<string, Device>;
  selectedDeviceId: string | null;
  onSelectDeviceId: (id: string | null) => void;
  className?: string;
}

export function DeviceUptimeTab({ 
  from, 
  to, 
  tz, 
  bucket, 
  deviceMap, 
  selectedDeviceId,
  onSelectDeviceId,
  className 
}: DeviceUptimeTabProps) {
  const { formatDateTime } = useTimeFormatter();
  const navigate = useNavigate();
  const summaryTableHeight = 'h-[340px] sm:h-[420px] lg:h-[520px]';
  const sessionsTableHeight = 'h-[340px] sm:h-[420px]';

  // Query for device online summary
  const { data: summaryRes, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['telemetry', 'online-time', 'summary', from, to],
    queryFn: () => getOnlineTimeSummary({ from, to }),
  });

  const summaryData = summaryRes?.data || [];

  // Query for active device count trend
  const { data: activeCountRes, isLoading: isActiveCountLoading } = useQuery({
    queryKey: ['telemetry', 'online-time', 'active-count', from, to, bucket, tz],
    queryFn: () => getActiveDeviceCountBuckets({ from, to, tz, bucket }),
  });

  const activeCountData = activeCountRes?.data || [];

  // Query for concurrency trend
  const { data: concurrencyRes, isLoading: isConcurrencyLoading } = useQuery({
    queryKey: ['telemetry', 'online-time', 'concurrency', from, to, bucket, tz],
    queryFn: () => getConcurrencyBuckets({ from, to, tz, bucket }),
  });

  const concurrencyData = concurrencyRes?.data || [];

  // Query for selected device sessions
  const { data: sessionsRes, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['telemetry', 'online-time', 'sessions', selectedDeviceId, from, to],
    queryFn: () =>
      getDeviceSessions({
        deviceId: selectedDeviceId!,
        from,
        to,
        limit: 50,
      }),
    enabled: !!selectedDeviceId,
  });

  const sessionsData: DeviceSession[] = useMemo(() => {
    if (!sessionsRes?.data?.items) return [];
    return sessionsRes.data.items.map((s) => ({
      sessionId: String(s.sessionId),
      deviceId: selectedDeviceId!,
      startedAt: s.startTime,
      endedAt: s.endTime || null,
      durationSeconds: s.durationSeconds,
    }));
  }, [sessionsRes, selectedDeviceId]);

  // Auto-select first device
  useEffect(() => {
    if (!selectedDeviceId && summaryData.length > 0) {
      onSelectDeviceId(summaryData[0].deviceId);
    }
  }, [summaryData, selectedDeviceId, onSelectDeviceId]);

  // KPI calculations
  const kpis = useMemo(() => {
    if (summaryData.length === 0) {
      return { totalDevices: 0, totalOnlineTime: 0, peakConcurrent: 0 };
    }
    const totalDevices = summaryData.length;
    const totalOnlineTime = summaryData.reduce((sum, d) => sum + (d.onlineSeconds || 0), 0);
    const peakConcurrent = concurrencyData.reduce(
      (max: number, d: { maxConcurrent?: number }) => Math.max(max, d.maxConcurrent || 0),
      0
    );
    return { totalDevices, totalOnlineTime, peakConcurrent };
  }, [summaryData, concurrencyData]);

  const selectedDevice = summaryData.find((d) => d.deviceId === selectedDeviceId);
  
  const selectedDeviceName = useMemo(() => {
    if (!selectedDeviceId || !deviceMap) return null;
    return deviceMap[selectedDeviceId]?.deviceName || 'Deleted Device';
  }, [selectedDeviceId, deviceMap]);

  const canOpenDevice = Boolean(selectedDeviceId && deviceMap?.[selectedDeviceId]);

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    if (hours > 1000) return `${(hours / 1000).toFixed(1)}k h`;
    return `${hours}h`;
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Top Section: Global KPIs and Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-3 grid grid-cols-1 gap-4">
          <Card className="rounded-3xl border-none ring-1 ring-muted/60 shadow-sm bg-background/40 backdrop-blur-md overflow-hidden transition-all hover:ring-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                  <MonitorSmartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-[0.1em]">Total Devices</p>
                  <p className="text-2xl font-bold tracking-tighter tabular-nums">{kpis.totalDevices}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none ring-1 ring-muted/60 shadow-sm bg-background/40 backdrop-blur-md overflow-hidden transition-all hover:ring-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-600 shadow-inner">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-[0.1em]">Total Online Time</p>
                  <p className="text-2xl font-bold tracking-tighter tabular-nums text-sky-600">
                    {formatTotalTime(kpis.totalOnlineTime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="xl:col-span-9 rounded-3xl border-none ring-1 ring-muted/60 shadow-sm bg-background/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[11px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-2.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              Global Device Activity
            </CardTitle>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-muted-foreground tracking-tight">Active Devices</span>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeCountData}>
                  <defs>
                    <linearGradient id="colorActiveCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                  <XAxis
                    dataKey="bucketStart"
                    fontSize={9}
                    tickFormatter={(val) => {
                      try {
                        return formatInTimeZone(new Date(val), tz, bucket === 'HOUR' ? 'HH:mm' : 'MMM d');
                      } catch { return val; }
                    }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    labelFormatter={(val) => formatDateTime(val)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activeDevices"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#colorActiveCount)"
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        <div className="min-w-0">
          <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="p-4 pb-2 bg-muted/5 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-bold tracking-widest flex items-center gap-2 text-foreground/80">
                <Wifi className="h-3.5 w-3.5 text-primary" />
                Device Online Summary
              </CardTitle>
              <div className="text-[10px] font-bold text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full tracking-tighter">
                {summaryData.length} Devices
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isSummaryLoading ? (
                <div className={cn(summaryTableHeight, 'flex items-center justify-center text-[10px] font-bold opacity-20 italic')}>
                  Loading...
                </div>
              ) : summaryData.length === 0 ? (
                <div className={cn(summaryTableHeight, 'flex items-center justify-center text-[10px] font-bold opacity-20 text-center px-8')}>
                  No online data in this period
                </div>
              ) : (
                <DeviceOnlineTable
                  data={summaryData}
                  deviceMap={deviceMap}
                  selectedDeviceId={selectedDeviceId || undefined}
                  onSelectDevice={onSelectDeviceId}
                  className={cn(summaryTableHeight, 'border-0 rounded-none')}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 flex flex-col gap-4">
          {selectedDevice ? (
            <>
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm bg-muted/5">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          (selectedDevice as any)?.status === 'ACTIVE' ? "bg-emerald-500/10" : "bg-slate-500/10"
                        )}>
                          <Wifi className={cn(
                            "h-4 w-4",
                            (selectedDevice as any)?.status === 'ACTIVE' ? "text-emerald-500" : "text-slate-400"
                          )} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate max-w-[200px]">
                            {selectedDeviceName || '—'}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] font-bold tracking-widest',
                          (selectedDevice as any)?.status === 'ACTIVE'
                            ? 'bg-emerald-500/5 text-emerald-600 border-emerald-200'
                            : 'bg-slate-500/5 text-slate-400 border-slate-200'
                        )}
                      >
                        {(selectedDevice as any)?.status || 'Unknown'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-xl bg-background border border-muted/20">
                        <p className="text-[9px] font-bold text-muted-foreground tracking-tighter">Network</p>
                        <p className="text-xs font-bold text-primary">
                          {deviceMap?.[selectedDeviceId!]?.networkType || '—'}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-background border border-muted/20">
                        <p className="text-[9px] font-bold text-muted-foreground tracking-tighter">Period Online Time</p>
                        <p className="text-xs font-bold text-emerald-500 tabular-nums">
                          {Math.floor(selectedDevice.onlineSeconds / 3600)}h {Math.floor((selectedDevice.onlineSeconds % 3600) / 60)}m
                        </p>
                      </div>
                    </div>

                    {canOpenDevice && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-[10px] font-bold tracking-widest"
                        onClick={() => navigate(`/dashboard/devices/${selectedDeviceId}`)}
                      >
                        Navigate to Device
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="p-4 pb-2 bg-muted/5 border-b">
                  <CardTitle className="text-[10px] font-bold tracking-widest flex items-center gap-2 text-foreground/80">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Connection History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isSessionsLoading ? (
                    <div className={cn(sessionsTableHeight, 'flex items-center justify-center text-[10px] font-bold opacity-20 italic')}>
                      Loading...
                    </div>
                  ) : sessionsData.length === 0 ? (
                    <div className={cn(sessionsTableHeight, 'flex items-center justify-center text-[10px] font-bold opacity-20')}>
                      No session history
                    </div>
                  ) : (
                    <DeviceSessionsTable data={sessionsData} className={cn(sessionsTableHeight, 'border-0 rounded-none')} />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed rounded-3xl p-8 bg-muted/5">
              <MonitorSmartphone className="h-12 w-12 mb-3" />
              <p className="text-xs font-bold tracking-widest">Select a Device</p>
              <p className="text-[10px] mt-1">Choose from the summary list to view detailed telemetry</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
