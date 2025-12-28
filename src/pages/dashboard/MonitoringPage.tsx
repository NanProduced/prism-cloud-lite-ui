import { useEffect, useMemo, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Wifi,
  RefreshCw,
  AlertTriangle,
  Search,
  Monitor,
  Clock,
  Copy,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Gauge,
} from 'lucide-react';
import { getDevices } from '@/services/deviceApi';
import { type SensorSourceType } from '@/services/telemetryApi';
import { type Device, resolveDeviceStatus } from '@/types/device';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

import type { TelemetryItem, RealtimeMetric, SSEState, MonitoringFilters } from './monitoring/types';
import { getSourceTab, type MonitoringTab } from './monitoring/constants';
import { DeviceSensorTab, M2SensorTab } from './monitoring/components';

const LRU_LIMIT = 500;
const REFRESH_INTERVAL = 1000;

export default function MonitoringPage() {
  const queryClient = useQueryClient();

  // Selection & Filters
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<MonitoringTab>('device');

  // SSE & Real-time State
  const [sseState, setSseState] = useState<SSEState>({
    metrics: {},
    lastUpdate: 0,
    status: 'idle',
    diagnostics: [],
  });

  const traceIdBuffer = useRef<Set<string>>(new Set());
  const pendingUpdates = useRef<Record<string, RealtimeMetric>>({});

  // --- Queries ---

  const { data: devicesRes, isLoading: isDevicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const devices = useMemo(() => {
    const list = devicesRes?.data || [];
    return list.filter(
      (d) =>
        d.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [devicesRes, searchQuery]);

  // --- SSE Logic ---

  useEffect(() => {
    if (selectedDeviceIds.length === 0) {
      setSseState((prev) => ({ ...prev, status: 'idle', metrics: {} }));
      return;
    }

    const url = `/api/sse/monitoring/stream?deviceIds=${selectedDeviceIds.join(',')}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    setSseState((prev) => ({ ...prev, status: 'connected' }));

    eventSource.addEventListener('prism', (event: any) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope.type === 'telemetry.sensor.reported') {
          // De-duplication
          if (envelope.traceId && traceIdBuffer.current.has(envelope.traceId)) return;
          if (envelope.traceId) {
            traceIdBuffer.current.add(envelope.traceId);
            if (traceIdBuffer.current.size > LRU_LIMIT) {
              const first = traceIdBuffer.current.values().next().value;
              traceIdBuffer.current.delete(first);
            }
          }

          const items = (envelope.data?.items || []) as TelemetryItem[];

          items.forEach((item) => {
            const deviceId = item.deviceId || envelope.deviceId || 'unknown';
            const sensorType = item.sensorType;
            const sensorId = item.sensorId;

            // Determine source type based on sensorId
            const sourceType: SensorSourceType =
              sensorType === 'bitErrorRate'
                ? 'DEVICE_SENSOR'
                : sensorId >= 1000
                  ? 'M2_SENSOR'
                  : 'DEVICE_SENSOR';

            // Get the tab this metric belongs to
            const tab = getSourceTab(sensorType, sensorId);

            // Determine reportType
            let reportType = sensorType;

            const metricKey = `${sourceType}:${reportType}:${deviceId}`;

            const val = item.sensorValue !== undefined ? item.sensorValue : item;
            const numVal = typeof val === 'number' ? val : 0;

            const existing = pendingUpdates.current[metricKey] || sseState.metrics[metricKey];
            const history = existing?.history || [];
            const newHistory = [...history, { at: envelope.occurredAt, val: numVal }].slice(-30);

            pendingUpdates.current[metricKey] = {
              value: val,
              at: envelope.occurredAt,
              sourceType,
              reportType,
              metricKey,
              deviceId,
              history: newHistory,
              traceId: envelope.traceId,
            };
          });

          // Diagnostics
          if (envelope.traceId) {
            setSseState((prev) => ({
              ...prev,
              diagnostics: [
                { traceId: envelope.traceId, occurredAt: envelope.occurredAt },
                ...prev.diagnostics,
              ].slice(0, 20),
            }));
          }
        }
      } catch (e) {
        console.error('[SSE Monitoring] Error', e);
      }
    });

    eventSource.onerror = () => {
      setSseState((prev) => ({ ...prev, status: 'error' }));
    };

    return () => {
      eventSource.close();
    };
  }, [selectedDeviceIds]);

  // Throttled UI Update
  useEffect(() => {
    const timer = setInterval(() => {
      if (Object.keys(pendingUpdates.current).length > 0) {
        setSseState((prev) => ({
          ...prev,
          metrics: { ...prev.metrics, ...pendingUpdates.current },
          lastUpdate: Date.now(),
        }));
        pendingUpdates.current = {};
      }
    }, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // --- Helpers ---

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const copyDiagnostics = () => {
    const text = sseState.diagnostics
      .map((d) => `${d.occurredAt} | ${d.traceId}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Diagnostics copied to clipboard');
  };

  // Filter metrics by active tab
  const filteredMetrics = useMemo(() => {
    const result: Record<string, RealtimeMetric> = {};
    Object.entries(sseState.metrics).forEach(([key, metric]) => {
      const tab = getSourceTab(metric.reportType, metric.reportType === 'bitErrorRate' ? 0 : metric.sourceType === 'M2_SENSOR' ? 1000 : 0);
      if (
        (activeTab === 'device' && (metric.sourceType === 'DEVICE_SENSOR' || metric.reportType === 'bitErrorRate')) ||
        (activeTab === 'm2' && metric.sourceType === 'M2_SENSOR' && metric.reportType !== 'bitErrorRate')
      ) {
        result[key] = metric;
      }
    });
    return result;
  }, [sseState.metrics, activeTab]);

  // Get metric counts for tabs
  const tabCounts = useMemo(() => {
    let device = 0;
    let m2 = 0;
    Object.values(sseState.metrics).forEach((m) => {
      if (m.sourceType === 'DEVICE_SENSOR' || m.reportType === 'bitErrorRate') {
        device++;
      }
      if (m.sourceType === 'M2_SENSOR' && m.reportType !== 'bitErrorRate') {
        m2++;
      }
    });
    return { device, m2 };
  }, [sseState.metrics]);

  if (isDevicesLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
        Initializing Fleet Monitoring...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-hidden">
      {/* Unified Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl font-semibold text-[11px] tracking-tight gap-2 px-4 border-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['devices'] })}
          >
            <RefreshCw className="h-3.5 w-3.5 text-primary" />
            Refresh Fleet
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-tight text-muted-foreground/60">
            <Activity className="h-3.5 w-3.5 text-primary" />
            Live Monitoring
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <SSEStatus status={sseState.status} />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={copyDiagnostics}
            title="Copy Diagnostics"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-11rem)] gap-6 overflow-hidden">
        {/* LEFT: FLEET NAVIGATOR */}
        <Card className="flex w-[300px] flex-col overflow-hidden border-none bg-muted/10 shadow-none ring-1 ring-muted/50 shrink-0">
          <div className="p-4 space-y-4 border-b bg-muted/5">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search devices..."
                className="pl-9 h-10 bg-background border-muted/50 text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Fleet ({devices.length})
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[9px] font-bold"
                  onClick={() => setSelectedDeviceIds(devices.map((d) => d.id))}
                >
                  ALL
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[9px] font-bold"
                  onClick={() => setSelectedDeviceIds([])}
                >
                  NONE
                </Button>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {devices.map((d) => {
                const isSelected = selectedDeviceIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDevice(d.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group border border-transparent',
                      isSelected
                        ? 'bg-background border-primary/20 shadow-sm'
                        : 'hover:bg-background/50 text-muted-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        resolveDeviceStatus(d as Device) === 'online'
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs font-bold truncate',
                          isSelected ? 'text-primary' : 'text-foreground/80'
                        )}
                      >
                        {d.deviceName}
                      </p>
                      <p className="text-[9px] opacity-40 font-mono truncate">{d.id}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {selectedDeviceIds.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 bg-muted/5 rounded-[2rem] border border-dashed">
              <Monitor className="h-16 w-16 mb-4" />
              <h2 className="text-xl font-bold uppercase tracking-tight">
                No Active Subscriptions
              </h2>
              <p className="text-sm">
                Select one or more devices from the fleet list to start receiving real-time
                telemetry.
              </p>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as MonitoringTab)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Tab Header */}
              <div className="bg-card border rounded-2xl p-4 flex items-center justify-between gap-4">
                <TabsList className="bg-muted/50 p-1 h-10">
                  <TabsTrigger
                    value="device"
                    className="h-8 px-4 text-[11px] font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    Device & Receive Card
                    {tabCounts.device > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-primary/10 text-primary rounded-full">
                        {tabCounts.device}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="m2"
                    className="h-8 px-4 text-[11px] font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
                  >
                    <Gauge className="h-3.5 w-3.5" />
                    M2 External Sensors
                    {tabCounts.m2 > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-primary/10 text-primary rounded-full">
                        {tabCounts.m2}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Latest:{' '}
                    {sseState.lastUpdate > 0
                      ? new Date(sseState.lastUpdate).toLocaleTimeString()
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Tab Content */}
              <TabsContent
                value="device"
                className="flex-1 mt-4 overflow-auto data-[state=inactive]:hidden"
              >
                {Object.keys(filteredMetrics).length === 0 ? (
                  <EmptyState
                    icon={Cpu}
                    title="Awaiting Device Telemetry"
                    description="No device sensor or receive card data reported for the selected devices yet."
                  />
                ) : (
                  <DeviceSensorTab
                    deviceIds={selectedDeviceIds}
                    metrics={filteredMetrics}
                  />
                )}
              </TabsContent>

              <TabsContent
                value="m2"
                className="flex-1 mt-4 overflow-auto data-[state=inactive]:hidden"
              >
                {Object.keys(filteredMetrics).length === 0 ? (
                  <EmptyState
                    icon={Gauge}
                    title="Awaiting M2 Telemetry"
                    description="No M2 external sensor data reported for the selected devices yet."
                  />
                ) : (
                  <M2SensorTab
                    deviceIds={selectedDeviceIds}
                    metrics={filteredMetrics}
                  />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Internal UI Helpers ---

function SSEStatus({ status }: { status: SSEState['status'] }) {
  const configs = {
    connected: { color: 'text-emerald-500', label: 'SSE Connected', icon: Wifi },
    reconnecting: { color: 'text-amber-500', label: 'Reconnecting', icon: RefreshCw },
    error: { color: 'text-rose-500', label: 'SSE Error', icon: AlertTriangle },
    idle: { color: 'text-muted-foreground', label: 'Disconnected', icon: Wifi },
  };
  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 h-9 rounded-xl border bg-background text-[10px] font-bold uppercase tracking-tight',
        config.color
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'reconnecting' && 'animate-spin')} />
      {config.label}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof AlertCircle;
  title: string;
  description: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 bg-muted/5 rounded-[2rem] border border-dashed h-full min-h-[400px]">
      <Icon className="h-16 w-16 mb-4" />
      <h2 className="text-xl font-bold uppercase tracking-tight">{title}</h2>
      <p className="text-sm">{description}</p>
    </div>
  );
}
