import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { 
  ArrowRight, 
  Cpu, 
  CheckCircle, 
  Zap, 
  Layout, 
  Play, 
  Clock, 
  ShieldCheck,
  Video,
  Monitor,
  Layers
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "transcode",
    title: "Smart Transcoding",
    highlight: "Zero-config playback",
    description: "Our cloud-native encoding engine automatically optimizes every asset for your target hardware. No more manual conversions or codec errors.",
    tags: ["4K Support", "Auto-bitrate", "H.265/HEVC"],
    color: "indigo",
    icon: Cpu,
  },
  {
    id: "editor",
    title: "Visual Editor",
    highlight: "Drag. Drop. Publish.",
    description: "Design stunning digital signage programs in minutes with our intuitive multi-layer editor. Built-in templates and real-time canvas preview.",
    tags: ["Multi-layer", "Keyframes", "Asset Library"],
    color: "purple",
    icon: Layout,
  },
  {
    id: "sync",
    title: "Resilient Sync",
    highlight: "Offline-first reliability",
    description: "Content is synchronized to edge nodes globally. Your screens keep playing even if the internet goes down, with smart bandwidth management.",
    tags: ["Edge Caching", "Bandwidth Control", "Delta Sync"],
    color: "emerald",
    icon: Zap,
  }
];

