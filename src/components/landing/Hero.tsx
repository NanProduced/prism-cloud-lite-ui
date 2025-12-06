import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronRight, Terminal } from "lucide-react";

export const Hero: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black selection:bg-indigo-500/30">
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
          <Button size="lg" className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-100 border-none font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)]">
            {t("hero.primaryBtn")}
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
          initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative w-full max-w-5xl"
          style={{ perspective: "2000px" }}
        >
          {/* Glow behind the app */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/15 blur-[100px] rounded-full" />

          {/* The "App Window" */}
          <div className="relative bg-[#0A0A0A] rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden ring-1 ring-white/5 group">

            {/* Window Controls */}
            <div className="h-10 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between px-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#2D2D2D] border border-white/5" />
                <div className="w-3 h-3 rounded-full bg-[#2D2D2D] border border-white/5" />
                <div className="w-3 h-3 rounded-full bg-[#2D2D2D] border border-white/5" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
                Connected
              </div>
            </div>

            {/* Interface Layout */}
            <div className="grid grid-cols-12 h-[500px] md:h-[600px]">
              {/* Sidebar */}
              <div className="col-span-3 border-r border-white/[0.06] bg-[#050505] p-4 hidden md:block">
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
                    <Terminal size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">Prism</span>
                </div>
                <div className="space-y-1">
                  {["Dashboard", "Deployments", "Analytics", "Settings"].map((item, i) => (
                    <div key={i} className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${i === 0 ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Area */}
              <div className="col-span-12 md:col-span-9 bg-[#0A0A0A] p-8 relative overflow-hidden">
                {/* Spotlight within the app */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 blur-[80px] pointer-events-none" />

                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-1">Overview</h3>
                    <p className="text-gray-500 text-sm">Last synced 2 minutes ago</p>
                  </div>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20">
                    + New Deploy
                  </Button>
                </div>

                {/* Bento Grid inside App */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1 p-6 rounded-xl bg-[#111] border border-white/[0.06] relative group/card hover:border-white/[0.15] transition-colors">
                    <div className="absolute top-4 right-4 text-green-500">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>
                    <div className="text-gray-500 text-sm mb-2 font-mono">Active Terminals</div>
                    <div className="text-4xl font-bold text-white mb-4">1,248</div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-indigo-500 rounded-full" />
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1 p-6 rounded-xl bg-[#111] border border-white/[0.06] hover:border-white/[0.15] transition-colors">
                    <div className="text-gray-500 text-sm mb-2 font-mono">Bandwidth Usage</div>
                    <div className="text-4xl font-bold text-white mb-4">4.2 <span className="text-xl text-gray-600">TB</span></div>
                    <div className="flex items-end gap-1 h-8">
                      {[20, 40, 30, 60, 50, 80, 40, 90, 30, 50].map((h, i) => (
                        <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-white/10 hover:bg-indigo-500 transition-colors rounded-sm" />
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2 p-6 rounded-xl bg-[#111] border border-white/[0.06] hover:border-white/[0.15] transition-colors">
                    <div className="flex justify-between mb-4">
                      <div className="text-gray-500 text-sm font-mono">Recent Activities</div>
                      <div className="text-xs text-indigo-400 cursor-pointer hover:underline">View all</div>
                    </div>
                    <div className="space-y-3">
                      {[1,2,3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-xs font-mono text-gray-400">
                              LOG
                            </div>
                            <div>
                              <div className="text-sm text-gray-200">Campaign updated</div>
                              <div className="text-xs text-gray-600">US-East Region • 2m ago</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 font-mono">v2.4.0</div>
                        </div>
                      ))}
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
