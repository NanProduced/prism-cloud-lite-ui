import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, MonitorPlay, Clock, Monitor, TrendingUp } from 'lucide-react';
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
  getMediaSummary,
  getMediaPlaybackBuckets,
  getMediaPlaybackDevices,
  type PlaybackBucket,
  type MediaSummaryItem,
} from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { PlaybackTopTable } from './PlaybackTopTable';
import { AnalyticsDeviceTable } from '@/components/analytics/AnalyticsDeviceTable';

interface MediaTabProps {
  from: string;
  to: string;
  tz: string;
  bucket: PlaybackBucket;
  className?: string;
}

export function MediaTab({ from, to, tz, bucket, className }: MediaTabProps) {
  const { formatDateTime } = useTimeFormatter();
  const [selectedMedia, setSelectedMedia] = useState<MediaSummaryItem | null>(null);

  // Query for summary list
  const { data: summaryRes, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['telemetry', 'playback', 'media', 'summary', from, to],
    queryFn: () => getMediaSummary({ from, to, limit: 50, sort: 'playSeconds' }),
  });

  const mediaList = summaryRes?.data?.items || [];

  // Query for selected media trend
  const { data: trendRes, isLoading: isTrendLoading } = useQuery({
    queryKey: ['telemetry', 'playback', 'media', selectedMedia?.mediaId, from, to, bucket, tz],
    queryFn: () =>
      getMediaPlaybackBuckets({
        mediaId: selectedMedia!.mediaId,
        from,
        to,
        tz,
        bucket,
      }),
    enabled: !!selectedMedia,
  });

  const trendData = trendRes?.data || [];

  // Query for selected media device distribution
  const { data: devicesRes, isLoading: isDevicesLoading } = useQuery({
    queryKey: ['telemetry', 'playback', 'media', selectedMedia?.mediaId, 'devices', from, to],
    queryFn: () =>
      getMediaPlaybackDevices({
        mediaId: selectedMedia!.mediaId,
        from,
        to,
        limit: 10,
      }),
    enabled: !!selectedMedia,
  });

  const deviceData = devicesRes?.data || [];

  // Auto-select first media
  useMemo(() => {
    if (!selectedMedia && mediaList.length > 0) {
      setSelectedMedia(mediaList[0]);
    }
  }, [mediaList, selectedMedia]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Summary Table */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-muted/5 border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
              <Film className="h-4 w-4 text-primary" />
              Media Analytics Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PlaybackTopTable
              data={mediaList.map(m => ({
                id: m.mediaId,
                name: m.name,
                playCount: m.playCount,
                playSeconds: m.playSeconds
              }))}
              type="media"
              selectedId={selectedMedia?.mediaId}
              onSelect={(item) => {
                const m = mediaList.find(m => m.mediaId === item.id);
                if (m) setSelectedMedia(m);
              }}
              className="h-[500px] border-0 rounded-none"
            />
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedMedia ? (
            <>
              {/* Selected Media Header */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pink-500/10">
                        <Film className="h-4 w-4 text-pink-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate max-w-[250px]">
                          {selectedMedia.name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          ID: {selectedMedia.mediaId} | Type: {selectedMedia.type}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                    <TrendingUp className="h-4 w-4 text-pink-500" />
                    Playback Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="h-[200px]">
                    {isTrendLoading ? (
                      <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                        LOADING TREND...
                      </div>
                    ) : trendData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[10px] font-bold opacity-20 italic text-center px-8">
                        No trend data available for this period
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="colorMediaTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
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
                            stroke="#ec4899"
                            strokeWidth={2}
                            fill="url(#colorMediaTrend)"
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
                  <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-foreground/70">
                    <Monitor className="h-4 w-4 text-pink-500" />
                    Device Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isDevicesLoading ? (
                    <div className="h-[150px] flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                      LOADING DEVICES...
                    </div>
                  ) : deviceData.length === 0 ? (
                    <div className="h-[150px] flex items-center justify-center text-[10px] font-bold opacity-20 italic">
                      No device distribution recorded
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
                <Film className="h-12 w-12 mb-3" />
                <p className="text-sm font-bold uppercase">Select a Media Asset</p>
                <p className="text-[10px]">Choose a media item from the list to view telemetry details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
