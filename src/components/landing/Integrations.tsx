import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { Database, Map as MapIcon, Terminal, Code2, Cpu, Cloud, Link2, Share2, Globe } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { cn } from "@/lib/utils";

export const Integrations = () => {
  const { t } = useTranslation();

  // Get categories from i18n
  const categoriesData = t("integrations.categories", { returnObjects: true });
  const categories = useMemo(() => {
    const icons = [
      <Database size={20} className="text-indigo-400" />,
      <MapIcon size={20} className="text-purple-400" />,
      <Terminal size={20} className="text-blue-400" />
    ];

    if (Array.isArray(categoriesData)) {
      return categoriesData.map((cat: any, i: number) => ({
        icon: icons[i],
        title: cat.title,
        desc: cat.desc,
        tags: cat.tags
      }));
    }
    return [];
  }, [categoriesData]);

  return (
    <section id="integration" className="py-32 relative bg-black overflow-hidden border-t border-white/5">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          {/* Left: Text Content & Cards */}
          <div className="flex-1 text-left relative z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8">
                <Link2 size={12} className="text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  {t("integrations.badge")}
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                {t("integrations.title")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  {t("integrations.titleHighlight")}
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-neutral-500 text-lg mb-12 max-w-xl">
                {t("integrations.subtitle")}
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="space-y-4">
                {categories.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: 8, transition: { duration: 0.2 } }}
                    className={cn(
                      "group p-5 rounded-2xl flex gap-5",
                      "bg-white/[0.02] border border-white/[0.05]",
                      "hover:bg-white/[0.04] hover:border-white/[0.12]",
                      "transition-all duration-300 cursor-pointer"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      "bg-gradient-to-br from-white/[0.05] to-transparent",
                      "border border-white/[0.08]",
                      "group-hover:scale-110 group-hover:border-white/[0.15]",
                      "transition-all duration-300"
                    )}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-neutral-500 mb-3 leading-relaxed">
                        {item.desc}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded",
                              "text-neutral-500 bg-white/[0.03] border border-white/[0.06]",
                              "group-hover:border-indigo-500/20 group-hover:text-indigo-400/80",
                              "transition-all duration-300"
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Right: Code & Connection Visual */}
          <FadeIn delay={0.4} className="flex-[1.2] w-full relative">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/8 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

            {/* The "Integration Console" */}
            <div className="relative z-10 w-full max-w-2xl mx-auto">

              {/* Floating Icons - Enhanced */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
                className="absolute inset-0 w-full h-full scale-[1.4] pointer-events-none"
              >
                {[Cloud, Cpu, Share2, Globe, Database].map((Icon, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.15, 0.3, 0.15]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                    className="absolute"
                    style={{
                      top: `${50 + 42 * Math.sin(i * 1.25)}%`,
                      left: `${50 + 42 * Math.cos(i * 1.25)}%`
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                      <Icon size={18} className="text-indigo-400/60" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Code Snippet Card - Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-[#0a0a0a] rounded-2xl overflow-hidden",
                  "border border-white/[0.08]",
                  "shadow-2xl shadow-black/50",
                  "ring-1 ring-white/5"
                )}
              >
                {/* Window header */}
                <div className="h-12 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                    </div>
                    <span className="text-[11px] font-mono text-neutral-500">terminal.js</span>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-md">
                    SDK
                  </div>
                </div>

                {/* Code content */}
                <div className="p-8 font-mono text-[13px] leading-[1.8] space-y-1 select-all">
                  <div className="flex">
                    <span className="text-neutral-600 w-8">1</span>
                    <span className="text-purple-400">const</span>
                    <span className="text-white ml-1">prism</span>
                    <span className="text-neutral-500 mx-1">=</span>
                    <span className="text-purple-400">require</span>
                    <span className="text-neutral-400">(</span>
                    <span className="text-green-400">'@prism/sdk'</span>
                    <span className="text-neutral-400">);</span>
                  </div>
                  <div className="flex">
                    <span className="text-neutral-600 w-8">2</span>
                  </div>
                  <div className="flex">
                    <span className="text-neutral-600 w-8">3</span>
                    <span className="text-neutral-500 italic">{t("integrations.codeComment")}</span>
                  </div>
                  <div className="flex">
                    <span className="text-neutral-600 w-8">4</span>
                    <span className="text-purple-400">await</span>
                    <span className="text-white ml-1">prism</span>
                    <span className="text-neutral-400">.</span>
                    <span className="text-blue-400">publish</span>
                    <span className="text-neutral-400">{'({'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-neutral-600 w-8">5</span>
                    <span className="text-white ml-6">programId:</span>
                    <span className="text-green-400 ml-1">"SALE_2026"</span>
                    <span className="text-neutral-400">,</span>
                  </div>
                  <div className="flex">
                    <span className="text-neutral-600 w-8">6</span>
                    <span className="text-white ml-6">target:</span>
                    <span className="text-green-400 ml-1">"region=NYC"</span>
                  </div>
                  <div className="flex">
                    <span className="text-neutral-600 w-8">7</span>
                    <span className="text-neutral-400">{'})'}</span>
                    <span className="text-neutral-400">;</span>
                  </div>
                </div>

                {/* Bottom accent line */}
                <motion.div
                  className="h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </motion.div>

              {/* Result Card (Overlapping) - Enhanced */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 30 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                className={cn(
                  "absolute -bottom-10 -right-6 md:-right-12",
                  "bg-[#0f0f0f] border border-white/[0.1]",
                  "p-6 rounded-2xl shadow-2xl shadow-black/60",
                  "max-w-[240px]"
                )}
              >
                <div className="flex items-center gap-4 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center"
                  >
                    <Code2 size={20} className="text-green-400" />
                  </motion.div>
                  <div className="text-[12px] font-bold text-white uppercase tracking-wider">
                    {t("integrations.apiSuccess")}
                  </div>
                </div>
                <div className="text-[11px] text-neutral-500 font-medium pl-14">
                  {t("integrations.endpointsUpdated", { count: 482 })}
                </div>

                {/* Success pulse indicator */}
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-green-500"
                />
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};