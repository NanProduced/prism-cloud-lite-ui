import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, MonitorPlay, Clock, Monitor, TrendingUp, AlertCircle } from 'lucide-react';
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
  getProgramsSummary,
  getProgramPlaybackBuckets,
  getProgramPlaybackDevices,
  getLanProgramPlaybackBuckets,
  getLanProgramPlaybackDevices,
  type PlaybackBucket,
  type ProgramPlaySummaryItem,
} from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { PlaybackTopTable } from './PlaybackTopTable';
import { AnalyticsDeviceTable } from '@/components/analytics/AnalyticsDeviceTable';
import { useNavigate } from 'react-router-dom';

interface ProgramTabProps {
  from: string;
  to: string;
  tz: string;
  bucket: PlaybackBucket;
  deviceMap?: Record<string, string>;
  className?: string;
}

export function ProgramTab({ from, to, tz, bucket, deviceMap, className }: ProgramTabProps) {
  const { formatDateTime } = useTimeFormatter();
  const [selectedProgram, setSelectedProgram] = useState<ProgramPlaySummaryItem | null>(null);
  const navigate = useNavigate();
  const masterTableHeight = 'h-[340px] sm:h-[420px] lg:h-[520px]';
  const deviceTableHeight = 'h-[260px] sm:h-[300px]';

  // Query for summary list
  const { data: summaryRes, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['telemetry', 'playback', 'programs', 'summary', from, to],
    queryFn: () => getProgramsSummary({ from, to, limit: 50, sort: 'playSeconds' }),
  });

  const programs = summaryRes?.data || [];

  // Query for selected program trend
  const { data: trendRes, isLoading: isTrendLoading } = useQuery({
    queryKey: [
      'telemetry', 
      'playback', 
      'program', 
      selectedProgram?.lan ? selectedProgram?.lanProgramId : selectedProgram?.programId, 
      selectedProgram?.releaseVersion, 
      from, 
      to, 
      bucket, 
      tz
    ],
    queryFn: () => {
      if (selectedProgram!.lan) {
        return getLanProgramPlaybackBuckets({
          lanProgramId: selectedProgram!.lanProgramId!,
          from,
          to,
          tz,
          bucket,
        });
      }
      return getProgramPlaybackBuckets({
        programId: selectedProgram!.programId!,
        version: selectedProgram!.releaseVersion?.toString() || '1',
        from,
        to,
        tz,
        bucket,
      });
    },
    enabled: !!selectedProgram,
  });

  const trendData = trendRes?.data || [];

  // Query for selected program device distribution
  const { data: devicesRes, isLoading: isDevicesLoading } = useQuery({
    queryKey: [
      'telemetry', 
      'playback', 
      'program', 
      selectedProgram?.lan ? selectedProgram?.lanProgramId : selectedProgram?.programId, 
      selectedProgram?.lan ? 'LAN' : selectedProgram?.releaseVersion,
      'devices', 
      from, 
      to
    ],
    queryFn: () => {
      if (selectedProgram!.lan) {
        return getLanProgramPlaybackDevices({
          lanProgramId: selectedProgram!.lanProgramId!,
          from,
          to,
          limit: 10,
        });
      }
      return getProgramPlaybackDevices({
        programId: selectedProgram!.programId!,
        version: selectedProgram!.releaseVersion?.toString() || '1',
        from,
        to,
        limit: 10,
      });
    },
    enabled: !!selectedProgram,
  });

  const deviceData = devicesRes?.data || [];

  const openDevice = (deviceId: string) => {
    if (!deviceMap?.[deviceId]) return;
    navigate(`/dashboard/devices/${deviceId}`);
  };

  // Auto-select first program
  useEffect(() => {
    if (!selectedProgram && programs.length > 0) {
      setSelectedProgram(programs[0]);
    }
  }, [programs, selectedProgram]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        {/* LEFT: Master Table */}
        <div className="min-w-0">
          <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="p-4 pb-2 bg-muted/5 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground/80">
                <Layers className="h-4 w-4 text-primary" />
                Program Analytics Summary
              </CardTitle>
              <div className="text-[10px] font-medium text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full">
                {programs.length} Programs Tracked
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isSummaryLoading ? (
                <div className={cn(masterTableHeight, 'flex items-center justify-center text-[10px] font-bold opacity-20 italic')}>
                  Loading...
                </div>
              ) : programs.length === 0 ? (
                <div className={cn(masterTableHeight, 'flex items-center justify-center text-[10px] font-bold opacity-20 text-center px-8')}>
                  No program playback data
                </div>
              ) : (
                <PlaybackTopTable
                  data={programs.map(p => ({
                    id: p.lan ? p.lanProgramId! : p.programId!,
                    name: p.programName,
                    playCount: p.playCount,
                    playSeconds: p.playSeconds,
                    version: p.releaseVersion?.toString()
                  }))}
                  type="program"
                  selectedId={selectedProgram?.lan ? selectedProgram?.lanProgramId : selectedProgram?.programId}
                  onSelect={(item) => {
                    const p = programs.find(p => (p.lan ? p.lanProgramId : p.programId) === item.id);
                    if (p) setSelectedProgram(p);
                  }}
                  className={cn(masterTableHeight, 'border-0 rounded-none')}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="min-w-0 flex flex-col gap-4">
          {selectedProgram ? (
            <>
              {/* Context Header */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm bg-muted/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Layers className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate max-w-[250px]">
                          {selectedProgram.programName}
                        </p>
                      </div>
                    </div>
                    {selectedProgram.lan && (
                      <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/5 text-amber-600 border-amber-200">
                        LAN
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-[10px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Playback Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="h-[150px]">
                    {isTrendLoading ? (
                      <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20">
                        Loading...
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorProgramTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                          />
                          <Area type="monotone" dataKey="playCount" name="Plays" stroke="#6366f1" strokeWidth={2} fill="url(#colorProgramTrend)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Device Distribution */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="p-4 pb-2 bg-muted/5 border-b">
                  <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground/80">
                    <Monitor className="h-4 w-4 text-primary" />
                    Device Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isDevicesLoading ? (
                    <div className={cn(deviceTableHeight, 'flex items-center justify-center text-[10px] font-bold opacity-20')}>
                      Loading...
                    </div>
                  ) : (
                    <AnalyticsDeviceTable
                      data={deviceData}
                      deviceMap={deviceMap}
                      onOpenDevice={openDevice}
                      className={cn(deviceTableHeight, 'border-0 rounded-none')}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed rounded-3xl p-8 bg-muted/5">
              <Layers className="h-12 w-12 mb-3" />
              <p className="text-xs font-bold tracking-widest">Select a program</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
