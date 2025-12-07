import { FadeIn } from "@/components/ui/FadeIn";

// Import images
import imgGroup1261159637 from "@/assets/figma/6527cf12577e86d6f6e34cddff67cf9d52ce8063.png";
import imgGroup12611596431 from "@/assets/figma/5ffbfcdee3ee54cd9d536fe4ac67058bd55e4d45.png";
import imgGroup1261159636 from "@/assets/figma/3e144d872a3a8c71b676c7eb837359c82863d643.png";
import imgVisitorInsights1 from "@/assets/figma/1d91018dc964e02f93234c18154e6d67617940a3.png";
import imgGroup1261159645 from "@/assets/figma/afb861da2acee83cdbb5ae231689e58884537c45.png";

export const AppFeatures = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl text-white mb-4 font-medium">
              Cloud Observability for <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5653ff] to-[#d252ff]">
                Modern Infrastructure
              </span>
            </h2>
            <p className="text-[#aaaaaa] max-w-2xl mx-auto mt-6">
              Collect, Organize and Analyze your metrics with our
              advanced learning algorithms to find patterns in
              your infrastructure.
            </p>
          </FadeIn>
        </div>

        {/* Bento Grid Layout - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
          {/* Column 1 */}
          <div className="flex flex-col gap-6">
            {/* Real Time Insights */}
            <FadeIn
              delay={0}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col h-[320px] group hover:border-white/20 transition-colors overflow-hidden relative"
            >
              <div className="relative z-10">
                <h4 className="text-2xl text-[#cacaca] mb-2 font-medium">
                  Real Time Deep Insights
                </h4>
                <p className="text-sm text-[#666666]">
                  Real-time analytics with predictive
                  capabilities for your infrastructure.
                </p>
              </div>
              <div className="absolute bottom-0 left-6 right-6 h-[200px] rounded-t-xl overflow-hidden border-t-4 border-x-4 border-[#1a1a1a] bg-[#1a1a1a]">
                <img
                  src={imgGroup1261159636}
                  alt="Realtime"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </FadeIn>

            {/* Optimise Revise Repeat */}
            <FadeIn
              delay={0.2}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col justify-center h-[190px] group hover:border-white/20 transition-colors relative overflow-hidden"
            >
              <div className="absolute right-0 top-4 h-[160px] w-[250px] opacity-80">
                <img
                  src={imgVisitorInsights1}
                  alt="Visitor"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative z-10">
                <p className="text-[#3a3a3a] text-2xl font-medium leading-tight">
                  Optimize. Revise.
                </p>
                <p className="text-white text-2xl font-medium leading-tight">
                  Repeat.
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-6">
            {/* Journey */}
            <FadeIn
              delay={0.1}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-0 flex flex-col h-[534px] group hover:border-white/20 transition-colors overflow-hidden relative"
            >
              <div className="flex-1 p-6 pb-0 w-full relative">
                <div className="w-full h-full rounded-t-xl border-t-4 border-x-4 border-[#1a1a1a] overflow-hidden bg-[#1a1a1a]">
                  <img
                    src={imgGroup12611596431}
                    alt="Journey"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="p-8 text-center relative z-10 bg-[#0d0d0d]">
                <h4 className="text-2xl text-[#cacaca] mb-2 font-medium">
                  Journey, not destination
                </h4>
                <p className="text-[#666] text-sm mb-6">
                  Monitor and analyze retention to optimize
                  system reliability.
                </p>
                <div className="inline-block text-xs text-[#333] border-l-2 border-[#333] pl-3 text-left">
                  On average, our users have seen <br />{" "}
                  <span className="text-white font-bold">
                    +20%
                  </span>{" "}
                  improvement in uptime.
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-6">
            {/* A/B Test */}
            <FadeIn
              delay={0.2}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col h-[250px] group hover:border-white/20 transition-colors relative overflow-hidden"
            >
              <div className="relative z-10 mb-4 text-center">
                <h4 className="text-2xl text-[#cacaca] font-medium">
                  A/B Test Feature Variants
                </h4>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[180px] rounded-t-xl mx-6 border-t-4 border-x-4 border-[#1a1a1a] overflow-hidden bg-[#1a1a1a]">
                <img
                  src={imgGroup1261159637}
                  alt="AB Testing"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </FadeIn>

            {/* Metrics */}
            <FadeIn
              delay={0.3}
              className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6 flex flex-col h-[260px] group hover:border-white/20 transition-colors relative overflow-hidden"
            >
              <div className="relative z-10 mb-4 text-center">
                <h4 className="text-2xl text-[#cacaca] font-medium">
                  Supercharged Metrics
                </h4>
              </div>
              <div className="absolute bottom-0 left-6 right-6 h-[190px] rounded-t-xl border-t-4 border-x-4 border-[#1a1a1a] overflow-hidden bg-[#1a1a1a]">
                <img
                  src={imgGroup1261159645}
                  alt="Metrics"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};
