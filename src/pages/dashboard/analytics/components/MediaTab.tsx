import { useEffect, useMemo, useState } from 'react';
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
  type MediaPlaySummaryItem,
} from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { PlaybackTopTable } from './PlaybackTopTable';
import { AnalyticsDeviceTable } from '@/components/analytics/AnalyticsDeviceTable';

interface MediaTabProps {
  from: string;
  to: string;
  tz: string;
  bucket: PlaybackBucket;
  deviceMap?: Record<string, string>;
  className?: string;
}

export function MediaTab({ from, to, tz, bucket, deviceMap, className }: MediaTabProps) {
  const { formatDateTime } = useTimeFormatter();
  const [selectedMedia, setSelectedMedia] = useState<MediaPlaySummaryItem | null>(null);
  const resolvedDeviceMap = deviceMap ?? {};
  const masterTableHeight = 'h-[340px] sm:h-[420px] lg:h-[520px]';
  const deviceTableHeight = 'h-[260px] sm:h-[300px]';

  // Query for summary list
  const { data: summaryRes, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['telemetry', 'playback', 'media', 'summary', from, to],
    queryFn: () => getMediaSummary({ from, to, limit: 50, sort: 'playSeconds' }),
  });

  const mediaList = summaryRes?.data || [];

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
  useEffect(() => {
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
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        {/* LEFT: Master Table */}
        <div className="min-w-0">
          <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="p-4 pb-2 bg-muted/5 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold flex items-center gap-2 text-foreground/80">
                <Film className="h-4 w-4 text-pink-500" />
                Media Analytics Summary
              </CardTitle>
              <div className="text-[10px] font-medium text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full">
                {mediaList.length} Items Tracked
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isSummaryLoading ? (
                <div className={cn(masterTableHeight, 'flex items-center justify-center text-[10px] font-bold opacity-20 italic')}>
                  Loading...
                </div>
              ) : mediaList.length === 0 ? (
                <div className={cn(masterTableHeight, 'flex items-center justify-center text-[10px] font-bold opacity-20 text-center px-8')}>
                  No media playback data
                </div>
              ) : (
                <PlaybackTopTable
                  data={mediaList.map(m => ({
                    id: m.mediaId,
                    name: m.mediaTitle || 'Unknown Media',
                    playCount: m.playCount,
                    playSeconds: m.playSeconds
                  }))}
                  type="media"
                  selectedId={selectedMedia?.mediaId}
                  onSelect={(item) => {
                    const m = mediaList.find(m => m.mediaId === item.id);
                    if (m) setSelectedMedia(m);
                  }}
                  className={cn(masterTableHeight, 'border-0 rounded-none')}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="min-w-0 flex flex-col gap-4">
          {selectedMedia ? (
            <>
              {/* Context Header */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm bg-muted/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-pink-500/10">
                        <Film className="h-4 w-4 text-pink-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate max-w-[250px]">
                          {selectedMedia.mediaTitle || 'Unknown Media'}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          ID: {selectedMedia.mediaId} | Type: {selectedMedia.itemType}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card className="rounded-2xl border-none ring-1 ring-muted shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-pink-500" />
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
                            <linearGradient id="colorMediaTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
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
                          <Area type="monotone" dataKey="playCount" name="Plays" stroke="#ec4899" strokeWidth={2} fill="url(#colorMediaTrend)" />
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
                    <Monitor className="h-4 w-4 text-pink-500" />
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
                      deviceMap={resolvedDeviceMap}
                      className={cn(deviceTableHeight, 'border-0 rounded-none')}
                    />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 border-2 border-dashed rounded-3xl p-8 bg-muted/5">
              <Film className="h-12 w-12 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Select a Media Asset</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
