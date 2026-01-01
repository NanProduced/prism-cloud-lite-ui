import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Monitor,
  Play,
  Bell,
  Search,
  Wifi,
  WifiOff,
  AlertTriangle,
  FileWarning,
  XCircle,
  Clock,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PrismIcon } from '@/components/shared/logo/PrismIcon';
import { cn } from '@/lib/utils';

export const MiniDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const NAV_ITEMS = [
    { label: t("hero.miniDashboard.tabs.overview"), icon: LayoutDashboard, id: "overview" },
    { label: t("hero.miniDashboard.tabs.devices"), icon: Monitor, id: "devices" },
    { label: t("hero.miniDashboard.tabs.programs"), icon: Play, id: "programs" },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  // Rich mock data
  const MOCK_DEVICES = [
    { name: "NYC-Lobby-Main", online: true, program: "Welcome 2024", lastSeen: "Just now", cpu: 23 },
    { name: "LA-Conference-A", online: true, program: "Q4 Results", lastSeen: "Just now", cpu: 45 },
    { name: "CHI-Cafeteria-01", online: true, program: "Daily Menu", lastSeen: "Just now", cpu: 12 },
    { name: "SF-Reception", online: false, program: "—", lastSeen: "3h ago", cpu: 0 },
    { name: "BOS-Elevator-L2", online: true, program: "News Feed", lastSeen: "Just now", cpu: 31 },
  ];

  const MOCK_PROGRAMS = [
    {
      name: "Welcome 2024",
      resolution: "1920×1080",
      status: "published",
      devices: 6,
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      layers: 4,
      duration: "00:45"
    },
    {
      name: "Q4 Results",
      resolution: "1920×1080",
      status: "published",
      devices: 4,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      layers: 3,
      duration: "02:30"
    },
    {
      name: "Daily Menu",
      resolution: "1080×1920",
      status: "published",
      devices: 3,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      layers: 2,
      duration: "00:15"
    },
    {
      name: "Holiday Promo",
      resolution: "1920×1080",
      status: "draft",
      devices: 0,
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      layers: 5,
      duration: "01:00"
    },
  ];

  // Weekly activity data with more detail
  const WEEKLY_DATA = [
    { day: 'Mon', value: 156, commands: 42 },
    { day: 'Tue', value: 203, commands: 58 },
    { day: 'Wed', value: 178, commands: 51 },
    { day: 'Thu', value: 289, commands: 76 },
    { day: 'Fri', value: 234, commands: 62 },
    { day: 'Sat', value: 267, commands: 71 },
    { day: 'Sun', value: 189, commands: 48 },
  ];
  const maxValue = Math.max(...WEEKLY_DATA.map(d => d.value));

  return (
    <div
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      style={{ perspective: "1500px" }}
    >
      <motion.div
        animate={{
          rotateX: mousePos.y * -5,
          rotateY: mousePos.x * 5,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full h-full bg-[#030303]/80 backdrop-blur-3xl rounded-2xl border border-white/[0.08] shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_0_1px_rgba(255,255,255,0.2)] overflow-hidden flex"
      >
        {/* Sidebar */}
        <div className="w-16 md:w-56 border-r border-white/[0.05] bg-black/40 flex flex-col transition-all duration-300">
          <div className="p-4 md:p-6 mb-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
               <PrismIcon size={20} variant="gradient" />
            </div>
            <span className="hidden md:block font-bold text-white tracking-tight">Prism Cloud</span>
          </div>

          <div className="flex-1 px-2 md:px-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  activeTab === item.id
                    ? "bg-white/5 text-white shadow-[inset_0_0_1px_rgba(255,255,255,0.2)]"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                )}
              >
                <item.icon size={18} className={activeTab === item.id ? "text-indigo-400" : "text-gray-600 group-hover:text-gray-400"} />
                <span className="hidden md:block text-[13px] font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div layoutId="nav-active" className="absolute left-0 w-1 h-4 bg-indigo-500 rounded-r-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-4 mt-auto">
             <div className="hidden md:block p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase mb-2 tracking-widest">Storage</div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-1.5">
                   <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                </div>
                <div className="text-[10px] text-gray-500 font-medium">1.2 GB / 2 GB</div>
             </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/20">
          {/* Header */}
          <header className="h-14 border-b border-white/[0.05] flex items-center justify-between px-6">
            <div className="flex items-center gap-4 flex-1">
               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] w-full max-w-xs group cursor-pointer hover:border-white/10 transition-colors">
                  <Search size={14} className="text-gray-500 group-hover:text-gray-300" />
                  <span className="text-[11px] text-gray-600 font-medium">Search...</span>
                  <kbd className="ml-auto text-[9px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="relative cursor-pointer text-gray-500 hover:text-white transition-colors">
                  <Bell size={18} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 border border-black" />
               </div>
               <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/10 shadow-lg flex items-center justify-center text-[11px] font-bold text-white">
                  N
               </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 p-6 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5 h-full flex flex-col"
                >
                  <div className="flex justify-between items-end">
                    <div>
                       <h2 className="text-xl font-bold text-white tracking-tight">{t("hero.miniDashboard.overview.welcome")}</h2>
                       <p className="text-[11px] text-gray-500 mt-0.5">{t("hero.miniDashboard.overview.welcomeSubtitle")}</p>
                    </div>
                    <div className="text-[10px] text-gray-600 font-mono">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-12 gap-4">
                    {/* Device Health Card - Prominent */}
                    <Card className="col-span-12 md:col-span-7 bg-white/[0.03] border-white/[0.08] p-5 rounded-xl">
                       <div className="flex items-start justify-between mb-4">
                          <div>
                             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("hero.miniDashboard.overview.totalDevices")}</span>
                             <div className="text-3xl font-black text-white tabular-nums tracking-tighter mt-1">18</div>
                          </div>
                          <div className="flex gap-4">
                             <div className="text-center">
                                <div className="flex items-center gap-1.5 text-green-400">
                                   <Wifi size={12} />
                                   <span className="text-xl font-bold tabular-nums">16</span>
                                </div>
                                <span className="text-[9px] text-gray-600 uppercase">{t("hero.miniDashboard.overview.online")}</span>
                             </div>
                             <div className="text-center">
                                <div className="flex items-center gap-1.5 text-rose-400">
                                   <WifiOff size={12} />
                                   <span className="text-xl font-bold tabular-nums">2</span>
                                </div>
                                <span className="text-[9px] text-gray-600 uppercase">{t("hero.miniDashboard.overview.offline")}</span>
                             </div>
                          </div>
                       </div>
                       {/* Health Progress Bar */}
                       <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '88.9%' }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-l-full"
                          />
                          <div className="h-full bg-rose-500 rounded-r-full flex-1" />
                       </div>
                       <div className="mt-2 flex justify-between items-center">
                          <span className="text-[10px] text-gray-500">Fleet health</span>
                          <span className="text-[11px] font-bold text-green-400">88.9%</span>
                       </div>
                    </Card>

                    {/* Attention Card */}
                    <Card className="col-span-12 md:col-span-5 bg-amber-500/5 border-amber-500/20 p-5 rounded-xl">
                       <div className="flex items-center gap-2 mb-4">
                          <AlertTriangle size={14} className="text-amber-400" />
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{t("hero.miniDashboard.overview.attention")}</span>
                       </div>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between group cursor-pointer">
                             <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                  <FileWarning size={14} className="text-amber-400" />
                                </div>
                                <div>
                                  <span className="text-[11px] text-white font-medium block">{t("hero.miniDashboard.overview.unpublished")}</span>
                                  <span className="text-[9px] text-gray-600">Q4 Results, Menu...</span>
                                </div>
                             </div>
                             <span className="text-sm font-bold text-white bg-amber-500/20 px-2 py-0.5 rounded tabular-nums">3</span>
                          </div>
                          <div className="flex items-center justify-between group cursor-pointer">
                             <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                  <XCircle size={14} className="text-rose-400" />
                                </div>
                                <div>
                                  <span className="text-[11px] text-white font-medium block">{t("hero.miniDashboard.overview.failedCommands")}</span>
                                  <span className="text-[9px] text-gray-600">SF-Reception timeout</span>
                                </div>
                             </div>
                             <span className="text-sm font-bold text-white bg-rose-500/20 px-2 py-0.5 rounded tabular-nums">1</span>
                          </div>
                       </div>
                    </Card>
                  </div>

                  {/* Activity Chart */}
                  <div className="flex-1 min-h-0 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                     <div className="flex justify-between items-center mb-4">
                       <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Weekly Activity</div>
                       <div className="flex items-center gap-3 text-[9px]">
                         <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-indigo-500" /> Events</span>
                         <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-indigo-500/30" /> Commands</span>
                       </div>
                     </div>
                     <div className="flex items-end gap-3 h-[calc(100%-40px)]">
                        {WEEKLY_DATA.map((data, i) => (
                           <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full">
                              <div className="flex-1 w-full flex flex-col justify-end gap-0.5">
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${(data.value / maxValue) * 100}%` }}
                                  transition={{ duration: 0.5, delay: i * 0.05 }}
                                  className={cn(
                                    "w-full rounded-t-sm transition-colors relative group cursor-pointer",
                                    i === 6 ? "bg-indigo-500" : "bg-indigo-500/40 hover:bg-indigo-500/60"
                                  )}
                                >
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-1.5 py-0.5 rounded text-[9px] text-white whitespace-nowrap">
                                    {data.value} events
                                  </div>
                                </motion.div>
                              </div>
                              <span className={cn(
                                "text-[9px] font-medium",
                                i === 6 ? "text-indigo-400" : "text-gray-600"
                              )}>
                                {data.day}
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "devices" && (
                <motion.div
                  key="devices"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 h-full flex flex-col"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white tracking-tight">{t("hero.miniDashboard.devices.title")}</h2>
                    <div className="flex gap-2">
                       <div className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          16 {t("hero.miniDashboard.overview.online")}
                       </div>
                       <div className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          2 {t("hero.miniDashboard.overview.offline")}
                       </div>
                    </div>
                  </div>

                  {/* Device Table */}
                  <div className="flex-1 rounded-xl border border-white/[0.08] overflow-hidden">
                    <div className="bg-white/[0.03] border-b border-white/[0.05] px-4 py-2.5 grid grid-cols-12 gap-4">
                      <span className="col-span-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("hero.miniDashboard.devices.name")}</span>
                      <span className="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("hero.miniDashboard.devices.status")}</span>
                      <span className="col-span-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:block">{t("hero.miniDashboard.devices.program")}</span>
                      <span className="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:block">{t("hero.miniDashboard.devices.lastSeen")}</span>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                      {MOCK_DEVICES.map((device, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer group"
                        >
                          <div className="col-span-4 flex items-center gap-2.5">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              device.online ? "bg-indigo-500/10" : "bg-gray-500/10"
                            )}>
                              <Monitor size={14} className={device.online ? "text-indigo-400" : "text-gray-600"} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-medium text-white truncate block">{device.name}</span>
                              {device.online && (
                                <span className="text-[9px] text-gray-600">CPU {device.cpu}%</span>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium",
                              device.online
                                ? "bg-green-500/10 text-green-400"
                                : "bg-rose-500/10 text-rose-400"
                            )}>
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                device.online ? "bg-green-500 animate-pulse" : "bg-rose-500"
                              )} />
                              {device.online ? t("hero.miniDashboard.overview.online") : t("hero.miniDashboard.overview.offline")}
                            </span>
                          </div>
                          <div className="col-span-4 hidden md:flex items-center gap-2">
                            {device.online && (
                              <>
                                <Play size={10} className="text-indigo-400" />
                                <span className="text-[11px] text-gray-400 truncate">{device.program}</span>
                              </>
                            )}
                            {!device.online && (
                              <span className="text-[11px] text-gray-600">—</span>
                            )}
                          </div>
                          <span className="col-span-2 text-[10px] text-gray-500 hidden md:flex items-center gap-1.5">
                            <Clock size={10} />
                            {device.lastSeen}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "programs" && (
                <motion.div
                  key="programs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 h-full flex flex-col"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white tracking-tight">{t("hero.miniDashboard.programs.title")}</h2>
                    <div className="flex gap-2">
                       <div className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={10} />
                          3 {t("hero.miniDashboard.programs.published")}
                       </div>
                       <div className="px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-400 text-[10px] font-bold">
                          1 {t("hero.miniDashboard.programs.draft")}
                       </div>
                    </div>
                  </div>

                  {/* Program Cards Grid */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-auto">
                    {MOCK_PROGRAMS.map((program, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="bg-white/[0.03] border-white/[0.08] p-4 rounded-xl hover:border-white/15 transition-all cursor-pointer group h-full">
                          <div className="flex gap-3">
                            {/* Rich Thumbnail */}
                            <div className={cn(
                              "w-20 h-14 rounded-lg flex-shrink-0 relative overflow-hidden",
                              "bg-gradient-to-br",
                              program.gradient
                            )}>
                              {/* Simulated content layers */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-5 bg-white/20 rounded-sm backdrop-blur-sm" />
                              </div>
                              <div className="absolute bottom-1 right-1 bg-black/50 px-1 py-0.5 rounded text-[8px] text-white/80 font-mono backdrop-blur-sm">
                                {program.duration}
                              </div>
                              {program.status === 'published' && (
                                <div className="absolute top-1 left-1">
                                  <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-[13px] font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                                  {program.name}
                                </h4>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0",
                                  program.status === 'published'
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-gray-500/10 text-gray-500"
                                )}>
                                  {program.status === 'published' ? t("hero.miniDashboard.programs.published") : t("hero.miniDashboard.programs.draft")}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-auto pt-2">
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {program.resolution}
                                </span>
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <Layers size={10} />
                                  {program.layers}
                                </span>
                                {program.devices > 0 && (
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <Monitor size={10} />
                                    {program.devices}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Bar */}
          <footer className="h-8 border-t border-white/[0.05] bg-black/40 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-1.5 text-[9px] text-green-400/80 font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  System OK
               </span>
               <span className="text-[9px] text-gray-600">|</span>
               <span className="text-[9px] text-gray-600">Latency: <span className="text-gray-500">24ms</span></span>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-[9px] text-gray-600 font-mono tracking-tighter">V2.0-LITE</span>
            </div>
          </footer>
        </div>
      </motion.div>

      {/* Background Decorative Glow */}
      <div className="absolute -inset-4 bg-indigo-500/5 blur-3xl -z-10 rounded-[3rem]" />
    </div>
  );
};
