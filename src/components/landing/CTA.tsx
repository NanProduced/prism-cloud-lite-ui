import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const CTA = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-indigo-900/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />

      <Container className="relative z-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-white mb-6"
        >
          {t("cta.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
        >
          {t("cta.subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Button size="lg" className="shadow-[0_0_40px_rgba(99,102,241,0.4)] bg-white text-black hover:bg-gray-100">
            {t("cta.button")}
          </Button>
        </motion.div>
      </Container>
    </section>
  );
};
