import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Monitor, 
  Settings, 
  Clock, 
  Zap,
  RefreshCw,
  Camera,
  Volume2,
  Sun,
  Layout,
  Database,
  Search,
  FileText,
  Copy,
  Maximize2,
  ShieldCheck,
  Cpu,
  RotateCw,
  Play,
  Layers,
  Moon,
  ThermometerSnowflake,
  Network,
  Wifi,
  Cable,
  Signal,
  Share2,
  Info,
  X,
  CalendarDays,
  Send,
  History as HistoryIcon,
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Unlock,
  Power
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/store/notificationStore";
import { DeviceScreenshot } from "@/components/devices/DeviceScreenshot";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { SlideToUnlock } from "@/components/ui/slide-to-unlock";
import { BatchCommandDialog } from "@/features/devices/commands/BatchCommandDialog";
import { ScreenshotManagerDialog } from "@/components/devices/ScreenshotManagerDialog";
import type { DeviceDetails } from "@/types/device-details";
import { resolveDeviceStatus } from "@/types/device";
import { 
  getDevice, 
  getDeviceScreenshots, 
  executeDeviceAction, 
  deleteScreenshot, 
  clearScreenshots,
  getDeviceSchedule,
  getDeviceProgramAllowlist
} from "@/services/deviceApi";
import { getDeviceCommandLogs } from "@/services/logApi";
import { useMessageStore } from "@/store/messageStore";
import { useBreadcrumbStore } from "@/store/breadcrumbStore";
import { cn } from "@/lib/utils";
import { useTimeFormatter } from "@/hooks/use-time-formatter";

