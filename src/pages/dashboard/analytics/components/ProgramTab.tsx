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
  const resolvedDeviceMap = deviceMap ?? {};

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
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Programs Summary Table */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-muted/5 border-b">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/70">
              <Layers className="h-4 w-4 text-primary" />
              Program Analytics Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isSummaryLoading ? (
              <div className="h-[320px] flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                Loading...
              </div>
            ) : programs.length === 0 ? (
              <div className="h-[320px] flex items-center justify-center text-[10px] font-bold opacity-20 text-center px-8">
                No program playback data in this period
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
                className="h-[320px] border-0 rounded-none"
              />
            )}
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
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate max-w-[250px]">
                          {selectedProgram.programName}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          ID: {selectedProgram.lan ? selectedProgram.lanProgramId : selectedProgram.programId}
                          {selectedProgram.releaseVersion && ` v${selectedProgram.releaseVersion}`}
                        </p>
                      </div>
                    </div>
                    {selectedProgram.lan && (
                      <Badge variant="outline" className="text-[9px] font-bold h-5 px-2 bg-amber-500/5 text-amber-600 border-amber-200">
                        LAN PROGRAM
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* LAN Safeguard Message */}
              {selectedProgram.lan && (
                <div className="p-3 bg-amber-500/5 border border-amber-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                    This is a LAN-distributed program. Platform-side metadata and detail pages are not available. 
                    Drill-down is limited to telemetry statistics only.
                  </p>
                </div>
              )}

              {/* Trend Chart */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/70">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Playback Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="h-[200px]">
                    {isTrendLoading ? (
                      <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                        Loading trend...
                      </div>
                    ) : trendData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20 italic text-center px-8">
                        No trend data available for this period
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
                            dataKey="playCount"
                            name="Plays"
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
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
                <CardHeader className="p-4 pb-2 bg-muted/5 border-b">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground/70">
                    <Monitor className="h-4 w-4 text-primary" />
                    Device Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isDevicesLoading ? (
                    <div className="h-[150px] flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                      Loading devices...
                    </div>
                  ) : deviceData.length === 0 ? (
                    <div className="h-[150px] flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                      No device distribution recorded
                    </div>
                  ) : (
                    <AnalyticsDeviceTable
                      data={deviceData}
                      deviceMap={resolvedDeviceMap}
                      className="h-[180px] border-0 rounded-none"
                    />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none h-full min-h-[400px]">
              <CardContent className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Layers className="h-12 w-12 mb-3" />
                <p className="text-sm font-bold uppercase">Select a Program</p>
                <p className="text-[10px]">Choose a program from the list to view telemetry details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
