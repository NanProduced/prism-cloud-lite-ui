import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/FadeIn";
import CountUp from "@/components/ui/count-up";
import { useTranslation } from "react-i18next";
import {
  RefreshCw,
  CheckCircle,
  Zap,
  Monitor,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

// ========== Mini Chart Component ==========

const MiniChart = ({ color }: { color: string }) => {
  const bars = useMemo(() =>
    Array.from({ length: 12 }, () => 20 + Math.random() * 60),
    []
  );

  const colorClasses = {
    cyan: "from-cyan-500/40 to-cyan-500/10",
    emerald: "from-emerald-500/40 to-emerald-500/10",
    purple: "from-purple-500/40 to-purple-500/10",
    amber: "from-amber-500/40 to-amber-500/10",
  }[color] || "from-white/20 to-white/5";

  return (
    <div className="flex items-end gap-0.5 h-full w-full px-4">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${height}%` }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
          className={cn("flex-1 rounded-t bg-gradient-to-t", colorClasses)}
        />
      ))}
    </div>
  );
};

// ========== Stat Card Component ==========

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  unit: string;
  label: string;
  description: string;
  color: "cyan" | "emerald" | "purple" | "amber";
  delay: number;
  decimals?: number;
}

const StatCard = ({
  icon: Icon,
  value,
  unit,
  label,
  description,
  color,
  delay,
  decimals = 0
}: StatCardProps) => {
  const colorClasses = {
    cyan: {
      iconBg: "bg-cyan-500/10",
      iconBorder: "border-cyan-500/20",
      iconColor: "text-cyan-400",
      unitColor: "text-cyan-400",
      glow: "bg-cyan-500",
      hoverBorder: "hover:border-cyan-500/30"
    },
    emerald: {
      iconBg: "bg-emerald-500/10",
      iconBorder: "border-emerald-500/20",
      iconColor: "text-emerald-400",
      unitColor: "text-emerald-400",
      glow: "bg-emerald-500",
      hoverBorder: "hover:border-emerald-500/30"
    },
    purple: {
      iconBg: "bg-purple-500/10",
      iconBorder: "border-purple-500/20",
      iconColor: "text-purple-400",
      unitColor: "text-purple-400",
      glow: "bg-purple-500",
      hoverBorder: "hover:border-purple-500/30"
    },
    amber: {
      iconBg: "bg-amber-500/10",
      iconBorder: "border-amber-500/20",
      iconColor: "text-amber-400",
      unitColor: "text-amber-400",
      glow: "bg-amber-500",
      hoverBorder: "hover:border-amber-500/30"
    }
  }[color];

  return (
    <FadeIn delay={delay}>
      <div className={cn(
        "relative group p-6 rounded-2xl overflow-hidden",
        "bg-white/[0.02] border border-white/[0.06]",
        "hover:bg-white/[0.04] hover:-translate-y-1",
        "transition-all duration-300",
        colorClasses.hoverBorder
      )}>
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border mb-5",
          colorClasses.iconBg,
          colorClasses.iconBorder
        )}>
          <Icon className={cn("w-5 h-5", colorClasses.iconColor)} />
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl md:text-5xl font-black text-white tracking-tighter tabular-nums">
            <CountUp to={value} decimals={decimals} duration={2.5} />
          </span>
          <span className={cn("text-xl md:text-2xl font-bold", colorClasses.unitColor)}>
            {unit}
          </span>
        </div>

        {/* Label */}
        <div className="text-sm font-semibold text-white mb-1">{label}</div>
        <div className="text-xs text-neutral-500">{description}</div>

        {/* Mini Chart Background */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
          <MiniChart color={color} />
        </div>

        {/* Hover Glow */}
        <div className={cn(
          "absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-[60px]",
          "opacity-0 group-hover:opacity-30 transition-opacity duration-500",
          colorClasses.glow
        )} />
      </div>
    </FadeIn>
  );
};

// ========== Main Component ==========

export const StatsSection = () => {
  const { t } = useTranslation();

  const stats = useMemo(() => [
    {
      icon: RefreshCw,
      value: 1.2,
      unit: t("stats.stat1.unit"),
      label: t("stats.stat1.label"),
      description: t("stats.stat1.description"),
      color: "cyan" as const,
      decimals: 1
    },
    {
      icon: CheckCircle,
      value: 99.9,
      unit: t("stats.stat2.unit"),
      label: t("stats.stat2.label"),
      description: t("stats.stat2.description"),
      color: "emerald" as const,
      decimals: 1
    },
    {
      icon: Zap,
      value: 14,
      unit: t("stats.stat3.unit"),
      label: t("stats.stat3.label"),
      description: t("stats.stat3.description"),
      color: "purple" as const,
      decimals: 0
    },
    {
      icon: Monitor,
      value: 50,
      unit: t("stats.stat4.unit"),
      label: t("stats.stat4.label"),
      description: t("stats.stat4.description"),
      color: "amber" as const,
      decimals: 0
    }
  ], [t]);

  return (
    <section className="py-32 relative overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <FadeIn delay={0.1}>
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
              {t("stats.title")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400">
                {t("stats.titleHighlight")}
              </span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
              {t("stats.subtitle")}
            </p>
          </FadeIn>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              {...stat}
              delay={0.3 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
