import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, 
  Thermometer, 
  Wifi, 
  Zap, 
  RefreshCw,
  AlertTriangle,
  Cpu,
  Layers,
  Search,
  LineChart as LineChartIcon,
  Monitor,
  Microchip,
  Droplets,
  Wind,
  ShieldAlert,
  ChevronRight,
  Clock,
  LayoutGrid,
  Cable,
  Gauge,
  X
} from 'lucide-react';
import { getDevices } from '@/services/deviceApi';
import { getSensorSeries, type SensorSourceType } from '@/services/telemetryApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { type Device, resolveDeviceStatus } from '@/types/device';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// --- Types & Constants ---

interface RealtimeState {
  [reportType: string]: {
    value: any;
    at: string;
    source: SensorSourceType;
    history: { at: string; val: number }[]; 
  };
}

const SENSOR_MAPPING: Record<string, { reportType: string; sourceType: SensorSourceType; label: string; unit?: string; icon: any }> = {
  'bright:0': { reportType: 'bright', sourceType: 'DEVICE_SENSOR', label: 'Ambient Light', unit: 'lux', icon: Zap },
  'bright:1000': { reportType: 'bright', sourceType: 'M2_SENSOR', label: 'Panel Brightness', unit: '%', icon: Zap },
  'noise:1': { reportType: 'noise', sourceType: 'DEVICE_SENSOR', label: 'Noise', unit: 'dB', icon: Wind },
  'noise:1001': { reportType: 'noise', sourceType: 'M2_SENSOR', label: 'Noise (M2)', unit: 'dB', icon: Wind },
  'humidity:2': { reportType: 'humidity', sourceType: 'DEVICE_SENSOR', label: 'Humidity', unit: '%', icon: Droplets },
  'humidity:1002': { reportType: 'humidity', sourceType: 'M2_SENSOR', label: 'Humidity (M2)', unit: '%', icon: Droplets },
  'temperature:2': { reportType: 'temperature', sourceType: 'DEVICE_SENSOR', label: 'Temperature', unit: '°C', icon: Thermometer },
  'temperature:1002': { reportType: 'temperature', sourceType: 'M2_SENSOR', label: 'Temperature (M2)', unit: '°C', icon: Thermometer },
  'smoke:3': { reportType: 'smoke', sourceType: 'DEVICE_SENSOR', label: 'Smoke', icon: ShieldAlert },
  'smoke:1003': { reportType: 'smoke', sourceType: 'M2_SENSOR', label: 'Smoke (M2)', icon: ShieldAlert },
  'pm25:4': { reportType: 'pm25', sourceType: 'DEVICE_SENSOR', label: 'PM2.5', unit: 'μg', icon: Activity },
  'pm25:1004': { reportType: 'pm25', sourceType: 'M2_SENSOR', label: 'PM2.5 (M2)', unit: 'μg', icon: Activity },
  'bitErrorRate:undefined': { reportType: 'receiveCard', sourceType: 'DEVICE_SENSOR', label: 'Receive Cards', icon: Cpu },
  'temperature:6': { reportType: 'temperatureOnBoard', sourceType: 'DEVICE_SENSOR', label: 'Board Temp', unit: '°C', icon: Microchip },
  'humidity:7': { reportType: 'humidityOnBoard', sourceType: 'DEVICE_SENSOR', label: 'Board Hum', unit: '%', icon: Droplets },
};

// --- Main Page Component ---

