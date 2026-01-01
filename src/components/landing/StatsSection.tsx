import { FadeIn } from "@/components/ui/FadeIn";
import CountUp from "@/components/ui/count-up";
import { useTranslation } from "react-i18next";

export const StatsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-black">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 items-center">
          <FadeIn>
            <h3 className="text-3xl md:text-4xl text-white font-bold mb-4 leading-[1.1] tracking-tight">
              Powering the <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Visual Web.</span>
            </h3>
            <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-[240px]">
              Delivering high-impact content to thousands of global endpoints every second.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="flex flex-col gap-1">
              <div className="text-5xl md:text-7xl font-black text-white tracking-tighter tabular-nums flex items-baseline">
                <CountUp to={1.2} duration={2} />
                <span className="text-2xl md:text-3xl text-indigo-500 ml-1">M</span>
              </div>
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
                Daily Content Syncs
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-col gap-1">
              <div className="text-5xl md:text-7xl font-black text-white tracking-tighter tabular-nums flex items-baseline">
                <CountUp to={99.9} duration={2} />
                <span className="text-2xl md:text-3xl text-purple-500 ml-1">%</span>
              </div>
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
                Uptime Percentage
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col gap-1">
              <div className="text-5xl md:text-7xl font-black text-white tracking-tighter tabular-nums flex items-baseline">
                <CountUp to={14} duration={2} />
                <span className="text-2xl md:text-3xl text-emerald-500 ml-1">ms</span>
              </div>
              <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
                Edge Sync Latency
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
