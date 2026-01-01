import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronRight, Terminal, Layout, ShieldCheck, Video, Layers, Calendar, Settings } from "lucide-react";
import Prism from "@/components/Prism";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

export const Hero: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black selection:bg-indigo-500/30">
      {/* Prism Background Effect */}
      <div className="absolute inset-0 w-full h-full opacity-60 pointer-events-none z-0">
        <Prism />
      </div>

      {/* Raycast-style Top Spotlight/Aurora */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100%] h-[600px] opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/30 via-purple-900/10 to-transparent blur-[100px]" />
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-indigo-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-0 right-1/4 w-1/2 h-1/2 bg-purple-600/20 blur-[120px] mix-blend-screen" />
      </div>

      {/* Star field / Subtle grain */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      <Container className="relative z-10 flex flex-col items-center text-center">
        {/* Version Badge - Raycast Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-colors cursor-pointer backdrop-blur-sm group">
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">{t("hero.badge")}</span>
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{t("hero.badgeText")}</span>
            <ChevronRight className="h-3 w-3 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.div>

        {/* Headline - Massive & Glowing */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-5xl text-6xl md:text-8xl font-bold tracking-tight text-white mb-8 leading-[0.95]"
        >
          {t("hero.title")} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300">
            {t("hero.titleHighlight")}
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-xl text-gray-400 mb-10 leading-relaxed"
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20"
        >
          {/* Primary CTA Button */}
          <Button 
            size="lg" 
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/register")}
            className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-100 border-none font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {isAuthenticated ? t("nav.dashboard", "Go to Dashboard") : t("hero.primaryBtn")}
          </Button>

          {/* Secondary Demo Button */}
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-8 rounded-full bg-transparent border border-white/30 text-white hover:border-white/60 hover:bg-white/5 font-semibold transition-all"
          >
            {t("hero.secondaryBtn")}
          </Button>
        </motion.div>

        {/* Hero Visual - "Floating Interface" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-6xl mt-20 px-4"
          style={{ perspective: "2000px" }}
        >
          {/* Ambient Glows */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[100%] h-[100%] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute top-1/4 -right-10 w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

          {/* The "App Window" - Ultra High Fidelity */}
          <div className="relative bg-[#030303]/60 backdrop-blur-3xl rounded-3xl border border-white/[0.08] shadow-[0_0_100px_rgba(0,0,0,0.8),inset_0_0_1px_rgba(255,255,255,0.3)] overflow-hidden group">
            
            {/* Window Chrome */}
            <div className="h-12 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between px-6">
              <div className="flex gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/10" />
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/10" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/10" />
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex items-center gap-3">
                   <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-[0.2em]">Edge Node: HK-01</span>
                   </div>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <span className="text-[10px] text-gray-500 font-mono tracking-tighter">PRISM-LITE-V2</span>
              </div>
            </div>

            <div className="grid grid-cols-12 h-[600px] md:h-[700px]">
              {/* Sidebar */}
              <div className="col-span-3 border-r border-white/[0.05] bg-black/20 p-6 hidden lg:block">
                <div className="flex items-center gap-3 mb-12">
                   <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                      <Terminal size={18} className="text-white" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-white tracking-tight leading-none mb-1">Prism Center</span>
                      <span className="text-[9px] text-gray-500 font-medium uppercase tracking-widest">Enterprise</span>
                   </div>
                </div>
                
                <div className="space-y-1">
                  {[
                    { name: "Overview", icon: <Layout size={16} />, active: true },
                    { name: "Global Terminals", icon: <ShieldCheck size={16} /> },
                    { name: "Asset Library", icon: <Video size={16} /> },
                    { name: "Creative Editor", icon: <Layers size={16} /> },
                    { name: "Smart Scheduler", icon: <Calendar size={16} /> },
                    { name: "Global Config", icon: <Settings size={16} /> }
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium transition-all duration-300 cursor-pointer ${item.active ? "bg-white/5 text-white shadow-[inset_0_0_1px_rgba(255,255,255,0.2)]" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"}`}>
                      <span className={item.active ? "text-indigo-400" : "text-gray-600"}>{item.icon}</span>
                      {item.name}
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-10">
                   <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-white/5">
                      <div className="text-[10px] text-gray-500 font-bold uppercase mb-3 tracking-widest">Quota Usage</div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                         <div className="h-full w-3/4 bg-indigo-500 rounded-full" />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-gray-600">
                         <span>75% Used</span>
                         <span>24.2 / 32 GB</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Main Canvas */}
              <div className="col-span-12 lg:col-span-9 bg-black/40 p-8 relative overflow-hidden flex flex-col">
                {/* World Map Overlay - Faint Connectivity */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none scale-110">
                   <svg viewBox="0 0 1000 500" className="w-full h-full fill-white">
                      <path d="M150,200 L850,200 M200,300 L800,300 M500,50 L500,450" stroke="white" strokeWidth="0.5" />
                      {[200, 400, 600, 800].map(x => [100, 250, 400].map(y => (
                        <circle key={`${x}-${y}`} cx={x + Math.random()*50} cy={y + Math.random()*50} r="2" />
                      )))}
                   </svg>
                </div>

                <div className="relative z-10 flex justify-between items-start mb-12">
                   <div>
                      <h3 className="text-3xl font-bold text-white tracking-tight mb-2">Network Health</h3>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            <span className="text-xs text-gray-400">1,204 Online</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-xs text-gray-400">42 Syncing</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="hidden md:flex flex-col items-end">
                         <div className="text-[10px] font-mono text-gray-600 uppercase mb-1">Response Time</div>
                         <div className="text-sm font-bold text-indigo-400 tracking-tighter">18ms Avg.</div>
                      </div>
                      <Button className="rounded-full bg-white text-black font-bold h-10 px-6 hover:scale-105 transition-transform shadow-xl">
                         Launch Dashboard
                      </Button>
                   </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                   {/* Main Analytics Card */}
                   <div className="col-span-12 md:col-span-7 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] p-8 relative overflow-hidden group/card transition-all hover:bg-white/[0.05]">
                      <div className="absolute top-0 right-0 p-8 opacity-20 group-hover/card:opacity-40 transition-opacity">
                         <Zap size={120} className="text-indigo-500" />
                      </div>
                      <div className="relative z-10">
                         <div className="text-xs font-bold text-indigo-400 uppercase tracking-[0.3em] mb-6">Real-time Performance</div>
                         <div className="text-6xl font-black text-white mb-2 tabular-nums tracking-tighter">99.99<span className="text-3xl text-gray-600">%</span></div>
                         <div className="text-sm text-gray-500 font-medium mb-10">System uptime across 12 global regions</div>
                         
                         <div className="flex items-end gap-1.5 h-32">
                           {[40, 60, 45, 90, 70, 85, 50, 95, 60, 75, 40, 80, 55, 90, 65, 85, 70].map((h, i) => (
                             <motion.div 
                               key={i}
                               initial={{ height: 0 }}
                               animate={{ height: `${h}%` }}
                               transition={{ delay: i * 0.03, duration: 1, ease: "circOut" }}
                               className="flex-1 bg-gradient-to-t from-indigo-500/20 to-indigo-500 rounded-full"
                             />
                           ))}
                         </div>
                      </div>
                   </div>

                   {/* Right Side Cards */}
                   <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
                      <div className="flex-1 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] p-8 hover:bg-white/[0.05] transition-all">
                         <div className="flex justify-between items-start mb-6">
                            <div className="text-xs font-bold text-purple-400 uppercase tracking-widest">Active Task</div>
                            <Clock size={16} className="text-gray-600" />
                         </div>
                         <div className="text-xl font-bold text-white mb-2">Winter Campaign</div>
                         <p className="text-xs text-gray-500 mb-6">Synchronizing 4K assets to 482 terminals</p>
                         <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                               <motion.div 
                                 animate={{ x: ["-100%", "100%"] }}
                                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                 className="w-1/2 h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent" 
                               />
                            </div>
                            <span className="text-[10px] font-mono text-purple-400 font-bold">LIVESTREAM</span>
                         </div>
                      </div>
                      
                      <div className="h-32 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-700 p-6 flex items-center justify-between shadow-2xl shadow-indigo-500/20 group/cta cursor-pointer hover:scale-[1.02] transition-transform">
                         <div>
                            <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">New Terminal</div>
                            <div className="text-lg font-black text-white">Add Device</div>
                         </div>
                         <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover/cta:bg-white group-hover/cta:text-indigo-600 transition-all">
                            <ArrowRight size={24} />
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
