import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { 
  User, 
  Flame, 
  Sparkles, 
  Coffee,
  ShieldCheck,
  Cpu,
  Brain,
  Zap,
  Terminal,
  Bug,
  Globe,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  name: string;
  role: string;
  desc: string;
  model?: string;
}

// ========== Custom Model Logos (High End) ==========

const ModelLogo = ({ type, className }: { type?: string, className?: string }) => {
  const logoMap: Record<string, string> = {
    codex: "https://svgl.app/library/openai_dark.svg",
    gemini: "https://svgl.app/library/gemini.svg",
    claude: "https://svgl.app/library/claude-ai-icon.svg",
    qwen: "https://svgl.app/library/qwen_dark.svg",
    deepseek: "https://svgl.app/library/deepseek.svg",
    v0: "https://svgl.app/library/vercel_dark.svg",
    serena: "https://svgl.app/library/vercel_dark.svg", // Fallback for Serena
  };

  const src = logoMap[type || ''] || "https://svgl.app/library/openai_dark.svg";

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
      <motion.img 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        src={src} 
        alt={type}
        className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-500"
      />
    </div>
  );
};

export default function AboutUsPage() {
  const { t } = useTranslation();
  const aiLeads = t('aboutPage.aiLeads', { returnObjects: true }) as TeamMember[];
  const aiSpecialists = t('aboutPage.aiSpecialists', { returnObjects: true }) as TeamMember[];

  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200 font-sans">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative inline-block mb-8"
            >
              <div className="absolute -inset-4 bg-orange-500/20 blur-3xl rounded-full" />
              <div className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <Flame className="text-orange-500 animate-pulse" size={20} />
                <span className="text-sm font-bold uppercase tracking-widest text-slate-300">
                  {t('aboutPage.tokenCount')} {t('aboutPage.tokenDesc')}
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter leading-[0.85] text-white"
            >
              {t('aboutPage.title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400 animate-gradient-x">
                {t('aboutPage.titleHighlight')}
              </span>
            </motion.h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto italic opacity-80">
              "{t('aboutPage.subtitle')}"
            </p>
          </div>

          {/* The Human Orchestrator - COMMAND CENTER UI */}
          <section className="mb-40 relative">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative bg-[#0d0d0d] rounded-[48px] border border-white/10 p-10 md:p-20 overflow-hidden shadow-2xl"
            >
              {/* Decorative grid background */}
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                <div className="relative shrink-0 group/avatar">
                  {/* WILD VFX CONTAINER */}
                  <div className="absolute -inset-8 pointer-events-none">
                    {/* Spinning RGB Rings */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-dashed border-indigo-500/30 rounded-full scale-110 opacity-0 group-hover/avatar:opacity-100 transition-opacity" 
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dotted border-purple-500/40 rounded-full scale-125 opacity-0 group-hover/avatar:opacity-100 transition-opacity" 
                    />
                    {/* Speed Lines / Sparkles */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                            rotate: i * 45 
                          }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                          className="absolute w-1 h-20 bg-gradient-to-t from-indigo-500 to-transparent origin-bottom pb-20"
                          style={{ rotate: `${i * 45}deg` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-orange-500 p-1.5 animate-gradient-x shadow-[0_0_50px_rgba(99,102,241,0.3)] group-hover/avatar:shadow-[0_0_80px_rgba(99,102,241,0.6)] transition-all duration-500">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden relative">
                      <img 
                        src="/assets/nan-avatar.jpg" 
                        alt="Nan" 
                        className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                      />
                      {/* Laser Eyes Effect Overlay */}
                      <div className="absolute inset-0 opacity-0 group-hover/avatar:opacity-20 pointer-events-none bg-gradient-to-t from-red-500/50 to-transparent" />
                    </div>
                  </div>

                  {/* Floating elements */}
                  <motion.div 
                    animate={{ 
                      y: [0, -12, 0], 
                      rotate: [0, 5, 0],
                      scale: [1, 1.1, 1] 
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-4 -right-4 p-5 rounded-2xl bg-black border border-indigo-500/30 shadow-2xl backdrop-blur-xl z-20 group-hover/avatar:border-orange-500/50 transition-colors"
                  >
                    <Coffee size={28} className="text-orange-400" />
                    <motion.div 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles size={16} className="text-yellow-400" />
                    </motion.div>
                  </motion.div>

                  {/* "THE BOSS" Tag */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[10px] font-black italic uppercase tracking-tighter rounded-md shadow-xl border border-indigo-400/50 whitespace-nowrap z-20"
                  >
                    Maximum Human Potential
                  </motion.div>
                </div>
                
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">
                    {t('aboutPage.humanTitle')}
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                    {t('aboutPage.humanName')}
                  </h2>
                  <p className="text-xl text-slate-400 leading-relaxed max-w-xl font-medium">
                    {t('aboutPage.humanBio')}
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          {/* AI LEADS - THE ELITE THREE */}
          <section className="mb-40">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">{t('aboutPage.aiLeadsTitle')}</h2>
              <p className="text-slate-500">The supreme algorithmic decision-makers of Prism Cloud.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {aiLeads.map((lead, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                  className="relative group h-full"
                >
                  {/* Premium Outer Glow */}
                  <div className={cn(
                    "absolute -inset-0.5 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-700 bg-gradient-to-br",
                    idx === 0 ? "from-blue-500 to-indigo-600" :
                    idx === 1 ? "from-indigo-400 to-purple-500" :
                    "from-orange-400 to-red-500"
                  )} />
                  
                  <div className="relative h-full bg-[#080808] rounded-[40px] border border-white/10 p-12 flex flex-col items-center text-center hover:border-white/20 transition-all duration-500 group-hover:-translate-y-2 shadow-2xl">
                    {/* Floating Header Badge */}
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-black border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-indigo-400 group-hover:border-indigo-500/50 transition-colors">
                      Lead AI 0{idx + 1}
                    </div>

                    <div className="relative mb-10">
                      <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                      <ModelLogo type={lead.model} className="w-24 h-24 relative z-10" />
                    </div>

                    <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">{lead.name}</h3>
                    <div className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-8 py-1.5 px-4 bg-indigo-500/5 rounded-full border border-indigo-500/20">
                      {lead.role}
                    </div>
                    
                    <p className="text-slate-400 leading-relaxed font-medium text-base">
                      {lead.desc}
                    </p>
                    
                    {/* Bottom Action Hint */}
                    <div className="mt-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                      Superior Logic Active <Sparkles size={12} className="animate-pulse" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* SPECIALISTS - THE SUPPORT SQUAD */}
          <section className="mb-40">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-300 mb-4 tracking-tight">{t('aboutPage.aiSpecialistsTitle')}</h2>
              <div className="h-px w-16 bg-white/10 mx-auto" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiSpecialists.map((sp, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group p-8 rounded-[32px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all"
                >
                  <div className="flex items-start gap-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/5 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ModelLogo type={sp.model} className="w-12 h-12 shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500" />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors tracking-tight">{sp.name}</h4>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{sp.role}</div>
                      <p className="text-[13px] text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">
                        {sp.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Manifesto */}
          <section className="text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="p-12 md:p-24 rounded-[60px] bg-[#050505] border border-white/5 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
              
              <Sparkles className="text-indigo-400 mx-auto mb-10" size={56} />
              <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter text-white">{t('aboutPage.manifestoTitle')}</h2>
              <p className="text-2xl md:text-4xl text-slate-400 leading-[1.1] max-w-5xl mx-auto font-black italic tracking-tighter">
                "{t('aboutPage.manifesto')}"
              </p>
              
              {/* Token burnout visual */}
              <div className="mt-16 flex items-center justify-center gap-8 opacity-20 grayscale">
                <ModelLogo type="codex" className="w-12 h-12" />
                <ModelLogo type="gemini" className="w-12 h-12" />
                <ModelLogo type="claude" className="w-12 h-12" />
                <ModelLogo type="deepseek" className="w-12 h-12" />
                <ModelLogo type="qwen" className="w-12 h-12" />
              </div>
            </motion.div>
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  );
}