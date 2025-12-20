import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Monitor, 
  Settings, 
  HardDrive, 
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
  Network
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
import { toast } from "sonner";
import { DeviceScreenshot } from "@/components/devices/DeviceScreenshot";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { SlideToUnlock } from "@/components/ui/slide-to-unlock";
import { BatchCommandDialog } from "@/features/devices/commands/BatchCommandDialog";
import type { DeviceDetails } from "@/types/device-details";
import { mockDevices, mockTags } from "@/lib/mock/devices";
import { cn } from "@/lib/utils";

export default function DeviceDetailsPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showBatchCommand, setShowBatchCommand] = useState(false);

  // Interactive States (Mapped to UI requirements)
  const [brightnessPct, setBrightnessPct] = useState(0); // 0-100%
  const [volumeLevel, setVolumeLevel] = useState(0);     // 0-15
  const [colorTemp, setColorTemp] = useState(6500);      // 2000-10000K
  const [inputMode, setInputMode] = useState("internal");

  // Track original values to show "Apply/Reset"
  const [originalValues, setOriginalValues] = useState({
    brightness: 0,
    volume: 0,
    colorTemp: 6500
  });

  const hasChanges = brightnessPct !== originalValues.brightness || 
                     volumeLevel !== originalValues.volume || 
                     colorTemp !== originalValues.colorTemp;
  
  // Danger Action States
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, type: 'sleep' | 'reboot' | null }>({ open: false, type: null });

  useEffect(() => {
    // Simulate Data Sync
    const findDevice = mockDevices.find(d => d.id === deviceId);
    if (findDevice) {
      // STRICT ALIGNMENT WITH device_properties.txt
      const enhancedDevice: DeviceDetails = {
        ...findDevice,
        deviceProperties: {
          terminal: { 
            name: findDevice.deviceName, 
            leddescription: "Commercial Hall LED Display Node", 
            reportTime: Date.now() / 1000 
          },
          WebSocketStatus: { status: 1 },
          powerstatus: { powerstatus: 1, reportTime: Date.now() / 1000 },
          info: {
            info: {
              vername: "v3.2.1-stable",
              serialno: findDevice.serialNumber || "CL-SN-1029384756",
              model: findDevice.model,
              up: 144113, 
              mem: { total: 2147483648, free: 1073741824 },
              storage: { total: findDevice.storageTotal, free: findDevice.storageTotal - findDevice.storageUsed },
              playing: { name: findDevice.currentProgram?.name || "IDLE", path: "/data/vsns/001.vsn", source: "internet" }
            },
            reportTime: Date.now() / 1000
          },
          vsns: {
            contents: [
              {
                type: "program",
                ressize: 617494741,
                unused: 52428800,
                content: [
                  { md5: "a1b2c3d4e5f6", name: "Summer_Sale_Campaign.vsn", publishedmd5: "p1", size: 616695227 },
                  { md5: "f1g2h3i4j5k6", name: "Night_Background.vsn", publishedmd5: "p2", size: 161608 }
                ]
              }
            ],
            playing: { name: findDevice.currentProgram?.name || "Summer_Sale_Campaign.vsn", path: "/data/vsns/001.vsn", source: "internet", type: "rotation" },
            reportTime: Date.now() / 1000
          },
          dimension: {
            width: findDevice.resolution.width,
            height: findDevice.resolution.height,
            fps: 60,
            dclk: 148500,
            hsync: 44,
            real_width: findDevice.resolution.width,
            real_height: findDevice.resolution.height,
            real_dclk: 148500,
            reportTime: Date.now() / 1000
          },
          volume: { musicvolume: findDevice.volume, reportTime: Date.now() / 1000 },
          inputmode: { inputmode: "internal", inputmodeactive: "internal", reportTime: Date.now() / 1000 },
          ifstatus: {
            types: [
              {
                type: "eth",
                enabled: 1,
                connected: 1,
                operstate: "up",
                mode: "static",
                mac: findDevice.macAddress || "00:11:22:33:44:55",
                ips: { ip: findDevice.ipAddress || "192.168.1.100", mask: "255.255.255.0", gateway: "192.168.1.1", dns1: "8.8.8.8", dns2: "8.8.4.4" },
                speed: 1000
              },
              {
                type: "wifi",
                enabled: 1,
                connected: 0,
                operstate: "down",
                mode: "dhcp",
                mac: "AA:BB:CC:DD:EE:FF",
                SSID: "PRISM_OFFICE_IOT",
                strength: 75
              }
            ]
          },
          brightnessandcolortemp: { brightness: 180, colortemperature: 6500, reportTime: Date.now() / 1000 },
          newrtc: { time: "2025-12-19 15:00:00", timezoneId: "Asia/Shanghai", timezone: 8, isautotime: 1, reportTime: Date.now() / 1000 },
          screen_orientation: { orientation: "landscape" },
          "4ginfo": { signal: -75, operator: "China Unicom", imei: "860000000000001", iccid: "8986000000000000001" },
          reportswitch: { log_report: "on", complete_screen_status_report: "on", command_screenshot_report: "on", auto_vsns_report: "on" },
          sync_program_mode: { sync_program_ntp_enable: 1, sync_program_ntp_server: "pool.ntp.org", sync_program_lan_role: "slave" }
        }
      };

      const b = Math.round((enhancedDevice.deviceProperties?.brightnessandcolortemp?.brightness || 0) / 255 * 100);
      const v = Math.round((enhancedDevice.deviceProperties?.volume?.musicvolume || 0) / 100 * 15);
      const c = enhancedDevice.deviceProperties?.brightnessandcolortemp?.colortemperature || 6500;
      
      setDevice(enhancedDevice);
      
      // Initialize interactive states from real props
      setBrightnessPct(b);
      setVolumeLevel(v);
      setColorTemp(c);
      setInputMode(enhancedDevice.deviceProperties?.inputmode?.inputmode || "internal");

      setOriginalValues({ brightness: b, volume: v, colorTemp: c });
    }
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [deviceId]);

  const handleApplyChanges = () => {
    toast.promise(new Promise(r => setTimeout(r, 1000)), {
      loading: 'Applying adjustments...',
      success: () => {
        setOriginalValues({ brightness: brightnessPct, volume: volumeLevel, colorTemp: colorTemp });
        return 'Parameters applied successfully';
      },
      error: 'Failed to apply changes',
    });
  };

  const handleResetChanges = () => {
    setBrightnessPct(originalValues.brightness);
    setVolumeLevel(originalValues.volume);
    setColorTemp(originalValues.colorTemp);
    toast.info('Adjustments reverted');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => { 
      setIsRefreshing(false); 
      toast.success("Real-time data synchronized"); 
    }, 1000);
  };

  const executeDangerousAction = () => {
    const action = confirmDialog.type === 'sleep' ? "TERMINAL_SLEEP" : "SYSTEM_REBOOT";
    toast.promise(new Promise(r => setTimeout(r, 2000)), {
      loading: `Dispatching ${action}...`,
      success: `Command ${action} accepted by node`,
      error: 'Dispatch failed',
    });
    setConfirmDialog({ open: false, type: null });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">正在初始化指令通道</p>
    </div>
  );

  if (!device) return <div>Terminal Missing</div>;

  const realProps = device.deviceProperties!;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* SECTION 1: CORE IDENTITY (TOP BAR) - CRITICAL DATA ONLY */}
      <header className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         <Card className="lg:col-span-3 rounded-2xl border-none shadow-sm ring-1 ring-muted/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-primary/5 rounded-2xl border shadow-inner">
                  <Monitor className="h-8 w-8 text-primary" />
               </div>
               <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                     <h1 className="text-2xl font-black tracking-tight">{device.deviceName}</h1>
                     <DeviceStatusBadge status={device.status} />
                     <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 font-mono text-[10px]">
                        WS: {realProps.WebSocketStatus?.status === 1 ? "CONNECTED" : "DISCONNECTED"}
                     </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
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
               <Button 
                  variant="outline" 
                  className="h-10 rounded-xl font-black text-xs gap-2" 
                  onClick={() => setShowBatchCommand(true)}
               >
                  <Zap className="h-4 w-4 text-amber-500" /> BATCH
               </Button>
               <Button variant="outline" className="h-10 rounded-xl font-black text-xs gap-2" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> SYNC
               </Button>
            </div>
         </Card>
         
         <Card className="rounded-2xl border-none ring-1 ring-muted/60 bg-muted/20 p-5 flex flex-col justify-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Heartbeat Record</p>
            <p className="text-lg font-black tracking-tight">{formatRelativeTime(device.lastReportTime)}</p>
            <div className="flex items-center gap-2 mt-2 opacity-50">
               <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
               <span className="text-[9px] font-bold uppercase tracking-tighter">Real-time Stream Available</span>
            </div>
         </Card>
      </header>

      {/* SECTION 2: COCKPIT (SCREEN + CONTROLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Display Buffer (8/12) */}
        <div className="lg:col-span-8">
           <Card className="overflow-hidden border-none shadow-2xl bg-black h-full flex flex-col ring-1 ring-white/10">
              <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 bg-zinc-950/80 border-b border-white/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Terminal Frame Buffer
                </CardTitle>
                <div className="flex items-center gap-3">
                   <Badge variant="outline" className="text-[9px] h-5 border-zinc-800 text-zinc-600 font-mono tracking-tighter">
                      {realProps.dimension?.real_width}x{realProps.dimension?.real_height} @ {realProps.dimension?.fps}FPS
                   </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative flex items-center justify-center bg-zinc-900/30">
                <div className="relative w-full h-full group">
                  <DeviceScreenshot
                    src={device.latestScreenshot?.url}
                    timestamp={device.latestScreenshot?.timestamp}
                    deviceName={device.deviceName}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
                  
                  {/* Now Playing HUD */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                     <div className="flex items-center gap-5 p-5 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                           <Play className="h-6 w-6 text-white fill-white/10" />
                        </div>
                        <div className="text-white min-w-0">
                           <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Engine Status: {realProps.vsns?.playing.type}</p>
                           <p className="text-lg font-black tracking-tight truncate max-w-[300px]">{realProps.vsns?.playing.name}</p>
                           <div className="flex items-center gap-3 mt-1">
                              <Badge className="bg-white/10 text-white border-none text-[9px] h-4 font-bold">SOURCE: {realProps.vsns?.playing.source?.toUpperCase()}</Badge>
                           </div>
                        </div>
                     </div>
                     <div className="hidden xl:flex flex-col gap-2 items-end">
                        <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full shadow-2xl" onClick={() => toast.info("Full Inspection Initiated")}>
                           <Maximize2 className="h-5 w-5" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full shadow-2xl" onClick={() => setIsCapturing(true)}>
                           <Camera className={cn("h-5 w-5", isCapturing && "animate-pulse text-primary")} />
                        </Button>
                     </div>
                  </div>
                </div>
              </CardContent>
           </Card>
        </div>

        {/* Right: Rapid Operations (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <Card className="shadow-xl border-none ring-1 ring-muted/60 h-full">
              <CardHeader className="pb-5 border-b bg-muted/5 px-6">
                 <CardTitle className="text-[11px] font-black flex items-center gap-2 uppercase tracking-[0.15em] text-slate-500">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500/10" /> 指令控制台
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-8 px-8">
                 {/* Safety Level 1 Actions */}
                 <div className="grid grid-cols-2 gap-3">
                    <Button 
                       variant="outline" 
                       className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/10 text-amber-700"
                       onClick={() => setConfirmDialog({ open: true, type: 'sleep' })}
                    >
                       <Moon className="h-4 w-4" /> Sleep Mode
                    </Button>
                    <Button 
                       variant="outline" 
                       className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 border-rose-500/20 bg-rose-500/[0.03] hover:bg-rose-500/10 text-rose-700"
                       onClick={() => setConfirmDialog({ open: true, type: 'reboot' })}
                    >
                       <RotateCw className="h-4 w-4" /> Hard Reboot
                    </Button>
                 </div>

                 {/* Logic Signal Source */}
                 <div className="space-y-4 bg-muted/30 p-5 rounded-2xl border border-dashed hover:border-primary/30 transition-colors">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Logic Signal Protocol</p>
                    <Select value={inputMode} onValueChange={setInputMode}>
                       <SelectTrigger className="h-6 text-xs font-black uppercase bg-transparent border-none p-0 focus:ring-0 shadow-none">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="internal" className="text-xs font-bold uppercase">INTERNAL_ENGINE</SelectItem>
                          <SelectItem value="hdmi" className="text-xs font-bold uppercase">HDMI_FEED_IN</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>

                 {/* Real-time Sliders (Instruct the node directly) */}
                 <div className="space-y-9 px-1">
                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span className="flex items-center gap-2">
                             <Sun className="h-4 w-4 text-amber-500" /> Luminance Gain
                             {brightnessPct !== originalValues.brightness && <Badge className="ml-2 bg-amber-500/10 text-amber-600 border-none text-[8px] h-4">待应用</Badge>}
                          </span>
                          <span className="font-mono bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md border border-amber-500/10">{brightnessPct}%</span>
                       </div>
                       <Slider value={[brightnessPct]} max={100} onValueChange={(v) => setBrightnessPct(v[0])} className="cursor-pointer" />
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span className="flex items-center gap-2">
                             <Volume2 className="h-4 w-4 text-blue-500" /> Audio Level
                             {volumeLevel !== originalValues.volume && <Badge className="ml-2 bg-blue-500/10 text-blue-600 border-none text-[8px] h-4">待应用</Badge>}
                          </span>
                          <span className="font-mono bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md border border-blue-500/10">{volumeLevel} / 15</span>
                       </div>
                       <Slider value={[volumeLevel]} max={15} step={1} onValueChange={(v) => setVolumeLevel(v[0])} className="cursor-pointer" />
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span className="flex items-center gap-2">
                             <ThermometerSnowflake className="h-4 w-4 text-emerald-500" /> Color Rendering
                             {colorTemp !== originalValues.colorTemp && <Badge className="ml-2 bg-emerald-500/10 text-emerald-600 border-none text-[8px] h-4">待应用</Badge>}
                          </span>
                          <span className="font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-500/10">{colorTemp}K</span>
                       </div>
                       <Slider value={[colorTemp]} min={2000} max={10000} step={100} onValueChange={(v) => setColorTemp(v[0])} className="cursor-pointer" />
                    </div>
                 </div>

                 {hasChanges && (
                   <div className="flex gap-2 animate-in slide-in-from-bottom-2">
                      <Button onClick={handleApplyChanges} className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20">应用更改</Button>
                      <Button onClick={handleResetChanges} variant="outline" className="h-12 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]">重置</Button>
                   </div>
                 )}

                 <p className="text-[9px] text-center text-muted-foreground mt-auto pt-10 font-bold uppercase tracking-[0.2em] opacity-30">
                    指令栈就绪 路 加密直连通道
                 </p>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* SECTION 3: SYSTEM OVERVIEW & TELEMETRY (ACCURATE DATA ONLY) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         {/* Detailed Overview (8/12) */}
         <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoGroup title="Architecture Inventory" icon={Layers}>
               <InfoItem label="Terminal Alias" value={realProps.terminal?.name} />
               <InfoItem label="Hardware Model" value={realProps.info?.info.model} highlight />
               <InfoItem label="System Uptime" value={formatUptime(realProps.info?.info.up || 0)} highlight />
               <InfoItem label="Firmware Stack" value={realProps.info?.info.vername} />
               <InfoGroupSeparator />
               <InfoItem label="Panel Orientation" value={realProps.screen_orientation?.orientation} />
               <InfoItem label="Dot Clock Rate" value={`${realProps.dimension?.real_dclk} KHz`} />
               <InfoItem label="Sync H-Pulse" value={`${realProps.dimension?.hsync} px`} />
            </InfoGroup>
            
            <InfoGroup title="Active Connectivity" icon={Network}>
               <InfoItem label="Active Port" value={realProps.ifstatus?.types.find(i => i.connected === 1)?.type.toUpperCase()} highlight />
               <InfoItem label="Assigned IPv4" value={realProps.ifstatus?.types.find(i => i.connected === 1)?.ips?.ip} fontMono highlight />
               <InfoItem label="Gateway Node" value={realProps.ifstatus?.types.find(i => i.connected === 1)?.ips?.gateway} fontMono />
               <InfoItem label="DNS Resolver" value={realProps.ifstatus?.types.find(i => i.connected === 1)?.ips?.dns1} fontMono />
               <InfoGroupSeparator />
               <InfoItem label="Cellular ISP" value={realProps["4ginfo"]?.operator} />
               <InfoItem label="RSSI Signal" value={`${realProps["4ginfo"]?.signal} dBm`} highlight />
               <InfoItem label="Modem IMEI" value={realProps["4ginfo"]?.imei} fontMono />
            </InfoGroup>
         </div>

         {/* Resource Analytics (4/12) */}
         <Card className="xl:col-span-4 rounded-3xl border-none ring-1 ring-muted/60 bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col justify-between">
            <CardHeader className="p-0 pb-6">
               <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" /> Hardware Vital Signs
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-8 flex-1">
               <ResourceProgress 
                  label="Flash Partitions" 
                  used={realProps.info?.info.storage.total! - realProps.info?.info.storage.free!} 
                  total={realProps.info?.info.storage.total!} 
                  unit="GB" 
                  color="bg-emerald-500"
               />
               <ResourceProgress 
                  label="Volatile Memory (RAM)" 
                  used={realProps.info?.info.mem.total! - realProps.info?.info.mem.free!} 
                  total={realProps.info?.info.mem.total!} 
                  unit="MB"
                  color="bg-blue-500"
               />
               <div className="pt-4 grid grid-cols-2 gap-4">
                  <div className="bg-card p-5 rounded-2xl border shadow-sm text-center">
                     <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Dot Clock</p>
                     <p className="text-xl font-black text-slate-800 dark:text-white">{realProps.dimension?.real_dclk} <span className="text-[10px] opacity-40">KHz</span></p>
                  </div>
                  <div className="bg-card p-5 rounded-2xl border shadow-sm text-center">
                     <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">FPS Cycle</p>
                     <p className="text-xl font-black text-primary">{realProps.dimension?.fps}</p>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* SECTION 4: DEEP ASSETS & SYSTEM POLICIES */}
      <Tabs defaultValue="assets" className="w-full">
         <TabsList className="bg-muted/40 p-1 rounded-2xl border h-11 mb-6 flex w-full md:w-auto">
            <TabsTrigger value="assets" className="rounded-xl flex-1 md:px-12 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-md">Endpoint Storage</TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-xl flex-1 md:px-12 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-md">Timeline Monitor</TabsTrigger>
            <TabsTrigger value="policy" className="rounded-xl flex-1 md:px-12 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-md">System Manifest</TabsTrigger>
         </TabsList>

         <TabsContent value="schedule" className="mt-0">
            <Card className="rounded-[3rem] border-none ring-1 ring-muted/60 overflow-hidden shadow-xl bg-card">
               <CardHeader className="px-10 py-8 border-b bg-muted/5 flex flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                     <CardTitle className="text-xl font-black tracking-tight uppercase">Live Timeline Monitor</CardTitle>
                     <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Real-time terminal execution rules for today</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                     <Button variant="outline" className="h-10 rounded-xl font-black text-xs gap-2 border-2 uppercase">
                        <RotateCw className="h-4 w-4" /> Sync Node
                     </Button>
                     <Button className="h-10 rounded-xl font-black text-xs gap-2 bg-zinc-900 text-white uppercase px-6">
                        Modify Schedule
                     </Button>
                  </div>
               </CardHeader>
               <CardContent className="p-10 space-y-12">
                  <div className="relative h-64 bg-muted/20 border-2 border-dashed border-muted rounded-[2.5rem] overflow-hidden">
                     {/* 24h Grid */}
                     <div className="absolute inset-0 flex">
                        {Array.from({ length: 24 }).map((_, i) => (
                           <div key={i} className="flex-1 border-r border-muted/30 last:border-r-0 flex flex-col items-center justify-end pb-2">
                              <span className="text-[8px] font-black text-muted-foreground/30 tabular-nums">{String(i).padStart(2, '0')}</span>
                           </div>
                        ))}
                     </div>
                     
                     {/* Current Time Indicator */}
                     <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ left: '65%' }}>
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <div className="absolute top-4 left-2 px-2 py-1 bg-rose-500 text-white text-[8px] font-black rounded-md uppercase whitespace-nowrap">Current Time: 15:42</div>
                     </div>

                     {/* Active Program Blocks */}
                     <div className="absolute top-12 left-[35%] right-[15%] h-12 bg-blue-500/10 border-2 border-blue-500/40 rounded-2xl flex items-center px-6 gap-3 shadow-lg">
                        <Play className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-blue-700">Lobby Loop V4 (Active)</span>
                        <Badge className="ml-auto bg-blue-500 text-white text-[8px]">08:30 - 20:00</Badge>
                     </div>

                     <div className="absolute top-32 left-[45%] right-[40%] h-12 bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl flex items-center px-6 gap-3 shadow-lg">
                        <Zap className="h-4 w-4 text-rose-500 fill-rose-500/20" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-rose-700">Flash Sale Promo</span>
                        <Badge className="ml-auto bg-rose-500 text-white text-[8px]">11:00 - 13:00</Badge>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="p-6 rounded-3xl bg-muted/10 border-2 border-dashed border-muted space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Policy</p>
                        <h4 className="text-lg font-black uppercase tracking-tighter">Retail Weekend Plan</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">Applied to this node since Dec 12, 2025.</p>
                     </div>
                     <div className="p-6 rounded-3xl bg-muted/10 border-2 border-dashed border-muted space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Storage Status</p>
                        <div className="flex items-center gap-3">
                           <HardDrive className="h-5 w-5 text-primary" />
                           <span className="text-lg font-black tabular-nums">4.2 GB / 16 GB</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">Schedule resources are fully cached on local storage.</p>
                     </div>
                     <div className="p-6 rounded-3xl bg-muted/10 border-2 border-dashed border-muted space-y-4">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Next Action</p>
                        <div className="flex items-center gap-3">
                           <Clock className="h-5 w-5 text-amber-500" />
                           <span className="text-lg font-black">20:00 - SLEEP</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">Automatic suspend initiated by power policy.</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="assets" className="mt-0">
            <Card className="rounded-3xl border-none ring-1 ring-muted/60 overflow-hidden shadow-xl bg-card">
               <CardHeader className="px-8 py-6 border-b bg-muted/5 flex flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                     <CardTitle className="text-lg font-black tracking-tighter uppercase">Local Resource Repository</CardTitle>
                     <CardDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Localized vsn bundles in primary storage</CardDescription>
                  </div>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input placeholder="Filter terminal cache..." className="pl-10 h-11 w-64 bg-muted/30 border-none rounded-xl text-xs font-bold" />
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="grid grid-cols-12 px-8 py-5 bg-muted/20 text-[9px] font-black uppercase text-slate-500 tracking-widest border-b">
                     <div className="col-span-7">Resource Bundle / Manifest MD5</div>
                     <div className="col-span-2 text-center">Protocol</div>
                     <div className="col-span-3 text-right">Disk Allocation</div>
                  </div>
                  <div className="divide-y divide-muted/40">
                     {realProps.vsns?.contents.map(group => group.content.map(vsn => (
                        <div key={vsn.md5} className="grid grid-cols-12 px-8 py-6 items-center hover:bg-primary/[0.02] transition-colors group">
                           <div className="col-span-7 flex items-center gap-5">
                              <div className="h-12 w-12 rounded-2xl bg-card border flex items-center justify-center text-muted-foreground shadow-sm group-hover:scale-105 transition-transform">
                                 <FileText className="h-6 w-6" />
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                 <p className="font-black text-sm uppercase tracking-tight text-slate-800 dark:text-slate-100">{vsn.name}</p>
                                 <p className="text-[10px] font-mono text-muted-foreground opacity-50 truncate max-w-[400px]">{vsn.md5}</p>
                              </div>
                           </div>
                           <div className="col-span-2 text-center">
                              <Badge variant="outline" className="text-[9px] font-black uppercase rounded-lg border-none bg-indigo-500/10 text-indigo-600 px-3">{group.type}</Badge>
                           </div>
                           <div className="col-span-3 text-right">
                              <p className="text-xs font-black tabular-nums">{(vsn.size / 1024 / 1024).toFixed(1)} <span className="text-[10px] font-bold opacity-40 ml-1">MB</span></p>
                           </div>
                        </div>
                     )))}
                  </div>
               </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="policy" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="rounded-3xl border-none ring-1 ring-muted/60 shadow-sm overflow-hidden lg:col-span-1">
                  <CardHeader className="bg-muted/5 border-b py-6 px-8">
                     <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-slate-500">
                        <Clock className="h-4 w-4 text-primary" /> Terminal Chronometer
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                     <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 text-center shadow-inner ring-1 ring-primary/5">
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] mb-2">Internal RTC Output</p>
                        <p className="text-6xl font-black tracking-tighter text-primary tabular-nums drop-shadow-sm">{realProps.newrtc?.time.split(' ')[1]}</p>
                        <p className="text-xs font-black text-muted-foreground uppercase mt-4 tracking-widest opacity-60">{realProps.newrtc?.time.split(' ')[0]}</p>
                     </div>
                     <div className="space-y-5 px-4">
                        <PolicyData label="Timezone ID" value={realProps.newrtc?.timezoneId} />
                        <PolicyData label="Local Offset" value="GMT +8:00" />
                        <PolicyData label="NTP Engine" value="pool.ntp.org" active />
                     </div>
                  </CardContent>
               </Card>

               <Card className="rounded-3xl border-none ring-1 ring-muted/60 shadow-sm overflow-hidden lg:col-span-2">
                  <CardHeader className="bg-muted/5 border-b py-6 px-8">
                     <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-slate-500">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> Security & Logic Manifest
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                     <PolicyItem label="Inbound Firewall" desc="Reject unauthorized socket handshakes" active={realProps.inboundfirewall?.status === 'on'} />
                     <PolicyItem label="OTA Autonomous" desc="Self-apply kernel security patches" active />
                     <PolicyItem label="USB Physical Access" desc="Allow media ingestion via physical ports" active={false} />
                     <PolicyItem label="Sync Program Mode" desc="NTP-based frame synchronization" active={realProps.sync_program_mode?.sync_program_ntp_enable === 1} />
                  </CardContent>
               </Card>
            </div>
         </TabsContent>
      </Tabs>

      {/* DANGEROUS ACTION CONFIRMATION (WITH SLIDE-TO-UNLOCK) */}
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
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none">
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
             <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground" onClick={() => setConfirmDialog({ open: false, type: null })}>
                Abort Operation
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BatchCommandDialog
        open={showBatchCommand}
        onOpenChange={setShowBatchCommand}
        devices={mockDevices}
        tags={mockTags}
        initialSelectedDeviceIds={device ? [device.id] : []}
        mode="single-device"
      />

    </div>
  );
}

function PolicyData({ label, value, active = false }: { label: string, value: any, active?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[10px] group">
       <span className="font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
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
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-slate-500">
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
      <span className="text-muted-foreground font-black text-[9px] uppercase tracking-[0.15em] shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          "font-black truncate text-xs tracking-tight uppercase", 
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
             <p className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">{label}</p>
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
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <span className={cn("font-mono font-black text-xs", isHigh ? "text-rose-500" : "text-slate-700 dark:text-slate-300")}>{percentage.toFixed(0)}%</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
         <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--primary),0.5)]", color, isHigh && "bg-rose-500")} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
        <span>Mapped: {formattedUsed} {unit}</span>
        <span>Capacity: {formattedTotal} {unit}</span>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMinutes = (Date.now() - date.getTime()) / (1000 * 60);
  if (diffMinutes < 1) return 'ONLINE_NOW';
  if (diffMinutes < 60) return `${Math.floor(diffMinutes)}M AGO`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}H AGO`;
  return date.toLocaleDateString();
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}D ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
