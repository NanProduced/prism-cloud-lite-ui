import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Prism from "@/components/Prism";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { MiniDashboard } from "./MiniDashboard";

export const Hero: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black selection:bg-indigo-500/30">
      {/* Prism Background Effect */}
      <div className="absolute inset-0 w-full h-full opacity-60 pointer-events-none z-0">
        <Prism />
      </div>

      {/* Raycast-style Top Spotlight/Aurora */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100%] h-[600px] opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/30 via-purple-900/10 to-transparent blur-[100px]" />
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-indigo-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-0 right-1/4 w-1/2 h-1/2 bg-purple-600/20 blur-[120px] mix-blend-screen" />
      </div>

      {/* Star field / Subtle grain */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>

      <Container className="relative z-10 flex flex-col items-center text-center">
        {/* Version Badge - Raycast Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] transition-colors cursor-pointer backdrop-blur-sm group">
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">{t("hero.badge")}</span>
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{t("hero.badgeText")}</span>
            <ChevronRight className="h-3 w-3 text-gray-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.div>

        {/* Headline - Massive & Glowing */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-5xl text-6xl md:text-8xl font-bold tracking-tight text-white mb-8 leading-[0.95]"
        >
          {t("hero.title")} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300">
            {t("hero.titleHighlight")}
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl text-xl text-gray-400 mb-10 leading-relaxed"
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20"
        >
          {/* Primary CTA Button */}
          <Button
            size="lg"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/register")}
            className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-100 border-none font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            {isAuthenticated ? t("nav.dashboard", "Go to Dashboard") : t("hero.primaryBtn")}
          </Button>

          {/* Secondary Demo Button - Interactive Scroll */}
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              const featuresSection = document.getElementById("features");
              if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: "smooth", block: "start" });
                // Add highlight effect
                featuresSection.classList.add("ring-2", "ring-indigo-500/50", "ring-offset-4", "ring-offset-black");
                setTimeout(() => {
                  featuresSection.classList.remove("ring-2", "ring-indigo-500/50", "ring-offset-4", "ring-offset-black");
                }, 2000);
              }
            }}
            className="h-12 px-8 rounded-full bg-transparent border border-white/30 text-white hover:border-white/60 hover:bg-white/5 font-semibold transition-all"
          >
            {t("hero.secondaryBtn")}
          </Button>
        </motion.div>

        {/* Hero Visual - "Floating Interface" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-6xl mt-20 px-4 h-[600px] md:h-[750px]"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[100%] h-[100%] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute top-1/4 -right-10 w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

          <MiniDashboard />
        </motion.div>
      </Container>
    </section>
  );
};