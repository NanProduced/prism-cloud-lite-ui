import { FadeIn } from "@/components/ui/FadeIn";

export const StatsSection = () => {
  return (
    <section className="py-20 border-y border-white/5 bg-white/[0.02]">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <FadeIn>
            <h3 className="text-4xl text-white font-medium mb-2 leading-tight">
              We are growing <br /> like crazy
            </h3>
            <p className="text-[#aaaaaa] text-sm leading-relaxed">
              Transforming data into actionable insights for businesses worldwide.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="text-5xl font-medium text-white mb-2 tracking-tight">
              $28M
            </div>
            <div className="text-[#aaaaaa] font-light">
              raised by startups
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="text-5xl font-medium text-white mb-2 tracking-tight">
              500+
            </div>
            <div className="text-[#aaaaaa] font-light">
              Active Companies
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="text-5xl font-medium text-white mb-2 tracking-tight">
              200k
            </div>
            <div className="text-[#aaaaaa] font-light">
              Daily Users
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
