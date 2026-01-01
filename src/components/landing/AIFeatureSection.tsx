import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MessageSquare, Sparkles, Send, CheckCircle2, AlertCircle, Search } from "lucide-react";

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
    <section className="py-24 relative overflow-hidden bg-black">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Text Content */}
          <div className="flex-1 text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6"
            >
              <Sparkles size={12} />
              <span>{t("ai.sectionSubtitle")}</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {t("ai.sectionTitle")}
            </h2>
            
            <p className="text-gray-400 text-lg mb-10 max-w-xl">
              Prism AI 助手不仅仅是一个聊天机器人，它是您的数字运维主管。
              通过自然语言即可完成原本复杂的设备排障、内容分发与数据统计。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: t("ai.feature1"), desc: "毫秒级诊断全网终端异常" },
                { title: t("ai.feature2"), desc: "一句话完成跨区域内容分发" },
                { title: t("ai.feature3"), desc: "自动分析并建议最佳播放时段" }
              ].map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 size={14} className="text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{f.title}</h4>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Mockup Interface */}
          <div className="flex-1 w-full max-w-2xl relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative bg-[#0D0D0D] rounded-3xl border border-white/10 shadow-2xl overflow-hidden aspect-[4/3] flex flex-col">
              {/* Header */}
              <div className="h-12 border-b border-white/5 bg-white/5 flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Prism AI Admin</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
                <AnimatePresence mode="wait">
                  {step >= 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="self-end max-w-[80%] bg-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-sm"
                    >
                      {t("ai.exampleQuery")}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {step >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="self-start max-w-[85%] bg-white/5 border border-white/10 text-gray-200 px-4 py-3 rounded-2xl rounded-tl-none text-sm flex flex-col gap-3"
                    >
                      <p>{t("ai.exampleResponse")}</p>
                      
                      {/* Interactive Card result */}
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                          <AlertCircle size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-white truncate">SH-Store-03 (Offline)</div>
                          <div className="text-[10px] text-gray-500">Last seen: 2 hours ago</div>
                        </div>
                        <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[10px] text-white transition-colors">
                          Diagnosis
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/5 bg-white/5">
                <div className="relative">
                  <input 
                    type="text"
                    readOnly
                    placeholder={step === 0 ? t("ai.chatPlaceholder") : ""}
                    className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-4 pr-10 text-sm outline-none"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
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