export const FeatureSection = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24 md:py-48 relative bg-black overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-8"
          >
            <Zap size={12} />
            <span>Enterprise Infrastructure</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8"
          >
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400">Scale</span>. <br className="hidden md:block" />
            Designed for <span className="text-white/40">Simplicity</span>.
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto font-medium"
          >
            Prism Cloud Lite eliminates the complexity of global content distribution, 
            letting you focus on the message, not the middleware.
          </motion.p>
        </div>

        <div className="space-y-40 md:space-y-64">
          {features.map((feature, index) => (
            <FeatureBlock key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureBlock = ({ feature, index }: { feature: any, index: number }) => {
  const isEven = index % 2 === 0;

  return (
    <div className={cn(
      "flex flex-col lg:flex-row items-center gap-16 lg:gap-32",
      !isEven && "lg:flex-row-reverse"
    )}>
      {/* Text Content */}
      <div className="flex-1 space-y-8">
        <motion.div
          initial={{ opacity: 0, x: isEven ? -20 : 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-6"
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg",
            feature.color === 'indigo' && "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
            feature.color === 'purple' && "bg-purple-500/10 border-purple-500/20 text-purple-400",
            feature.color === 'emerald' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          )}>
            <feature.icon size={24} />
          </div>
          
          <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {feature.title} <br />
            <span className="text-white/30">{feature.highlight}</span>
          </h3>
          
          <p className="text-lg text-gray-500 leading-relaxed font-medium">
            {feature.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {feature.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/50 text-[10px] font-bold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>

          <div className="pt-4">
            <button className="flex items-center gap-2 text-white font-bold group">
               Documentation <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Visual Mockup */}
      <div className="flex-1 w-full perspective-1000">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: isEven ? 5 : -5 }}
          whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative group"
        >
          {/* Background Glow */}
          <div className={cn(
            "absolute -inset-4 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity rounded-[3rem]",
            feature.color === 'indigo' && "bg-indigo-500",
            feature.color === 'purple' && "bg-purple-500",
            feature.color === 'emerald' && "bg-emerald-500"
          )} />
          
          <div className="relative bg-[#080808] rounded-[2rem] border border-white/[0.08] shadow-2xl overflow-hidden aspect-[4/3] flex flex-col">
            {/* Window Chrome */}
            <div className="h-10 border-b border-white/[0.05] bg-white/[0.02] flex items-center px-6 justify-between">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-white/10" />
                <div className="w-2 h-2 rounded-full bg-white/10" />
                <div className="w-2 h-2 rounded-full bg-white/10" />
              </div>
              <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">{feature.id}.prism.service</span>
            </div>

            <div className="flex-1 p-6 flex flex-col">
              {feature.id === 'transcode' && <TranscodeVisual />}
              {feature.id === 'editor' && <EditorVisual />}
              {feature.id === 'sync' && <SyncVisual />}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const TranscodeVisual = () => (
  <div className="space-y-6 flex-1 flex flex-col justify-center">
    {[
      { name: "Global_Keynote.mkv", progress: 92, status: "Transcoding", size: "1.2GB" },
      { name: "Product_Showcase_4K.mov", progress: 100, status: "Optimized", size: "850MB" },
      { name: "Winter_Campaign.mp4", progress: 100, status: "Ready", size: "420MB" }
    ].map((item, i) => (
      <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-4 relative overflow-hidden group/item">
        {item.progress < 100 && (
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "0%" }}
            className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
          />
        )}
        <div className="w-10 h-10 rounded bg-black border border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500">
          {item.name.split('.').pop()?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-white truncate">{item.name}</span>
            <span className="text-[10px] font-mono text-indigo-400">{item.progress}%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <div style={{ width: `${item.progress}%` }} className={cn("h-full rounded-full transition-all duration-1000", item.progress === 100 ? "bg-emerald-500/50" : "bg-indigo-500")} />
          </div>
        </div>
        {item.progress === 100 && <CheckCircle size={14} className="text-emerald-500 ml-2" />}
      </div>
    ))}
  </div>
);

const EditorVisual = () => (
  <div className="flex-1 bg-black/40 rounded-xl border border-white/5 overflow-hidden flex flex-col">
    <div className="h-8 bg-white/5 border-b border-white/5 px-4 flex items-center gap-4">
       <Layout size={12} className="text-purple-400" />
       <div className="flex gap-1">
         {[1,2,3].map(i => <div key={i} className="w-12 h-1 bg-white/10 rounded-full" />)}
       </div>
    </div>
    <div className="flex-1 flex p-4 gap-4">
      <div className="w-12 flex flex-col gap-3 pt-2">
        {[ImageIcon, Video, Layers, Monitor].map((Icon, i) => (
          <div key={i} className={cn("w-8 h-8 rounded-lg flex items-center justify-center", i === 0 ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-gray-600")}>
            <Icon size={14} />
          </div>
        ))}
      </div>
      <div className="flex-1 bg-[#050505] rounded-lg border border-white/5 relative overflow-hidden group/canvas shadow-inner">
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
         <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           whileInView={{ scale: 1, opacity: 1 }}
           className="absolute inset-8 border border-purple-500 bg-purple-500/10 flex items-center justify-center"
         >
            <Play size={32} className="text-purple-400 opacity-50" />
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-500" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-500" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-500" />
            <div className="absolute top-full mt-2 left-0 right-0 flex justify-center">
              <span className="px-2 py-0.5 rounded bg-purple-500 text-[8px] font-bold text-white uppercase tracking-widest">Video Layer</span>
            </div>
         </motion.div>
      </div>
    </div>
  </div>
);

const SyncVisual = () => (
  <div className="flex-1 flex flex-col justify-center items-center p-4">
    <div className="relative w-full max-w-sm aspect-video">
       {/* Central Hub */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center z-10">
          <Zap size={32} className="text-emerald-400" />
          <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-20 animate-pulse" />
       </div>

       {/* Orbiting Nodes */}
       {[0, 72, 144, 216, 288].map((deg, i) => (
         <motion.div
           key={i}
           animate={{ rotate: 360 }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute inset-0 pointer-events-none"
         >
            <div 
              style={{ transform: `rotate(${deg}deg) translateX(100px) rotate(-${deg}deg)` }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
               <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <Monitor size={14} className="text-gray-500" />
               </div>
               {/* Pulse line to hub */}
               <div className="absolute left-1/2 top-1/2 w-[100px] h-px bg-gradient-to-r from-emerald-500/40 to-transparent -translate-x-full origin-right" />
            </div>
         </motion.div>
       ))}
    </div>
    <div className="mt-8 grid grid-cols-2 gap-4 w-full">
       <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[8px] font-bold text-gray-600 uppercase mb-1">Success Rate</div>
          <div className="text-sm font-bold text-white">99.98%</div>
       </div>
       <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="text-[8px] font-bold text-gray-600 uppercase mb-1">Global Latency</div>
          <div className="text-sm font-bold text-emerald-400">14ms</div>
       </div>
    </div>
  </div>
);

const ImageIcon = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);