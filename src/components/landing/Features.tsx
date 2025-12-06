import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { motion } from "framer-motion";
import { Zap, Shield, Globe, Command } from "lucide-react";

const featureConfig = [
  {
    titleKey: "features.instantSync",
    descKey: "features.instantSyncDesc",
    icon: Zap,
    colSpan: "col-span-1 md:col-span-2",
    bg: "bg-gradient-to-br from-indigo-500/10 to-transparent"
  },
  {
    titleKey: "features.edgeSecurity",
    descKey: "features.edgeSecurityDesc",
    icon: Shield,
    colSpan: "col-span-1",
    bg: ""
  },
  {
    titleKey: "features.globalMesh",
    descKey: "features.globalMeshDesc",
    icon: Globe,
    colSpan: "col-span-1",
    bg: ""
  },
  {
    titleKey: "features.apiFirst",
    descKey: "features.apiFirstDesc",
    icon: Command,
    colSpan: "col-span-1 md:col-span-2",
    bg: "bg-gradient-to-br from-purple-500/10 to-transparent"
  },
];

export const Features = () => {
  const { t } = useTranslation();
  return (
    <section id="features" className="py-32 bg-black relative">
      <Container>
        <div className="mb-20 max-w-2xl">
           <motion.h2
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight"
           >
             {t("features.title")} <br/>
             <span className="text-gray-500">{t("features.titleHighlight")}</span>
           </motion.h2>
           <motion.p
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-xl text-gray-400"
           >
             {t("features.subtitle")}
           </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {featureConfig.map((feature, index) => (
             <motion.div
               key={index}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.1 }}
               className={`${feature.colSpan} group relative p-8 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] hover:border-white/[0.15] transition-all overflow-hidden`}
             >
                {/* Hover gradient glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />

                {/* Feature specific subtle background */}
                <div className={`absolute inset-0 opacity-50 ${feature.bg}`} />

                <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="mb-8">
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform duration-300 group-hover:bg-indigo-500 group-hover:border-indigo-500">
                        <feature.icon size={20} />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{t(feature.titleKey)}</h3>
                      <p className="text-gray-400 leading-relaxed">{t(feature.descKey)}</p>
                   </div>

                   {/* Decorative "Code" or "Tech" element at bottom */}
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-50 transition-opacity">
                      <div className="h-1 w-1 rounded-full bg-white" />
                      <div className="h-[1px] w-10 bg-white/20" />
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      </Container>
    </section>
  );
};
