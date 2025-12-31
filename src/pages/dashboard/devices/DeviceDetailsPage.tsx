import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  Trash2,
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
import { formatBytes } from "@better-upload/client/helpers";
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
  getDeviceProgramAllowlist,
  clearDevicePrograms,
  deleteDeviceProgram
} from "@/services/deviceApi";
import { getDeviceCommandLogs } from "@/services/logApi";
import { unpublishProgram } from "@/services/programApi";
import { useMessageStore } from "@/store/messageStore";
import { useBreadcrumbStore } from "@/store/breadcrumbStore";
import { cn } from "@/lib/utils";
import { buildProgramNameVersionKey, formatVsnDisplayName, parseVsnFilename } from "@/lib/vsn";
import { useTimeFormatter } from "@/hooks/use-time-formatter";
import { formatInTimeZone } from 'date-fns-tz';

const ProgramVersionDisplay = ({ name, version, variant = 'default' }: { name?: string; version?: number; variant?: 'default' | 'overlay' }) => {
  const parsed = useMemo(() => parseVsnFilename(name), [name]);
  if (!parsed && !name) return <span className="opacity-50">—</span>;

  const displayName = parsed?.programName || parsed?.titleSnapshot || parsed?.fileName || name;
  const displayVersion = version ?? parsed?.version;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className={cn(
        "truncate",
        variant === 'overlay' ? "text-base font-bold text-white" : "text-sm font-semibold text-foreground"
      )}>
        {displayName}
      </span>
      {displayVersion != null && (
        <Badge 
          variant="secondary" 
          className={cn(
            "h-4.5 px-1.5 text-[9px] font-black border-none shrink-0",
            variant === 'overlay' 
              ? "bg-white/20 text-white backdrop-blur-sm" 
              : "bg-primary/10 text-primary"
          )}
        >
          v{displayVersion}
        </Badge>
      )}
    </div>
  );
};

