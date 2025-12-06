import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { motion } from "framer-motion";
import { ShoppingBag, Plane, Building2, GraduationCap, Landmark, Utensils } from "lucide-react";

const useCaseConfig = [
  {
    titleKey: "useCases.retail",
    descKey: "useCases.retailDesc",
    icon: ShoppingBag,
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop"
  },
  {
    titleKey: "useCases.transportation",
    descKey: "useCases.transportationDesc",
    icon: Plane,
    image: "https://images.unsplash.com/photo-1473649085228-583485e6e4d7?q=80&w=800&auto=format&fit=crop"
  },
  {
    titleKey: "useCases.corporate",
    descKey: "useCases.corporateDesc",
    icon: Building2,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop"
  },
  {
    titleKey: "useCases.education",
    descKey: "useCases.educationDesc",
    icon: GraduationCap,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop"
  },
  {
    titleKey: "useCases.publicServices",
    descKey: "useCases.publicServicesDesc",
    icon: Landmark,
    image: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?q=80&w=800&auto=format&fit=crop"
  },
  {
    titleKey: "useCases.hospitality",
    descKey: "useCases.hospitalityDesc",
    icon: Utensils,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop"
  }
];

export const UseCases = () => {
  const { t } = useTranslation();
  return (
    <section id="solutions" className="py-24 bg-black relative">
      <Container>
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-indigo-400 font-semibold tracking-wide uppercase text-sm"
            >
              {t("useCases.industries")}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-2 text-3xl md:text-4xl font-bold text-white"
            >
              {t("useCases.title")}
            </motion.h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCaseConfig.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0">
                <img
                  src={item.image}
                  alt={t(item.titleKey)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500" />
              </div>

              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="mb-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t(item.titleKey)}</h3>
                <p className="text-gray-300 text-sm opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  {t(item.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
