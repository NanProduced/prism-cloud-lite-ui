import { useMemo, useState } from 'react';
import { Download, Calendar, Globe, LayoutDashboard, Wifi, PlayCircle } from 'lucide-react';
import type { PlaybackBucket } from '@/services/telemetryApi';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab, PlaybackTab, FleetUptimeTab } from './analytics/components';
import type { AnalyticsTab } from './analytics/types';
import { useSettingsStore } from '@/store/settingsStore';
import { fromZonedTime } from 'date-fns-tz';

// --- Constants ---

const BUCKETS: { value: PlaybackBucket; label: string }[] = [
  { value: 'HOUR', label: 'Hourly' },
  { value: 'DAY', label: 'Daily' },
  { value: 'WEEK', label: 'Weekly' },
  { value: 'MONTH', label: 'Monthly' },
];

// --- Main Page Component ---

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const { preferences } = useSettingsStore();
  const tz = preferences.timezone || 'UTC';

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
  
  const [bucket, setBucket] = useState<PlaybackBucket>('DAY');

  // 使用用户设置的时区将本地日期字符串转换为 UTC ISO 字符串供 API 使用
  const fromIso = useMemo(() => {
    try {
      // 假设用户输入的日期是该时区的 00:00:00
      const dateTimeStr = `${timeRange.from} 00:00:00`;
      const utcDate = fromZonedTime(dateTimeStr, tz);
      if (isNaN(utcDate.getTime())) throw new Error('Invalid date');
      return utcDate.toISOString();
    } catch (e) {
      console.error('Failed to convert from date:', e);
      return new Date().toISOString();
    }
  }, [timeRange.from, tz]);

  const toIso = useMemo(() => {
    try {
      // 假设用户输入的日期是该时区的 23:59:59.999，或者下一天的 00:00:00
      const [year, month, day] = timeRange.to.split('-').map(Number);
      const nextDay = new Date(year, month - 1, day + 1);
      if (isNaN(nextDay.getTime())) throw new Error('Invalid next day');
      
      const nextDayStr = nextDay.toISOString().split('T')[0];
      const dateTimeStr = `${nextDayStr} 00:00:00`;
      const utcDate = fromZonedTime(dateTimeStr, tz);
      if (isNaN(utcDate.getTime())) throw new Error('Invalid utc date');
      return utcDate.toISOString();
    } catch (e) {
      console.error('Failed to convert to date:', e);
      return new Date().toISOString();
    }
  }, [timeRange.to, tz]);

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
            value="overview"
            className="rounded-md px-4 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background gap-1.5 h-7"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="online-time"
            className="rounded-md px-4 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background gap-1.5 h-7"
          >
            <Wifi className="h-3.5 w-3.5" />
            Online Time
          </TabsTrigger>
          <TabsTrigger
            value="playback"
            className="rounded-md px-4 text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-background gap-1.5 h-7"
          >
            <PlayCircle className="h-3.5 w-3.5" />
            Playback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 min-h-0 mt-0 overflow-auto pr-1">
          <OverviewTab from={fromIso} to={toIso} tz={tz} bucket={bucket} />
        </TabsContent>

        <TabsContent value="online-time" className="flex-1 min-h-0 mt-0 overflow-auto pr-1">
          <FleetUptimeTab from={fromIso} to={toIso} tz={tz} bucket={bucket} />
        </TabsContent>

        <TabsContent value="playback" className="flex-1 min-h-0 mt-0 overflow-auto pr-1">
          <PlaybackTab from={fromIso} to={toIso} tz={tz} bucket={bucket} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

