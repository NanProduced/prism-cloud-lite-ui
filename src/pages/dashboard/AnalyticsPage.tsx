import { useMemo, useState } from 'react';
import { Download, Calendar, Globe, Layers, Film, Wifi } from 'lucide-react';
import type { PlaybackBucket } from '@/services/telemetryApi';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgramTab, MediaTab, FleetUptimeTab } from './analytics/components';
import type { AnalyticsTab } from './analytics/types';

// --- Constants ---

const BUCKETS: { value: PlaybackBucket; label: string }[] = [
  { value: 'HOUR', label: 'Hourly' },
  { value: 'DAY', label: 'Daily' },
  { value: 'WEEK', label: 'Weekly' },
  { value: 'MONTH', label: 'Monthly' },
];

// --- Main Page Component ---

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('program');

  // Global Controls
  const [timeRange, setTimeRange] = useState(() => {
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      from: weekAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  });
  const [tz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [bucket, setBucket] = useState<PlaybackBucket>('DAY');

  // 修复时区问题：将本地日期转换为本地时区的 start/end of day
  // 然后转换为 UTC ISO 字符串供 API 使用
  const fromIso = useMemo(() => {
    // 解析本地日期字符串，创建本地 00:00:00
    const [year, month, day] = timeRange.from.split('-').map(Number);
    const localStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    return localStart.toISOString();
  }, [timeRange.from]);

  const toIso = useMemo(() => {
    // 解析本地日期字符串，创建本地 23:59:59.999（或下一天 00:00:00）
    const [year, month, day] = timeRange.to.split('-').map(Number);
    // 使用下一天的 00:00:00 作为 exclusive end
    const localEnd = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
    return localEnd.toISOString();
  }, [timeRange.to]);

  return (
    <div className="flex flex-col gap-4 p-6 h-full">
      {/* GLOBAL CONTROLS / TOOLBAR */}
      <div className="flex items-center gap-4 flex-wrap bg-card border rounded-lg p-2 px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-md px-2 py-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={timeRange.from}
                onChange={(e) => setTimeRange((prev) => ({ ...prev, from: e.target.value }))}
                className="bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 outline-none w-24"
              />
              <span className="text-[10px] font-bold opacity-30 px-1">TO</span>
              <input
                type="date"
                value={timeRange.to}
                onChange={(e) => setTimeRange((prev) => ({ ...prev, to: e.target.value }))}
                className="bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 outline-none w-24"
              />
            </div>
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">{tz}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md ml-4">
          {BUCKETS.map((b) => (
            <Button
              key={b.value}
              variant={bucket === b.value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 text-[9px] font-bold rounded-sm px-2.5"
              onClick={() => setBucket(b.value)}
            >
              {b.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="default"
            size="sm"
            className="h-8 rounded-md font-bold text-[10px] uppercase tracking-wider px-4 gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AnalyticsTab)}
        className="space-y-4 flex-1 flex flex-col min-h-0"
      >
        <TabsList className="bg-muted/40 p-1 rounded-lg border shadow-inner w-fit h-9">
          <TabsTrigger
            value="program"
            className="rounded-md px-4 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background gap-1.5 h-7"
          >
            <Layers className="h-3.5 w-3.5" />
            Program
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="rounded-md px-4 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background gap-1.5 h-7"
          >
            <Film className="h-3.5 w-3.5" />
            Media
          </TabsTrigger>
          <TabsTrigger
            value="fleet"
            className="rounded-md px-4 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background gap-1.5 h-7"
          >
            <Wifi className="h-3.5 w-3.5" />
            Fleet Uptime
          </TabsTrigger>
        </TabsList>

        <TabsContent value="program" className="flex-1 min-h-0 mt-0 overflow-auto pr-1">
          <ProgramTab from={fromIso} to={toIso} tz={tz} bucket={bucket} />
        </TabsContent>

        <TabsContent value="media" className="flex-1 min-h-0 mt-0 overflow-auto pr-1">
          <MediaTab from={fromIso} to={toIso} tz={tz} bucket={bucket} />
        </TabsContent>

        <TabsContent value="fleet" className="flex-1 min-h-0 mt-0 overflow-auto pr-1">
          <FleetUptimeTab from={fromIso} to={toIso} tz={tz} bucket={bucket} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

