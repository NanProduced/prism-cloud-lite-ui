import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { 
  Zap, 
  ShieldCheck, 
  Cpu, 
  BarChart3, 
  CheckCircle2,
  Clock,
  Globe,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BenefitsPage() {
  const { t } = useTranslation();

  const benefits = [
    {
      id: "roi",
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      id: "reliability",
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      id: "ai",
      icon: Cpu,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    },
    {
      id: "scale",
      icon: Globe,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20"
    }
  ];

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
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
                <Zap size={14} className="fill-indigo-400" />
                Value Proposition
              </div>
              <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter leading-[0.85]">
                {t('benefitsPage.title')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400 animate-gradient-x">
                  {t('benefitsPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto font-medium">
                {t('benefitsPage.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* Value Blocks - Modern Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-40">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={benefit.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "p-10 md:p-16 rounded-[48px] border bg-white/[0.02] flex flex-col justify-between group hover:bg-white/[0.04] transition-all duration-500 shadow-2xl",
                  benefit.border
                )}
              >
                <div className="space-y-8">
                  <div className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110",
                    benefit.bg,
                    benefit.color
                  )}>
                    <benefit.icon size={40} />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                      {t(`benefitsPage.${benefit.id}.title`)}
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed font-medium">
                      {t(`benefitsPage.${benefit.id}.description`)}
                    </p>
                  </div>
                </div>

                <div className="mt-12 space-y-4">
                  {(t(`benefitsPage.${benefit.id}.points`, { returnObjects: true }) as string[]).map((point, i) => (
                    <div key={i} className="flex items-center gap-4 py-2 border-t border-white/5 first:border-0">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", benefit.bg.replace('/10', ''))} />
                      <span className="text-slate-300 font-medium">{point}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Bar */}
          <section className="py-20 border-y border-white/5 mb-40">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { label: "Cost Reduction", value: "60%" },
                { label: "Setup Time", value: "< 5min" },
                { label: "Uptime SLA", value: "99.9%" },
                { label: "Security Scale", value: "Enterprise" }
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="text-4xl md:text-6xl font-black tracking-tighter text-white">{stat.value}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="p-12 md:p-24 rounded-[60px] bg-gradient-to-b from-indigo-500/10 to-transparent border border-white/5 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <h2 className="text-4xl md:text-7xl font-black mb-10 tracking-tighter text-white">
              Ready to claim your edge?
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 italic">
              Stop settling for basic players. Switch to a platform that powers your entire visual ecosystem with intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-indigo-500 text-white font-black hover:bg-indigo-400 transition-all shadow-[0_0_40px_rgba(99,102,241,0.4)] text-lg">
                Start Growing Now
              </button>
              <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 transition-all text-lg">
                View Pricing
              </button>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}