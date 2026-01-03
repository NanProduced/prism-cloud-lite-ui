import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { CheckCircle2, Clock, Calendar, Rocket, Sparkles, Zap, Shield, Layout } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapItemData {
  date: string;
  title: string;
  description: string;
  features: string[];
  status: 'completed' | 'in-progress' | 'planned';
}

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const styles = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "in-progress": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    planned: "bg-slate-500/10 text-slate-400 border-slate-500/20"
  }[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

  const labels = {
    completed: t('roadmap.status.completed'),
    "in-progress": t('roadmap.status.inProgress'),
    planned: t('roadmap.status.planned')
  }[status] || status;

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", styles)}>
      {labels}
    </span>
  );
};

export default function RoadmapPage() {
  const { t } = useTranslation();
  const roadmapItems = t('roadmap.items', { returnObjects: true }) as RoadmapItemData[];

  const getIcon = (index: number, status: string) => {
    if (status === 'in-progress') return Clock;
    switch (index) {
      case 0: return Zap;
      case 1: return Layout;
      case 2: return Shield;
      case 3: return Sparkles;
      case 4: return Rocket;
      default: return CheckCircle2;
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <Container>
          {/* Header */}
          <div className="max-w-4xl mx-auto text-center mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold uppercase tracking-widest mb-8">
                <Rocket size={16} />
                Project Timeline
              </div>
              <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight leading-[0.9]">
                {t('roadmap.title')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">
                  {t('roadmap.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
                {t('roadmap.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* Timeline */}
          <div className="relative max-w-5xl mx-auto">
            {/* Center Line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-purple-500/50 to-transparent md:-translate-x-1/2" />

            <div className="space-y-32">
              {Array.isArray(roadmapItems) && roadmapItems.map((item, index) => {
                const Icon = getIcon(index, item.status);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7, delay: index * 0.1 }}
                    className={cn(
                      "relative flex flex-col md:flex-row gap-12 md:gap-0 items-center",
                      index % 2 === 0 ? "md:flex-row-reverse" : ""
                    )}
                  >
                    {/* Content Side */}
                    <div className="w-full md:w-1/2 px-4 md:px-12">
                      <div className={cn(
                        "relative p-8 rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-md group hover:bg-white/[0.05] transition-all duration-500",
                        item.status === 'in-progress' ? "ring-2 ring-indigo-500/30 shadow-[0_0_50px_-12px_rgba(99,102,241,0.3)]" : ""
                      )}>
                        <div className="flex items-center justify-between mb-6">
                          <StatusBadge status={item.status} />
                          <span className="text-sm font-mono text-indigo-400/70 font-bold">{item.date}</span>
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-indigo-300 transition-colors">
                          {item.title}
                        </h3>
                        
                        <p className="text-slate-400 leading-relaxed mb-8">
                          {item.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          {item.features.map((feature, fIdx) => (
                            <span key={fIdx} className="px-3 py-1 rounded-full bg-white/5 text-[11px] text-slate-300 border border-white/10 font-medium">
                              {feature}
                            </span>
                          ))}
                        </div>

                        {/* Connector arrow (Desktop) */}
                        <div className={cn(
                          "absolute top-12 hidden md:block w-8 h-px bg-gradient-to-r",
                          index % 2 === 0 ? "-left-8 from-indigo-500/50 to-transparent" : "-right-8 from-transparent to-indigo-500/50"
                        )} />
                      </div>
                    </div>

                    {/* Node on the line */}
                    <div className="absolute left-0 md:left-1/2 top-0 md:top-12 -translate-x-1/2 z-10">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl bg-black border-2 flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110",
                        item.status === 'completed' ? "border-indigo-500 text-indigo-400 shadow-indigo-500/20" : 
                        item.status === 'in-progress' ? "border-purple-500 text-purple-400 animate-pulse shadow-purple-500/40" : 
                        "border-slate-800 text-slate-600"
                      )}>
                        <Icon size={24} />
                      </div>
                    </div>

                    {/* Empty Side (Desktop) */}
                    <div className="hidden md:block md:w-1/2" />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-60 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="p-16 rounded-[40px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/10 max-w-3xl mx-auto relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full" />
              <h2 className="text-3xl font-bold mb-4">{t('roadmap.feedbackTitle')}</h2>
              <p className="text-slate-400 mb-10 text-lg">
                {t('roadmap.feedbackDesc')}
              </p>
              <button className="px-10 py-4 rounded-2xl bg-white text-black font-bold hover:bg-slate-200 transition-all shadow-xl">
                {t('roadmap.feedbackBtn')}
              </button>
            </motion.div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}