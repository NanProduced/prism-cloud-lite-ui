import { useMemo, useState } from 'react';
import { Wifi, Layers, Film, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { addDays, subDays } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { getDevices } from '@/services/deviceApi';
import { ExportDialog } from '@/components/shared/ExportDialog';
import { ExportType } from '@/types/export';
import type { PlaybackBucket, ProgramPlaySummaryItem, MediaPlaySummaryItem } from '@/services/telemetryApi';
import type { Device } from '@/types/device';
import type { AnalyticsTab } from './analytics/types';
import { DeviceUptimeTab, ProgramTab, MediaTab } from './analytics/components';

// --- Constants ---

const getBuckets = (t: any): { value: PlaybackBucket; label: string }[] => [
  { value: 'HOUR', label: t('analytics.buckets.HOUR') },
  { value: 'DAY', label: t('analytics.buckets.DAY') },
  { value: 'WEEK', label: t('analytics.buckets.WEEK') },
  { value: 'MONTH', label: t('analytics.buckets.MONTH') },
];

// --- Internal Components ---

function BucketSelector({ value, onChange }: { value: PlaybackBucket; onChange: (v: PlaybackBucket) => void }) {
  const { t } = useTranslation();
  const buckets = getBuckets(t);
  return (
    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border shadow-sm">
      {buckets.map((b) => (
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('online-time');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const { preferences } = useSettingsStore();
  const tz = preferences.timezone || 'UTC';

  // Selection states lifted from sub-tabs
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<ProgramPlaySummaryItem | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaPlaySummaryItem | null>(null);

  const { data: devicesRes, isLoading: isDevicesLoading } = useQuery({
    queryKey: ['devices', 'list'],
    queryFn: () => getDevices(),
  });

  const deviceMap = useMemo(() => {
    if (isDevicesLoading) return undefined;
    if (!Array.isArray(devicesRes?.data)) return undefined;
    const map: Record<string, Device> = {};
    devicesRes.data.forEach((d) => {
      map[String(d.deviceId)] = d;
      if (d.id) map[d.id] = d;
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

  const exportConfig = useMemo(() => {
    switch (activeTab) {
      case 'online-time': 
        return {
          type: ExportType.DEVICE_ONLINE_SESSIONS,
          selectedId: selectedDeviceId || undefined,
          selectedName: selectedDeviceId ? (deviceMap?.[selectedDeviceId]?.deviceName || selectedDeviceId) : undefined
        };
      case 'programs':
        return {
          type: ExportType.PROGRAM_PLAY_SESSIONS,
          selectedId: selectedProgram ? (selectedProgram.lan ? selectedProgram.lanProgramId : selectedProgram.programId) : undefined,
          selectedName: selectedProgram?.programName
        };
      case 'media':
        return {
          type: ExportType.MEDIA_PLAY_SESSIONS,
          selectedId: selectedMedia?.mediaId,
          selectedName: selectedMedia?.mediaTitle
        };
      default:
        return { type: ExportType.DEVICE_ONLINE_SESSIONS };
    }
  }, [activeTab, selectedDeviceId, selectedProgram, selectedMedia, deviceMap]);

  return (
    <div className="flex flex-col gap-4 p-6 h-full">
      {/* GLOBAL CONTROLS / TOOLBAR */}
      <div className="flex items-center gap-4 flex-wrap bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-xl p-2 px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <DateRangePicker
            value={timeRange}
            onChange={(val) => setTimeRange(val)}
            showTime={false}
          />
        </div>
        <Separator orientation="vertical" className="h-8 mx-2" />
        <div className="flex items-center gap-2 ml-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 rounded-lg font-bold text-xs gap-2 border-primary/20 hover:bg-primary/5 text-primary transition-all shadow-sm"
            onClick={() => setIsExportDialogOpen(true)}
          >
            <Download className="h-3.5 w-3.5" />
            {t('analytics.common.exportAll')}
          </Button>
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
              {t('analytics.tabs.onlineTime')}
            </TabsTrigger>
            <TabsTrigger
              value="programs"
              className="rounded-md px-4 text-xs font-semibold data-[state=active]:bg-background gap-1.5 h-7"
            >
              <Layers className="h-3.5 w-3.5" />
              {t('analytics.tabs.programs')}
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-md px-4 text-xs font-semibold data-[state=active]:bg-background gap-1.5 h-7"
            >
              <Film className="h-3.5 w-3.5" />
              {t('analytics.tabs.media')}
            </TabsTrigger>
          </TabsList>

          <BucketSelector value={bucket} onChange={setBucket} />
        </div>

        <TabsContent value="online-time" className="flex-1 min-h-0 mt-0 overflow-x-hidden overflow-y-auto pr-1">
          <DeviceUptimeTab 
            from={fromIso} 
            to={toIso} 
            tz={tz} 
            bucket={bucket} 
            deviceMap={deviceMap} 
            selectedDeviceId={selectedDeviceId}
            onSelectDeviceId={setSelectedDeviceId}
          />
        </TabsContent>
 
        <TabsContent value="programs" className="flex-1 min-h-0 mt-0 overflow-x-hidden overflow-y-auto pr-1">
          <ProgramTab 
            from={fromIso} 
            to={toIso} 
            tz={tz} 
            bucket={bucket} 
            deviceMap={deviceMap} 
            selectedProgram={selectedProgram}
            onSelectProgram={setSelectedProgram}
          />
        </TabsContent>
 
        <TabsContent value="media" className="flex-1 min-h-0 mt-0 overflow-x-hidden overflow-y-auto pr-1">
          <MediaTab 
            from={fromIso} 
            to={toIso} 
            tz={tz} 
            bucket={bucket} 
            deviceMap={deviceMap} 
            selectedMedia={selectedMedia}
            onSelectMedia={setSelectedMedia}
          />
        </TabsContent>
      </Tabs>

      <ExportDialog 
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        type={exportConfig.type}
        filters={{
          from: fromIso,
          to: toIso
        }}
        selectedId={exportConfig.selectedId}
        selectedName={exportConfig.selectedName}
      />
    </div>
  );
}