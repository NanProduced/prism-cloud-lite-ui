import { FadeIn } from "@/components/ui/FadeIn";
import { useTranslation } from "react-i18next";

export const StatsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-32 relative overflow-hidden bg-black border-y border-white/[0.05]">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <FadeIn>
            <h3 className="text-3xl text-white font-bold mb-4 leading-tight tracking-tight">
              Powering the <br /> 
              <span className="text-indigo-400">Visual Web</span>
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-[200px]">
              Delivering high-impact content to thousands of endpoints every second.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="text-6xl font-black text-white mb-3 tracking-tighter tabular-nums">
              1.2M
            </div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              Daily Content Syncs
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="text-6xl font-black text-white mb-3 tracking-tighter tabular-nums">
              99.9
            </div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              Uptime Percentage
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="text-6xl font-black text-white mb-3 tracking-tighter tabular-nums">
              0ms
            </div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
              Offline Latency
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};