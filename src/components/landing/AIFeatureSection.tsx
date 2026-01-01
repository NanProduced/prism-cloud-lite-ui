import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Command, 
  Cpu, 
  Globe,
  MessageCircle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export const AIFeatureSection = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  // Simulated chat sequence
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-32 md:py-48 relative overflow-hidden bg-black">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-24">
          {/* Text Content */}
          <div className="flex-1 text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/50 text-[10px] font-bold uppercase tracking-widest"
            >
              <Sparkles size={12} className="text-indigo-400" />
              <span>{t("ai.sectionSubtitle", "Next-Gen Intelligence")}</span>
            </motion.div>
            
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[0.95]">
              Meet your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400">
                AI Co-pilot.
              </span>
            </h2>
            
            <p className="text-gray-500 text-xl font-medium max-w-xl leading-relaxed">
              Prism AI is more than a chatbot. It's an intelligent layer that understands your visual infrastructure, automates troubleshooting, and optimizes delivery.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              {[
                { 
                  icon: Activity, 
                  title: t("ai.feature1", "Real-time Diagnosis"), 
                  desc: "Identify bottlenecks across 10k+ nodes in milliseconds." 
                },
                { 
                  icon: Globe, 
                  title: t("ai.feature2", "Natural Language Sync"), 
                  desc: "Deploy campaigns globally with simple voice or text commands." 
                },
                { 
                  icon: Cpu, 
                  title: t("ai.feature3", "Auto-optimization"), 
                  desc: "Predictive scaling based on audience traffic and network load." 
                },
                { 
                  icon: Command, 
                  title: t("ai.feature4", "Command Automation"), 
                  desc: "Script complex workflows without writing a single line of code." 
                }
              ].map((f, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <f.icon size={18} className="text-indigo-400" />
                    <h4 className="text-white font-bold">{f.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Mockup Interface */}
          <div className="flex-1 w-full max-w-2xl relative group">
            {/* Pulsing Aura */}
            <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-colors duration-1000" />
            
            {/* Main Console */}
            <div className="relative bg-[#050505] rounded-[2.5rem] border border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden aspect-[4/3] flex flex-col">
              {/* Toolbar */}
              <div className="h-14 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between px-8">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                    <div className="absolute inset-0 bg-indigo-500 blur-sm animate-ping opacity-50" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Prism AI Core</span>
                </div>
                <div className="flex gap-4">
                   <Terminal size={14} className="text-gray-600" />
                   <MessageCircle size={14} className="text-gray-400" />
                </div>
              </div>

              {/* Chat Viewport */}
              <div className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
                <AnimatePresence mode="wait">
                  {step >= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="self-end max-w-[80%] bg-white/5 border border-white/10 px-5 py-3 rounded-2xl rounded-tr-none text-sm text-white font-medium shadow-xl"
                    >
                      {t("ai.exampleQuery", "Are there any offline nodes in the Southeast region?")}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {step >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="self-start max-w-[90%] bg-indigo-500/10 border border-indigo-500/20 text-gray-200 px-6 py-4 rounded-2xl rounded-tl-none text-sm flex flex-col gap-4 shadow-2xl"
                    >
                      <div className="flex items-center gap-2 text-indigo-400">
                         <Sparkles size={14} />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Assistant Analysis</span>
                      </div>
                      <p className="leading-relaxed">
                        {t("ai.exampleResponse", "I found 1 node offline in Hong Kong (HK-Store-03). Root cause analysis suggests a network timeout. Would you like me to attempt a remote restart?")}
                      </p>
                      
                      {/* Action Card */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-4 bg-black/60 rounded-xl border border-white/5 flex items-center gap-4 group/card"
                      >
                        <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                          <AlertCircle size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white">HK-Store-03</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">Timeout Error: E_CON_RESET</div>
                        </div>
                        <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-[10px] font-bold hover:scale-105 transition-transform">
                          Restart Node
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Input Area */}
              <div className="p-6 border-t border-white/[0.05] bg-white/[0.01]">
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-gray-500">
                    <Command size={14} />
                  </div>
                  <input 
                    type="text"
                    readOnly
                    placeholder={step === 0 ? t("ai.chatPlaceholder", "Ask Prism anything...") : ""}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-11 pr-12 text-sm text-white outline-none placeholder:text-gray-700 font-medium"
                  />
                  <div className="absolute right-3 h-8 w-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Send size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};