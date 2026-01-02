import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  LayoutDashboard,
  Monitor,
  Layers,
  CalendarClock,
  Search,
  Wifi,
  WifiOff,
  AlertTriangle,
  FileWarning,
  XCircle,
  Clock,
  ChevronDown,
  Play,
  Bell,
  Menu,
  Zap,
  Activity,
  Image as ImageIcon,
  Film,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrismIcon } from '@/components/shared/logo';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export const MiniDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [cpuFluctuation, setCpuFluctuation] = useState(0);

  const mouseX = useSpring(0, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuFluctuation(Math.floor(Math.random() * 5) - 2);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const NAV_GROUPS = [
    {
      items: [
        { label: "Dashboard", icon: LayoutDashboard, id: "overview" },
        { label: "Devices", icon: Monitor, id: "devices" },
      ],
    },
    {
      items: [
        { label: "Media Library", icon: ImageIcon, id: "media" },
        { label: "Programs", icon: Layers, id: "programs" },
        { label: "Schedule", icon: CalendarClock, id: "schedule" },
      ],
    },
  ];

  const MOCK_DEVICES = [
    { name: "NYC-Lobby-Main", online: true, program: "Welcome 2024", lastSeen: "Just now", cpu: 23 },
    { name: "LA-Conference-A", online: true, program: "Q4 Results", lastSeen: "Just now", cpu: 45 },
    { name: "CHI-Cafeteria-01", online: true, program: "Daily Menu", lastSeen: "Just now", cpu: 12 },
    { name: "SF-Reception", online: false, program: "—", lastSeen: "3h ago", cpu: 0 },
    { name: "BOS-Elevator-L2", online: true, program: "News Feed", lastSeen: "Just now", cpu: 31 },
  ];

  const MOCK_PROGRAMS = [
    { name: "Welcome 2024", resolution: "1920×1080", status: "published", devices: 6, gradient: "from-indigo-600 to-violet-600", layers: 4, duration: "00:45" },
    { name: "Q4 Results", resolution: "1920×1080", status: "published", devices: 4, gradient: "from-emerald-600 to-teal-600", layers: 3, duration: "02:30" },
    { name: "Daily Menu", resolution: "1080×1920", status: "published", devices: 3, gradient: "from-amber-600 to-orange-600", layers: 2, duration: "00:15" },
    { name: "Holiday Promo", resolution: "1920×1080", status: "draft", devices: 0, gradient: "from-fuchsia-600 to-rose-600", layers: 5, duration: "01:00" },
  ];

  const MOCK_MEDIA = [
    { name: "Brand_Intro_4K.mp4", size: "142 MB", type: "video", date: "2h ago", color: "bg-blue-500" },
    { name: "Global_Promotion.jpg", size: "2.4 MB", type: "image", date: "5h ago", color: "bg-purple-500" },
    { name: "Menu_Items_Static.png", size: "5.1 MB", type: "image", date: "Yesterday", color: "bg-amber-500" },
    { name: "Corporate_Safety.mp4", size: "88 MB", type: "video", date: "2 days ago", color: "bg-rose-500" },
    { name: "Welcome_Background.mp4", size: "45 MB", type: "video", date: "3 days ago", color: "bg-emerald-500" },
    { name: "Footer_Logo_Set.svg", size: "0.2 MB", type: "image", date: "Last week", color: "bg-slate-500" },
  ];

  const MOCK_SCHEDULE = [
    { time: "09:00 - 12:00", program: "Morning Welcome", group: "Reception", status: "active" },
    { time: "12:00 - 14:00", program: "Lunch Menu Special", group: "Cafeteria", status: "waiting" },
    { time: "14:00 - 18:00", program: "Corporate News", group: "All Screens", status: "waiting" },
    { time: "18:00 - 22:00", program: "Evening Ambiance", group: "Lobby", status: "waiting" },
  ];

  const WEEKLY_DATA = [
    { day: 'Mon', value: 65 }, { day: 'Tue', value: 82 }, { day: 'Wed', value: 74 },
    { day: 'Thu', value: 91 }, { day: 'Fri', value: 88 }, { day: 'Sat', value: 45 }, { day: 'Sun', value: 38 },
  ];
  const maxValue = 100;

  return (
    <div
      className="relative w-full h-full group select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1200px" }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="dark w-full h-full bg-[#050505]/90 backdrop-blur-2xl rounded-2xl border border-white/[0.05] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] overflow-hidden flex text-foreground"
      >
        {/* Sidebar */}
        <aside className="w-16 md:w-64 border-r border-white/[0.05] bg-[#080808] flex flex-col transition-all duration-300">
          <div className="p-4 border-b border-white/[0.03]">
            <div className="flex items-center gap-3">
              <PrismIcon size={28} variant="gradient" className="flex-shrink-0" />
              <div className="hidden md:flex flex-1 flex-col items-start min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-white/90">Prism Cloud</span>
                  <Badge className="text-[10px] h-4 font-bold px-1.5 py-0 bg-primary/20 text-primary border border-primary/20">Lite</Badge>
                </div>
                <p className="text-[10px] tracking-[0.2em] text-white/20 mt-0.5 uppercase font-medium">Workspace</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-6">
            {NAV_GROUPS.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative text-sm font-medium",
                      activeTab === item.id
                        ? "bg-white/[0.03] text-white shadow-[inset_0_0_1px_rgba(255,255,255,0.1)]"
                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
                    )}
                  >
                    <item.icon size={18} className={cn("transition-colors", activeTab === item.id ? "text-primary" : "text-white/20 group-hover:text-white/60")} />
                    <span className="hidden md:block">{item.label}</span>
                  </button>
                ))}
                {groupIdx < NAV_GROUPS.length - 1 && <div className="mt-4 pt-4 border-t border-white/[0.03]" />}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/[0.03]">
             <div className="hidden md:block rounded-xl border border-white/[0.03] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white/50">Cloud Storage</h4>
                  <Badge variant="outline" className="text-[10px] font-bold h-5 bg-black/40 border-primary/20 text-primary">Free</Badge>
                </div>
                <Progress value={60} className="h-1 bg-white/[0.05]" />
                <div className="flex items-center justify-between text-[10px] text-white/30 font-medium">
                  <span>1.2 GB / 2 GB</span>
                  <span className="text-primary/60">60%</span>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/10">
          {/* Header */}
          <header className="h-16 border-b border-white/[0.05] flex items-center justify-between px-6 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                 <span className="hover:text-white/60 cursor-pointer transition-colors">Dashboard</span>
                 <span className="opacity-30">/</span>
                 <span className="text-white/90">{activeTab}</span>
               </div>
               <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] w-full max-w-[240px] group cursor-pointer hover:border-white/10 transition-all ml-6">
                  <Search size={14} className="text-white/20 group-hover:text-white/60" />
                  <span className="text-xs text-white/20">Search...</span>
                  <kbd className="ml-auto text-[10px] text-white/10 bg-black/40 px-1.5 py-0.5 rounded border border-white/5 font-mono">⌘K</kbd>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
                  <Bell size={18} />
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-500 border border-black" />
               </Button>
               
               <div className="flex items-center gap-3 pl-2 border-l border-white/[0.05] ml-2">
                 <div className="flex items-center gap-3 p-1 rounded-lg border border-transparent hover:bg-white/5 hover:border-white/5 transition-all cursor-pointer group">
                    <Avatar className="h-8 w-8 rounded-lg border border-white/5">
                       <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">JD</AvatarFallback>
                    </Avatar>
                    <div className="hidden xl:flex flex-col text-left">
                       <div className="flex items-center gap-1.5">
                         <span className="text-xs font-bold text-white/90">Jane Doe</span>
                       </div>
                       <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">PRO Plan</span>
                    </div>
                    <ChevronDown size={14} className="text-white/20 group-hover:text-white/60" />
                 </div>
               </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-end justify-between">
                    <div>
                       <h1 className="text-2xl font-bold tracking-tight text-white/95">Overview</h1>
                       <p className="text-sm text-white/40">Real-time network status and operations.</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2 text-[10px] h-8 bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10 font-bold uppercase tracking-widest">
                       <Zap className="h-3 w-3" />
                       Customize
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Device Health Widget */}
                    <Card className="md:col-span-7 bg-white/[0.02] border-white/[0.05] shadow-none overflow-hidden">
                       <CardHeader className="p-3 border-b border-white/[0.03] flex flex-row items-center gap-2 space-y-0 bg-white/[0.01]">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Fleet Status</CardTitle>
                       </CardHeader>
                       <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-8">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                                   <Wifi className="h-6 w-6 text-emerald-500" />
                                </div>
                                <div>
                                   <div className="text-3xl font-bold text-white/90 tracking-tighter">16</div>
                                   <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Online</div>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                                   <WifiOff className="h-6 w-6 text-white/20" />
                                </div>
                                <div>
                                   <div className="text-3xl font-bold text-white/90 tracking-tighter">2</div>
                                   <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Offline</div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="space-y-3">
                             <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-white/20">Coverage</span>
                                <span className="text-emerald-500">88.9%</span>
                             </div>
                             <Progress value={88.9} className="h-1 bg-white/[0.05]" />
                          </div>
                       </CardContent>
                    </Card>

                    {/* Attention Widget */}
                    <Card className="md:col-span-5 bg-white/[0.02] border-white/[0.05] shadow-none">
                       <CardHeader className="p-3 border-b border-white/[0.03] flex flex-row items-center gap-2 space-y-0 bg-white/[0.01]">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Attention</CardTitle>
                       </CardHeader>
                       <CardContent className="p-4 space-y-2 pt-6">
                          {[
                            { label: "Unpublished", icon: FileWarning, color: "text-amber-500", bg: "bg-amber-500/10", count: 3 },
                            { label: "Failed Tasks", icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10", count: 1 },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group border border-transparent hover:border-white/[0.05]">
                               <div className="flex items-center gap-3">
                                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", item.bg)}>
                                    <item.icon size={16} className={item.color} />
                                  </div>
                                  <span className="text-sm font-bold text-white/70">{item.label}</span>
                               </div>
                               <Badge className={cn("border-none px-2 font-black h-5", item.bg, item.color)}>{item.count}</Badge>
                            </div>
                          ))}
                       </CardContent>
                    </Card>

                    {/* Activity Chart */}
                    <Card className="md:col-span-12 bg-white/[0.02] border-white/[0.05] shadow-none overflow-hidden">
                       <CardHeader className="p-3 border-b border-white/[0.03] flex flex-row items-center justify-between bg-white/[0.01]">
                          <div className="flex items-center gap-2">
                             <Activity className="h-3.5 w-3.5 text-primary" />
                             <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Network Activity</CardTitle>
                          </div>
                          <div className="flex items-center gap-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                             <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Syncs</span>
                          </div>
                       </CardHeader>
                       <CardContent className="p-6 h-40 flex flex-col">
                         <div className="flex-1 flex items-end gap-2 h-full pt-4">
                            {WEEKLY_DATA.map((data, i) => (
                               <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full group">
                                  <div className="flex-1 w-full flex flex-col justify-end">
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: `${data.value}%` }}
                                      transition={{ duration: 1.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                      className={cn(
                                        "w-full rounded-t-sm transition-all duration-500 relative cursor-pointer",
                                        i === 4 ? "bg-primary shadow-[0_0_20px_rgba(var(--primary),0.2)]" : "bg-white/[0.05] hover:bg-white/[0.1]"
                                      )}
                                    />
                                  </div>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-tighter transition-colors",
                                    i === 4 ? "text-primary" : "text-white/20"
                                  )}>
                                    {data.day}
                                  </span>
                               </div>
                            ))}
                         </div>
                       </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {activeTab === "devices" && (
                <motion.div
                  key="devices"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white/95">Device Fleet</h1>
                    <div className="flex gap-2">
                       <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold h-7 px-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
                          16 Online
                       </Badge>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] overflow-hidden">
                    <div className="bg-white/[0.02] border-b border-white/[0.03] px-6 py-4 grid grid-cols-12 gap-4">
                      <span className="col-span-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">Device Name</span>
                      <span className="col-span-3 text-[10px] font-bold text-white/20 uppercase tracking-widest">Status</span>
                      <span className="col-span-3 text-[10px] font-bold text-white/20 uppercase tracking-widest">Load</span>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                      {MOCK_DEVICES.map((device, i) => (
                        <div key={i} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer group">
                          <div className="col-span-6 flex items-center gap-4">
                            <div className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center border transition-all",
                              device.online ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/[0.03] border-white/5 text-white/20"
                            )}>
                              <Monitor size={16} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-white/80 block truncate">{device.name}</span>
                              <span className="text-[10px] font-mono text-white/20 uppercase">{(i + 1).toString().padStart(4, '0')}</span>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <div className={cn(
                              "inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                              device.online ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-white/20"
                            )}>
                              <span className={cn("w-1 h-1 rounded-full", device.online ? "bg-emerald-500" : "bg-white/20")} />
                              {device.online ? "Online" : "Offline"}
                            </div>
                          </div>
                          <div className="col-span-3">
                             <div className="w-24 space-y-1.5">
                                <div className="flex justify-between text-[8px] font-bold text-white/20">
                                   <span>CPU</span>
                                   <span>{device.online ? device.cpu + cpuFluctuation : 0}%</span>
                                </div>
                                <Progress value={device.online ? device.cpu + cpuFluctuation : 0} className="h-1 bg-white/[0.05]" />
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "media" && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white/95">Media Library</h1>
                    <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest px-4">Upload Asset</Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {MOCK_MEDIA.map((item, i) => (
                      <Card key={i} className="bg-white/[0.02] border-white/[0.05] overflow-hidden group hover:border-white/10 transition-all cursor-pointer">
                        <div className={cn("aspect-video relative overflow-hidden", item.color, "opacity-20 group-hover:opacity-30 transition-opacity")}>
                          <div className="absolute inset-0 flex items-center justify-center">
                             {item.type === 'video' ? <Film size={32} className="text-white" /> : <ImageIcon size={32} className="text-white" />}
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white/80 truncate">{item.name}</p>
                              <p className="text-[10px] text-white/30 font-medium mt-0.5">{item.size} • {item.date}</p>
                            </div>
                            <MoreVertical size={14} className="text-white/20" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "programs" && (
                <motion.div
                  key="programs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white/95">Programs</h1>
                    <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest px-4">New Program</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MOCK_PROGRAMS.map((program, i) => (
                      <Card key={i} className="bg-white/[0.02] border-white/[0.05] overflow-hidden hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex h-28">
                          <div className={cn("w-28 bg-gradient-to-br flex-shrink-0 relative", program.gradient)}>
                             <div className="absolute inset-0 bg-black/20" />
                             <div className="absolute inset-0 flex items-center justify-center">
                               <Play size={20} className="text-white/40 group-hover:scale-110 transition-transform" />
                             </div>
                          </div>
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                               <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-white/90">{program.name}</h4>
                                  <Badge className={cn("text-[8px] font-black h-4 px-1 border-none", program.status === 'published' ? "bg-emerald-500/20 text-emerald-500" : "bg-white/10 text-white/40")}>
                                    {program.status === 'published' ? "LIVE" : "DRAFT"}
                                  </Badge>
                               </div>
                               <p className="text-[10px] text-white/30 font-medium mt-1">{program.resolution}</p>
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                               <span className="flex items-center gap-1"><Layers size={10} /> {program.layers}</span>
                               <span className="flex items-center gap-1"><Monitor size={10} /> {program.devices}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "schedule" && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white/95">Schedule</h1>
                    <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest px-4">Add Task</Button>
                  </div>

                  <div className="space-y-3">
                    {MOCK_SCHEDULE.map((item, i) => (
                      <Card key={i} className="bg-white/[0.02] border-white/[0.05] p-4 flex items-center justify-between group hover:bg-white/[0.03] transition-colors">
                        <div className="flex items-center gap-4">
                           <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border border-white/[0.05]", item.status === 'active' ? "bg-primary/10 text-primary" : "bg-white/5 text-white/20")}>
                             <Calendar size={18} />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white/80">{item.program}</p>
                              <div className="flex items-center gap-3 mt-1">
                                 <span className="text-[10px] text-white/30 font-bold flex items-center gap-1"><Clock size={10} /> {item.time}</span>
                                 <span className="text-[10px] text-white/30 font-bold flex items-center gap-1"><Monitor size={10} /> {item.group}</span>
                              </div>
                           </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[9px] font-black h-5 border-none", item.status === 'active' ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-white/20")}>
                           {item.status.toUpperCase()}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer className="h-10 border-t border-white/[0.05] bg-[#080808]/80 flex items-center justify-between px-6 shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <PrismIcon size={16} variant="gradient" />
                  <span className="text-[9px] text-primary font-black uppercase tracking-[0.3em]">Prism Cloud Lite</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-emerald-500/60 font-black uppercase tracking-widest">Active</span>
               </div>
            </div>
            <div className="flex items-center gap-4 text-[9px] text-white/20 font-mono font-bold">
               <span>Latency: 14ms</span>
               <div className="h-3 w-[1px] bg-white/[0.05]" />
               <span className="opacity-60">v2.0.4-STABLE</span>
            </div>
          </footer>
        </div>
      </motion.div>

      {/* Background Decorative Glow */}
      <div className="absolute -inset-10 bg-primary/5 blur-[120px] -z-20" />
    </div>
  );
};