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
    <div className={cn('space-y-6', className)}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-emerald-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <MonitorSmartphone className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Fleet Size
                </p>
                <p className="text-2xl font-bold tracking-tighter tabular-nums">
                  {kpis.totalDevices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-sky-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-500/10">
                <Activity className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Avg Availability
                </p>
                <p className="text-2xl font-bold tracking-tighter tabular-nums">
                  {kpis.avgOnlineRate === null ? '—' : `${Math.round(kpis.avgOnlineRate * 100)}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-violet-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Peak Concurrency
                </p>
                <p className="text-2xl font-bold tracking-tighter tabular-nums">
                  {kpis.peakConcurrent}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Device Count Chart */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/70">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Active Device Count
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-[200px]">
              {isActiveCountLoading ? (
                <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                  Loading...
                </div>
              ) : activeCountData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeCountData}>
                    <defs>
                      <linearGradient id="colorActiveCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Concurrency Chart */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/70">
              <Users className="h-4 w-4 text-violet-500" />
              Concurrency Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="h-[200px]">
              {isConcurrencyLoading ? (
                <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                  Loading...
                </div>
              ) : concurrencyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={concurrencyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
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
                    <Line
                      type="monotone"
                      dataKey="maxConcurrent"
                      name="Max"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgConcurrent"
                      name="Avg"
                      stroke="#a78bfa"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6">
        {/* Fleet Online Table */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-muted/5 border-b">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/70">
              <Wifi className="h-4 w-4 text-primary" />
              Online Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isSummaryLoading ? (
              <div className="h-[400px] flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                Loading...
              </div>
            ) : summaryData.length === 0 ? (
              <div className="h-[400px] flex items-center justify-center text-[10px] font-bold opacity-20 text-center px-8">
                No online time data in this period
              </div>
            ) : (
              <FleetOnlineTable
                data={summaryData}
                deviceMap={resolvedDeviceMap}
                selectedDeviceId={selectedDeviceId || undefined}
                onSelectDevice={setSelectedDeviceId}
                className="h-[400px] border-0 rounded-none"
              />
            )}
          </CardContent>
        </Card>

        {/* Device Sessions Panel */}
        <div className="space-y-4">
          {selectedDevice ? (
            <>
              {/* Selected Device Header */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none">
                <CardContent className="p-4">
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
                </CardContent>
              </Card>

              {/* Device Sessions */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
                <CardHeader className="p-4 pb-2 bg-muted/5 border-b">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/70">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    Session History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isSessionsLoading ? (
                    <div className="h-[320px] flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                      Loading sessions...
                    </div>
                  ) : sessionsData.length === 0 ? (
                    <div className="h-[320px] flex items-center justify-center text-[10px] font-bold opacity-20">
                      No sessions recorded in this period
                    </div>
                  ) : (
                    <DeviceSessionsTable data={sessionsData} className="h-[400px] border-0 rounded-none" />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none h-full min-h-[400px]">
              <CardContent className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Wifi className="h-12 w-12 mb-3" />
                <p className="text-sm font-bold uppercase">Select a Device</p>
                <p className="text-[10px]">Choose a device from the summary to view detailed sessions</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
