import { useMemo, useState } from 'react';
import { Globe, Wifi, Layers, Film } from 'lucide-react';
import type { PlaybackBucket } from '@/services/telemetryApi';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FleetUptimeTab, ProgramTab, MediaTab } from './analytics/components';
import type { AnalyticsTab } from './analytics/types';
import { useSettingsStore } from '@/store/settingsStore';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { addDays, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { getDevices } from '@/services/deviceApi';

// --- Constants ---

const BUCKETS: { value: PlaybackBucket; label: string }[] = [
  { value: 'HOUR', label: 'Hourly' },
  { value: 'DAY', label: 'Daily' },
  { value: 'WEEK', label: 'Weekly' },
  { value: 'MONTH', label: 'Monthly' },
];

// --- Internal Components ---

function BucketSelector({ value, onChange }: { value: PlaybackBucket; onChange: (v: PlaybackBucket) => void }) {
  return (
    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border shadow-sm">
      {BUCKETS.map((b) => (
        <Button
          key={b.value}
          variant={value === b.value ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            'h-7 text-[10px] font-bold tracking-wider rounded-md px-3 transition-all',
            value === b.value ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(b.value)}
        >
          {b.label}
        </Button>
      ))}
    </div>
  );
}

// --- Main Page Component ---

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('online-time');
  const { preferences } = useSettingsStore();
  const tz = preferences.timezone || 'UTC';

  const { data: devicesRes, isLoading: isDevicesLoading } = useQuery({
    queryKey: ['devices', 'list'],
    queryFn: () => getDevices(),
  });

  const deviceMap = useMemo(() => {
    if (isDevicesLoading) return undefined;
    if (!Array.isArray(devicesRes?.data)) return undefined;
    const map: Record<string, string> = {};
    devicesRes.data.forEach((d) => {
      map[String(d.deviceId)] = d.deviceName;
    });
    return map;
  }, [devicesRes, isDevicesLoading]);

  // Global Controls
  const [timeRange, setTimeRange] = useState(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const today = now;
    return {
      from: formatInTimeZone(weekAgo, tz, 'yyyy-MM-dd'),
      to: formatInTimeZone(today, tz, 'yyyy-MM-dd'),
    };
  });
  
  const [bucket, setBucket] = useState<PlaybackBucket>('DAY');

  const toUtcIso = (date: string, time: string) => {
    const utcDate = fromZonedTime(`${date} ${time}`, tz);
    if (isNaN(utcDate.getTime())) throw new Error('Invalid date conversion');
    return utcDate.toISOString();
  };

  // Convert local date strings (in tz) to UTC ISO strings for API usage.
  const fromIso = useMemo(() => {
    try {
      return toUtcIso(timeRange.from, '00:00:00');
    } catch (e) {
      console.error('Failed to convert from date:', e);
      return new Date().toISOString();
    }
  }, [timeRange.from, tz]);

  const toIso = useMemo(() => {
    try {
      const start = fromZonedTime(`${timeRange.to} 00:00:00`, tz);
      return addDays(start, 1).toISOString();
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
          <DateRangePicker
            value={timeRange}
            onChange={(val) => setTimeRange(val)}
            showTime={false}
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{tz}</span>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AnalyticsTab)}
        className="space-y-4 flex-1 flex flex-col min-h-0"
      >
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/40 p-1 rounded-lg border shadow-inner w-fit h-9">
            <TabsTrigger
              value="online-time"
              className="rounded-md px-4 text-xs font-semibold data-[state=active]:bg-background gap-1.5 h-7"
            >
              <Wifi className="h-3.5 w-3.5" />
              Online Time
            </TabsTrigger>
            <TabsTrigger
              value="programs"
              className="rounded-md px-4 text-xs font-semibold data-[state=active]:bg-background gap-1.5 h-7"
            >
              <Layers className="h-3.5 w-3.5" />
              Programs
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-md px-4 text-xs font-semibold data-[state=active]:bg-background gap-1.5 h-7"
            >
              <Film className="h-3.5 w-3.5" />
              Media
            </TabsTrigger>
          </TabsList>

          <BucketSelector value={bucket} onChange={setBucket} />
        </div>

        <TabsContent value="online-time" className="flex-1 min-h-0 mt-0 overflow-x-hidden overflow-y-auto pr-1">
          <FleetUptimeTab from={fromIso} to={toIso} tz={tz} bucket={bucket} deviceMap={deviceMap} />
        </TabsContent>
 
        <TabsContent value="programs" className="flex-1 min-h-0 mt-0 overflow-x-hidden overflow-y-auto pr-1">
          <ProgramTab from={fromIso} to={toIso} tz={tz} bucket={bucket} deviceMap={deviceMap} />
        </TabsContent>
 
        <TabsContent value="media" className="flex-1 min-h-0 mt-0 overflow-x-hidden overflow-y-auto pr-1">
          <MediaTab from={fromIso} to={toIso} tz={tz} bucket={bucket} deviceMap={deviceMap} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
