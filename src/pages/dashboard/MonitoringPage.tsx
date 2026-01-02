import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Wifi,
  RadioTower,
  EthernetPort,
  RefreshCw,
  AlertTriangle,
  Search,
  Monitor,
  Clock,
  CheckCircle2,
  Cpu,
  Gauge,
} from 'lucide-react';
import { getDevices } from '@/services/deviceApi';
import { type Device, resolveDeviceStatus, type Tag } from '@/types/device';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TagChip } from '@/components/devices/TagChip';
import { cn } from '@/lib/utils';

import type { RealtimeMetric, SSEState } from './monitoring/types';
import { type MonitoringTab } from './monitoring/constants';
import { DeviceSensorTab, M2SensorTab, ReceiveCardTab } from './monitoring/components';
import { useMonitoringSSE } from '@/hooks/use-monitoring-sse';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { DateRangePicker } from '@/components/shared/DateRangePicker';

import { format } from 'date-fns';

function toLocalDateString(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export default function MonitoringPage() {
  const queryClient = useQueryClient();
  const { formatDateTime } = useTimeFormatter();

  // Selection & Filters - 单设备模式，使用 number 类型（契约要求）
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MonitoringTab>('receiveCard');  // 默认显示接收卡Tab

  // History window (applies to history queries & initial preload)
  const [historyDraft, setHistoryDraft] = useState(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      from: toLocalDateString(from),
      to: toLocalDateString(now),
    };
  });
  const [historyApplied, setHistoryApplied] = useState(historyDraft);

  const historyRange = useMemo(() => {
    const fromDate = new Date(historyApplied.from);
    const toDate = new Date(historyApplied.to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return null;
    if (fromDate.getTime() >= toDate.getTime()) return null;
    return { from: fromDate.toISOString(), to: toDate.toISOString() };
  }, [historyApplied.from, historyApplied.to]);

  // --- Queries ---

  const { data: devicesRes, isLoading: isDevicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const devices = useMemo(() => {
    const list = devicesRes?.data || [];
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (d) =>
        d.deviceName.toLowerCase().includes(q) ||
        d.networkType?.toLowerCase().includes(q) ||
        d.tags?.some(t => t.tagName.toLowerCase().includes(q))
    );
  }, [devicesRes, searchQuery]);

  // SSE & Real-time State - 单设备订阅
  const sseState = useMonitoringSSE(selectedDeviceId, historyRange ?? undefined);

  // Default Selection: Prefer online devices, then the first one
  useEffect(() => {
    if (!isDevicesLoading && devices.length > 0 && selectedDeviceId === null) {
      const onlineDevice = devices.find(d => resolveDeviceStatus(d as Device) === 'online');
      if (onlineDevice) {
        setSelectedDeviceId(onlineDevice.deviceId);
      } else {
        setSelectedDeviceId(devices[0].deviceId);
      }
    }
  }, [isDevicesLoading, devices, selectedDeviceId]);

  // --- Helpers ---

  // 单选设备：点击切换选中状态
  const selectDevice = (deviceId: number) => {
    setSelectedDeviceId(deviceId);
  };

  // Filter metrics by active tab (3个独立数据源)
  const filteredMetrics = useMemo(() => {
    const result: Record<string, RealtimeMetric> = {};
    Object.entries(sseState.metrics).forEach(([key, metric]) => {
      const isReceiveCard = metric.sourceType === 'RECEIVE_CARD' || metric.reportType === 'bitErrorRate';

      if (
        (activeTab === 'receiveCard' && isReceiveCard) ||
        (activeTab === 'device' && metric.sourceType === 'DEVICE_SENSOR' && !isReceiveCard) ||
        (activeTab === 'm2' && metric.sourceType === 'M2_SENSOR')
      ) {
        result[key] = metric;
      }
    });
    return result;
  }, [sseState.metrics, activeTab]);

  // Get metric counts for tabs (3个独立数据源)
  const tabCounts = useMemo(() => {
    let receiveCard = 0;
    let device = 0;
    let m2 = 0;
    Object.values(sseState.metrics).forEach((m) => {
      const isReceiveCard = m.sourceType === 'RECEIVE_CARD' || m.reportType === 'bitErrorRate';
      if (isReceiveCard) {
        receiveCard++;
      } else if (m.sourceType === 'DEVICE_SENSOR') {
        device++;
      } else if (m.sourceType === 'M2_SENSOR') {
        m2++;
      }
    });
    return { receiveCard, device, m2 };
  }, [sseState.metrics]);

  if (isDevicesLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-muted-foreground font-semibold tracking-wider text-xs">
        Initializing Device Monitoring...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-hidden">
      {/* Unified Toolbar */}
      <div className="flex items-center gap-3 flex-wrap bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-xl p-2 px-4 shadow-sm">
        {/* History Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker
            value={historyDraft}
            label="Analysis period"
            onChange={(val) => {
              setHistoryDraft(val);
              // For monitoring, we apply immediately when a preset is chosen or range changes
              setHistoryApplied(val);
            }}
            showTime={false}
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-11rem)] gap-4 overflow-hidden">
        {/* Device: Device NAVIGATOR */}
        <Card className="flex w-[320px] flex-col overflow-hidden border bg-card shadow-sm shrink-0">
          <div className="p-3 space-y-3 border-b bg-muted/30">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search by name, network or tags..."
                className="pl-8 h-8 bg-background text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Devices ({devices.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] font-bold text-primary gap-1.5 hover:bg-primary/5 transition-colors"
                onClick={() => {
                   queryClient.invalidateQueries({ queryKey: ['devices'] });
                   setSelectedDeviceId(null); // Optional: reset selection on refresh to trigger default logic again
                }}
              >
                <RefreshCw className={cn("h-3 w-3", sseState.status === 'reconnecting' && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {devices.map((d) => {
                // 单选模式：使用 deviceId (number) 比较
                const isSelected = selectedDeviceId === d.deviceId;
                const status = resolveDeviceStatus(d as Device);
                const NetworkIcon =
                  d.networkType === 'WIFI' || d.networkType === 'WiFi' ? Wifi : 
                  (d.networkType === 'FOUR_G' || d.networkType === '4G') ? RadioTower : EthernetPort;

                return (
                  <button
                    key={d.id}
                    onClick={() => selectDevice(d.deviceId)}
                    className={cn(
                      'w-full flex items-start gap-2.5 p-3 rounded-md transition-all text-left border border-transparent',
                      isSelected
                        ? 'bg-primary/5 border-primary/10 shadow-sm'
                        : 'hover:bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0 mt-1',
                        status === 'online'
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs font-semibold truncate',
                          isSelected ? 'text-primary' : 'text-foreground/80'
                        )}
                      >
                        {d.deviceName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                         <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                           <NetworkIcon className="h-2.5 w-2.5" />
                           {d.networkType || 'Offline'}
                         </div>
                         {d.tags?.slice(0, 2).map((t: Tag) => (
                            <TagChip 
                              key={t.tagSlug} 
                              tag={t} 
                              className="h-4 text-[8px] max-w-[80px]" 
                            />
                         ))}
                         {d.tags && d.tags.length > 2 && (
                            <span className="text-[8px] text-muted-foreground/60 font-bold">+{d.tags.length - 2}</span>
                         )}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-primary mt-1" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {selectedDeviceId === null ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 bg-muted/10 rounded-lg border border-dashed">
              <Monitor className="h-12 w-12 mb-3" />
              <h2 className="text-lg font-bold tracking-tight">
                No Device Selected
              </h2>
              <p className="text-xs max-w-xs">
                Select a device from the fleet list to start receiving real-time telemetry.
              </p>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as MonitoringTab)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Tab Header - 3个独立数据源Tab */}
              <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-xl p-2 px-4 flex items-center justify-between gap-4 shadow-sm">
                <TabsList className="bg-muted/50 h-8">
                  <TabsTrigger
                    value="receiveCard"
                    className="h-6 px-3 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    Receive Cards
                    {tabCounts.receiveCard > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-primary/10 text-primary rounded-full">
                        {tabCounts.receiveCard}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="device"
                    className="h-6 px-3 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    Device Sensors
                    {tabCounts.device > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-primary/10 text-primary rounded-full">
                        {tabCounts.device}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="m2"
                    className="h-6 px-3 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
                  >
                    <Gauge className="h-3.5 w-3.5" />
                    M2 External
                    {tabCounts.m2 > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-primary/10 text-primary rounded-full">
                        {tabCounts.m2}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Real-time feed active
                  </span>
                </div>
              </div>

              {/* Tab Content - 3个独立数据源 */}
              <TabsContent
                value="receiveCard"
                className="flex-1 mt-3 overflow-auto data-[state=inactive]:hidden"
              >
                <ReceiveCardTab
                  deviceId={selectedDeviceId}
                  metrics={filteredMetrics}
                  historyRange={historyRange ?? undefined}
                />
              </TabsContent>

              <TabsContent
                value="device"
                className="flex-1 mt-3 overflow-auto data-[state=inactive]:hidden"
              >
                <DeviceSensorTab
                  deviceId={selectedDeviceId}
                  metrics={filteredMetrics}
                  historyRange={historyRange ?? undefined}
                />
              </TabsContent>

              <TabsContent
                value="m2"
                className="flex-1 mt-3 overflow-auto data-[state=inactive]:hidden"
              >
                <M2SensorTab
                  deviceId={selectedDeviceId}
                  metrics={filteredMetrics}
                  historyRange={historyRange ?? undefined}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Internal UI Helpers ---

function SSEStatus({ status }: { status: 'connected' | 'reconnecting' | 'error' | 'idle' }) {
  const configs = {
    connected: { color: 'text-emerald-500', label: 'Connected', icon: Wifi },
    reconnecting: { color: 'text-amber-500', label: 'Reconnecting', icon: RefreshCw },
    error: { color: 'text-rose-500', label: 'Error', icon: AlertTriangle },
    idle: { color: 'text-muted-foreground', label: 'Disconnected', icon: Wifi },
  } as const;
  
  const config = configs[status as keyof typeof configs] || configs.idle;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2.5 h-8 rounded-md border bg-background text-[10px] font-bold uppercase tracking-tight',
        config.color
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'reconnecting' && 'animate-spin')} />
      {config.label}
    </div>
  );
}
