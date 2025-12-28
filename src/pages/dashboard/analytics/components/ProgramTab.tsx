import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, MonitorPlay, Clock, Monitor, TrendingUp } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import {
  getPlaybackOverview,
  getProgramPlaybackBuckets,
  getProgramPlaybackDevices,
  type PlaybackBucket,
} from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { PlaybackTopTable } from './PlaybackTopTable';
import { AnalyticsDeviceTable } from '@/components/analytics/AnalyticsDeviceTable';
import type { TopPlaybackItem } from '../types';

interface ProgramTabProps {
  from: string;
  to: string;
  tz: string;
  bucket: PlaybackBucket;
  className?: string;
}

export function ProgramTab({ from, to, tz, bucket, className }: ProgramTabProps) {
  const { formatDateTime } = useTimeFormatter();
  const [selectedProgram, setSelectedProgram] = useState<TopPlaybackItem | null>(null);

  // Query for overview
  const { data: overviewRes, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['telemetry', 'playback', 'overview', from, to],
    queryFn: () => getPlaybackOverview({ from, to }),
  });

  const overview = overviewRes?.data;
  const topPrograms = overview?.topPrograms || [];

  // Query for selected program trend
  const { data: trendRes, isLoading: isTrendLoading } = useQuery({
    queryKey: ['telemetry', 'playback', 'program', selectedProgram?.id, selectedProgram?.version, from, to, bucket],
    queryFn: () =>
      getProgramPlaybackBuckets({
        programId: selectedProgram!.id,
        version: selectedProgram!.version || '1',
        from,
        to,
        tz,
        bucket,
      }),
    enabled: !!selectedProgram,
  });

  const trendData = trendRes?.data || [];

  // Query for selected program device distribution
  const { data: devicesRes, isLoading: isDevicesLoading } = useQuery({
    queryKey: ['telemetry', 'playback', 'program', selectedProgram?.id, 'devices', from, to],
    queryFn: () =>
      getProgramPlaybackDevices({
        programId: selectedProgram!.id,
        version: selectedProgram!.version || '1',
        from,
        to,
        limit: 10,
      }),
    enabled: !!selectedProgram,
  });

  const deviceData = devicesRes?.data || [];

  // Auto-select first program
  useMemo(() => {
    if (!selectedProgram && topPrograms.length > 0) {
      setSelectedProgram(topPrograms[0]);
    }
  }, [topPrograms, selectedProgram]);

  // KPI calculations
  const kpis = useMemo(() => {
    if (!overview) return { totalCount: 0, totalSeconds: 0, uniquePrograms: 0 };
    return {
      totalCount: overview.totalCount || 0,
      totalSeconds: overview.totalSeconds || 0,
      uniquePrograms: topPrograms.length,
    };
  }, [overview, topPrograms]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-indigo-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10">
                <MonitorPlay className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Total Plays
                </p>
                <p className="text-2xl font-bold tracking-tighter tabular-nums">
                  {kpis.totalCount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-pink-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-pink-500/10">
                <Clock className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Total Air Time
                </p>
                <p className="text-2xl font-bold tracking-tighter tabular-nums">
                  {formatDuration(kpis.totalSeconds)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-emerald-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Layers className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Active Programs
                </p>
                <p className="text-2xl font-bold tracking-tighter tabular-nums">
                  {kpis.uniquePrograms}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Programs Table */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-muted/5 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Top Programs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PlaybackTopTable
              data={topPrograms}
              type="program"
              selectedId={selectedProgram?.id}
              onSelect={setSelectedProgram}
              className="h-[400px] border-0 rounded-none"
            />
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedProgram ? (
            <>
              {/* Selected Program Header */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Layers className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate max-w-[200px]">
                          {selectedProgram.name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          ID: {selectedProgram.id}
                          {selectedProgram.version && ` v${selectedProgram.version}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-bold">
                      TOP {topPrograms.findIndex((p) => p.id === selectedProgram.id) + 1}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Playback Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="h-[180px]">
                    {isTrendLoading ? (
                      <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                        LOADING...
                      </div>
                    ) : trendData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                        No trend data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorProgramTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis
                            dataKey="bucketStart"
                            fontSize={9}
                            tickFormatter={(val) =>
                              new Date(val).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                            }
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
                            dataKey="playCount"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="url(#colorProgramTrend)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Device Distribution */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    Device Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isDevicesLoading ? (
                    <div className="h-[150px] flex items-center justify-center text-[10px] font-bold opacity-20">
                      LOADING...
                    </div>
                  ) : deviceData.length === 0 ? (
                    <div className="h-[150px] flex items-center justify-center text-[10px] font-bold opacity-20">
                      No device data available
                    </div>
                  ) : (
                    <AnalyticsDeviceTable data={deviceData} className="h-[150px] border-0 rounded-none" />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none h-full min-h-[400px]">
              <CardContent className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Layers className="h-12 w-12 mb-3" />
                <p className="text-sm font-bold">Select a Program</p>
                <p className="text-[10px]">Choose a program from the list to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
