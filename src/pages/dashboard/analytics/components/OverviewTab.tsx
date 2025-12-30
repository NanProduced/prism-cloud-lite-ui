import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Play, 
  Clock, 
  Users, 
  TrendingUp, 
  MonitorSmartphone,
  Layers,
  Film
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getPlaybackOverview, 
  getActiveDeviceCountBuckets, 
  getConcurrencyBuckets,
  type PlaybackBucket 
} from '@/services/telemetryApi';
import { PlaybackTopTable } from './PlaybackTopTable';
import { cn } from '@/lib/utils';

interface OverviewTabProps {
  from: string;
  to: string;
  tz: string;
  bucket: PlaybackBucket;
  className?: string;
}

export function OverviewTab({ from, to, tz, bucket, className }: OverviewTabProps) {
  // 1. Playback Overview (Total KPI + Top 10)
  const { data: playbackOverviewRes, isLoading: isPlaybackLoading } = useQuery({
    queryKey: ['telemetry', 'playback', 'overview', from, to],
    queryFn: () => getPlaybackOverview({ from, to, top: 10 }),
  });

  const playbackOverview = playbackOverviewRes?.data;

  // 2. Active Devices (from buckets)
  const { data: activeCountRes } = useQuery({
    queryKey: ['telemetry', 'online-time', 'active-count', from, to, bucket, tz],
    queryFn: () => getActiveDeviceCountBuckets({ from, to, tz, bucket }),
  });

  const activeDevices = useMemo(() => {
    const buckets = activeCountRes?.data || [];
    if (buckets.length === 0) return 0;
    // Use the last bucket as current active count indicator
    return buckets[buckets.length - 1].activeCount || 0;
  }, [activeCountRes]);

  // 3. Concurrency (Peak/Avg)
  const { data: concurrencyRes } = useQuery({
    queryKey: ['telemetry', 'online-time', 'concurrency', from, to, bucket, tz],
    queryFn: () => getConcurrencyBuckets({ from, to, tz, bucket }),
  });

  const concurrencyKpis = useMemo(() => {
    const buckets = concurrencyRes?.data || [];
    if (buckets.length === 0) return { peak: 0, avg: 0 };
    
    const peak = buckets.reduce((max: number, b: any) => Math.max(max, b.maxConcurrent || 0), 0);
    const avg = Math.round(buckets.reduce((sum: number, b: any) => sum + (b.avgConcurrent || 0), 0) / buckets.length);
    
    return { peak, avg };
  }, [concurrencyRes]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    if (hours > 1000) return `${(hours / 1000).toFixed(1)}k hrs`;
    return `${hours.toLocaleString()} hrs`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Devices */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-emerald-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <MonitorSmartphone className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Devices</p>
                <p className="text-2xl font-bold tracking-tighter tabular-nums">{activeDevices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Concurrency */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-violet-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-violet-500/10">
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Peak Concurrency</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold tracking-tighter tabular-nums">{concurrencyKpis.peak}</p>
                  <span className="text-[10px] text-muted-foreground font-bold italic">AVG: {concurrencyKpis.avg}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Playback Duration */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-sky-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-500/10">
                <Clock className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Air Time</p>
                <p className="text-2xl font-bold tracking-tighter tabular-nums">
                  {formatDuration(playbackOverview?.totalSeconds || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Play Count */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <div className="h-1 w-full bg-amber-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Play className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Plays</p>
                <p className="text-2xl font-bold tracking-tighter tabular-nums">
                  {(playbackOverview?.totalCount || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TOP 10 SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Programs */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-muted/5 border-b flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Top 10 Programs
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground/30" />
          </CardHeader>
          <CardContent className="p-0">
            {isPlaybackLoading ? (
               <div className="h-[400px] flex items-center justify-center text-[10px] font-bold opacity-20 italic">LOADING TOP PROGRAMS...</div>
            ) : (
              <PlaybackTopTable 
                data={playbackOverview?.topPrograms.map(p => ({
                  id: p.id,
                  name: p.name,
                  playCount: p.playCount,
                  playSeconds: p.playSeconds,
                  version: p.version
                })) || []} 
                type="program" 
                className="border-0 rounded-none h-[400px]"
              />
            )}
          </CardContent>
        </Card>

        {/* Top Media */}
        <Card className="rounded-2xl border-none ring-1 ring-muted shadow-none overflow-hidden">
          <CardHeader className="p-4 pb-2 bg-muted/5 border-b flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" />
              Top 10 Media Assets
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground/30" />
          </CardHeader>
          <CardContent className="p-0">
            {isPlaybackLoading ? (
               <div className="h-[400px] flex items-center justify-center text-[10px] font-bold opacity-20 italic">LOADING TOP MEDIA...</div>
            ) : (
              <PlaybackTopTable 
                data={playbackOverview?.topMedia.map(m => ({
                  id: m.id,
                  name: m.name,
                  playCount: m.playCount,
                  playSeconds: m.playSeconds
                })) || []} 
                type="media" 
                className="border-0 rounded-none h-[400px]"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
