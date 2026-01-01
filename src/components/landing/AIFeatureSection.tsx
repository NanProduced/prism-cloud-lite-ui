import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Send,
  AlertCircle,
  Command,
  Cpu,
  Globe,
  Activity,
  Zap,
  RotateCcw,
  Circle,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/ui/FadeIn";

// ========== Feature Card Component ==========

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: "indigo" | "purple" | "cyan" | "emerald";
  delay: number;
}

const FeatureCard = ({ icon: Icon, title, description, color, delay }: FeatureCardProps) => {
  const colorClasses = {
    indigo: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      icon: "text-indigo-400",
      glow: "group-hover:shadow-indigo-500/10"
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      icon: "text-purple-400",
      glow: "group-hover:shadow-purple-500/10"
    },
    cyan: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      icon: "text-cyan-400",
      glow: "group-hover:shadow-cyan-500/10"
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: "text-emerald-400",
      glow: "group-hover:shadow-emerald-500/10"
    }
  }[color];

  return (
    <FadeIn delay={delay}>
      <div className={cn(
        "group p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]",
        "hover:bg-white/[0.04] hover:border-white/[0.1] hover:-translate-y-0.5",
        "transition-all duration-300 shadow-lg",
        colorClasses.glow
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
            colorClasses.bg,
            colorClasses.border
          )}>
            <Icon className={cn("w-5 h-5", colorClasses.icon)} />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-white font-semibold text-sm">{title}</h4>
            <p className="text-neutral-500 text-xs leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

// ========== Typing Effect Hook ==========

const useTypingEffect = (text: string, speed: number = 30, startDelay: number = 0) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);

    const startTimeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, startDelay]);

  return { displayedText, isComplete };
};

// ========== AI Console Component ==========

const AIConsole = () => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(0);

  // Animation sequence: 0=idle, 1=user message, 2=analyzing, 3=response
  useEffect(() => {
    const sequence = [
      { delay: 1500, next: 1 },  // Show user message
      { delay: 2000, next: 2 },  // Show analyzing
      { delay: 1500, next: 3 },  // Show AI response
      { delay: 6000, next: 0 },  // Reset
    ];

    const timer = setTimeout(() => {
      const current = sequence[phase];
      if (current) {
        setPhase(current.next);
      }
    }, sequence[phase]?.delay || 1500);

    return () => clearTimeout(timer);
  }, [phase]);

  const aiResponseText = t("ai.exampleResponse");
  const { displayedText, isComplete } = useTypingEffect(
    aiResponseText,
    25,
    phase === 3 ? 300 : 0
  );

  return (
    <div className="relative bg-[#0a0a0a] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
      {/* Window Header */}
      <div className="h-12 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {/* Title */}
          <div className="flex items-center gap-2 ml-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-neutral-400">{t("ai.consoleTitle")}</span>
          </div>
        </div>
        {/* Status */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
            <div className="absolute inset-0 bg-emerald-500 blur-sm animate-pulse opacity-50" />
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">{t("ai.consoleStatus")}</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="h-[340px] p-5 flex flex-col gap-4 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {/* User Message */}
          {phase >= 1 && (
            <motion.div
              key="user-msg"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="self-end max-w-[85%]"
            >
              <div className="flex items-end gap-2 justify-end">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-neutral-600">{t("ai.justNow")}</span>
                    <span className="text-[10px] text-neutral-500 font-medium">{t("ai.userLabel")}</span>
                  </div>
                  <div className="bg-indigo-500/20 border border-indigo-500/30 px-4 py-3 rounded-2xl rounded-br-md">
                    <p className="text-sm text-white">{t("ai.exampleQuery")}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Analyzing */}
          {phase === 2 && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="self-start flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-neutral-400">{t("ai.analyzing")}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Response */}
          {phase >= 3 && (
            <motion.div
              key="ai-response"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="self-start max-w-[95%]"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-3 flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">{t("ai.assistantLabel")}</span>
                    <span className="text-[10px] text-neutral-600">{t("ai.justNow")}</span>
                  </div>

                  {/* Response Bubble */}
                  <div className="bg-white/[0.03] border border-white/[0.08] px-5 py-4 rounded-2xl rounded-tl-md space-y-4">
                    <p className="text-sm text-neutral-200 leading-relaxed">
                      {phase === 3 ? displayedText : aiResponseText}
                      {phase === 3 && !isComplete && (
                        <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse" />
                      )}
                    </p>

                    {/* Action Card */}
                    {(phase > 3 || isComplete) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 bg-black/40 rounded-xl border border-rose-500/20 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">HK-Store-03</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-medium">
                              {t("ai.deviceOffline")}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-1">{t("ai.errorType")}</div>
                        </div>
                        <button className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0">
                          <RotateCcw className="w-3 h-3" />
                          {t("ai.restartButton")}
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="relative flex items-center">
          <Command className="absolute left-4 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            readOnly
            placeholder={phase === 0 ? t("ai.chatPlaceholder") : ""}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 pl-11 pr-12 text-sm text-white placeholder:text-neutral-700 outline-none focus:border-indigo-500/30 transition-colors"
          />
          <button className="absolute right-2 w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center transition-colors">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Ambient glow */}
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
    </div>
  );
};

// ========== Main Component ==========

export const AIFeatureSection = () => {
  const { t } = useTranslation();

  const features = useMemo(() => [
    {
      icon: Activity,
      title: t("ai.feature1"),
      description: t("ai.feature1Desc"),
      color: "indigo" as const,
    },
    {
      icon: Globe,
      title: t("ai.feature2"),
      description: t("ai.feature2Desc"),
      color: "purple" as const,
    },
    {
      icon: Cpu,
      title: t("ai.feature3"),
      description: t("ai.feature3Desc"),
      color: "cyan" as const,
    },
    {
      icon: Zap,
      title: t("ai.feature4"),
      description: t("ai.feature4Desc"),
      color: "emerald" as const,
    },
  ], [t]);

  return (
    <section className="py-32 relative overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          {/* Left: Text Content */}
          <div className="flex-1 space-y-10">
            {/* Badge */}
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  {t("ai.badge")}
                </span>
              </div>
            </FadeIn>

            {/* Title */}
            <FadeIn delay={0.1}>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                {t("ai.title")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400">
                  {t("ai.titleHighlight")}
                </span>
              </h2>
            </FadeIn>

            {/* Description */}
            <FadeIn delay={0.2}>
              <p className="text-neutral-500 text-lg leading-relaxed max-w-xl">
                {t("ai.description")}
              </p>
            </FadeIn>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  {...feature}
                  delay={0.3 + index * 0.1}
                />
              ))}
            </div>
          </div>

          {/* Right: AI Console */}
          <div className="flex-1 w-full max-w-xl lg:max-w-lg xl:max-w-xl">
            <FadeIn delay={0.3}>
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full opacity-50" />
                <AIConsole />
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};
