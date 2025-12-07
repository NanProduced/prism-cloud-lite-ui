import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

// Import images
import imgTotalRevenue from "@/assets/figma/a7f635ffc6f0dbfd617f4bb54bc75542cd6dec23.png";
import imgTargetVsReality from "@/assets/figma/0fc9632f18b8400bd7628d52cd74dd751d6dfc83.png";
import imgTargetVsReality1 from "@/assets/figma/588bb3ea1311b0fb39a9315a67cc48332ec5c419.png";
import imgTopProducts2 from "@/assets/figma/a45c65ab47d740288daf3c25cdcb92d2f19987d5.png";
import imgCustomerSatisfaction from "@/assets/figma/9150588776d2f7a9e7bfedd111bd4a03aa1b70a2.png";
import imgVolume from "@/assets/figma/bc2a9bcc6205b84bd92a1474d825ffd36f1a5d9e.png";
import img1 from "@/assets/figma/5999004a2ff9f52933933ba323a414f035089d54.png";

export const FeatureSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <FadeIn className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl text-white mb-4 font-medium">
            Better Understand your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5653ff] to-[#d252ff]">
              Cloud Infrastructure
            </span>
          </h2>
        </FadeIn>

        {/* Feature 1: Comprehensive Data Collection */}
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24 mb-32">
          <div className="flex-1 relative min-h-[400px] w-full flex items-center justify-center">
            {/* Abstract Graphic Background */}
            <div className="absolute inset-0 bg-[#5754FF]/10 blur-[80px] rounded-full" />
            <div className="relative z-10 w-full max-w-md">
              <motion.img
                whileHover={{ scale: 1.02, rotate: -2 }}
                src={imgTotalRevenue}
                className="w-full rounded-xl shadow-2xl mb-[-40px] relative z-10"
                alt="Revenue Chart"
              />
              <motion.img
                whileHover={{ scale: 1.02, rotate: 2 }}
                src={imgTargetVsReality}
                className="w-3/4 ml-auto rounded-xl shadow-2xl border border-white/10 bg-[#0d0d0d]"
                alt="Target Reality"
              />
            </div>
          </div>
          <FadeIn className="flex-1 text-left">
            <h3 className="text-3xl md:text-4xl text-white font-medium mb-6">
              Comprehensive Data Collection
            </h3>
            <p className="text-[#aaaaaa] text-lg leading-relaxed mb-8 font-light">
              Seamlessly gather metrics from your cloud infrastructure,
              containers, and services. Our platform integrates
              effortlessly with your existing tools to provide a
              holistic view of your system performance.
            </p>
            <button className="flex items-center gap-2 text-white border-b border-white/30 pb-1 hover:border-white transition-colors group">
              Learn More{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </FadeIn>
        </div>

        {/* Feature 2: Advanced Data Visualization */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-24 mb-32">
          <FadeIn className="flex-1 text-left">
            <h3 className="text-3xl md:text-4xl text-white font-medium mb-6">
              Advanced Data Visualization
            </h3>
            <p className="text-[#aaaaaa] text-lg leading-relaxed mb-8 font-light">
              Easily interpret your metrics with our intuitive
              visualization tools. From interactive dashboards
              to detailed reports, our visualizations help you
              quickly identify trends, patterns, and
              opportunities for optimization.
            </p>
            <button className="flex items-center gap-2 text-white border-b border-white/30 pb-1 hover:border-white transition-colors group">
              Learn More{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </FadeIn>
          <div className="flex-1 relative min-h-[400px] w-full flex items-center justify-center">
            <div className="absolute inset-0 bg-[#CE53FF]/10 blur-[100px] rounded-full" />
            <div className="relative z-10 w-full max-w-md grid grid-cols-2 gap-4">
              <motion.img
                whileHover={{ y: -5 }}
                src={imgTargetVsReality1}
                className="col-span-2 w-full rounded-xl shadow-2xl border border-white/5"
                alt="Visualization"
              />
              <motion.img
                whileHover={{ y: -5 }}
                src={imgTopProducts2}
                className="w-full rounded-xl shadow-lg"
                alt="Products"
              />
              <motion.img
                whileHover={{ y: -5 }}
                src={img1}
                className="w-full rounded-xl shadow-lg"
                alt="Stats"
              />
            </div>
          </div>
        </div>

        {/* Feature 3: Behavioural Analysis */}
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
          <div className="flex-1 relative min-h-[400px] w-full flex items-center justify-center">
            {/* Abstract Graphic Background */}
            <div className="absolute inset-0 bg-[#6653FF]/10 blur-[80px] rounded-full" />
            <div className="relative z-10 w-full max-w-md">
              <motion.img
                whileHover={{ scale: 1.03 }}
                src={imgCustomerSatisfaction}
                className="w-full rounded-xl shadow-2xl relative z-10"
                alt="Satisfaction"
              />
              <motion.div
                whileHover={{ x: 10 }}
                className="absolute -right-8 -bottom-8 w-2/3"
              >
                <img
                  src={imgVolume}
                  className="w-full rounded-xl shadow-2xl border border-white/10 bg-black/50 backdrop-blur-md"
                  alt="Volume"
                />
              </motion.div>
            </div>
          </div>
          <FadeIn className="flex-1 text-left">
            <h3 className="text-3xl md:text-4xl text-white font-medium mb-6">
              Performance Analysis
            </h3>
            <p className="text-[#aaaaaa] text-lg leading-relaxed mb-8 font-light">
              Dive deep into system performance to understand how
              your services behave under load. Identify key
              bottlenecks, track resource usage patterns, and uncover
              areas for improvement to enhance overall reliability.
            </p>
            <button className="flex items-center gap-2 text-white border-b border-white/30 pb-1 hover:border-white transition-colors group">
              Learn More{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