export default function DeviceDetailsPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatRelative, formatDateTime } = useTimeFormatter();
  const sseConnected = useMessageStore(state => state.sseConnected);
  const setBreadcrumbOverride = useBreadcrumbStore(state => state.setOverride);
  const removeBreadcrumbOverride = useBreadcrumbStore(state => state.removeOverride);

  const { data: bffResponse, isLoading: isDeviceLoading, isFetching: isRefreshing } = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => getDevice(deviceId!),
    enabled: !!deviceId,
  });

  const { data: screenshotsResponse } = useQuery({
    queryKey: ['device-screenshots', deviceId],
    queryFn: () => getDeviceScreenshots(deviceId!),
    enabled: !!deviceId,
  });

  const { data: commandLogsResponse, refetch: refetchCommandLogs } = useQuery({
    queryKey: ['device-command-logs', deviceId],
    queryFn: () => getDeviceCommandLogs({ deviceId: Number(deviceId), size: 5 }),
    enabled: !!deviceId,
  });

  const { data: scheduleResponse } = useQuery({
    queryKey: ['device-schedule', deviceId],
    queryFn: () => getDeviceSchedule(deviceId!),
    enabled: !!deviceId,
  });

  const { data: allowlistResponse } = useQuery({
    queryKey: ['device-allowlist', deviceId],
    queryFn: () => getDeviceProgramAllowlist(deviceId!),
    enabled: !!deviceId,
  });

  const device = bffResponse?.data as DeviceDetails | undefined;
  const historicalScreenshots = useMemo(() => screenshotsResponse?.data || [], [screenshotsResponse]);
  
  // Robust fallback logic for screenshot URL
  const screenshotUrl = useMemo(() => {
    if (!device) return undefined;
    return device.latestScreenshot?.url || 
           device.lastScreenshotUrl || 
           device.screenshotUrl || 
           (historicalScreenshots.length > 0 ? (historicalScreenshots[0].url || historicalScreenshots[0].screenshotUrl) : undefined);
  }, [device, historicalScreenshots]);

  // Robust fallback logic for screenshot timestamp
  const screenshotTime = useMemo(() => {
    if (!device) return undefined;
    return device.latestScreenshot?.timestamp || 
           (historicalScreenshots.length > 0 ? (historicalScreenshots[0].timestamp || historicalScreenshots[0].createdAt) : device.lastReportTime);
  }, [device, historicalScreenshots]);
  const recentOperations = useMemo(() => commandLogsResponse?.data?.items || [], [commandLogsResponse]);
  const deviceSchedule = scheduleResponse?.data;
  const programAllowlist = allowlistResponse?.data || [];

  const [isCapturing, setIsCapturing] = useState(false);
  const [activeScreenshotOpId, setActiveScreenshotOpId] = useState<string | null>(null);
  const [showBatchCommand, setShowBatchCommand] = useState(false);
  const [showScreenshotManager, setShowScreenshotManager] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (device?.deviceName) {
      setBreadcrumbOverride(`/dashboard/devices/${deviceId}`, device.deviceName);
    }
    return () => {
      removeBreadcrumbOverride(`/dashboard/devices/${deviceId}`);
    };
  }, [device?.deviceName, deviceId, setBreadcrumbOverride, removeBreadcrumbOverride]);

  useEffect(() => {
    const handleOperationUpdate = (event: any) => {
      const { scope, data } = event.detail;
      if (scope.deviceId === Number(deviceId)) {
        refetchCommandLogs();
        
        // Handle screenshot operation feedback
        if (activeScreenshotOpId && scope.operationId === activeScreenshotOpId) {
          if (data.status === 'CONFIRMED' || data.status === 'COMPLETED') {
            toast.success('Screenshot command confirmed by device');
            setActiveScreenshotOpId(null);
          } else if (data.status === 'FAILED' || data.status === 'EXPIRED') {
            toast.error(`Screenshot command failed: ${data.status}`);
            setActiveScreenshotOpId(null);
          }
        }
      }
    };
    
    const handleDeviceUpdate = (event: any) => {
      const { deviceId: updatedId } = event.detail;
      if (Number(updatedId) === Number(deviceId)) {
        queryClient.invalidateQueries({ queryKey: ['device', deviceId] });
        queryClient.invalidateQueries({ queryKey: ['device-screenshots', deviceId] });
      }
    };

    window.addEventListener('prism.operation.updated' as any, handleOperationUpdate);
    window.addEventListener('prism.device.updated' as any, handleDeviceUpdate);
    
    return () => {
      window.removeEventListener('prism.operation.updated' as any, handleOperationUpdate);
      window.removeEventListener('prism.device.updated' as any, handleDeviceUpdate);
    };
  }, [refetchCommandLogs, deviceId, queryClient]);

  // Interactive States
  const [brightnessPct, setBrightnessPct] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [colorTemp, setColorTemp] = useState(6500);
  const [inputMode, setInputMode] = useState("internal");

  // Lock States
  const [isBrightnessLocked, setIsBrightnessLocked] = useState(true);
  const [isVolumeLocked, setIsVolumeLocked] = useState(true);
  const [isColorTempLocked, setIsColorTempLocked] = useState(true);

  const [originalValues, setOriginalValues] = useState({
    brightness: 0,
    volume: 0,
    colorTemp: 6500
  });

  useEffect(() => {
    if (device?.deviceProperties) {
      const props = device.deviceProperties;
      const b = Math.round((props.brightnessandcolortemp?.brightness || 0) / 255 * 100);
      const v = Math.round((props.volume?.musicvolume || 0) / 100 * 15);
      const c = props.brightnessandcolortemp?.colortemperature || 6500;
      
      setBrightnessPct(b);
      setVolumeLevel(v);
      setColorTemp(c);
      setInputMode(props.inputmode?.inputmode || "internal");
      setOriginalValues({ brightness: b, volume: v, colorTemp: c });
    }
  }, [device]);

  const hasChanges = brightnessPct !== originalValues.brightness || 
                     volumeLevel !== originalValues.volume || 
                     colorTemp !== originalValues.colorTemp;
  
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, type: 'sleep' | 'reboot' | null }>({ open: false, type: null });

  const handleApplyChanges = async () => {
    try {
      if (brightnessPct !== originalValues.brightness) {
        await executeDeviceAction(deviceId!, { 
          type: 'BRIGHTNESS', 
          body: { brightness: Math.round(brightnessPct * 2.55) } 
        });
      }
      if (volumeLevel !== originalValues.volume) {
        await executeDeviceAction(deviceId!, { 
          type: 'VOLUME', 
          body: { musicvolume: Math.round(volumeLevel * 100 / 15) } 
        });
      }
      if (colorTemp !== originalValues.colorTemp) {
        await executeDeviceAction(deviceId!, { 
          type: 'COLOR_TEMP', 
          body: { colortemp: colorTemp } 
        });
      }
      
      setOriginalValues({ brightness: brightnessPct, volume: volumeLevel, colorTemp: colorTemp });
      setIsBrightnessLocked(true);
      setIsVolumeLocked(true);
      setIsColorTempLocked(true);
      toast.success('Parameters dispatched');
      queryClient.invalidateQueries({ queryKey: ['device', deviceId] });
    } catch (err) {
      toast.error('Failed to dispatch commands');
    }
  };

  const handleResetChanges = () => {
    setBrightnessPct(originalValues.brightness);
    setVolumeLevel(originalValues.volume);
    setColorTemp(originalValues.colorTemp);
    setIsBrightnessLocked(true);
    setIsVolumeLocked(true);
    setIsColorTempLocked(true);
    toast.info('Adjustments reverted');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['device', deviceId] });
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      const res = await executeDeviceAction(deviceId!, { type: 'SCREENSHOT', body: {} });
      if (res.success && res.data?.operationId) {
        setActiveScreenshotOpId(res.data.operationId);
        toast.info('Screenshot command dispatched');
      } else {
        toast.success('Screenshot command dispatched');
      }
    } catch (err) {
      toast.error('Failed to dispatch capture command');
    } finally {
      setIsCapturing(false);
    }
  };

  const executeDangerousAction = async () => {
    const actionType = confirmDialog.type === 'sleep' ? 'POWER' : 'POWER';
    const command = confirmDialog.type === 'sleep' ? 'sleep' : 'reboot';
    
    try {
      await executeDeviceAction(deviceId!, { 
        type: actionType, 
        body: { command } 
      });
      toast.success(`Command ${command} accepted`);
    } catch (err) {
      toast.error('Dispatch failed');
    }
    setConfirmDialog({ open: false, type: null });
  };

  const handleDeleteScreenshot = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await deleteScreenshot(deviceId!, id);
      }
      queryClient.invalidateQueries({ queryKey: ['device-screenshots', deviceId] });
      toast.success('Screenshot(s) deleted');
    } catch (err) {
      toast.error('Failed to delete screenshots');
    }
  };

  const handleClearScreenshots = async () => {
    try {
      await clearScreenshots(deviceId!);
      queryClient.invalidateQueries({ queryKey: ['device-screenshots', deviceId] });
      toast.success('History cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  if (isDeviceLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-[10px] tracking-[0.2em] text-muted-foreground">Initializing Command Channel</p>
    </div>
  );

  if (!device || !device.deviceProperties) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <p className="font-bold text-[10px] tracking-[0.2em]">Terminal Data Missing or Unavailable</p>
      <Button variant="outline" onClick={() => navigate("/dashboard/devices")}>Back to List</Button>
    </div>
  );

  const realProps = device.deviceProperties;
  
  // Helper to normalize backend interface types (lan/wifi ap/4G) to UI keys (eth/wifi/ap/4g)
  const normalizeIfaceType = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('ap')) return 'ap';
    if (t === 'lan') return 'eth';
    return t;
  };

  const activeInterface = normalizeIfaceType(realProps.ifstatus?.types?.find(i => i.connected === 1)?.type || 'eth');

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* SECTION 1: CORE IDENTITY (TOP BAR) */}
      <header className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         <Card className="lg:col-span-3 rounded-2xl border-none shadow-sm ring-1 ring-muted/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-primary/5 rounded-2xl border shadow-inner">
                  <Monitor className="h-8 w-8 text-primary" />
               </div>
               <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                     <h1 className="text-2xl font-bold tracking-tight">{device.deviceName}</h1>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground tracking-wider mb-0.5">Device Status</span>
                        <DeviceStatusBadge status={resolveDeviceStatus(device)} />
                     </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] font-bold text-muted-foreground tracking-wide">
                     <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" /> SN: <span className="text-foreground font-mono">{realProps.info?.info.serialno}</span></span>
                     <span className="flex items-center gap-1.5"><Layout className="h-3.5 w-3.5" /> {realProps.info?.info.model}</span>
                     <span className="flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" /> OS: {realProps.info?.info.vername}</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/devices")} className="rounded-xl border h-10 w-10">
                  <ArrowLeft className="h-4 w-4" />
               </Button>
               <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button 
                          variant="outline" 
                          className="h-10 rounded-xl font-bold text-xs gap-2" 
                          onClick={() => setShowBatchCommand(true)}
                       >
                          <Zap className="h-4 w-4 text-amber-500" /> Advanced Command
                       </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                       <p>Advanced Wizard: chain multiple commands sequentially</p>
                    </TooltipContent>
                  </Tooltip>
               </TooltipProvider>
               <Button variant="outline" className="h-10 rounded-xl font-bold text-xs gap-2" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> Sync
               </Button>
            </div>
         </Card>
         
         <Card className="rounded-2xl border-none ring-1 ring-muted/60 bg-muted/20 p-5 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-1">Last Seen</p>
            <p className="text-lg font-bold tracking-tight">{device.lastReportTime ? formatRelative(device.lastReportTime) : 'N/A'}</p>
            <div className="flex items-center gap-2 mt-2">
               <div className={cn("h-1.5 w-1.5 rounded-full", sseConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
               <span className="text-[9px] font-bold tracking-tighter text-muted-foreground">
                  Console Connected: {sseConnected ? "Active" : "Disconnected"}
               </span>
            </div>
         </Card>
      </header>

      {/* SECTION 2: COCKPIT (SCREEN + CONTROLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monitor & Player */}
        <div className="lg:col-span-8">
           <Card className="overflow-hidden border-none shadow-2xl bg-black h-full flex flex-col ring-1 ring-white/10">
              <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-zinc-950/80 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-[10px] font-bold tracking-widest text-zinc-500 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Latest Screenshot
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                   {screenshotUrl ? (
                      <Badge variant="outline" className="text-[9px] h-5 border-zinc-800 text-zinc-400 font-mono tracking-tighter">
                         Captured: {formatDateTime(screenshotTime)}
                      </Badge>
                   ) : (
                      <Badge variant="outline" className="text-[9px] h-5 border-zinc-800 text-amber-500/80 font-bold tracking-tight">
                         No screenshot reported
                      </Badge>
                   )}
                   <Badge variant="outline" className="text-[9px] h-5 border-zinc-800 text-zinc-600 font-mono tracking-tighter">
                      {realProps.dimension?.real_width}x{realProps.dimension?.real_height}
                   </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative flex items-center justify-center bg-zinc-900/30 overflow-hidden">
                <div className="relative w-full aspect-video group">
                  {screenshotUrl ? (
                    <>
                      <DeviceScreenshot
                        src={screenshotUrl}
                        deviceName={device.deviceName}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-4">
                      <div className="p-6 rounded-full bg-zinc-800/50">
                        <Monitor className="h-12 w-12 opacity-20" />
                      </div>
                      <p className="text-xs font-bold tracking-[0.2em] opacity-40">Visual data unavailable</p>
                    </div>
                  )}

                  {/* Device Status Warning Overlay */}
                  {resolveDeviceStatus(device) === 'offline' && (
                    <div className="absolute top-4 left-4 right-4 animate-in slide-in-from-top-4 duration-500 z-20">
                      <div className="bg-amber-500/90 backdrop-blur-md border border-amber-400/50 rounded-xl p-3 flex items-center gap-3 shadow-2xl">
                        <AlertTriangle className="h-4 w-4 text-amber-950 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-amber-950 tracking-tight">Device Offline</p>
                          <p className="text-[9px] text-amber-900 leading-tight truncate">
                             Commands will be queued and may expire if the device doesn't reconnect soon.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Now Playing HUD */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                     {realProps.vsns?.playing ? (
                        <div className="flex items-center gap-5 p-5 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500">
                           <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                              <Play className="h-6 w-6 text-white fill-white/10" />
                           </div>
                           <div className="text-white min-w-0">
                              <p className="text-[10px] font-bold tracking-widest text-white/40 mb-0.5">
                                 Playing: {realProps.vsns.playing.type === 'rotation' ? 'Rotation' : 'Spot'}
                              </p>
                              <p className="text-lg font-bold tracking-tight truncate max-w-[300px]">{realProps.vsns.playing.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                 <Badge className="bg-white/10 text-white border-none text-[9px] h-4 font-bold">
                                    Source: {realProps.vsns.playing.source === 'internet' ? 'Cloud' : 'Local'}
                                 </Badge>
                              </div>
                           </div>
                        </div>
                     ) : <div />}

                     {/* Screenshot Actions */}
                     <div className="hidden xl:flex flex-col gap-2 items-end">
                        {screenshotUrl && (
                           <TooltipProvider>
                              <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button 
                                       size="icon" 
                                       variant="secondary" 
                                       className="h-10 w-10 rounded-full shadow-2xl hover:scale-110 transition-transform" 
                                       onClick={() => setPreviewImage(screenshotUrl)}
                                    >
                                       <Maximize2 className="h-5 w-5" />
                                    </Button>
                                 </TooltipTrigger>
                                 <TooltipContent side="left">
                                    <p className="text-xs font-bold">Full Screen View</p>
                                 </TooltipContent>
                              </Tooltip>
                           </TooltipProvider>
                        )}

                        <TooltipProvider>
                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button 
                                    size="icon" 
                                    variant="secondary" 
                                    className="h-10 w-10 rounded-full shadow-2xl hover:scale-110 transition-transform" 
                                    onClick={() => setShowScreenshotManager(true)}
                                 >
                                    <Layers className="h-5 w-5" />
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                 <p className="text-xs font-bold">Screenshot History</p>
                              </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button 
                                    size="icon" 
                                    variant="secondary" 
                                    className="h-10 w-10 rounded-full shadow-2xl hover:scale-110 transition-transform" 
                                    onClick={handleCapture} 
                                    disabled={isCapturing}
                                 >
                                    {isCapturing ? <RefreshCw className="h-5 w-5 animate-spin text-primary" /> : <Camera className="h-5 w-5" />}
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                 <p className="text-xs font-bold">Refresh Screenshot</p>
                              </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                     </div>
                  </div>
                </div>
              </CardContent>
           </Card>
        </div>

        {/* Right: Command Center */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <Card className="shadow-xl border-none ring-1 ring-muted/60 h-full flex flex-col overflow-hidden">
              <CardHeader className="pb-5 border-b bg-muted/5 px-6 shrink-0">
                 <CardTitle className="text-[11px] font-bold flex items-center gap-2 tracking-[0.15em] text-slate-500">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500/10" /> Command Center
                 </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-8 pt-6 px-6 scrollbar-none">
                 {/* Power Control */}
                 <div className="space-y-4">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest">Power Control</p>
                    <div className="grid grid-cols-1 gap-2">
                       <Button 
                          variant="outline" 
                          className="h-12 justify-start rounded-xl font-bold text-xs gap-3 border-amber-500/10 bg-amber-500/[0.02] hover:bg-amber-500/5 text-amber-700 group transition-all"
                          onClick={() => setConfirmDialog({ open: true, type: 'sleep' })}
                       >
                          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <Moon className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                             <p>Enter Standby</p>
                             <p className="text-[9px] font-normal text-amber-600/60 leading-none mt-0.5">Suspend content rendering</p>
                          </div>
                       </Button>
                       <Button 
                          variant="outline" 
                          className="h-12 justify-start rounded-xl font-bold text-xs gap-3 border-rose-500/10 bg-rose-500/[0.02] hover:bg-rose-500/5 text-rose-700 group transition-all"
                          onClick={() => setConfirmDialog({ open: true, type: 'reboot' })}
                       >
                          <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                             <RotateCw className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                             <p>Hard Reboot</p>
                             <p className="text-[9px] font-normal text-rose-600/60 leading-none mt-0.5">Force power cycle terminal</p>
                          </div>
                       </Button>
                    </div>
                 </div>

                 {/* Input Source */}
                 <div className="space-y-4 bg-muted/20 p-5 rounded-2xl border border-muted/20 transition-colors">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest">Input Source</p>
                    <Select value={inputMode} onValueChange={setInputMode}>
                       <SelectTrigger className="h-9 text-xs font-bold bg-background border shadow-sm rounded-xl">
                          <div className="flex items-center gap-2">
                             <Power className="h-3.5 w-3.5 text-primary" />
                             <SelectValue />
                          </div>
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="internal" className="text-xs font-bold text-slate-700">Internal Player</SelectItem>
                          <SelectItem value="hdmi" className="text-xs font-bold text-slate-700">HDMI Input</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>

                 {/* Display Adjustments */}
                 <div className="space-y-8 px-1">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-widest">Adjustments</p>
                    
                    {/* Brightness */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-muted-foreground">
                          <span className="flex items-center gap-2">
                             <Sun className="h-4 w-4 text-amber-500" /> Brightness
                             {brightnessPct !== originalValues.brightness && <Badge className="ml-2 bg-amber-500/10 text-amber-600 border-none text-[8px] h-4">Pending</Badge>}
                          </span>
                          <div className="flex items-center gap-3">
                             <span className="font-mono bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md border border-amber-500/10">{brightnessPct}%</span>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-6 w-6 rounded-md", !isBrightnessLocked && "bg-amber-500/10 text-amber-600")}
                                onClick={() => setIsBrightnessLocked(!isBrightnessLocked)}
                             >
                                {isBrightnessLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                             </Button>
                          </div>
                       </div>
                       <Slider 
                          value={[brightnessPct]} 
                          max={100} 
                          onValueChange={(v) => setBrightnessPct(v[0])} 
                          className={cn("transition-opacity", isBrightnessLocked ? "opacity-40 pointer-events-none" : "cursor-pointer")} 
                       />
                    </div>

                    {/* Volume */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-muted-foreground">
                          <span className="flex items-center gap-2">
                             <Volume2 className="h-4 w-4 text-blue-500" /> Volume
                             {volumeLevel !== originalValues.volume && <Badge className="ml-2 bg-blue-500/10 text-blue-600 border-none text-[8px] h-4">Pending</Badge>}
                          </span>
                          <div className="flex items-center gap-3">
                             <span className="font-mono bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md border border-blue-500/10">{volumeLevel} / 15</span>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-6 w-6 rounded-md", !isVolumeLocked && "bg-blue-500/10 text-blue-600")}
                                onClick={() => setIsVolumeLocked(!isVolumeLocked)}
                             >
                                {isVolumeLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                             </Button>
                          </div>
                       </div>
                       <Slider 
                          value={[volumeLevel]} 
                          max={15} 
                          step={1} 
                          onValueChange={(v) => setVolumeLevel(v[0])} 
                          className={cn("transition-opacity", isVolumeLocked ? "opacity-40 pointer-events-none" : "cursor-pointer")} 
                       />
                    </div>

                    {/* Color Temp */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-muted-foreground">
                          <span className="flex items-center gap-2">
                             <ThermometerSnowflake className="h-4 w-4 text-emerald-500" /> Color Temp
                             {colorTemp !== originalValues.colorTemp && <Badge className="ml-2 bg-emerald-500/10 text-emerald-600 border-none text-[8px] h-4">Pending</Badge>}
                          </span>
                          <div className="flex items-center gap-3">
                             <span className="font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-500/10">{colorTemp}K</span>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-6 w-6 rounded-md", !isColorTempLocked && "bg-emerald-500/10 text-emerald-600")}
                                onClick={() => setIsColorTempLocked(!isColorTempLocked)}
                             >
                                {isColorTempLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                             </Button>
                          </div>
                       </div>
                       <Slider 
                          value={[colorTemp]} 
                          min={2000} 
                          max={10000} 
                          step={100} 
                          onValueChange={(v) => setColorTemp(v[0])} 
                          className={cn("transition-opacity", isColorTempLocked ? "opacity-40 pointer-events-none" : "cursor-pointer")} 
                       />
                    </div>
                 </div>

                 {hasChanges && (
                   <div className="flex gap-2 animate-in slide-in-from-bottom-2 pb-2">
                      <Button onClick={handleApplyChanges} className="flex-1 h-12 rounded-xl font-bold text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20">Apply Changes</Button>
                      <Button onClick={handleResetChanges} variant="outline" className="h-12 rounded-xl font-bold text-[10px] tracking-[0.2em]">Cancel</Button>
                   </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>

      {/* SECTION 3: SYSTEM OVERVIEW & NETWORK */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         {/* Hardware Information */}
         <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoGroup title="Device Information" icon={Layers}>
               <InfoItem label="Device Name" value={device.deviceName} highlight />
               <InfoItem label="Hardware Model" value={realProps.info?.info.model} />
               <InfoItem label="System Uptime" value={formatUptime(realProps.info?.info.up || 0)} highlight />
               <InfoItem label="Firmware Version" value={realProps.info?.info.vername} />
               <InfoGroupSeparator />
               <InfoItem label="Orientation" value={realProps.screen_orientation?.orientation === 'landscape' ? 'Landscape' : 'Portrait'} />
               <InfoItem label="Frame Rate" value={`${realProps.dimension?.fps} FPS`} />
            </InfoGroup>
            
            <InfoGroup title="Network Status" icon={Network}>
               <Tabs defaultValue={activeInterface} className="w-full">
                  <TabsList className="grid grid-cols-4 h-8 bg-muted/50 p-1 rounded-xl mb-6">
                     <TabsTrigger value="eth" className="rounded-lg text-[9px] font-bold tracking-tighter data-[state=active]:bg-background data-[state=active]:shadow-sm">LAN</TabsTrigger>
                     <TabsTrigger value="wifi" className="rounded-lg text-[9px] font-bold tracking-tighter data-[state=active]:bg-background data-[state=active]:shadow-sm">WiFi</TabsTrigger>
                     <TabsTrigger value="ap" className="rounded-lg text-[9px] font-bold tracking-tighter data-[state=active]:bg-background data-[state=active]:shadow-sm">AP</TabsTrigger>
                     <TabsTrigger value="4g" className="rounded-lg text-[9px] font-bold tracking-tighter data-[state=active]:bg-background data-[state=active]:shadow-sm">4G</TabsTrigger>
                  </TabsList>

                                    {realProps.ifstatus?.types.map((iface) => {

                                       const normalized = normalizeIfaceType(iface.type);

                                       return (

                                          <TabsContent key={iface.type} value={normalized} className="mt-0 focus-visible:ring-0">

                                             <div className="space-y-4">

                                                <div className="flex justify-between items-center mb-2">

                                                   <div className="flex items-center gap-2">

                                                      {normalized === 'eth' && <Cable className="h-3 w-3 text-primary" />}

                                                      {normalized === 'wifi' && <Wifi className="h-3 w-3 text-primary" />}

                                                      {normalized === 'ap' && <Share2 className="h-3 w-3 text-primary" />}

                                                      {normalized === '4g' && <Signal className="h-3 w-3 text-primary" />}

                                                      <span className="text-[10px] font-bold tracking-widest text-slate-500">

                                                         {normalized === 'eth' ? 'Ethernet Port' : normalized === 'ap' ? 'WiFi Hotspot' : normalized.toUpperCase() + ' Module'}

                                                      </span>

                                                   </div>

                                                   <Badge variant="outline" className={cn(

                                                      "text-[8px] font-bold h-4 border-none",

                                                      iface.connected === 1 ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"

                                                   )}>

                                                      {iface.connected === 1 ? 'ACTIVE' : 'INACTIVE'}

                                                   </Badge>

                                                </div>

                  

                                                <div className="space-y-3 pl-1">
                                                   {(iface.SSID || iface.currentap) && <InfoItem label="Network Name" value={iface.SSID || iface.currentap} fontMono highlight />}
                                                   {iface.ips?.ip && <InfoItem label="IPv4 Address" value={iface.ips.ip} fontMono highlight />}
                                                   {iface.ips?.mask && <InfoItem label="Subnet Mask" value={iface.ips.mask} fontMono />}
                                                   {iface.ips?.gateway && <InfoItem label="Gateway" value={iface.ips.gateway} fontMono />}
                                                   <InfoItem label="MAC Address" value={iface.mac} fontMono />
                                                   {iface.speed !== undefined && iface.speed > 0 && <InfoItem label="Link Speed" value={`${iface.speed} Mbps`} />}
                                                   {iface.strength !== undefined && iface.strength !== null && <InfoItem label="Signal Strength" value={`${iface.strength}%`} highlight />}
                                                   
                                                   {normalized === '4g' && (
                                                      <>
                                                         <Separator className="my-2 opacity-30" />
                                                         <InfoItem label="Operator" value={realProps["4ginfo"]?.operator} />
                                                         <InfoItem label="RSSI" value={`${realProps["4ginfo"]?.signal} dBm`} highlight />
                                                         <InfoItem label="Modem IMEI" value={realProps["4ginfo"]?.imei} fontMono />
                                                      </>
                                                   )}

                                                   {iface.connected !== 1 && (
                                                      <div className="pt-4 flex items-center gap-2 opacity-40">
                                                         <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                                                         <p className="text-[8px] font-bold tracking-widest text-muted-foreground italic uppercase">
                                                            Standby / Disconnected
                                                         </p>
                                                      </div>
                                                   )}
                                                </div>

                                             </div>

                                          </TabsContent>

                                       );

                                    })}
               </Tabs>
            </InfoGroup>
         </div>

         {/* System Resources */}
         <Card className="xl:col-span-4 rounded-3xl border-none ring-1 ring-muted/60 bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col justify-between">
            <CardHeader className="p-0 pb-6">
               <CardTitle className="text-[10px] font-bold tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" /> System Resources
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-8 flex-1">
               <ResourceProgress 
                  label="Storage Space" 
                  used={(realProps.info?.info?.storage?.total || 0) - (realProps.info?.info?.storage?.free || 0)} 
                  total={realProps.info?.info?.storage?.total || 1} 
                  unit="GB" 
                  color="bg-emerald-500"
               />
               <ResourceProgress 
                  label="System Memory" 
                  used={(realProps.info?.info?.mem?.total || 0) - (realProps.info?.info?.mem?.free || 0)} 
                  total={realProps.info?.info?.mem?.total || 1} 
                  unit="MB"
                  color="bg-blue-500"
               />
               <div className="pt-4 p-5 bg-card rounded-2xl border shadow-sm flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                     <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                     <p className="text-[9px] font-bold text-muted-foreground ">Status Note</p>
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All modules functioning within normal parameters.</p>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* SECTION 4: DEEP ASSETS & SYSTEM POLICIES */}
      <Tabs defaultValue="assets" className="w-full">
         <TabsList className="bg-muted/40 p-1 rounded-2xl border h-11 mb-6 flex w-full md:w-auto overflow-x-auto scrollbar-none">
            <TabsTrigger value="assets" className="rounded-xl flex-1 md:px-10 font-bold text-[10px] tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-md">Asset Inventory</TabsTrigger>
            <TabsTrigger value="operations" className="rounded-xl flex-1 md:px-10 font-bold text-[10px] tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-md">Recent Operations</TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-xl flex-1 md:px-10 font-bold text-[10px] tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-md">Schedule</TabsTrigger>
            <TabsTrigger value="policy" className="rounded-xl flex-1 md:px-10 font-bold text-[10px] tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-md">Device Policy</TabsTrigger>
         </TabsList>

         <TabsContent value="operations" className="mt-0">
            <Card className="rounded-3xl border-none ring-1 ring-muted/60 overflow-hidden shadow-xl bg-card">
               <CardHeader className="px-8 py-6 border-b bg-muted/5 flex flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                     <CardTitle className="text-lg font-bold tracking-tighter">Recent Operations</CardTitle>
                     <CardDescription className="text-[10px] font-bold text-muted-foreground tracking-wider">Audit trail of commands dispatched to this device</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl font-bold text-xs gap-2"
                    onClick={() => navigate('/dashboard/logs', { state: { deviceId: device?.deviceId } })}
                  >
                    <HistoryIcon className="h-4 w-4" /> Full Logs
                  </Button>
               </CardHeader>
               <CardContent className="p-8">
                  <div className="space-y-3">
                     {recentOperations.length > 0 ? (
                        recentOperations.map((op) => (
                           <div key={op.id} className="p-4 rounded-2xl bg-muted/20 border border-muted/40 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                 <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center border shadow-sm",
                                    op.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                    op.status === 'FAILED' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                                    "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                 )}>
                                    <Activity className="h-5 w-5" />
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-2">
                                       <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{op.actionType}</span>
                                       <Badge variant="outline" className={cn(
                                          "text-[8px] h-4 border-none px-1.5 font-bold",
                                          op.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-600" :
                                          op.status === 'FAILED' ? "bg-rose-500/10 text-rose-600" :
                                          "bg-amber-500/10 text-amber-600"
                                       )}>
                                          {op.status}
                                       </Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {op.logId}</p>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-8 text-right">
                                 {op.errorMessage && (
                                    <p className="text-[10px] text-rose-500 font-medium max-w-[200px] truncate">{op.errorMessage}</p>
                                 )}
                                 <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-500">{op.createdAt ? formatRelative(op.createdAt) : 'N/A'}</p>
                                    <button 
                                       className="text-[10px] font-bold text-primary hover:underline"
                                       onClick={() => navigate(`/dashboard/logs?tab=terminal&id=${op.id}`)}
                                    >
                                       View Details
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground opacity-30">
                           <Activity className="h-12 w-12" />
                           <p className="text-sm font-bold tracking-[0.2em]">No command history available</p>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="assets" className="mt-0">
            <Card className="rounded-3xl border-none ring-1 ring-muted/60 overflow-hidden shadow-xl bg-card">
               <CardHeader className="px-8 py-6 border-b bg-muted/5 flex flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                     <CardTitle className="text-lg font-bold tracking-tighter ">Media Cache</CardTitle>
                     <CardDescription className="text-[10px] font-bold text-muted-foreground tracking-wider">Synchronized content stored in device local partitions</CardDescription>
                  </div>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input placeholder="Search cache..." className="pl-10 h-11 w-64 bg-muted/30 border-none rounded-xl text-xs font-bold" />
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="grid grid-cols-12 px-8 py-5 bg-muted/20 text-[9px] font-bold text-slate-500 tracking-widest border-b">
                     <div className="col-span-7">Resource Name</div>
                     <div className="col-span-2 text-center">Category</div>
                     <div className="col-span-3 text-right">Disk Size</div>
                  </div>
                  <div className="divide-y divide-muted/40 max-h-[600px] overflow-y-auto">
                     {realProps.vsns?.contents && realProps.vsns.contents.length > 0 ? (
                        realProps.vsns.contents.map(group => group.content.map(vsn => (
                           <div key={vsn.md5} className="grid grid-cols-12 px-8 py-6 items-center hover:bg-primary/[0.02] transition-colors group">
                              <div className="col-span-7 flex items-center gap-5">
                                 <div className="h-12 w-12 rounded-2xl bg-card border flex items-center justify-center text-muted-foreground shadow-sm group-hover:scale-105 transition-transform">
                                    <FileText className="h-6 w-6" />
                                 </div>
                                 <div className="min-w-0 space-y-0.5">
                                    <p className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">{vsn.name}</p>
                                    <p className="text-[10px] font-mono text-muted-foreground opacity-40 truncate max-w-[400px]">{vsn.md5}</p>
                                 </div>
                              </div>
                              <div className="col-span-2 text-center">
                                 <Badge variant="outline" className="text-[9px] font-bold rounded-lg border-none bg-indigo-500/10 text-indigo-600 px-3">{group.type}</Badge>
                              </div>
                              <div className="col-span-3 text-right">
                                 <p className="text-xs font-bold tabular-nums">{(vsn.size / 1024 / 1024).toFixed(1)} <span className="text-[10px] font-medium opacity-40 ml-1">MB</span></p>
                              </div>
                           </div>
                        )))
                     ) : (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 text-muted-foreground opacity-30">
                           <Database className="h-12 w-12" />
                           <p className="text-sm font-bold tracking-[0.2em]">No cached assets found</p>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="schedule" className="mt-0">
            <Card className="rounded-[3rem] border-none ring-1 ring-muted/60 overflow-hidden shadow-xl bg-card">
               <CardHeader className="px-10 py-8 border-b bg-muted/5 flex flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                     <CardTitle className="text-xl font-bold tracking-tight">Current Schedule</CardTitle>
                     <CardDescription className="text-[10px] font-bold text-muted-foreground tracking-widest">Active schedule and program visibility rules</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                     <Button 
                        variant="outline" 
                        className="h-10 rounded-xl font-bold text-xs gap-2 border-2"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['device-schedule', deviceId] })}
                     >
                        <RefreshCw className="h-4 w-4" /> Sync Status
                     </Button>
                     <Button className="h-10 rounded-xl font-bold text-xs gap-2 bg-zinc-900 text-white px-6" onClick={() => navigate('/dashboard/schedule')}>
                        Manage Schedules
                     </Button>
                  </div>
               </CardHeader>
               <CardContent className="p-10 space-y-10">
                  {/* Schedule Binding Info */}
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex-1 p-8 rounded-[2rem] bg-muted/20 border-2 border-dashed border-muted flex flex-col gap-4">
                        <p className="text-[10px] font-bold text-muted-foreground tracking-widest">Bound Schedule</p>
                        {deviceSchedule ? (
                           <div className="flex items-center gap-4">
                              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                                 <CalendarDays className="h-6 w-6" />
                              </div>
                              <div>
                                 <h4 className="text-xl font-bold tracking-tighter">{deviceSchedule.name}</h4>
                                 <p className="text-xs text-muted-foreground font-medium mt-1">
                                    Status: <span className={cn("font-bold", deviceSchedule.enabled ? "text-emerald-600" : "text-amber-600")}>
                                       {deviceSchedule.enabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                 </p>
                              </div>
                           </div>
                        ) : (
                           <div className="flex items-center gap-4 opacity-50">
                              <div className="p-3 rounded-2xl bg-muted text-muted-foreground border">
                                 <CalendarDays className="h-6 w-6" />
                              </div>
                              <p className="text-sm font-bold">No schedule bound</p>
                           </div>
                        )}
                     </div>
                     <div className="md:w-64 p-8 rounded-[2rem] bg-muted/20 border-2 border-dashed border-muted flex flex-col justify-center gap-1">
                        <p className="text-[10px] font-bold text-muted-foreground tracking-widest">Rule Summary</p>
                        <div className="flex items-center justify-between mt-2">
                           <span className="text-xs font-bold">Programs</span>
                           <Badge variant="secondary" className="font-bold text-[10px]">
                              {deviceSchedule?.contentsRules?.length || 0} Rules
                           </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-xs font-bold">Commands</span>
                           <Badge variant="secondary" className="font-bold text-[10px]">
                              {deviceSchedule?.commandRules?.length || 0} Actions
                           </Badge>
                        </div>
                     </div>
                  </div>

                  {/* Device Visibility (AllowList) */}
                  <div className="space-y-6">
                     <div className="flex items-center justify-between px-2">
                        <h3 className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground">Program Allowlist</h3>
                        <div className="flex items-center gap-4 text-[9px] font-bold text-muted-foreground/40">
                           <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500/20 border border-blue-500/40" /> From Schedule</span>
                           <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500/20 border border-emerald-500/40" /> Direct Publish</span>
                        </div>
                     </div>
                     
                     <div className="rounded-[2rem] border overflow-hidden">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-muted/30 border-b text-[9px] font-bold tracking-widest text-muted-foreground">
                                 <th className="px-6 py-4">Release Program</th>
                                 <th className="px-4 py-4 text-center">Version</th>
                                 <th className="px-4 py-4">Source</th>
                                 <th className="px-4 py-4">Status</th>
                                 <th className="px-6 py-4 text-right">Progress</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y">
                              {programAllowlist.length > 0 ? (
                                 programAllowlist.map((item: any) => (
                                    <VisibilityRow 
                                       key={`${item.programId}-${item.version}`}
                                       name={item.programName} 
                                       id={item.version} 
                                       source={item.source} 
                                       status={item.deploymentStatus || 'unknown'} 
                                       progress={item.progress || (item.deploymentStatus === 'DOWNLOADED' ? 100 : 0)} 
                                    />
                                 ))
                              ) : (
                                 <tr>
                                    <td colSpan={5} className="py-12 text-center text-muted-foreground opacity-50">
                                       <p className="text-xs font-bold">No programs currently assigned to this device</p>
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="policy" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="rounded-3xl border-none ring-1 ring-muted/60 shadow-sm overflow-hidden lg:col-span-1">
                  <CardHeader className="bg-muted/5 border-b py-6 px-8">
                     <CardTitle className="text-[10px] font-bold tracking-widest flex items-center gap-3 text-slate-500">
                        <Clock className="h-4 w-4 text-primary" /> System Clock
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                     <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 text-center shadow-inner ring-1 ring-primary/5">
                        <p className="text-[10px] font-bold text-primary/60 tracking-[0.3em] mb-2">Current Time</p>
                        <p className="text-6xl font-bold tracking-tighter text-primary tabular-nums drop-shadow-sm">{realProps.newrtc?.time?.split(' ')[1] || '--:--'}</p>
                        <p className="text-xs font-bold text-muted-foreground mt-4 tracking-widest opacity-60">{realProps.newrtc?.time?.split(' ')[0] || '--'}</p>
                     </div>
                     <div className="space-y-5 px-4">
                        <PolicyData label="Timezone" value={realProps.newrtc?.timezoneId} />
                        <PolicyData label="Offset" value="GMT +8:00" />
                        <PolicyData label="Time Server" value="pool.ntp.org" active />
                     </div>
                  </CardContent>
               </Card>

               <Card className="rounded-3xl border-none ring-1 ring-muted/60 shadow-sm overflow-hidden lg:col-span-2">
                  <CardHeader className="bg-muted/5 border-b py-6 px-8">
                     <CardTitle className="text-[10px] font-bold tracking-widest flex items-center gap-3 text-slate-500">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Security Settings
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                     <PolicyItem label="Inbound Firewall" desc="Reject unauthorized socket handshakes" active={realProps.inboundfirewall?.status === 'on'} />
                     <PolicyItem label="Auto Update" desc="Self-apply security patches automatically" active />
                     <PolicyItem label="USB Access" desc="Allow media ingestion via physical ports" active={false} />
                     <PolicyItem label="Sync Mode" desc="Multi-screen frame synchronization" active={realProps.sync_program_mode?.sync_program_ntp_enable === 1} />
                  </CardContent>
               </Card>
            </div>
         </TabsContent>
      </Tabs>

      {/* DANGEROUS ACTION CONFIRMATION */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null })}>
        <DialogContent className="sm:max-w-[440px] rounded-[2.5rem] p-10 overflow-hidden border-none shadow-2xl ring-1 ring-muted/50">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
             {confirmDialog.type === 'sleep' ? <Moon className="h-48 w-48" /> : <RotateCw className="h-48 w-48" />}
          </div>
          <DialogHeader className="relative z-10 space-y-4">
            <div className={cn(
                "h-20 w-20 rounded-3xl flex items-center justify-center border-2 shadow-inner mb-2",
                confirmDialog.type === 'sleep' ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600"
             )}>
                {confirmDialog.type === 'sleep' ? <Moon className="h-10 w-10" /> : <RotateCw className="h-10 w-10" />}
             </div>
            <DialogTitle className="text-3xl font-bold tracking-tighter leading-none">
               {confirmDialog.type === 'sleep' ? "Confirm Standby" : "Confirm Reboot"}
            </DialogTitle>
            <DialogDescription className="text-sm font-bold leading-relaxed text-slate-500">
               {confirmDialog.type === 'sleep' 
                  ? "This will put the display into low-power standby mode. Content rendering will stop immediately." 
                  : "This will force a full hardware power cycle. Terminal will be inaccessible for roughly 90 seconds."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-10 flex flex-col items-center gap-6 relative z-10">
             <SlideToUnlock 
                onUnlock={executeDangerousAction} 
                label={confirmDialog.type === 'sleep' ? "Slide to suspend" : "Slide to hard reset"} 
             />
             <Button variant="ghost" className="font-bold text-[10px] tracking-widest text-muted-foreground/60 hover:text-foreground" onClick={() => setConfirmDialog({ open: false, type: null })}>
                Abort Operation
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BatchCommandDialog
        open={showBatchCommand}
        onOpenChange={setShowBatchCommand}
        devices={device ? [device] : []}
        initialSelectedDeviceIds={device ? [String(device.deviceId)] : []}
        mode="single-device"
      />

      <ScreenshotManagerDialog
        open={showScreenshotManager}
        onOpenChange={setShowScreenshotManager}
        screenshots={historicalScreenshots}
        onDelete={handleDeleteScreenshot}
        onClearAll={handleClearScreenshots}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['device-screenshots', deviceId] })}
      />

      {/* Full Size Preview Dialog */}
      {previewImage && (
         <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent 
               className="max-w-[98vw] w-auto h-auto p-0 bg-transparent border-none shadow-none flex items-center justify-center focus-visible:outline-none scale-100 transition-all"
            >
               <div className="relative group animate-in zoom-in-95 duration-300 flex flex-col items-center">
                  <img 
                     src={previewImage} 
                     className="max-w-full max-h-[95vh] rounded-[2.5rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] border-8 border-white/10" 
                     alt="Preview" 
                  />
                  <Button 
                     size="icon" 
                     variant="secondary" 
                     className="absolute top-6 right-6 rounded-full h-12 w-12 shadow-2xl bg-black/50 text-white border-white/10 hover:bg-black/80 backdrop-blur-xl transition-all"
                     onClick={() => setPreviewImage(null)}
                  >
                     <X className="h-6 w-6" />
                  </Button>
                  
                  <div className="mt-6 px-8 py-3 bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 text-white/90 text-xs font-bold tracking-[0.3em] shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                     Press ESC or Click Outside to exit
                  </div>
               </div>
            </DialogContent>
         </Dialog>
      )}

    </div>
  );
}

function PolicyData({ label, value, active = false }: { label: string, value: any, active?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[10px] group">
       <span className="font-bold text-muted-foreground tracking-widest group-hover:text-primary transition-colors">{label}</span>
       <div className="flex items-center gap-2">
          <span className="font-bold">{value}</span>
          {active && <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />}
       </div>
    </div>
  );
}

function InfoGroup({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <Card className="border-none shadow-sm bg-card rounded-[2rem] overflow-hidden ring-1 ring-muted/60">
      <CardHeader className="py-5 border-b bg-muted/5 px-10">
        <CardTitle className="text-[10px] font-bold tracking-[0.2em] flex items-center gap-3 text-slate-500">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-8 pb-10 px-10">
        {children}
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value, copyable = false, highlight = false, fontMono = false }: { label: string, value: any, copyable?: boolean, highlight?: boolean, fontMono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-6 group/item">
      <span className="text-muted-foreground font-bold text-[9px] tracking-[0.15em] shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          "font-bold truncate text-xs tracking-tight", 
          highlight ? "text-primary" : "text-slate-800 dark:text-slate-200",
          fontMono && "font-mono normal-case tracking-tighter"
        )}>
          {value || "N/A"}
        </span>
        {copyable && value && (
          <button onClick={() => { navigator.clipboard.writeText(String(value)); toast.info("Copied to clipboard"); }} 
            className="p-1 opacity-0 group-hover/item:opacity-100 hover:bg-muted rounded text-primary transition-all">
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function InfoGroupSeparator() {
  return <Separator className="my-3 opacity-30 border-dashed" />;
}

function PolicyItem({ label, desc, active, last = false }: { label: string, desc: string, active: boolean, last?: boolean }) {
  return (
    <div className={cn("space-y-4", !last && "pb-6 border-b border-muted")}>
       <div className="flex items-center justify-between">
          <div className="space-y-1.5">
             <p className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200">{label}</p>
             <p className="text-[10px] font-bold text-muted-foreground">{desc}</p>
          </div>
          <Switch checked={active} disabled={label.includes("OTA")} className="data-[state=checked]:bg-emerald-500" />
       </div>
    </div>
  );
}

function ResourceProgress({ label, used, total, unit, color = "bg-primary" }: { label: string, used: number, total: number, unit: string, color?: string }) {
  const percentage = Math.min(100, (used / total) * 100);
  const isHigh = percentage > 85;
  const formattedUsed = unit === 'GB' ? (used / (1024 ** 3)).toFixed(1) : (used / (1024 ** 2)).toFixed(0);
  const formattedTotal = unit === 'GB' ? (total / (1024 ** 3)).toFixed(0) : (total / (1024 ** 2)).toFixed(0);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold tracking-widest text-slate-500">{label}</span>
        <span className={cn("font-mono font-bold text-xs", isHigh ? "text-rose-500" : "text-slate-700 dark:text-slate-300")}>{percentage.toFixed(0)}%</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
         <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--primary),0.5)]", color, isHigh && "bg-rose-500")} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between text-[9px] font-bold text-muted-foreground/60 tracking-tighter">
        <span>Mapped: {formattedUsed} {unit}</span>
        <span>Capacity: {formattedTotal} {unit}</span>
      </div>
    </div>
  );
}

function VisibilityRow({ name, id, source, status, progress }: { name: string, id: number, source: 'direct' | 'schedule', status: string, progress: number }) {
   return (
      <tr className="hover:bg-muted/5 transition-colors group">
         <td className="px-6 py-4">
            <div className="flex items-center gap-3">
               <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border shadow-sm", source === 'schedule' ? "bg-blue-500/5 text-blue-600 border-blue-500/10" : "bg-emerald-500/5 text-emerald-600 border-emerald-500/10")}>
                  {source === 'schedule' ? <CalendarDays className="h-4 w-4" /> : <Send className="h-4 w-4" />}
               </div>
               <span className="text-xs font-bold tracking-tight">{name}</span>
            </div>
         </td>
         <td className="px-4 py-4 text-center">
            <code className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded">{id}</code>
         </td>
         <td className="px-4 py-4">
            <Badge variant="outline" className={cn("text-[9px] font-bold tracking-widest border-none", source === 'schedule' ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600")}>
               {source}
            </Badge>
         </td>
         <td className="px-4 py-4">
            <div className="flex items-center gap-2">
               <div className={cn("h-1.5 w-1.5 rounded-full", status === 'downloaded' ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
               <span className="text-[10px] font-bold tracking-widest text-muted-foreground">{status}</span>
            </div>
         </td>
         <td className="px-6 py-4 text-right">
            <span className="text-xs font-bold tabular-nums">{progress}%</span>
         </td>
      </tr>
   );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}D ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
