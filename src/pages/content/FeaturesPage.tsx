import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { 
  ShieldCheck, 
  Zap, 
  Layout, 
  BarChart3, 
  Code2, 
  History, 
  Sparkles,
  CheckCircle2,
  Cpu,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FeaturesPage() {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  const mainFeatures = [
    {
      id: "security",
      key: "security",
      icon: ShieldCheck,
      color: "from-blue-500 to-indigo-600",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "transcode",
      key: "transcode",
      icon: Zap,
      color: "from-cyan-400 to-blue-500",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "editor",
      key: "editor",
      icon: Layout,
      color: "from-emerald-400 to-teal-500",
      image: "https://images.unsplash.com/photo-1542744094-24638eff58bb?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "analytics",
      key: "analytics",
      icon: BarChart3,
      color: "from-orange-400 to-rose-500",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=2000"
    },
    {
      id: "developer",
      key: "developer",
      icon: Code2,
      color: "from-indigo-500 to-purple-600",
      image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "audit",
      key: "audit",
      icon: History,
      color: "from-slate-600 to-slate-800",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-7xl font-bold mb-8 tracking-tight">
                {t('featuresPage.title')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">
                  {t('featuresPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
                {t('featuresPage.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* AI Assistant Spotlight */}
          <section id="aiAssistant" className="mb-60 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[40px] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#0a0a0a] rounded-[40px] border border-white/10 p-8 md:p-16 overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-16 items-center">
                <div className="flex-1 space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold uppercase tracking-widest">
                    <Sparkles size={16} />
                    AI Spotlight
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                    {t('featuresPage.aiAssistant.title')}
                  </h2>
                  <p className="text-xl text-slate-400 leading-relaxed">
                    {t('featuresPage.aiAssistant.description')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {(t('featuresPage.aiAssistant.techPoints', { returnObjects: true }) as string[]).map((point, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="text-indigo-500 shrink-0 mt-1" size={18} />
                        <span className="text-slate-300 font-medium">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 w-full lg:max-w-md">
                  <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <Cpu size={120} className="text-indigo-400/50 animate-pulse" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute w-64 h-64 border border-dashed border-indigo-500/30 rounded-full"
                    ></motion.div>
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute w-48 h-48 border border-dotted border-purple-500/30 rounded-full"
                    ></motion.div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Standard Features Loop */}
          <div className="space-y-60">
            {mainFeatures.map((feature, idx) => (
              <section 
                id={feature.id}
                key={feature.id}
                className={cn(
                  "flex flex-col gap-16 lg:gap-24 items-center",
                  idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                )}
              >
                <motion.div 
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="flex-1 space-y-8"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shadow-2xl",
                    feature.color
                  )}>
                    <feature.icon size={32} />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {t(`featuresPage.${feature.key}.title`)}
                  </h2>
                  <p className="text-xl text-slate-400 leading-relaxed">
                    {t(`featuresPage.${feature.key}.description`)}
                  </p>
                  
                  <div className="space-y-6 pt-4">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <ArrowRight size={14} className="text-indigo-500" />
                      {t(`featuresPage.${feature.key}.techTitle`)}
                    </h4>
                    <ul className="grid grid-cols-1 gap-4">
                      {(t(`featuresPage.${feature.key}.techPoints`, { returnObjects: true }) as string[]).map((point, i) => (
                        <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                          <span className="text-slate-300 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8 }}
                  className="flex-1 w-full"
                >
                  <div className="relative group">
                    <div className={cn(
                      "absolute -inset-4 rounded-[40px] opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-40 bg-gradient-to-br",
                      feature.color
                    )} />
                    <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                      <img 
                        src={feature.image} 
                        alt={t(`featuresPage.${feature.key}.title`)}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                  </div>
                </motion.div>
              </section>
            ))}
          </div>

          {/* Infrastructure Grid */}
          <div className="mt-60">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Enterprise Grade Infrastructure</h2>
              <p className="text-slate-500">Built to handle global demands with zero compromise.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Global CDN", desc: "Edge delivery in 120+ regions." },
                { title: "99.9% SLA", desc: "Reliability you can count on." },
                { title: "Multi-Region", desc: "Data residency and low latency." },
                { title: "24/7 Monitoring", desc: "Constant vigil over your fleet." }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-xl font-bold text-white mb-2">{item.title}</div>
                  <div className="text-sm text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}