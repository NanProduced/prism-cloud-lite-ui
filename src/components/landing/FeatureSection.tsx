import { motion } from "framer-motion";
import { ArrowRight, Play, Layers, Calendar, Video, Layout, Clock, Cpu, CheckCircle, Zap, AlertCircle } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { useTranslation } from "react-i18next";

export const FeatureSection = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-32 relative bg-black">
      <div className="container mx-auto px-6">
        <FadeIn className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest mb-6"
          >
            <Zap size={12} className="text-indigo-400" />
            <span>Powering Visual Networks</span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl text-white mb-6 font-bold tracking-tight">
            {t("features.title")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400">
              {t("features.titleHighlight")}
            </span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">{t("features.subtitle")}</p>
        </FadeIn>

        {/* Feature 1: Smart Transcoding */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32 mb-48">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full group-hover:bg-indigo-500/30 transition-colors" />
            
            {/* The Transcode Window */}
            <div className="relative z-10 w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
              <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                </div>
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Encoding Engine v4</span>
              </div>
              
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
                      <Cpu size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white tracking-tight">Cloud Transcoder</div>
                      <div className="text-[10px] text-gray-500">Auto-optimizing for 4K Screens</div>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold">ACTIVE</div>
                </div>

                <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-4 relative overflow-hidden group/item">
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <div className="w-10 h-10 rounded bg-black border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500">MKV</div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-medium text-white truncate">product_hero_final.mkv</span>
                          <span className="text-[10px] font-mono text-indigo-400">84%</span>
                       </div>
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: "84%" }}
                            className="h-full bg-indigo-500 rounded-full" 
                          />
                       </div>
                    </div>
                  </div>

                  {/* Item 2 - Done */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-4 opacity-50">
                    <div className="w-10 h-10 rounded bg-black border border-white/10 flex items-center justify-center text-xs font-bold text-green-500/50">MP4</div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-medium text-white/50 truncate">promo_v2_optimized.mp4</span>
                          <CheckCircle size={14} className="text-green-500/50" />
                       </div>
                       <div className="h-1 w-full bg-green-500/20 rounded-full overflow-hidden">
                          <div className="h-full w-full bg-green-500/50 rounded-full" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <FadeIn className="flex-1 text-left">
            <h3 className="text-4xl md:text-5xl text-white font-bold mb-8 tracking-tight">
              {t("features.smartTranscode")}
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed mb-10 font-light">
              {t("features.smartTranscodeDesc")}
            </p>
            <div className="flex items-center gap-6">
               <button className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2 group">
                  Learn how it works <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </FadeIn>
        </div>

        {/* Feature 2: Visual Editor */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-32 mb-48">
          <FadeIn className="flex-1 text-left">
            <h3 className="text-4xl md:text-5xl text-white font-bold mb-8 tracking-tight">
              {t("features.visualEditor")}
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed mb-10 font-light">
              {t("features.visualEditorDesc")}
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
               {["Drag & Drop", "4K Canvas", "Multi-layer", "Real-time Preview"].map(tag => (
                 <span key={tag} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">{tag}</span>
               ))}
            </div>
          </FadeIn>

          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-purple-500/20 blur-[120px] rounded-full group-hover:bg-purple-500/30 transition-colors" />
            
            {/* The Editor Window */}
            <div className="relative z-10 w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
               <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4">
                  <div className="flex gap-4 items-center">
                     <Layout size={14} className="text-purple-400" />
                     <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Designer / Untitled_Program_1</span>
                  </div>
               </div>

               <div className="p-1 bg-[#050505] flex">
                  {/* Mini Toolbar */}
                  <div className="w-10 border-r border-white/5 flex flex-col items-center py-4 gap-4">
                     {[Video, Calendar, Layout, Layers].map((Icon, i) => (
                       <Icon key={i} size={16} className={i === 0 ? "text-white" : "text-gray-700"} />
                     ))}
                  </div>
                  
                  {/* Canvas Area */}
                  <div className="flex-1 p-6">
                     <div className="aspect-video bg-[#0A0A0A] rounded border border-white/5 relative overflow-hidden shadow-inner">
                        {/* Grid lines */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        
                        {/* Selected Element */}
                        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-indigo-500 group/el">
                           <div className="absolute -top-1 -left-1 w-2 h-2 bg-indigo-500" />
                           <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500" />
                           <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-500" />
                           <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-indigo-500" />
                           <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                              <Play size={24} className="text-indigo-400/50" />
                           </div>
                        </div>

                        {/* Floating Tooltip */}
                        <motion.div 
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute bottom-4 right-4 px-2 py-1 rounded bg-black/80 border border-white/20 backdrop-blur-md text-[9px] text-white font-mono"
                        >
                          X: 420px | Y: 280px
                        </motion.div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Feature 3: Resilient Scheduling */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-green-500/20 blur-[120px] rounded-full group-hover:bg-green-500/30 transition-colors" />
            
            {/* The Schedule Window */}
            <div className="relative z-10 w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
               <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4 justify-between">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Timeline Manager</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Ready</span>
                  </div>
               </div>
               
               <div className="p-8">
                  <div className="space-y-6">
                    {[
                      { time: "08:00", duration: "2h", title: "Morning Rush Hours", color: "bg-indigo-500" },
                      { time: "10:30", duration: "6h", title: "Lunch Specials", color: "bg-green-500" },
                      { time: "18:00", duration: "4h", title: "Prime Time Ads", color: "bg-purple-500" }
                    ].map((item, i) => (
                      <div key={i} className="relative pl-6 border-l border-white/10">
                        <div className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_${item.color}]`} />
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-gray-500 font-mono">{item.time} ({item.duration})</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                           <span className="text-xs font-bold text-white">{item.title}</span>
                           <Clock size={12} className="text-gray-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Offline Warning Placeholder */}
                  <div className="mt-8 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center gap-3">
                     <AlertCircle size={14} className="text-amber-500" />
                     <span className="text-[10px] text-amber-500/80 font-medium">Auto-syncing to edge nodes for offline reliability.</span>
                  </div>
               </div>
            </div>
          </div>

          <FadeIn className="flex-1 text-left">
            <h3 className="text-4xl md:text-5xl text-white font-bold mb-8 tracking-tight">
              {t("features.resilientSchedule")}
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed mb-10 font-light">
              {t("features.resilientScheduleDesc")}
            </p>
            <button className="flex items-center gap-2 text-white/70 hover:text-white border-b border-white/20 hover:border-white transition-all pb-1 group text-sm font-bold">
              Explore Enterprise Rules <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
