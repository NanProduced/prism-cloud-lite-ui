import React from "react";
import { useTranslation } from "react-i18next";
import { WorldMap } from "@/components/ui/world-map";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/FadeIn";

export const GlobalReach: React.FC = () => {
  const { t } = useTranslation();

  // Central hub: Beijing (approximate coordinates)
  const hub = { lat: 39.9042, lng: 116.4074 };

  // Spreading connections from the hub to global nodes
  const dots = [
    { start: hub, end: { lat: 40.7128, lng: -74.006, label: "New York" } },
    { start: hub, end: { lat: 34.0522, lng: -118.2437, label: "Los Angeles" } },
    { start: hub, end: { lat: 51.5074, lng: -0.1278, label: "London" } },
    { start: hub, end: { lat: 35.6762, lng: 139.6503, label: "Tokyo" } },
    { start: hub, end: { lat: 1.3521, lng: 103.8198, label: "Singapore" } },
    { start: hub, end: { lat: 25.2048, lng: 55.2708, label: "Dubai" } },
    { start: hub, end: { lat: -33.8688, lng: 151.2093, label: "Sydney" } },
  ];

  return (
    <section className="py-40 bg-black overflow-hidden select-none relative">
      {/* Subtle atmospheric glow around the map area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-24">
          <FadeIn>
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
               Global Reach. <br />
               <span className="text-white/30">Total Control.</span>
            </h2>
            <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
               Control your entire fleet with millisecond precision, powered by our proprietary Tier-1 backbone and 240+ edge nodes.
            </p>
          </FadeIn>
        </div>

        {/* The Hub-and-Spoke Visualization */}
        <div className="relative w-full max-w-5xl mx-auto">
          <FadeIn delay={0.2}>
            <div className="relative aspect-[2/1] rounded-3xl overflow-hidden bg-white/[0.01] border border-white/[0.05] p-2 sm:p-6 backdrop-blur-sm">
               <WorldMap dots={dots} lineColor="hsl(var(--primary))" />
            </div>
          </FadeIn>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-24">
           {[
             { label: "Edge Locations", value: "240+" },
             { label: "Avg. Latency", value: "14ms" },
             { label: "Global Uptime", value: "99.99%" }
           ].map((stat, i) => (
             <FadeIn key={i} delay={0.3 + i * 0.1}>
               <div className="text-center group">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 block group-hover:text-primary/60 transition-colors">{stat.label}</span>
                  <span className="text-3xl font-bold text-white tracking-tighter">{stat.value}</span>
               </div>
             </FadeIn>
           ))}
        </div>
      </div>
    </section>
  );
};