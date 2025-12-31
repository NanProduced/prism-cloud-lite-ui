import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPlaybackOverview } from '@/services/telemetryApi';
import { PlayCircle, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const PlaybackOverviewWidget = () => {
  const { data: playbackRes, isLoading } = useQuery({
    queryKey: ['telemetry', 'playback-overview'],
    queryFn: () => getPlaybackOverview({
      from: new Date(Date.now() - 7 * 86400000).toISOString(),
      to: new Date().toISOString(),
      top: 5
    }),
  });

  const topPrograms = useMemo(() => {
    if (!playbackRes?.data?.topPrograms) return [];
    const total = playbackRes.data.programTotal?.playSeconds || 1;
    return playbackRes.data.topPrograms.map(p => ({
      name: p.programName,
      percent: Math.round((p.playSeconds / total) * 100),
      playCount: p.playCount
    }));
  }, [playbackRes]);

  if (isLoading) return <div className="h-full bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold text-muted-foreground uppercase">Top Programs (7D)</div>
        <Award className="h-3.5 w-3.5 text-amber-500" />
      </div>
      
      <div className="space-y-3 flex-1 overflow-auto">
        {topPrograms.map((program) => (
          <div key={program.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold truncate pr-2">{program.name}</span>
              <span className="text-muted-foreground">{program.percent}%</span>
            </div>
            <Progress value={program.percent} className="h-1" />
          </div>
        ))}
        {topPrograms.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <PlayCircle className="h-8 w-8 mb-2" />
            <span className="text-xs">No data available</span>
          </div>
        )}
      </div>
    </div>
  );
};
