import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { 
  ShoppingBag, 
  Building2, 
  Plane, 
  GraduationCap, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BenefitsPage() {
  const { t } = useTranslation();

  const scenarios = [
    {
      id: "retail",
      key: "retail",
      icon: ShoppingBag,
      color: "from-pink-500 to-rose-500",
      image: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "corporate",
      key: "corporate",
      icon: Building2,
      color: "from-blue-500 to-indigo-600",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "transport",
      key: "transport",
      icon: Plane,
      color: "from-cyan-400 to-blue-500",
      image: "https://images.unsplash.com/photo-1495313196544-7d1adf4e628f?auto=format&fit=crop&q=80&w=2000"
    },
    {
      id: "education",
      key: "education",
      icon: GraduationCap,
      color: "from-emerald-400 to-teal-500",
      image: "https://images.unsplash.com/photo-1525921429624-479b6a29d840?auto=format&fit=crop&q=80&w=2000"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          {/* Header */}
          <div className="max-w-4xl mx-auto text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl md:text-7xl font-bold mb-8 tracking-tight">
                {t('solutionsPage.title')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
                  {t('solutionsPage.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
                {t('solutionsPage.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* Scenarios List */}
          <div className="space-y-40">
            {scenarios.map((scenario, idx) => (
              <div 
                key={scenario.id}
                className={cn(
                  "flex flex-col gap-12 lg:gap-20 items-center",
                  idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                )}
              >
                {/* Content Side */}
                <motion.div 
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="flex-1 space-y-8"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shadow-xl",
                    scenario.color
                  )}>
                    <scenario.icon size={28} />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                      {t(`solutionsPage.${scenario.key}.title`)}
                    </h2>
                    <p className="text-xl text-slate-400 leading-relaxed">
                      {t(`solutionsPage.${scenario.key}.description`)}
                    </p>
                  </div>

                  {/* Pain Points */}
                  <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10 space-y-4">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                      <AlertCircle size={14} />
                      Common Pain Points
                    </h4>
                    <ul className="space-y-3">
                      {(t(`solutionsPage.${scenario.key}.painPoints`, { returnObjects: true }) as string[]).map((point, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-rose-500" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Solution Highlights */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      Platform Advantages
                    </h4>
                    <ul className="grid grid-cols-1 gap-4">
                      {(t(`solutionsPage.${scenario.key}.solutions`, { returnObjects: true }) as string[]).map((sol, i) => (
                        <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group">
                          <ArrowRight size={18} className="text-indigo-500 mt-0.5 group-hover:translate-x-1 transition-transform" />
                          <span className="text-slate-300">{sol}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Image Side */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="flex-1 w-full"
                >
                  <div className="relative">
                    <div className={cn(
                      "absolute -inset-4 rounded-[48px] opacity-20 blur-3xl bg-gradient-to-br",
                      scenario.color
                    )} />
                    <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                      <img 
                        src={scenario.image} 
                        alt={t(`solutionsPage.${scenario.key}.title`)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Floating Impact Card */}
                      <div className="absolute bottom-8 left-8 right-8 p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                            <TrendingUp size={20} />
                          </div>
                          <div>
                            <div className="text-xs text-white/60 font-bold uppercase tracking-widest">Est. Efficiency</div>
                            <div className="text-xl font-bold text-white">+40% boost</div>
                          </div>
                        </div>
                        <div className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center">
                          <ArrowRight size={16} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-60 p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight relative z-10">
              Ready to transform your sector?
            </h2>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto relative z-10">
              Join leading organizations already using Prism Cloud Lite to redefine their visual presence.
            </p>
            <div className="pt-4 relative z-10">
              <button className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-bold hover:bg-slate-100 transition-all shadow-xl text-lg">
                Get Started Today
              </button>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}