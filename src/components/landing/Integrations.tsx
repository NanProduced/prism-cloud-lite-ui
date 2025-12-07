import { motion } from "framer-motion";
import svgPaths from "@/lib/figma/svgPaths";

// Import image
import imgImage191 from "@/assets/figma/d39e9d958b9772e08948734578904e2c89de7454.png";

const logos = [
  svgPaths.p93d9200,
  svgPaths.p14c3eb80,
  svgPaths.p38c42b00,
  svgPaths.p1f30c800,
  svgPaths.p904ed00,
  svgPaths.p1702b700,
  svgPaths.p9729d00,
  svgPaths.p32671300,
];

export const Integrations = () => {
  return (
    <section className="py-24 relative bg-[#050505]">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Left: Text Content */}
        <div className="md:w-1/2 relative z-10">
          <h2 className="text-4xl md:text-6xl font-medium text-white mb-6 leading-tight">
            Easy to Integrate
          </h2>
          <p className="text-4xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-[#5653ff] to-[#d252ff] font-medium leading-tight mb-8">
            with your cloud stack
          </p>
          <p className="text-[#aaaaaa] text-lg max-w-md">
            Connect seamlessly with the tools you already use.
            Our platform supports a wide range of integrations
            to streamline your monitoring workflow.
          </p>
        </div>

        {/* Right: Integration Visual */}
        <div className="md:w-1/2 relative flex justify-center items-center">
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#5653ff]/10 to-[#d252ff]/10 blur-3xl rounded-full pointer-events-none" />

          {/* Central Integration Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 w-full max-w-[500px]"
          >
            <img
              src={imgImage191}
              alt="Integrations"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom: Partner Logos Grid */}
      <div className="container mx-auto px-6 mt-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-40">
          {logos.map((logoPath, i) => (
            <div
              key={i}
              className="flex items-center justify-center h-16"
            >
              <svg
                viewBox="0 0 120 40"
                className="h-full w-auto fill-white hover:fill-[#5552ff] transition-colors"
              >
                <path d={logoPath} />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
