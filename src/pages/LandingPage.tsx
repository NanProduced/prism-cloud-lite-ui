import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutTemplate, Zap, Globe } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

// --- Bento Grid Components ---

const BentoCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors ${className}`}
  >
    {children}
  </motion.div>
);

// --- Landing Page ---

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 py-24 relative z-10">
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
               <Logo size={80} className="mb-8" />
            </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
          >
            Control Your Screens. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Instantly.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl"
          >
            The next-generation digital signage platform. 
            Drag, drop, and publish content to thousands of displays in seconds.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex gap-4"
          >
            <Button size="lg" className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-base font-semibold shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all hover:scale-105">
              Start Creating
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 rounded-full border-white/10 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm">
              View Demo
            </Button>
          </motion.div>
        </div>

        {/* Bento Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:h-[500px] max-w-6xl mx-auto">
            
            {/* Large Card: Studio */}
            <BentoCard className="md:col-span-2 md:row-span-2 flex flex-col justify-between overflow-hidden" delay={0.2}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <LayoutTemplate size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Visual Studio</h3>
                    </div>
                    <p className="text-slate-400">Powerful drag & drop editor. What you see is exactly what plays on your screens.</p>
                </div>
                {/* Mock UI for Studio */}
                <div className="absolute right-0 bottom-0 w-3/4 h-3/4 bg-slate-900/80 border-t border-l border-white/10 rounded-tl-2xl p-4 shadow-2xl translate-y-4 translate-x-4 hover:translate-x-2 hover:translate-y-2 transition-transform duration-500">
                    <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 h-full">
                        <div className="bg-indigo-500/20 rounded-lg animate-pulse" />
                        <div className="bg-violet-500/10 rounded-lg" />
                    </div>
                </div>
            </BentoCard>

            {/* Tall Card: Real-time */}
            <BentoCard className="md:col-span-1 md:row-span-2 flex flex-col" delay={0.4}>
                 <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Real-time</h3>
                </div>
                <p className="text-slate-400 mb-8">Instant updates via WebSocket.</p>
                
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-ping" />
                        <div className="relative w-24 h-24 bg-slate-900 border border-emerald-500/30 rounded-full flex items-center justify-center">
                             <span className="text-3xl font-mono text-emerald-400">98%</span>
                        </div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-emerald-500 uppercase tracking-widest font-bold">Online</div>
                    </div>
                </div>
            </BentoCard>

            {/* Wide Card: Global */}
            <BentoCard className="md:col-span-3 h-48 flex items-center justify-between" delay={0.6}>
                 <div className="max-w-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <Globe size={24} />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Global CDN</h3>
                    </div>
                    <p className="text-slate-400">Content delivered from the edge, ensuring smooth playback anywhere in the world.</p>
                 </div>
                 {/* Abstract Globe Decor */}
                 <div className="w-64 h-full relative opacity-50">
                    <div className="absolute inset-0 border border-white/5 rounded-full rotate-45 scale-150" />
                     <div className="absolute inset-0 border border-white/5 rounded-full -rotate-12 scale-125" />
                 </div>
            </BentoCard>

        </div>
      </div>
    </div>
  );
}
