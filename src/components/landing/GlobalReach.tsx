import React from "react";
import { useTranslation } from "react-i18next";
import { WorldMap } from "@/components/ui/world-map";
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

  const stats = [
    {
      label: t("globalReach.stats.edgeLocations.label"),
      value: t("globalReach.stats.edgeLocations.value"),
    },
    {
      label: t("globalReach.stats.avgLatency.label"),
      value: t("globalReach.stats.avgLatency.value"),
    },
    {
      label: t("globalReach.stats.globalUptime.label"),
      value: t("globalReach.stats.globalUptime.value"),
    },
  ];

  return (
    <section className="py-32 md:py-40 bg-black overflow-hidden select-none relative">
      {/* Subtle atmospheric glow around the map area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
          <FadeIn>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6 md:mb-8">
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                {t("globalReach.title")}
              </span>
              <br />
              <span className="bg-gradient-to-r from-white/40 to-white/20 bg-clip-text text-transparent">
                {t("globalReach.titleHighlight")}
              </span>
            </h2>
            <p className="text-white/50 text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              {t("globalReach.subtitle")}
            </p>
          </FadeIn>
        </div>

        {/* The Hub-and-Spoke Visualization */}
        <div className="relative w-full max-w-5xl mx-auto">
          <FadeIn delay={0.2}>
            <div className="relative aspect-[2/1] rounded-2xl md:rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.08] p-2 sm:p-6 backdrop-blur-sm shadow-2xl shadow-primary/5">
              <WorldMap dots={dots} lineColor="hsl(var(--primary))" />
            </div>
          </FadeIn>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto mt-16 md:mt-24">
          {stats.map((stat, i) => (
            <FadeIn key={i} delay={0.3 + i * 0.1}>
              <div className="text-center group relative">
                {/* Subtle hover glow effect */}
                <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                <div className="relative py-4 md:py-6 px-2 md:px-4 rounded-xl border border-transparent group-hover:border-white/[0.08] transition-colors duration-300">
                  <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-white/30 mb-2 md:mb-3 block group-hover:text-primary/70 transition-colors duration-300">
                    {stat.label}
                  </span>
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {stat.value}
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
