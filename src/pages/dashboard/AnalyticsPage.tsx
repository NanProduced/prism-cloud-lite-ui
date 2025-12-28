import { useMemo, useState } from 'react';
import { Download, Calendar, Globe, Layers, Film, Wifi } from 'lucide-react';
import type { PlaybackBucket } from '@/services/telemetryApi';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
  const [timeRange, setTimeRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [tz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [bucket, setBucket] = useState<PlaybackBucket>('DAY');

  const fromIso = useMemo(() => new Date(timeRange.from).toISOString(), [timeRange.from]);
  const toIso = useMemo(() => new Date(timeRange.to).toISOString(), [timeRange.to]);

  return (
    <div className="flex flex-col gap-4 p-6 h-full">
      {/* GLOBAL CONTROLS */}
      <div className="flex items-center gap-4 flex-wrap bg-card border rounded-[1.5rem] p-3 px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={timeRange.from}
              onChange={(e) => setTimeRange((prev) => ({ ...prev, from: e.target.value }))}
              className="h-8 w-32 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0"
            />
            <span className="text-[10px] font-bold opacity-30">TO</span>
            <Input
              type="date"
              value={timeRange.to}
              onChange={(e) => setTimeRange((prev) => ({ ...prev, to: e.target.value }))}
              className="h-8 w-32 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0"
            />
          </div>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-tight">{tz}</span>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          {BUCKETS.map((b) => (
            <Button
              key={b.value}
              variant={bucket === b.value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-[9px] font-bold rounded-md px-3"
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
            className="h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest px-6 shadow-xl shadow-primary/20 gap-2"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AnalyticsTab)}
        className="space-y-6 flex-1 flex flex-col min-h-0"
      >
        <TabsList className="bg-muted/40 p-1 rounded-xl border shadow-inner w-fit">
          <TabsTrigger
            value="program"
            className="rounded-lg px-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-background gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            Program
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="rounded-lg px-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-background gap-1.5"
          >
            <Film className="h-3.5 w-3.5" />
            Media
          </TabsTrigger>
          <TabsTrigger
            value="fleet"
            className="rounded-lg px-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-background gap-1.5"
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
