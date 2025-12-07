import { motion } from "framer-motion";
import svgPaths from "@/lib/figma/svgPaths";

const testimonials1 = [
  {
    quote:
      "Prism Cloud's infrastructure monitoring has dramatically improved our system reliability and incident response time.",
    name: "Sarah Chen",
    role: "DevOps Lead",
    company: "TechCorp",
  },
  {
    quote:
      "The real-time metrics and predictive capabilities have kept us ahead in managing our cloud infrastructure at scale.",
    name: "Emily Rodriguez",
    role: "Platform Engineer",
    company: "CloudNative Inc.",
  },
  {
    quote:
      "Prism Cloud transformed our observability stack, providing seamless integration and insightful visualizations.",
    name: "Michael Zhang",
    role: "SRE Manager",
    company: "ScaleUp",
  },
  {
    quote:
      "The real-time metrics and predictive capabilities have kept us ahead in managing our cloud infrastructure at scale.",
    name: "Emily Rodriguez",
    role: "Platform Engineer",
    company: "CloudNative Inc.",
  },
];

const testimonials2 = [
  {
    quote:
      "Prism Cloud transformed our observability stack, providing seamless integration and insightful visualizations.",
    name: "Michael Zhang",
    role: "SRE Manager",
    company: "ScaleUp",
  },
  {
    quote:
      "Prism Cloud's infrastructure monitoring has dramatically improved our system reliability and incident response time.",
    name: "Sarah Chen",
    role: "DevOps Lead",
    company: "TechCorp",
  },
  {
    quote:
      "The real-time metrics and predictive capabilities have kept us ahead in managing our cloud infrastructure at scale.",
    name: "Emily Rodriguez",
    role: "Platform Engineer",
    company: "CloudNative Inc.",
  },
  {
    quote:
      "Prism Cloud's infrastructure monitoring has dramatically improved our system reliability and incident response time.",
    name: "Sarah Chen",
    role: "DevOps Lead",
    company: "TechCorp",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 text-center mb-16">
        <h2 className="text-4xl md:text-5xl text-white mb-4 font-medium">
          Trusted by over <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5653ff] to-[#d252ff]">
            500+ Cloud Teams
          </span>
        </h2>
      </div>

      <div className="relative flex flex-col gap-8">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-neutral-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-neutral-950 to-transparent z-10 pointer-events-none" />

        {/* Row 1 - Left */}
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-6 px-6 min-w-max"
            animate={{ x: [0, -1500] }}
            transition={{
              repeat: Infinity,
              duration: 40,
              ease: "linear",
            }}
          >
            {[...testimonials1, ...testimonials1].map(
              (t, i) => (
                <div
                  key={i}
                  className="w-[450px] h-[280px] bg-[#0d0d0d] border border-[#1a1a1a] p-8 rounded-2xl flex flex-col justify-between shrink-0 relative group hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 text-[#5a5a5a]">
                      <svg
                        viewBox="0 0 32 32"
                        className="w-full h-full fill-current"
                      >
                        <path d={svgPaths.p2398d200} />
                      </svg>
                    </div>
                    <span className="text-[#5a5a5a] font-medium">
                      {t.company}
                    </span>
                  </div>
                  <p className="text-[#8a8a8a] text-lg italic leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="mt-6 text-center">
                    <p className="text-[#cacaca] font-medium text-lg">
                      {t.name},{" "}
                      <span className="font-normal text-sm text-[#8a8a8a]">
                        {t.role}
                      </span>
                    </p>
                  </div>
                </div>
              ),
            )}
          </motion.div>
        </div>

        {/* Row 2 - Right */}
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-6 px-6 min-w-max"
            animate={{ x: [-1500, 0] }}
            transition={{
              repeat: Infinity,
              duration: 40,
              ease: "linear",
            }}
          >
            {[...testimonials2, ...testimonials2].map(
              (t, i) => (
                <div
                  key={i}
                  className="w-[450px] h-[280px] bg-[#0d0d0d] border border-[#1a1a1a] p-8 rounded-2xl flex flex-col justify-between shrink-0 relative group hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 text-[#5a5a5a]">
                      <svg
                        viewBox="0 0 32 32"
                        className="w-full h-full fill-current"
                      >
                        <path d={svgPaths.p2398d200} />
                      </svg>
                    </div>
                    <span className="text-[#5a5a5a] font-medium">
                      {t.company}
                    </span>
                  </div>
                  <p className="text-[#8a8a8a] text-lg italic leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="mt-6 text-center">
                    <p className="text-[#cacaca] font-medium text-lg">
                      {t.name},{" "}
                      <span className="font-normal text-sm text-[#8a8a8a]">
                        {t.role}
                      </span>
                    </p>
                  </div>
                </div>
              ),
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
