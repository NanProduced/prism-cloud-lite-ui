import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wifi, Activity, Users, Clock, TrendingUp, MonitorSmartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
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
import { FleetOnlineTable } from './FleetOnlineTable';
import { DeviceSessionsTable } from './DeviceSessionsTable';
import type { DeviceSession } from '../types';

interface FleetUptimeTabProps {
  from: string;
  to: string;
  tz: string;
  bucket: PlaybackBucket;
  deviceMap?: Record<string, string>;
  className?: string;
}

export function FleetUptimeTab({ from, to, tz, bucket, deviceMap, className }: FleetUptimeTabProps) {
  const { formatDateTime } = useTimeFormatter();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const resolvedDeviceMap = deviceMap ?? {};

  // Query for fleet online summary
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
      sessionId: s.sessionId,
      deviceId: selectedDeviceId!,
      startedAt: s.startTime,
      endedAt: s.endTime || null,
      durationSeconds: s.durationSeconds,
    }));
  }, [sessionsRes, selectedDeviceId]);

  // Auto-select first device
  useEffect(() => {
    if (!selectedDeviceId && summaryData.length > 0) {
      setSelectedDeviceId(summaryData[0].deviceId);
    }
  }, [summaryData, selectedDeviceId]);

  // KPI calculations
  const kpis = useMemo(() => {
    if (summaryData.length === 0) {
      return { totalDevices: 0, avgOnlineRate: null as number | null, peakConcurrent: 0 };
    }
    const totalDevices = summaryData.length;
    const validRates = summaryData
      .map((d) => (typeof d.onlineRate === 'number' && Number.isFinite(d.onlineRate) ? d.onlineRate : null))
      .filter((v): v is number => v !== null);
    const avgOnlineRate =
      validRates.length === 0 ? null : validRates.reduce((sum, r) => sum + r, 0) / validRates.length;
    const peakConcurrent = concurrencyData.reduce(
      (max: number, d: { maxConcurrent?: number }) => Math.max(max, d.maxConcurrent || 0),
      0
    );
    return { totalDevices, avgOnlineRate, peakConcurrent };
  }, [summaryData, concurrencyData]);

  const selectedDevice = summaryData.find((d) => d.deviceId === selectedDeviceId);
  const selectedDeviceOnlineRate =
    typeof selectedDevice?.onlineRate === 'number' && Number.isFinite(selectedDevice.onlineRate)
      ? selectedDevice.onlineRate
      : null;

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Top Section: Global KPIs and Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* KPI Summary - Compact */}
        <div className="xl:col-span-1 grid grid-cols-1 gap-4">
          <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm bg-background/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <MonitorSmartphone className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fleet Size</p>
                  <p className="text-xl font-bold tracking-tight tabular-nums">{kpis.totalDevices}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm bg-background/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10">
                  <Activity className="h-4 w-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Availability</p>
                  <p className="text-xl font-bold tracking-tight tabular-nums">
                    {kpis.avgOnlineRate === null ? '—' : `${Math.round(kpis.avgOnlineRate * 100)}%`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Trends - Compact */}
        <Card className="xl:col-span-3 rounded-2xl border-none ring-1 ring-muted shadow-sm bg-background/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Fleet Availability & Concurrency
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeCountData}>
                  <defs>
                    <linearGradient id="colorActiveCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis
                    dataKey="bucketStart"
                    fontSize={9}
                    tickFormatter={(val) => {
                      try {
                        return formatInTimeZone(new Date(val), tz, bucket === 'HOUR' ? 'HH:mm' : 'MMM d');
                      } catch {
                        return val;
                      }
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    labelFormatter={(val) => formatDateTime(val)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '10px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activeDevices"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorActiveCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Section: Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[600px]">
        {/* LEFT: Master Table (65%) */}
        <div className="flex-[6.5] flex flex-col gap-4">
          <Card className="flex-1 rounded-2xl border-none ring-1 ring-muted shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="p-4 pb-2 bg-muted/5 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground/80">
                <Wifi className="h-4 w-4 text-primary" />
                Fleet Online Summary
              </CardTitle>
              <div className="text-[10px] font-medium text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full">
                {summaryData.length} Devices Recorded
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              {isSummaryLoading ? (
                <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                  Loading...
                </div>
              ) : summaryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20 text-center px-8">
                  No online time data in this period
                </div>
              ) : (
                <FleetOnlineTable
                  data={summaryData}
                  deviceMap={resolvedDeviceMap}
                  selectedDeviceId={selectedDeviceId || undefined}
                  onSelectDevice={setSelectedDeviceId}
                  className="h-full border-0 rounded-none min-h-[500px]"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Detail Panel (35%) */}
        <div className="flex-[3.5] flex flex-col gap-4">
          {selectedDevice ? (
            <>
              {/* Selected Device Context Card */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm bg-muted/5">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <Wifi className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate max-w-[200px]">
                            {resolvedDeviceMap[selectedDevice.deviceId] || selectedDevice.deviceId}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            ID: {selectedDevice.deviceId}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[9px] font-bold',
                          selectedDeviceOnlineRate !== null &&
                            selectedDeviceOnlineRate >= 0.9 &&
                            'bg-emerald-500/10 text-emerald-600',
                          selectedDeviceOnlineRate !== null &&
                            selectedDeviceOnlineRate >= 0.5 &&
                            selectedDeviceOnlineRate < 0.9 &&
                            'bg-amber-500/10 text-amber-600',
                          selectedDeviceOnlineRate !== null &&
                            selectedDeviceOnlineRate < 0.5 &&
                            'bg-rose-500/10 text-rose-600'
                        )}
                      >
                        {selectedDeviceOnlineRate === null
                          ? '—'
                          : selectedDeviceOnlineRate >= 0.9
                            ? 'EXCELLENT'
                            : selectedDeviceOnlineRate >= 0.5
                              ? 'FAIR'
                              : 'POOR'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-xl bg-background border border-muted/20">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Rate</p>
                        <p className="text-sm font-bold text-emerald-500">
                          {selectedDeviceOnlineRate === null ? '—' : `${Math.round(selectedDeviceOnlineRate * 100)}%`}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-background border border-muted/20">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Uptime</p>
                        <p className="text-sm font-bold text-primary">
                          {Math.floor(selectedDevice.onlineSeconds / 3600)}h {Math.floor((selectedDevice.onlineSeconds % 3600) / 60)}m
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session History Table */}
              <Card className="flex-1 rounded-2xl border-none ring-1 ring-muted shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="p-4 pb-2 bg-muted/5 border-b">
                  <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground/80">
                    <Clock className="h-4 w-4 text-primary" />
                    Connection History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                  {isSessionsLoading ? (
                    <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                      Loading...
                    </div>
                  ) : sessionsData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                      No session history
                    </div>
                  ) : (
                    <DeviceSessionsTable data={sessionsData} className="h-full border-0 rounded-none min-h-[400px]" />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed rounded-3xl p-8 bg-muted/5">
              <MonitorSmartphone className="h-12 w-12 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Select a Device</p>
              <p className="text-[10px] mt-1">Select from the summary list to view detailed telemetry</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
