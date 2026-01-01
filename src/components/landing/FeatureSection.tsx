import React from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Layout,
  Send,
  Activity,
  ChevronRight,
  File,
  Image,
  Video,
  Check,
  Layers,
  Play,
  Monitor,
  Wifi,
  WifiOff
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/ui/FadeIn";

// ========== Step UI Mockups ==========

// Step 1: Upload Media Interface
const UploadMockup = () => (
  <div className="w-full">
    <div className="bg-neutral-900/80 rounded-xl border border-white/[0.06] p-4 space-y-3">
      {/* Drag & Drop Zone */}
      <div className="border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 rounded-lg p-4 text-center">
        <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
        <div className="text-[10px] text-cyan-400/80">Drop files here</div>
      </div>

      {/* File List */}
      <div className="space-y-2">
        {[
          { name: "promo_4k.mp4", icon: Video, size: "128MB", status: "done" },
          { name: "banner.png", icon: Image, size: "2.4MB", status: "done" },
          { name: "slides.pdf", icon: File, size: "8.1MB", status: "uploading" },
        ].map((file, i) => (
          <div key={i} className="flex items-center gap-2 bg-neutral-800/50 rounded-lg px-3 py-2">
            <file.icon className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[10px] text-neutral-300 flex-1 truncate">{file.name}</span>
            <span className="text-[9px] text-neutral-600">{file.size}</span>
            {file.status === "done" ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <div className="w-3 h-3 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Step 2: Create Program Interface
const EditorMockup = () => (
  <div className="w-full">
    <div className="bg-neutral-900/80 rounded-xl border border-white/[0.06] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1">
          {["T", "□", "○", "▷"].map((icon, i) => (
            <div key={i} className={cn(
              "w-5 h-5 rounded flex items-center justify-center text-[9px]",
              i === 3 ? "bg-purple-500/20 text-purple-400" : "text-neutral-500"
            )}>
              {icon}
            </div>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex gap-1">
          <Layers className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[9px] text-neutral-500">3 layers</span>
        </div>
      </div>

      {/* Canvas Preview */}
      <div className="p-3">
        <div className="aspect-video bg-neutral-950 rounded-lg border border-white/[0.04] relative overflow-hidden">
          {/* Grid dots */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }} />

          {/* Video layer */}
          <div className="absolute inset-2 border border-purple-500/30 bg-purple-500/10 rounded flex items-center justify-center">
            <Play className="w-6 h-6 text-purple-400/50" />
          </div>

          {/* Text overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-black/60 backdrop-blur-sm rounded px-2 py-1">
              <div className="h-1.5 w-16 bg-white/40 rounded mb-1" />
              <div className="h-1 w-24 bg-white/20 rounded" />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-2 h-4 bg-neutral-800 rounded-full overflow-hidden flex items-center px-1">
          <div className="h-2 w-1/3 bg-purple-500/60 rounded-full" />
          <div className="w-0.5 h-3 bg-white ml-1" />
        </div>
      </div>
    </div>
  </div>
);

// Step 3: Deploy to Devices Interface
const DeployMockup = () => (
  <div className="w-full">
    <div className="bg-neutral-900/80 rounded-xl border border-white/[0.06] p-4 space-y-3">
      {/* Device Selection */}
      <div className="space-y-2">
        {[
          { name: "Lobby-Screen-01", online: true, selected: true },
          { name: "Entrance-Display", online: true, selected: true },
          { name: "Meeting-Room-A", online: false, selected: false },
        ].map((device, i) => (
          <div key={i} className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
            device.selected ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-neutral-800/50"
          )}>
            <div className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center",
              device.selected ? "border-emerald-500 bg-emerald-500" : "border-neutral-600"
            )}>
              {device.selected && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <Monitor className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[10px] text-neutral-300 flex-1">{device.name}</span>
            {device.online ? (
              <Wifi className="w-3 h-3 text-emerald-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-neutral-600" />
            )}
          </div>
        ))}
      </div>

      {/* Publish Button */}
      <button className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
        <Send className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-medium text-white">Publish</span>
      </button>
    </div>
  </div>
);

// Step 4: Monitor Status Interface
const MonitorMockup = () => (
  <div className="w-full">
    <div className="bg-neutral-900/80 rounded-xl border border-white/[0.06] p-4 space-y-3">
      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Online", value: "12", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Offline", value: "1", color: "text-neutral-500", bg: "bg-neutral-800" },
          { label: "Playing", value: "11", color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <div key={i} className={cn("rounded-lg p-2 text-center", stat.bg)}>
            <div className={cn("text-lg font-semibold", stat.color)}>{stat.value}</div>
            <div className="text-[9px] text-neutral-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Live Activity */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-neutral-400">Live Activity</span>
        </div>
        <div className="flex items-end gap-0.5 h-8">
          {[30, 45, 35, 60, 50, 70, 45, 55, 65, 40, 75, 50].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-amber-500/60 to-amber-500/20 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ========== Step Card Component ==========

interface WorkflowStepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  mockup: React.ReactNode;
  delay: number;
  isLast?: boolean;
}

const WorkflowStep = ({
  number,
  title,
  description,
  icon: Icon,
  color,
  mockup,
  delay,
  isLast
}: WorkflowStepProps) => {
  const colorClasses = {
    cyan: {
      number: "text-cyan-400",
      icon: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
      glow: "bg-cyan-500",
    },
    purple: {
      number: "text-purple-400",
      icon: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      glow: "bg-purple-500",
    },
    emerald: {
      number: "text-emerald-400",
      icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      glow: "bg-emerald-500",
    },
    amber: {
      number: "text-amber-400",
      icon: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      glow: "bg-amber-500",
    },
  }[color] || colorClasses.cyan;

  return (
    <FadeIn delay={delay} className="relative group">
      {/* Connection Arrow (hidden on last item and mobile) */}
      {!isLast && (
        <div className="hidden lg:flex absolute -right-4 top-16 z-10 items-center">
          <div className="w-8 h-px bg-gradient-to-r from-white/20 to-transparent" />
          <ChevronRight className="w-4 h-4 text-white/20 -ml-1" />
        </div>
      )}

      <div className={cn(
        "relative h-full flex flex-col overflow-hidden rounded-2xl",
        "bg-[#0a0a0a] border border-white/[0.06]",
        "transition-all duration-300",
        "hover:border-white/[0.12] hover:-translate-y-1"
      )}>
        {/* Step Number & Icon Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <span className={cn("text-4xl font-bold tracking-tighter opacity-50", colorClasses.number)}>
              {number}
            </span>
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border",
              colorClasses.icon
            )}>
              <Icon className="w-5 h-5" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-neutral-400 text-sm leading-relaxed">
            {description}
          </p>
        </div>

        {/* Mockup - Bottom */}
        <div className="mt-auto px-4 pb-4">
          {mockup}
        </div>

        {/* Subtle glow effect on hover */}
        <div className={cn(
          "absolute -bottom-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-500",
          colorClasses.glow
        )} />
      </div>
    </FadeIn>
  );
};

// ========== Main Component ==========

export const FeatureSection = () => {
  const { t } = useTranslation();

  const steps = [
    {
      number: t("workflow.step1.number"),
      title: t("workflow.step1.title"),
      description: t("workflow.step1.description"),
      icon: Upload,
      color: "cyan",
      mockup: <UploadMockup />,
    },
    {
      number: t("workflow.step2.number"),
      title: t("workflow.step2.title"),
      description: t("workflow.step2.description"),
      icon: Layout,
      color: "purple",
      mockup: <EditorMockup />,
    },
    {
      number: t("workflow.step3.number"),
      title: t("workflow.step3.title"),
      description: t("workflow.step3.description"),
      icon: Send,
      color: "emerald",
      mockup: <DeployMockup />,
    },
    {
      number: t("workflow.step4.number"),
      title: t("workflow.step4.title"),
      description: t("workflow.step4.description"),
      icon: Activity,
      color: "amber",
      mockup: <MonitorMockup />,
    },
  ];

  return (
    <section id="workflow" className="py-32 relative bg-black overflow-hidden">
      {/* Top border line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6"
          >
            {t("workflow.title")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400">
              {t("workflow.titleHighlight")}
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto"
          >
            {t("workflow.subtitle")}
          </motion.p>
        </div>

        {/* Workflow Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <WorkflowStep
              key={step.number}
              {...step}
              delay={index * 0.1}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