export default function MonitoringPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatDateTime } = useTimeFormatter();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [realtimeData, setRealtimeData] = useState<RealtimeState>({});
  
  // Historical view state
  const [historyTarget, setHistoryTarget] = useState<{ reportType: string; label: string } | null>(null);

  // --- Queries ---

  const { data: devicesRes, isLoading: isDevicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const devices = useMemo(() => {
    const list = devicesRes?.data || [];
    return list.filter(d => 
      d.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [devicesRes, searchQuery]);

  // Default selection
  useEffect(() => {
    if (!selectedDeviceId && devices.length > 0) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const selectedDevice = useMemo(() => 
    devices.find(d => d.id === selectedDeviceId), 
    [devices, selectedDeviceId]
  );

  // Fetch history if a target is selected
  const { data: seriesRes, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['telemetry', 'sensors', 'series', selectedDeviceId, historyTarget?.reportType],
    queryFn: () => getSensorSeries({ 
      deviceId: selectedDeviceId!, 
      reportTypes: [historyTarget!.reportType],
      limit: 100
    }),
    enabled: !!selectedDeviceId && !!historyTarget,
  });

  // --- SSE Logic ---

  useEffect(() => {
    if (!selectedDeviceId) return;

    setRealtimeData({}); // Reset on switch

    const url = `/api/sse/monitoring/stream?deviceIds=${selectedDeviceId}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener('prism', (event: any) => {
      try {
        const envelope = JSON.parse(event.data);
        if (envelope.type === 'telemetry.sensor.reported') {
          const items = envelope.data?.items || [];
          
          setRealtimeData(prev => {
            const next = { ...prev };
            items.forEach((item: any) => {
              const mapping = resolveMapping(item.sensorType, item.sensorId);
              if (mapping) {
                const existing = next[mapping.reportType] || { history: [] };
                const val = item.sensorValue !== undefined ? item.sensorValue : item;
                
                // Add to history for sparkline
                const numVal = typeof val === 'number' ? val : 0;
                const newHistory = [...existing.history, { at: envelope.occurredAt, val: numVal }].slice(-24);

                next[mapping.reportType] = {
                  value: val,
                  at: envelope.occurredAt,
                  source: mapping.sourceType,
                  history: newHistory
                };
              }
            });
            return next;
          });
        }
      } catch (e) {
        console.error('[SSE Monitoring] Error', e);
      }
    });

    return () => eventSource.close();
  }, [selectedDeviceId]);

  if (isDevicesLoading) {
    return <div className="flex h-[70vh] items-center justify-center text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Initializing Fleet Monitoring...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-hidden">
      {/* Unified Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
         <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl font-semibold text-[11px] tracking-tight gap-2 px-4 border-2" onClick={() => queryClient.invalidateQueries({ queryKey: ['devices'] })}>
               <RefreshCw className="h-3.5 w-3.5 text-primary" />
               Refresh Fleet
            </Button>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-tight text-muted-foreground/60">
               <Activity className="h-3.5 w-3.5 text-primary" />
               Fleet Monitoring Engine
            </div>
         </div>

         {selectedDevice && (
           <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2">
              <Badge variant="outline" className="h-9 rounded-xl border-dashed px-3 text-[10px] font-medium text-muted-foreground">
                 Live: {selectedDevice.deviceName}
              </Badge>
              <Button variant="outline" className="h-9 rounded-xl font-semibold text-[11px] tracking-tight px-4 gap-2 border-2" onClick={() => setRealtimeData({})}>
                 <RefreshCw className="h-3.5 w-3.5" /> Reset Stream
              </Button>
              <Button className="h-9 rounded-xl font-semibold text-[11px] tracking-tight px-6 shadow-xl shadow-primary/20" onClick={() => navigate(`/dashboard/devices/${selectedDeviceId}`)}>
                 Full Diagnostics
              </Button>
           </div>
         )}
      </div>

      <div className="flex flex-1 min-h-[calc(100vh-11rem)] gap-8 overflow-hidden">
        {/* LEFT: FLEET NAVIGATOR */}
        <Card className="flex w-[320px] flex-col overflow-hidden border-none bg-muted/10 shadow-none ring-1 ring-muted/50 shrink-0">
          <div className="p-5 space-y-4 border-b bg-muted/5">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
                <Input 
                  placeholder="Search devices..." 
                  className="pl-9 h-10 bg-background border-muted/50 text-sm font-medium" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
             <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Devices ({devices.length})</span>
                <Badge variant="outline" className="text-[9px] font-bold px-1.5 h-4 border-muted-foreground/20">READY</Badge>
             </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              {devices.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDeviceId(d.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-3 rounded-2xl transition-all text-left group border-2 border-transparent",
                    selectedDeviceId === d.id 
                      ? "bg-background border-primary shadow-xl shadow-primary/5 -translate-y-0.5" 
                      : "hover:bg-background hover:border-muted text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    resolveDeviceStatus(d as Device) === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                    resolveDeviceStatus(d as Device) === 'pending' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                    "bg-slate-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold tracking-tight", selectedDeviceId === d.id ? "text-primary" : "text-foreground/80")}>
                      {d.deviceName}
                    </p>
                    <p className="text-[9px] font-mono font-bold opacity-40 uppercase truncate">{d.id}</p>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 transition-all", selectedDeviceId === d.id ? "text-primary opacity-100" : "opacity-0 group-hover:opacity-30 group-hover:translate-x-1")} />
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* RIGHT: REAL-TIME DASHBOARD */}
        <div className="flex-1 flex flex-col gap-8 overflow-hidden">
          {selectedDevice ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-10 pb-20 animate-in slide-in-from-right-8 duration-700">
                 
                 {/* Compact Header */}
                 <div className="flex items-center justify-between gap-6 px-1 border-b pb-6">
                    <div className="flex items-center gap-4">
                       <h2 className="text-3xl font-bold tracking-tighter text-foreground">{selectedDevice.deviceName}</h2>
                       <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-2 h-5 font-bold text-[9px]">
                          {selectedDevice.model}
                       </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60">
                       <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Live Engine Active</span>
                    </div>
                 </div>

                 {/* Metrics Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    
                    {/* ENVIRONMENT CATEGORY */}
                    <div className="xl:col-span-1 space-y-6">
                       <CategoryTitle icon={Wind} label="Atmosphere & Quality" />
                       <div className="grid grid-cols-2 gap-4">
                          <MetricCard 
                            label="Temperature" 
                            value={realtimeData['temperature']?.value} 
                            unit="°C" 
                            history={realtimeData['temperature']?.history}
                            onClick={() => setHistoryTarget({ reportType: 'temperature', label: 'Temperature' })}
                          />
                          <MetricCard 
                            label="Humidity" 
                            value={realtimeData['humidity']?.value} 
                            unit="%" 
                            history={realtimeData['humidity']?.history}
                            color="#10b981"
                            onClick={() => setHistoryTarget({ reportType: 'humidity', label: 'Humidity' })}
                          />
                          <MetricCard 
                            label="PM 2.5" 
                            value={realtimeData['pm25']?.value} 
                            unit="μg/m³" 
                            history={realtimeData['pm25']?.history}
                            color="#f59e0b"
                            onClick={() => setHistoryTarget({ reportType: 'pm25', label: 'PM 2.5' })}
                          />
                          <MetricCard 
                            label="Noise Level" 
                            value={realtimeData['noise']?.value} 
                            unit="dB" 
                            history={realtimeData['noise']?.history}
                            color="#6366f1"
                            onClick={() => setHistoryTarget({ reportType: 'noise', label: 'Noise' })}
                          />
                       </div>
                    </div>

                    {/* POWER & LOGIC CATEGORY */}
                    <div className="xl:col-span-1 space-y-6">
                       <CategoryTitle icon={Zap} label="Electrical & Logic" />
                       <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                             <MetricCard 
                               label="Core Voltage" 
                               value={realtimeData['voltage']?.value} 
                               unit="V" 
                               history={realtimeData['voltage']?.history}
                               color="#ec4899"
                               onClick={() => setHistoryTarget({ reportType: 'voltage', label: 'Voltage' })}
                             />
                             <div className="p-5 rounded-3xl bg-muted/10 border-2 border-dashed flex flex-col justify-center gap-4 text-center">
                                <p className="text-[10px] font-bold text-muted-foreground">Relay Array</p>
                                <div className="flex gap-2 justify-center">
                                   <RelayPill label="1" active={realtimeData['relayStatus']?.value === 1} />
                                   <RelayPill label="2" active={realtimeData['relayStatus2']?.value === 1} />
                                   <RelayPill label="3" active={realtimeData['relayStatus3']?.value === 1} />
                                </div>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <MetricCard 
                               label="Board Temp" 
                               value={realtimeData['temperatureOnBoard']?.value} 
                               unit="°C" 
                               history={realtimeData['temperatureOnBoard']?.history}
                               color="#f43f5e"
                               onClick={() => setHistoryTarget({ reportType: 'temperatureOnBoard', label: 'Board Temp' })}
                             />
                             <MetricCard 
                               label="Board Hum" 
                               value={realtimeData['humidityOnBoard']?.value} 
                               unit="%" 
                               history={realtimeData['humidityOnBoard']?.history}
                               color="#8b5cf6"
                               onClick={() => setHistoryTarget({ reportType: 'humidityOnBoard', label: 'Board Hum' })}
                             />
                          </div>
                       </div>
                    </div>

                    {/* OPTICAL CATEGORY */}
                    <div className="xl:col-span-1 space-y-6">
                       <CategoryTitle icon={Gauge} label="Optical Sensors" />
                       <div className="p-8 rounded-[2.5rem] bg-card border shadow-sm ring-1 ring-muted/60 space-y-8">
                          <div className="space-y-2">
                             <div className="flex justify-between items-end">
                                <p className="text-[10px] font-bold text-muted-foreground tracking-widest">Master Brightness</p>
                                <p className="text-sm font-bold font-mono">{realtimeData['bright']?.value?.masterBrightValue ?? '—'} / 255</p>
                             </div>
                             <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all duration-700" 
                                  style={{ width: `${((realtimeData['bright']?.value?.masterBrightValue || 0) / 255) * 100}%` }} 
                                />
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-10">
                             <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground/40">Target %</p>
                                <p className="text-2xl font-bold tracking-tighter">{realtimeData['bright']?.value?.screenBrightValue ?? '—'}%</p>
                             </div>
                             <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground/40">Raw lux</p>
                                <p className="text-2xl font-bold tracking-tighter">{realtimeData['bright']?.value?.sensorBrightValue ?? '—'}</p>
                             </div>
                          </div>
                          <div className="h-16 w-full opacity-30">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={realtimeData['bright']?.history}>
                                   <Area type="stepAfter" dataKey="val" stroke="#f59e0b" fill="#f59e0b40" strokeWidth={2} />
                                </AreaChart>
                             </ResponsiveContainer>
                          </div>
                       </div>
                    </div>

                    {/* LED CORE TOPOLOGY (LARGE CARD) */}
                    <Card className="md:col-span-2 xl:col-span-3 rounded-[3rem] border-none ring-1 ring-muted/60 overflow-hidden shadow-2xl bg-card">
                       <CardHeader className="bg-muted/5 border-b px-10 py-8">
                          <div className="flex items-center gap-5">
                             <div className="p-3 rounded-[1.25rem] bg-indigo-500 text-white shadow-lg shadow-indigo-200">
                                <LayoutGrid className="h-6 w-6" />
                             </div>
                             <div>
                                <CardTitle className="text-xl font-bold uppercase tracking-tight">LED CORE TOPOLOGY</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Hardware-level bit error rate & card health monitoring</CardDescription>
                             </div>
                          </div>
                       </CardHeader>
                       <CardContent className="p-10">
                          <ReceiveCardTopology data={realtimeData['receiveCard']?.value} />
                       </CardContent>
                    </Card>
                 </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
               <Monitor className="h-20 w-20 mb-6" />
               <h2 className="text-2xl font-bold uppercase tracking-tighter">Selection Required</h2>
               <p className="text-sm font-medium">Please select a device from the fleet list to begin monitoring.</p>
            </div>
          )}
        </div>
      </div>

      {/* FULL HISTORY OVERLAY */}
      {historyTarget && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
            <Card className="w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden border-none ring-1 ring-white/10">
               <CardHeader className="p-10 flex flex-row items-center justify-between bg-muted/5">
                  <div className="flex items-center gap-6">
                     <div className="p-4 rounded-3xl bg-primary text-white shadow-xl shadow-primary/20">
                        <LineChartIcon className="h-8 w-8" />
                     </div>
                     <div>
                        <CardTitle className="text-3xl font-bold uppercase tracking-tight">{historyTarget.label} Full Analysis</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Historical sequence from {selectedDevice?.deviceName}</CardDescription>
                     </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setHistoryTarget(null)} className="rounded-full h-12 w-12 border">
                     <X className="h-6 w-6" />
                  </Button>
               </CardHeader>
               <CardContent className="p-10 pt-0">
                  <div className="h-[400px] w-full mt-10">
                     {isHistoryLoading ? (
                        <div className="h-full flex items-center justify-center opacity-20 font-bold text-xs uppercase tracking-widest animate-pulse">Fetching Sequence...</div>
                     ) : (
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={seriesRes?.data || []}>
                              <defs>
                                 <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis 
                                dataKey="at" 
                                fontSize={10} 
                                tickFormatter={(val) => new Date(val).toLocaleTimeString()} 
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                              />
                              <YAxis fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                              <Tooltip 
                                labelFormatter={(val) => formatDateTime(val)}
                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#6366f1" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#colorVal)" 
                                isAnimationActive={true}
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     )}
                  </div>
               </CardContent>
            </Card>
         </div>
      )}
    </div>
  );
}

// --- Internal UI Helpers ---

function CategoryTitle({ icon: Icon, label }: { icon: any, label: string }) {
   return (
      <div className="flex items-center gap-3 px-1">
         <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
         </div>
         <h3 className="text-xs font-bold tracking-tight text-muted-foreground">{label}</h3>
      </div>
   );
}

function MetricCard({ label, value, unit, history = [], color = "#6366f1", onClick }: any) {
  const isAvailable = value !== undefined && value !== null;
  
  return (
    <div 
      onClick={onClick}
      className="p-6 rounded-[2rem] bg-card border shadow-sm ring-1 ring-muted/60 transition-all hover:ring-primary/40 hover:-translate-y-1 cursor-pointer group"
    >
       <p className="text-[10px] font-bold text-muted-foreground tracking-tight group-hover:text-primary transition-colors">{label}</p>
       <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tighter tabular-nums">
             {isAvailable ? (typeof value === 'number' ? value.toFixed(1) : value) : '—'}
          </span>
          {isAvailable && unit && <span className="text-[10px] font-bold opacity-30">{unit}</span>}
       </div>
       <div className="h-10 w-full pt-4 opacity-40 group-hover:opacity-100 transition-opacity">
          {history.length > 2 && (
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                   <Area 
                     type="monotone" 
                     dataKey="val" 
                     stroke={color} 
                     fill={`${color}10`} 
                     strokeWidth={2} 
                     isAnimationActive={false} 
                   />
                </AreaChart>
             </ResponsiveContainer>
          )}
       </div>
    </div>
  );
}

function RelayPill({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={cn(
      "flex-1 py-2 rounded-xl border-2 font-bold text-[9px] uppercase tracking-widest text-center transition-all",
      active 
        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
        : "bg-muted/30 border-muted opacity-40"
    )}>
       {label}
    </div>
  );
}

function ReceiveCardTopology({ data }: any) {
  const ports = Array.isArray(data?.sensorValue) ? data.sensorValue : [];
  
  if (ports.length === 0) return (
    <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
       <RefreshCw className="h-10 w-10 animate-spin-slow" />
       <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Awaiting Hardware Link Pulse...</p>
    </div>
  );

  return (
    <div className="space-y-12">
       {ports.map((port: any) => (
          <div key={port.netPortNum} className="space-y-6">
             <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center border">
                   <Cable className="h-4 w-4 text-primary" />
                </div>
                <div>
                   <p className="text-xs font-bold uppercase tracking-widest">Network Port {port.netPortNum}</p>
                   <p className="text-[9px] font-bold text-emerald-600 uppercase">Status: Carrier Detected</p>
                </div>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {port.receiveCards?.map((card: any) => (
                   <div key={card.receiveCardNum} className="p-5 rounded-[1.5rem] bg-muted/10 border-2 border-transparent hover:border-primary/20 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                      <div className="flex justify-between items-start mb-4">
                         <span className="text-[11px] font-bold">Card #{card.receiveCardNum}</span>
                         <Badge variant="outline" className="text-[8px] h-4 px-1 border-emerald-500/20 text-emerald-600 font-bold">OK</Badge>
                      </div>
                      <div className="space-y-4">
                         <div>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase mb-0.5 opacity-40">Bit Error Rate</p>
                            <p className="text-xs font-mono font-bold tracking-tighter">{(card.bitErrorRate * 100).toFixed(5)}%</p>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">Temp</p>
                               <p className="text-[10px] font-bold">{card.temperature}°C</p>
                            </div>
                            <div>
                               <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">Hum</p>
                               <p className="text-[10px] font-bold">{card.humidity}%</p>
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       ))}
    </div>
  );
}

// --- Utils ---

function resolveMapping(sensorType: string, sensorId: number) {
  const key = `${sensorType}:${sensorId}`;
  const genericKey = `${sensorType}:undefined`; 
  
  const hit = SENSOR_MAPPING[key] || SENSOR_MAPPING[genericKey];
  if (hit) return hit;

  const isM2 = sensorId >= 1000;
  return {
    reportType: sensorType,
    sourceType: (isM2 ? 'M2_SENSOR' : 'DEVICE_SENSOR') as SensorSourceType
  };
}