export default function DeviceDetailsPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatRelative, formatDateTime } = useTimeFormatter();
  
  // Live Device Clock state
  const [liveTime, setLiveTime] = useState<Date>(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
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
    return device.lastScreenshotUploadedAt || 
           device.latestScreenshot?.timestamp || 
           (historicalScreenshots.length > 0 ? (historicalScreenshots[0].timestamp || historicalScreenshots[0].createdAt || historicalScreenshots[0].uploadedAt) : device.lastReportTime);
  }, [device, historicalScreenshots]);
  const recentOperations = useMemo(() => commandLogsResponse?.data?.items || [], [commandLogsResponse]);
  const deviceSchedule = scheduleResponse?.data;
  const programAllowlist = allowlistResponse?.data || [];
  const deviceProps = device?.deviceProperties;

  const allowlistIndex = useMemo(() => {
    const index = new Map<string, any>();
    for (const item of programAllowlist || []) {
      const key = buildProgramNameVersionKey(item?.programName, item?.version);
      if (key) index.set(key, item);
    }
    return index;
  }, [programAllowlist]);

  const playingVsnName = deviceProps?.vsns?.playing?.name || deviceProps?.info?.info?.playing?.name || device?.playingProgram;
  const playingParsed = useMemo(() => parseVsnFilename(playingVsnName), [playingVsnName]);
  const playingDisplayName = useMemo(
    () => formatVsnDisplayName(playingParsed) || playingVsnName || '--',
    [playingParsed, playingVsnName]
  );
  const playingProgramRef = useMemo(() => {
    const key = buildProgramNameVersionKey(playingParsed?.programName, playingParsed?.version);
    return key ? allowlistIndex.get(key) : undefined;
  }, [allowlistIndex, playingParsed?.programName, playingParsed?.version]);

  const [assetSearch, setAssetSearch] = useState('');
  const [assetDeleteTarget, setAssetDeleteTarget] = useState<{
    source: string;
    vsnName: string;
    displayName: string;
    programId?: string;
  } | null>(null);
  const [assetClearAllOpen, setAssetClearAllOpen] = useState(false);
  const [assetActionLoading, setAssetActionLoading] = useState(false);

  const localAssets = useMemo(() => {
    const rows: Array<{
      key: string;
      source: string;
      vsnName: string;
      md5?: string;
      sizeBytes?: number;
      displayName: string;
      programId?: string;
    }> = [];

    const groups = deviceProps?.vsns?.contents || [];
    for (const group of groups) {
      for (const vsn of group?.content || []) {
        const parsed = parseVsnFilename(vsn?.name);
        const displayName = formatVsnDisplayName(parsed) || vsn?.name || '—';
        const key = buildProgramNameVersionKey(parsed?.programName, parsed?.version);
        const ref = key ? allowlistIndex.get(key) : undefined;

        rows.push({
          key: vsn?.md5 || vsn?.name || `${group?.type}-${Math.random()}`,
          source: group?.type || 'unknown',
          vsnName: vsn?.name,
          md5: vsn?.md5,
          sizeBytes: vsn?.size,
          displayName,
          programId: ref?.programId,
        });
      }
    }
    return rows;
  }, [deviceProps?.vsns?.contents, allowlistIndex]);

  const filteredAssets = useMemo(() => {
    const q = assetSearch.trim().toLowerCase();
    if (!q) return localAssets;
    return localAssets.filter((a) => {
      const name = (a.displayName || '').toLowerCase();
      const file = (a.vsnName || '').toLowerCase();
      return name.includes(q) || file.includes(q);
    });
  }, [assetSearch, localAssets]);

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
        queryClient.invalidateQueries({ queryKey: ['device-command-logs', deviceId] });
        queryClient.invalidateQueries({ queryKey: ['device-schedule', deviceId] });
        queryClient.invalidateQueries({ queryKey: ['device-allowlist', deviceId] });
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

  // Unified lock state for all adjustments (prevents accidental changes)
  const [isControlsLocked, setIsControlsLocked] = useState(true);

  // Debounce refs for auto-apply
  const brightnessDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const volumeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const colorTempDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (brightnessDebounceRef.current) clearTimeout(brightnessDebounceRef.current);
      if (volumeDebounceRef.current) clearTimeout(volumeDebounceRef.current);
      if (colorTempDebounceRef.current) clearTimeout(colorTempDebounceRef.current);
    };
  }, []);

  // Sync state with device data
  useEffect(() => {
    if (device && device.deviceProperties) {
      const props = device.deviceProperties;
      setBrightnessPct(Math.round((props.brightnessandcolortemp?.brightness || 0) * 100 / 255));
      setVolumeLevel(props.volume?.musicvolume || 0);
      setColorTemp(props.brightnessandcolortemp?.colortemperature || 6500);
      setInputMode(props.inputmode?.inputmode || "internal");
    }
  }, [device]);

  // Auto-apply handlers with debounce
  const applyBrightness = useCallback(async (value: number) => {
    try {
      await executeDeviceAction(deviceId!, {
        type: 'BRIGHTNESS',
        body: { brightness: Math.round(value * 2.55) }
      });
      toast.success('Brightness updated');
    } catch (err) {
      toast.error('Failed to update brightness');
    }
  }, [deviceId]);

  const applyVolume = useCallback(async (value: number) => {
    try {
      await executeDeviceAction(deviceId!, {
        type: 'VOLUME',
        body: { musicvolume: value }
      });
      toast.success('Volume updated');
    } catch (err) {
      toast.error('Failed to update volume');
    }
  }, [deviceId]);

  const applyColorTemp = useCallback(async (value: number) => {
    try {
      await executeDeviceAction(deviceId!, {
        type: 'COLOR_TEMP',
        body: { colortemp: value }
      });
      toast.success('Color temperature updated');
    } catch (err) {
      toast.error('Failed to update color temperature');
    }
  }, [deviceId]);

  const handleBrightnessChange = (value: number) => {
    setBrightnessPct(value);
    if (brightnessDebounceRef.current) clearTimeout(brightnessDebounceRef.current);
    brightnessDebounceRef.current = setTimeout(() => applyBrightness(value), 500);
  };

  const handleVolumeChange = (value: number) => {
    setVolumeLevel(value);
    if (volumeDebounceRef.current) clearTimeout(volumeDebounceRef.current);
    volumeDebounceRef.current = setTimeout(() => applyVolume(value), 500);
  };

  const handleColorTempChange = (value: number) => {
    setColorTemp(value);
    if (colorTempDebounceRef.current) clearTimeout(colorTempDebounceRef.current);
    colorTempDebounceRef.current = setTimeout(() => applyColorTemp(value), 500);
  };

  const handleInputModeChange = async (value: string) => {
    setInputMode(value);
    try {
      await executeDeviceAction(deviceId!, {
        type: 'INPUT_MODE',
        body: { inputmode: value }
      });
      toast.success('Input source updated');
    } catch (err) {
      toast.error('Failed to update input source');
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, type: 'sleep' | 'wakeup' | 'reboot' | null }>({ open: false, type: null });

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
    const actionType = 'POWER';
    const command = confirmDialog.type === 'sleep' ? 'sleep' : 
                    confirmDialog.type === 'wakeup' ? 'wakeup' : 'reboot';
    
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
      queryClient.invalidateQueries({ queryKey: ['user-storage-quota'] });
      toast.success('Screenshot(s) deleted');
    } catch (err) {
      toast.error('Failed to delete screenshots');
    }
  };

  const handleClearScreenshots = async () => {
    try {
      await clearScreenshots(deviceId!);
      queryClient.invalidateQueries({ queryKey: ['device-screenshots', deviceId] });
      queryClient.invalidateQueries({ queryKey: ['user-storage-quota'] });
      toast.success('History cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  const refreshAfterProgramOps = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['device', deviceId] });
    queryClient.invalidateQueries({ queryKey: ['device-command-logs', deviceId] });
    queryClient.invalidateQueries({ queryKey: ['device-allowlist', deviceId] });
  }, [deviceId, queryClient]);

  const handleConfirmDeleteLocalAsset = useCallback(async () => {
    if (!assetDeleteTarget || !deviceId) return;
    setAssetActionLoading(true);
    try {
      if (assetDeleteTarget.source === 'internet' && assetDeleteTarget.programId) {
        const resp = await unpublishProgram(assetDeleteTarget.programId, {
          scope: 'SELECTED',
          deviceIds: [Number(deviceId)],
        });
        if (!resp.success) {
          throw new Error(resp.error?.displayMessage || resp.error?.message || 'Unpublish failed');
        }
        toast.success('Unpublished from this device');
      } else {
        const resp = await deleteDeviceProgram(deviceId, {
          vsnName: assetDeleteTarget.vsnName,
          source: assetDeleteTarget.source,
        });
        if (!resp.success) {
          throw new Error(resp.error?.displayMessage || resp.error?.message || 'Delete command failed');
        }
        toast.success('Delete command sent');
      }
      setAssetDeleteTarget(null);
      refreshAfterProgramOps();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete program');
    } finally {
      setAssetActionLoading(false);
    }
  }, [assetDeleteTarget, deviceId, refreshAfterProgramOps]);

  const handleConfirmClearAllPrograms = useCallback(async () => {
    if (!deviceId) return;
    setAssetActionLoading(true);
    try {
      const resp = await clearDevicePrograms(deviceId);
      if (!resp.success) {
        throw new Error(resp.error?.displayMessage || resp.error?.message || 'Clear command failed');
      }
      toast.success('Clear-all command sent');
      setAssetClearAllOpen(false);
      refreshAfterProgramOps();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to clear programs');
    } finally {
      setAssetActionLoading(false);
    }
  }, [deviceId, refreshAfterProgramOps]);

  if (isDeviceLoading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-muted-foreground">Loading device details...</p>
    </div>
  );

  if (!device || !device.deviceProperties) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <AlertTriangle className="h-12 w-12 text-amber-500" />
      <p className="text-sm font-medium">Device data unavailable</p>
      <Button variant="outline" onClick={() => navigate("/dashboard/devices")}>Back to devices</Button>
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
      
      {/* Header */}
      <header className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         <Card className="lg:col-span-3 rounded-2xl border-none shadow-sm ring-1 ring-muted/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-primary/5 rounded-2xl border shadow-inner">
                  <Monitor className="h-8 w-8 text-primary" />
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <h1 className="text-2xl font-bold tracking-tight">{device.deviceName}</h1>
                     <DeviceStatusBadge status={resolveDeviceStatus(device)} powerStatus={device.powerStatus} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                     <span className="flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5" />
                        <span className="font-mono text-foreground">{realProps.info?.info.serialno}</span>
                     </span>
                     <span className="flex items-center gap-1.5">
                        <Layout className="h-3.5 w-3.5" />
                        {realProps.info?.info.model}
                     </span>
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
                          className="h-10 rounded-xl text-sm font-medium gap-2"
                          onClick={() => setShowBatchCommand(true)}
                       >
                          <Zap className="h-4 w-4 text-amber-500" /> Advanced
                       </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                       <p>Send multiple actions at once</p>
                    </TooltipContent>
                  </Tooltip>
               </TooltipProvider>
               <Button variant="outline" className="h-10 rounded-xl text-sm font-medium gap-2" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> Refresh
               </Button>
            </div>
         </Card>

         <Card className="rounded-2xl border-none ring-1 ring-muted/60 bg-muted/20 p-5 flex flex-col justify-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Last seen</p>
            <p className="text-lg font-semibold">{device.lastReportTime ? formatRelative(device.lastReportTime) : 'Never'}</p>
            <div className="flex items-center gap-2 mt-2">
               <div className={cn("h-1.5 w-1.5 rounded-full", sseConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
               <span className="text-xs text-muted-foreground">
                  {sseConnected ? "Live updates active" : "Live updates paused"}
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
                  <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Screenshot
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                   {screenshotUrl ? (
                      <Badge variant="outline" className="text-xs h-6 border-zinc-800 text-zinc-400 font-mono">
                         {formatDateTime(screenshotTime)}
                      </Badge>
                   ) : (
                      <Badge variant="outline" className="text-xs h-6 border-zinc-800 text-amber-500/80">
                         No screenshot
                      </Badge>
                   )}
                   <Badge variant="outline" className="text-xs h-6 border-zinc-800 text-zinc-500 font-mono">
                      {realProps.dimension?.real_width}×{realProps.dimension?.real_height}
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
                      <p className="text-sm text-zinc-500">No screenshot available</p>
                    </div>
                  )}

                  {/* Device Offline Warning */}
                  {resolveDeviceStatus(device) === 'offline' && (
                    <div className="absolute top-4 left-4 right-4 animate-in slide-in-from-top-4 duration-500 z-20">
                      <div className="bg-amber-500/90 backdrop-blur-md border border-amber-400/50 rounded-xl p-3 flex items-center gap-3 shadow-2xl">
                        <AlertTriangle className="h-4 w-4 text-amber-950 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-amber-950">Device offline</p>
                          <p className="text-xs text-amber-900">
                             Actions will be queued until the device reconnects.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Now Playing */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                     {realProps.vsns?.playing ? (
                        <div className="flex items-center gap-4 p-4 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500">
                           <div className="h-11 w-11 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg">
                              <Play className="h-5 w-5 text-white fill-white/10" />
                           </div>
                           <div className="text-white min-w-0">
                              <p className="text-xs text-white/50 mb-0.5">Now playing</p>
                              <ProgramVersionDisplay name={realProps.vsns.playing.name} variant="overlay" />
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
                 <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4 text-amber-500" /> Quick actions
                 </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-8 pt-6 px-6 scrollbar-none">
                 {/* Power Control */}
                 <div className="space-y-4 bg-muted/20 p-5 rounded-2xl border border-muted/20">
                    <p className="text-xs font-semibold text-muted-foreground">System power</p>
                    <div className="flex gap-3">
                       {device.powerStatus === 0 ? (
                          <Button
                             variant="default"
                             className="flex-[1.5] h-12 rounded-xl text-sm font-bold gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 border-none transition-all active:scale-95"
                             onClick={() => setConfirmDialog({ open: true, type: 'wakeup' })}
                          >
                             <Zap className="h-4 w-4 fill-white" />
                             Wake Up
                          </Button>
                       ) : (
                          <Button
                             variant="outline"
                             className="flex-1 h-12 rounded-xl text-sm font-semibold gap-2 bg-background border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 shadow-sm"
                             onClick={() => setConfirmDialog({ open: true, type: 'sleep' })}
                          >
                             <Moon className="h-4 w-4 text-slate-500" />
                             Sleep
                          </Button>
                       )}
                       <Button
                          variant="outline"
                          className="flex-1 h-12 rounded-xl text-sm font-semibold gap-2 bg-background border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                          onClick={() => setConfirmDialog({ open: true, type: 'reboot' })}
                       >
                          <RotateCw className="h-4 w-4 text-rose-400" />
                          Restart
                       </Button>
                    </div>
                 </div>

                 {/* Input Source */}
                 <div className="space-y-4 bg-muted/20 p-5 rounded-2xl border border-muted/20 transition-colors">
                    <p className="text-xs font-semibold text-muted-foreground">Input source</p>
                    <Select value={inputMode} onValueChange={handleInputModeChange}>
                       <SelectTrigger className="h-10 text-sm font-medium bg-background border shadow-sm rounded-xl">
                          <div className="flex items-center gap-2">
                             <Power className="h-4 w-4 text-primary" />
                             <SelectValue />
                          </div>
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="internal" className="text-sm">Internal player</SelectItem>
                          <SelectItem value="hdmi" className="text-sm">HDMI</SelectItem>
                          <SelectItem value="dvi" className="text-sm">DVI</SelectItem>
                          <SelectItem value="vga" className="text-sm">VGA</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>

                 {/* Display Adjustments */}
                 <div className="space-y-6">
                    {/* Section Header with Unified Lock */}
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-semibold text-muted-foreground">Display adjustments</p>
                       <Button
                          variant={isControlsLocked ? "outline" : "default"}
                          size="sm"
                          className={cn(
                             "h-8 rounded-lg font-medium text-xs gap-2 transition-all",
                             !isControlsLocked && "bg-primary text-primary-foreground"
                          )}
                          onClick={() => setIsControlsLocked(!isControlsLocked)}
                       >
                          {isControlsLocked ? (
                             <>
                                <Lock className="h-3.5 w-3.5" />
                                <span>Unlock to adjust</span>
                             </>
                          ) : (
                             <>
                                <Unlock className="h-3.5 w-3.5" />
                                <span>Adjusting...</span>
                             </>
                          )}
                       </Button>
                    </div>

                    {/* Brightness */}
                    <div className={cn("space-y-3 transition-opacity", isControlsLocked && "opacity-50")}>
                       <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-sm font-medium">
                             <Sun className="h-4 w-4 text-amber-500" /> Brightness
                          </span>
                          <span className="font-mono text-sm font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg">{brightnessPct}%</span>
                       </div>
                       <Slider
                          value={[brightnessPct]}
                          max={100}
                          onValueChange={(v) => handleBrightnessChange(v[0])}
                          disabled={isControlsLocked}
                          className={cn(isControlsLocked ? "pointer-events-none" : "cursor-pointer")}
                       />
                    </div>

                    {/* Volume */}
                    <div className={cn("space-y-3 transition-opacity", isControlsLocked && "opacity-50")}>
                       <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-sm font-medium">
                             <Volume2 className="h-4 w-4 text-blue-500" /> Volume
                          </span>
                          <span className="font-mono text-sm font-semibold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-lg">{Math.round(volumeLevel / 15 * 100)}%</span>
                       </div>
                       <Slider
                          value={[volumeLevel]}
                          max={15}
                          step={1}
                          onValueChange={(v) => handleVolumeChange(v[0])}
                          disabled={isControlsLocked}
                          className={cn(isControlsLocked ? "pointer-events-none" : "cursor-pointer")}
                       />
                    </div>

                    {/* Color Temperature */}
                    <div className={cn("space-y-3 transition-opacity", isControlsLocked && "opacity-50")}>
                       <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-sm font-medium">
                             <ThermometerSnowflake className="h-4 w-4 text-emerald-500" /> Color temperature
                          </span>
                          <span className="font-mono text-sm font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">{colorTemp}K</span>
                       </div>
                       <Slider
                          value={[colorTemp]}
                          min={2000}
                          max={10000}
                          step={100}
                          onValueChange={(v) => handleColorTempChange(v[0])}
                          disabled={isControlsLocked}
                          className={cn(isControlsLocked ? "pointer-events-none" : "cursor-pointer")}
                       />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* System Details */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         {/* Hardware Information */}
         <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoGroup title="System" icon={Layers}>
               <InfoItem label="Uptime" value={formatUptime(Math.floor((realProps.info?.info.up || 0) / 1000))} highlight />
               <InfoItem label="Firmware" value={realProps.info?.info.vername} />
               <InfoItem label="Orientation" value={realProps.screen_orientation?.orientation === 'landscape' ? 'Landscape' : 'Portrait'} />
            </InfoGroup>
            
            <InfoGroup title="Network" icon={Network}>
               <Tabs defaultValue={activeInterface} className="w-full">
                  <TabsList className="grid grid-cols-4 h-8 bg-muted/50 p-1 rounded-xl mb-4">
                     <TabsTrigger value="eth" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">LAN</TabsTrigger>
                     <TabsTrigger value="wifi" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">WiFi</TabsTrigger>
                     <TabsTrigger value="ap" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">AP</TabsTrigger>
                     <TabsTrigger value="4g" className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">4G</TabsTrigger>
                  </TabsList>

                  {realProps.ifstatus?.types.map((iface) => {
                     const normalized = normalizeIfaceType(iface.type);
                     return (
                        <TabsContent key={iface.type} value={normalized} className="mt-0 focus-visible:ring-0">
                           <div className="space-y-4">
                              <div className="flex justify-between items-center mb-2">
                                 <div className="flex items-center gap-2">
                                    {normalized === 'eth' && <Cable className="h-3.5 w-3.5 text-primary" />}
                                    {normalized === 'wifi' && <Wifi className="h-3.5 w-3.5 text-primary" />}
                                    {normalized === 'ap' && <Share2 className="h-3.5 w-3.5 text-primary" />}
                                    {normalized === '4g' && <Signal className="h-3.5 w-3.5 text-primary" />}
                                    <span className="text-xs font-medium text-muted-foreground">
                                       {normalized === 'eth' ? 'Ethernet' : normalized === 'ap' ? 'Hotspot' : normalized.toUpperCase()}
                                    </span>
                                 </div>
                                 <Badge variant="outline" className={cn(
                                    "text-xs h-5 border-none",
                                    iface.connected === 1 ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                                 )}>
                                    {iface.connected === 1 ? 'Connected' : 'Disconnected'}
                                 </Badge>
                              </div>

                              <div className="space-y-3">
                                 {(iface.SSID || iface.currentap) && <InfoItem label="Network" value={iface.SSID || iface.currentap} fontMono highlight />}
                                 {iface.ips?.ip && <InfoItem label="IP address" value={iface.ips.ip} fontMono highlight />}
                                 {iface.ips?.gateway && <InfoItem label="Gateway" value={iface.ips.gateway} fontMono />}
                                 <InfoItem label="MAC" value={iface.mac} fontMono />
                                 {iface.speed !== undefined && iface.speed > 0 && <InfoItem label="Speed" value={`${iface.speed} Mbps`} />}
                                 {iface.strength !== undefined && iface.strength !== null && <InfoItem label="Signal" value={`${iface.strength}%`} highlight />}

                                 {normalized === '4g' && realProps["4ginfo"] && (
                                    <>
                                       <Separator className="my-2 opacity-30" />
                                       <InfoItem label="Carrier" value={realProps["4ginfo"]?.operator} />
                                       <InfoItem label="Signal" value={`${realProps["4ginfo"]?.signal} dBm`} highlight />
                                    </>
                                 )}

                                 {iface.connected !== 1 && (
                                    <p className="pt-2 text-xs text-muted-foreground">Not connected</p>
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
               <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" /> Resources
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6 flex-1">
               <ResourceProgress
                  label="Storage"
                  used={(realProps.info?.info?.storage?.total || 0) - (realProps.info?.info?.storage?.free || 0)}
                  total={realProps.info?.info?.storage?.total || 1}
                  unit="GB"
                  color="bg-emerald-500"
               />
               <ResourceProgress
                  label="Memory"
                  used={(realProps.info?.info?.mem?.total || 0) - (realProps.info?.info?.mem?.free || 0)}
                  total={realProps.info?.info?.mem?.total || 1}
                  unit="MB"
                  color="bg-blue-500"
               />
            </CardContent>
         </Card>
      </div>

      {/* Additional Details */}
      <Tabs defaultValue="assets" className="w-full">
         <TabsList className="bg-muted/40 p-1 rounded-2xl border h-11 mb-6 flex w-full md:w-auto overflow-x-auto scrollbar-none">
            <TabsTrigger value="assets" className="rounded-xl flex-1 md:px-8 text-sm data-[state=active]:bg-card data-[state=active]:shadow-md">Local assets</TabsTrigger>
            <TabsTrigger value="operations" className="rounded-xl flex-1 md:px-8 text-sm data-[state=active]:bg-card data-[state=active]:shadow-md">Activity</TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-xl flex-1 md:px-8 text-sm data-[state=active]:bg-card data-[state=active]:shadow-md">Schedule</TabsTrigger>
            <TabsTrigger value="policy" className="rounded-xl flex-1 md:px-8 text-sm data-[state=active]:bg-card data-[state=active]:shadow-md">Settings</TabsTrigger>
         </TabsList>

         <TabsContent value="operations" className="mt-0">
            <Card className="rounded-3xl border-none ring-1 ring-muted/60 overflow-hidden shadow-xl bg-card">
               <CardHeader className="px-8 py-6 border-b bg-muted/5 flex flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                     <CardTitle className="text-lg font-semibold">Recent activity</CardTitle>
                     <CardDescription className="text-sm text-muted-foreground">Actions sent to this device</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-sm gap-2"
                    onClick={() => navigate('/dashboard/logs', { state: { deviceId: device?.deviceId } })}
                  >
                    <HistoryIcon className="h-4 w-4" /> View all
                  </Button>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="space-y-3">
                      {recentOperations.length > 0 ? (
                         recentOperations.map((op) => (
                            <div key={op.id} className="p-4 rounded-xl bg-muted/20 border border-muted/40 hover:bg-muted/30 transition-colors flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                 {(() => {
                                   const status = (op.status || '').toUpperCase();
                                   const isAckOnly = (op.trackingLevel || '').toUpperCase() === 'ACK_ONLY';
                                   const rejected = op.accepted === false;

                                   const isSending = status === 'PUBLISHED' || status === 'DISPATCHED' || status === 'WAITING';
                                   const isReceived = status === 'CONFIRMED' || status === 'ACKED';
                                   const isSucceeded = status === 'COMPLETED' || status === 'SUCCEEDED' || (isAckOnly && isReceived);
                                   const isFailed = rejected || status === 'FAILED' || status === 'EXPIRED';

                                   const icon = isSending ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                     isSucceeded ? <CheckCircle2 className="h-5 w-5" /> :
                                       isFailed ? <XCircle className="h-5 w-5" /> :
                                         <Activity className="h-5 w-5" />;

                                   const toneClass = isSucceeded
                                     ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                     : isFailed
                                       ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                       : "bg-amber-500/10 text-amber-600 border-amber-500/20";

                                   return (
                                     <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", toneClass)}>
                                       {icon}
                                     </div>
                                   );
                                 })()}
                                  <div>
                                     <div className="flex items-center gap-2">
                                       {(() => {
                                         const type = (op.actionType || '').toUpperCase();
                                         const status = (op.status || '').toUpperCase();
                                         const isAckOnly = (op.trackingLevel || '').toUpperCase() === 'ACK_ONLY';
                                         const rejected = op.accepted === false;

                                         const label = (() => {
                                           if (type === 'CONTENT_REPORT_SWITCH') return 'Statistics';
                                           if (type === 'INPUT_MODE') return 'Input Mode';
                                           if (type === 'CLEAR_DEVICE_PROGRAM') return 'Clear Programs';
                                           if (type === 'DELETE_DEVICE_VSN') return 'Delete Program';
                                           if (!type) return 'Unknown';
                                           return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
                                         })();

                                         const isSending = status === 'PUBLISHED' || status === 'DISPATCHED' || status === 'WAITING';
                                         const isReceived = status === 'CONFIRMED' || status === 'ACKED';
                                         const isSucceeded = status === 'COMPLETED' || status === 'SUCCEEDED' || (isAckOnly && isReceived);
                                         const isFailed = rejected || status === 'FAILED' || status === 'EXPIRED';

                                         const statusText = rejected
                                           ? 'Rejected'
                                           : isSucceeded
                                             ? 'Success'
                                             : status === 'EXPIRED'
                                               ? 'Expired'
                                               : status === 'FAILED'
                                                 ? 'Failed'
                                                 : isReceived
                                                   ? 'Received'
                                                   : isSending
                                                     ? 'Sending'
                                                     : status || 'Pending';

                                         const badgeClass = isSucceeded
                                           ? "bg-emerald-500/10 text-emerald-600"
                                           : isFailed
                                             ? "bg-rose-500/10 text-rose-600"
                                             : "bg-amber-500/10 text-amber-600";

                                         return (
                                           <>
                                             <span className="font-medium text-sm">{label}</span>
                                             <Badge variant="outline" className={cn("text-xs h-5 border-none", badgeClass)}>
                                               {statusText}
                                             </Badge>
                                           </>
                                         );
                                       })()}
                                     </div>
                                     {op.errorMessage && (
                                       <p className="text-xs text-rose-500 mt-1 max-w-[320px] break-words">{op.errorMessage}</p>
                                     )}
                                  </div>
                               </div>
 
                               <div className="text-right">
                                 <p className="text-xs text-muted-foreground">{op.createdAt ? formatRelative(op.createdAt) : ''}</p>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="py-16 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                           <Activity className="h-10 w-10 opacity-30" />
                           <p className="text-sm">No recent activity</p>
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
                      <CardTitle className="text-lg font-semibold">Local assets</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Content cached on this device</CardDescription>
                   </div>
                   <div className="flex items-center gap-3">
                      <Button
                         variant="outline"
                         size="sm"
                         className="rounded-xl text-sm gap-2"
                         onClick={() => setAssetClearAllOpen(true)}
                      >
                         <Trash2 className="h-4 w-4" /> Clear all
                      </Button>
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                         <Input
                            placeholder="Search..."
                            value={assetSearch}
                            onChange={(e) => setAssetSearch(e.target.value)}
                            className="pl-10 h-10 w-56 bg-muted/30 border-none rounded-xl text-sm"
                         />
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="grid grid-cols-12 px-8 py-4 bg-muted/20 text-xs font-medium text-muted-foreground border-b">
                      <div className="col-span-6">Name</div>
                      <div className="col-span-2 text-center">Source</div>
                      <div className="col-span-2 text-right">Size</div>
                      <div className="col-span-2 text-right">Actions</div>
                   </div>
                   <div className="divide-y divide-muted/40 max-h-[500px] overflow-y-auto">
                      {localAssets.length > 0 ? (
                        filteredAssets.length > 0 ? (
                          filteredAssets.map((asset) => {
                            const sourceLabel = asset.source === 'internet' ? 'Cloud' : asset.source === 'lan' ? 'LAN' : asset.source;
                            const sourceClass =
                              asset.source === 'internet'
                                ? 'bg-indigo-500/10 text-indigo-600'
                                : asset.source === 'lan'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-muted text-muted-foreground';

                                                          return (
                                                            <div key={asset.key} className="grid grid-cols-12 px-8 py-4 items-center hover:bg-muted/10 transition-colors">
                                                              <div className="col-span-6 flex items-center gap-4 min-w-0">
                                                                 <div className="h-10 w-10 rounded-xl bg-card border flex items-center justify-center text-muted-foreground shrink-0">
                                                                    <FileText className="h-5 w-5" />
                                                                 </div>
                                                                 <ProgramVersionDisplay name={asset.vsnName} />
                                                              </div>
                                                              <div className="col-span-2 text-center">
                                                                <Badge variant="outline" className={cn('text-xs border-none', sourceClass)}>
                                                                  {sourceLabel}
                                                                </Badge>
                                                              </div>
                                                              <div className="col-span-2 text-right">
                                                                <p className="text-sm tabular-nums">{asset.sizeBytes != null ? formatBytes(asset.sizeBytes) : '—'}</p>
                                                              </div>
                                                              <div className="col-span-2 text-right">                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl"
                                    disabled={assetActionLoading || !asset.vsnName}
                                    onClick={() =>
                                      setAssetDeleteTarget({
                                        source: asset.source,
                                        vsnName: asset.vsnName,
                                        displayName: asset.displayName,
                                        programId: asset.programId,
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-16 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <Search className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No matching assets</p>
                          </div>
                        )
                      ) : (
                         <div className="py-16 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <Database className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No cached assets</p>
                         </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="schedule" className="mt-0">
            <Card className="rounded-3xl border-none ring-1 ring-muted/60 overflow-hidden shadow-xl bg-card">
               <CardHeader className="px-8 py-6 border-b bg-muted/5 flex flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                     <CardTitle className="text-lg font-semibold">Schedule</CardTitle>
                     <CardDescription className="text-sm text-muted-foreground">Programs assigned to this device</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button
                        variant="outline"
                        className="h-10 rounded-xl text-sm gap-2"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['device-schedule', deviceId] })}
                     >
                        <RefreshCw className="h-4 w-4" /> Refresh
                     </Button>
                     {deviceSchedule?.scheduleId ? (
                        <Button
                           className="h-10 rounded-xl text-sm gap-2"
                           onClick={() => navigate(`/dashboard/schedule/${deviceSchedule.scheduleId}`)}
                        >
                           Open schedule
                        </Button>
                     ) : (
                        <Button className="h-10 rounded-xl text-sm gap-2" onClick={() => navigate('/dashboard/schedule')}>
                           Manage
                        </Button>
                     )}
                  </div>
               </CardHeader>
               <CardContent className="p-6 space-y-6">
                  {/* Schedule Info */}
                  <div className="flex flex-col md:flex-row gap-4">
                     <div className="flex-1 p-6 rounded-2xl bg-muted/20 border border-dashed border-muted/60">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Assigned schedule</p>
                        {deviceSchedule?.scheduleId ? (
                           <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                 <CalendarDays className="h-5 w-5" />
                              </div>
                              <div>
                                 <h4 className="text-base font-semibold">{deviceSchedule.scheduleName || '—'}</h4>
                                 <p className="text-xs text-muted-foreground mt-0.5">
                                    <span className={cn(deviceSchedule.scheduleEnabled ? "text-emerald-600" : "text-amber-600")}>
                                       {deviceSchedule.scheduleEnabled ? 'Active' : 'Paused'}
                                    </span>
                                 </p>
                              </div>
                           </div>
                        ) : (
                           <div className="flex items-center gap-3 opacity-50">
                              <div className="p-2.5 rounded-xl bg-muted text-muted-foreground border">
                                 <CalendarDays className="h-5 w-5" />
                              </div>
                              <p className="text-sm">No schedule assigned</p>
                           </div>
                        )}
                     </div>
                     <div className="md:w-48 p-6 rounded-2xl bg-muted/20 border border-dashed border-muted/60">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Summary</p>
                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <span className="text-sm">Programs</span>
                              <Badge variant="secondary" className="text-xs">
                                 {deviceSchedule?.contentsRules?.length || 0}
                              </Badge>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-sm">Actions</span>
                              <Badge variant="secondary" className="text-xs">
                                 {deviceSchedule?.commandRules?.length || 0}
                              </Badge>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Programs List */}
                  <div className="space-y-4">
                     <p className="text-xs font-medium text-muted-foreground">Published programs</p>
                     <div className="rounded-xl border overflow-hidden">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-muted/30 border-b text-xs font-medium text-muted-foreground">
                                 <th className="px-4 py-3">Program</th>
                                 <th className="px-4 py-3">Status</th>
                                 <th className="px-4 py-3 text-right">Progress</th>
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
                                    <td colSpan={4} className="py-10 text-center text-muted-foreground">
                                       <p className="text-sm">No programs assigned</p>
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
                           <CardHeader className="bg-muted/5 border-b py-5 px-6">
                              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                 <Clock className="h-4 w-4 text-primary" /> Time
                              </CardTitle>
                           </CardHeader>
                           <CardContent className="p-6 space-y-6">
                              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 text-center">
                                 <p className="text-xs text-primary/60 mb-2">Device local time</p>
                                 <p className="text-4xl font-bold text-primary tabular-nums">
                                   {realProps.newrtc?.timezoneId ? 
                                     formatInTimeZone(liveTime, realProps.newrtc.timezoneId, 'HH:mm:ss') : 
                                     '--:--:--'}
                                 </p>
                                 <p className="text-sm text-muted-foreground mt-2 font-medium">
                                   {realProps.newrtc?.timezoneId ? 
                                     formatInTimeZone(liveTime, realProps.newrtc.timezoneId, 'yyyy-MM-dd') : 
                                     '--'}
                                 </p>
                              </div>
                              <div className="space-y-3">
                                 <PolicyData label="Timezone ID" value={realProps.newrtc?.timezoneId} />
                                 <PolicyData label="Last Sync" value={realProps.newrtc?.time?.split(' ')[1]} />
                              </div>
                           </CardContent>
                        </Card>
               <Card className="rounded-3xl border-none ring-1 ring-muted/60 shadow-sm overflow-hidden lg:col-span-2">
                  <CardHeader className="bg-muted/5 border-b py-5 px-6">
                     <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Security
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <PolicyItem label="Firewall" desc="Block unauthorized connections" active={realProps.inboundfirewall?.status === 'on'} />
                     <PolicyItem label="Auto update" desc="Apply updates automatically" active />
                     <PolicyItem label="USB access" desc="Allow content from USB" active={false} />
                     <PolicyItem label="Multi-screen sync" desc="Synchronize with other devices" active={realProps.sync_program_mode?.sync_program_ntp_enable === 1} />
                  </CardContent>
               </Card>
            </div>
         </TabsContent>
       </Tabs>

       {/* Local Assets: Delete Single */}
       <Dialog open={!!assetDeleteTarget} onOpenChange={(open) => !open && setAssetDeleteTarget(null)}>
         <DialogContent className="sm:max-w-[520px] rounded-[2rem] p-8 border-none shadow-2xl ring-1 ring-muted/50">
           <DialogHeader className="space-y-3">
             <DialogTitle className="text-xl font-bold">Remove program from device?</DialogTitle>
             <DialogDescription className="text-sm text-muted-foreground">
               {assetDeleteTarget?.source === 'internet' && assetDeleteTarget?.programId
                 ? 'This will unpublish the program from this device and request the device to delete the cached VSN.'
                 : 'This will request the device to delete the cached VSN. Cloud publishing state will not be changed.'}
             </DialogDescription>
           </DialogHeader>

           <div className="mt-4 space-y-2">
             <div className="rounded-xl bg-muted/30 p-4">
               <p className="text-sm font-medium">{assetDeleteTarget?.displayName}</p>
               <p className="text-xs text-muted-foreground break-all">{assetDeleteTarget?.vsnName}</p>
             </div>
           </div>

           <div className="mt-6 flex justify-end gap-3">
             <Button variant="outline" className="rounded-xl" onClick={() => setAssetDeleteTarget(null)} disabled={assetActionLoading}>
               Cancel
             </Button>
             <Button className="rounded-xl gap-2" onClick={handleConfirmDeleteLocalAsset} disabled={assetActionLoading}>
               {assetActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
               Remove
             </Button>
           </div>
         </DialogContent>
       </Dialog>

       {/* Local Assets: Clear All */}
       <Dialog open={assetClearAllOpen} onOpenChange={setAssetClearAllOpen}>
         <DialogContent className="sm:max-w-[520px] rounded-[2rem] p-8 border-none shadow-2xl ring-1 ring-muted/50">
           <DialogHeader className="space-y-3">
             <DialogTitle className="text-xl font-bold">Clear all cached programs?</DialogTitle>
             <DialogDescription className="text-sm text-muted-foreground">
               This sends a device command to clear all downloaded programs. It does not change cloud assignments or schedules.
             </DialogDescription>
           </DialogHeader>

           <div className="mt-6 flex justify-end gap-3">
             <Button variant="outline" className="rounded-xl" onClick={() => setAssetClearAllOpen(false)} disabled={assetActionLoading}>
               Cancel
             </Button>
             <Button className="rounded-xl gap-2" onClick={handleConfirmClearAllPrograms} disabled={assetActionLoading}>
               {assetActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
               Clear all
             </Button>
           </div>
         </DialogContent>
       </Dialog>

       {/* Power Action Confirmation */}
       <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null })}>
         <DialogContent className="sm:max-w-[440px] rounded-[2.5rem] p-10 overflow-hidden border-none shadow-2xl ring-1 ring-muted/50">
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              {confirmDialog.type === 'sleep' ? <Moon className="h-48 w-48" /> : confirmDialog.type === 'wakeup' ? <Power className="h-48 w-48" /> : <RotateCw className="h-48 w-48" />}
          </div>
          <DialogHeader className="relative z-10 space-y-4">
            <div className={cn(
                "h-20 w-20 rounded-3xl flex items-center justify-center border-2 shadow-inner mb-2",
                confirmDialog.type === 'sleep' ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : 
                confirmDialog.type === 'wakeup' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                "bg-rose-500/10 border-rose-500/20 text-rose-600"
             )}>
                {confirmDialog.type === 'sleep' ? <Moon className="h-10 w-10" /> : confirmDialog.type === 'wakeup' ? <Power className="h-10 w-10" /> : <RotateCw className="h-10 w-10" />}
             </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
               {confirmDialog.type === 'sleep' ? "Put device to sleep?" : confirmDialog.type === 'wakeup' ? "Wake up device?" : "Restart device?"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
               {confirmDialog.type === 'sleep'
                  ? "The device will enter sleep mode. Content playback will stop until the device is woken up."
                  : confirmDialog.type === 'wakeup'
                  ? "The device will be woken up and resume normal operation."
                  : "The device will restart. It may be unavailable for about 90 seconds."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-10 flex flex-col items-center gap-6 relative z-10">
             <SlideToUnlock
                onUnlock={executeDangerousAction}
                label={confirmDialog.type === 'sleep' ? "Slide to confirm sleep" : confirmDialog.type === 'wakeup' ? "Slide to confirm wake up" : "Slide to confirm restart"}
             />
             <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setConfirmDialog({ open: false, type: null })}>
                Cancel
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BatchCommandDialog 
        open={showBatchCommand} 
        onOpenChange={setShowBatchCommand}
        devices={[device]}
        initialSelectedDeviceIds={[device.deviceId]}
        mode="single-device"
        initialDeviceProps={realProps}
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
    <div className="flex justify-between items-center text-sm">
       <span className="text-muted-foreground">{label}</span>
       <div className="flex items-center gap-2">
          <span className="font-medium">{value || 'Not set'}</span>
          {active && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
       </div>
    </div>
  );
}

function InfoGroup({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <Card className="border-none shadow-sm bg-card rounded-2xl overflow-hidden ring-1 ring-muted/60">
      <CardHeader className="py-4 border-b bg-muted/5 px-6">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 py-5 px-6">
        {children}
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value, copyable = false, highlight = false, fontMono = false }: { label: string, value: any, copyable?: boolean, highlight?: boolean, fontMono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4 group/item">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          "font-medium truncate text-sm",
          highlight ? "text-primary" : "",
          fontMono && "font-mono"
        )}>
          {value || "—"}
        </span>
        {copyable && value && (
          <button onClick={() => { navigator.clipboard.writeText(String(value)); toast.info("Copied"); }}
            className="p-1 opacity-0 group-hover/item:opacity-100 hover:bg-muted rounded text-primary transition-all">
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function InfoGroupSeparator() {
  return <Separator className="my-2 opacity-30" />;
}

function PolicyItem({ label, desc, active, last = false }: { label: string, desc: string, active: boolean, last?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
       <div className="space-y-0.5">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
       </div>
       <Switch checked={active} disabled className="data-[state=checked]:bg-emerald-500" />
    </div>
  );
}

function ResourceProgress({ label, used, total, unit, color = "bg-primary" }: { label: string, used: number, total: number, unit: string, color?: string }) {
  const percentage = Math.min(100, (used / total) * 100);
  const isHigh = percentage > 85;
  const formattedUsed = unit === 'GB' ? (used / (1024 ** 3)).toFixed(1) : (used / (1024 ** 2)).toFixed(0);
  const formattedTotal = unit === 'GB' ? (total / (1024 ** 3)).toFixed(0) : (total / (1024 ** 2)).toFixed(0);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("text-sm font-medium tabular-nums", isHigh ? "text-rose-500" : "")}>{percentage.toFixed(0)}%</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
         <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", color, isHigh && "bg-rose-500")} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formattedUsed} {unit} used</span>
        <span>{formattedTotal} {unit} total</span>
      </div>
    </div>
  );
}

function VisibilityRow({ name, id, source, status, progress }: { name: string, id: number, source: 'direct' | 'schedule', status: string, progress: number }) {
   const statusLabel = status === 'DOWNLOADED' || status === 'downloaded' ? 'Ready' : status === 'DOWNLOADING' ? 'Downloading' : 'Pending';
   return (
      <tr className="hover:bg-muted/5 transition-colors">
         <td className="px-4 py-3">
            <ProgramVersionDisplay name={name} version={id} />
         </td>
         <td className="px-4 py-3">
            <div className="flex items-center gap-2">
               <div className={cn("h-1.5 w-1.5 rounded-full", statusLabel === 'Ready' ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
               <span className="text-xs text-muted-foreground">{statusLabel}</span>
            </div>
         </td>
         <td className="px-4 py-3 text-right">
            <span className="text-sm tabular-nums">{progress}%</span>
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
