import React from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Zap, Shield, Cpu, Globe2, BarChart3, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

const benefits = [
  {
    title: "Lighting Fast Performance",
    description: "Built on a modern stack ensuring your content loads and plays without a stutter, even on low-end hardware.",
    icon: Zap,
    className: "md:col-span-2",
    iconColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20"
  },
  {
    title: "Secure by Design",
    description: "Enterprise-grade encryption for your media and communications.",
    icon: Shield,
    className: "md:col-span-1",
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20"
  },
  {
    title: "AI Integration",
    description: "Leverage the power of Gemini to automate your content strategy and creation.",
    icon: Cpu,
    className: "md:col-span-1",
    iconColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  },
  {
    title: "Global Distribution",
    description: "Scale from one screen to thousands across the globe with our robust CDN infrastructure.",
    icon: Globe2,
    className: "md:col-span-2",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    title: "Real-time Analytics",
    description: "Get instant insights into your display network's performance and audience engagement.",
    icon: BarChart3,
    className: "md:col-span-1",
    iconColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20"
  },
  {
    title: "Cloud First",
    description: "Manage everything from anywhere. No complex on-premise servers required.",
    icon: Cloud,
    className: "md:col-span-2",
    iconColor: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20"
  }
];

export default function BenefitsPage() {
  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-24">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              Why choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Prism Cloud</span>?
            </motion.h1>
            <p className="text-lg text-slate-400">
              We focus on delivering measurable value to your business through cutting-edge display technology and intuitive software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "group relative p-8 rounded-3xl border bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300",
                  benefit.borderColor,
                  benefit.className
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                  benefit.bgColor,
                  benefit.iconColor
                )}>
                  <benefit.icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{benefit.title}</h3>
                <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
                
                {/* Decorative background glow */}
                <div className={cn(
                  "absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                  benefit.bgColor
                )} />
              </motion.div>
            ))}
          </div>

          {/* Results Section */}
          <div className="mt-32 p-12 rounded-[40px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-white/5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Real Results for Real Businesses</h2>
                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="text-4xl font-bold text-white">50%</div>
                    <div>
                      <div className="font-bold mb-1">Efficiency Boost</div>
                      <p className="text-sm text-slate-400">Reduce time spent on content updates by half compared to traditional systems.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-4xl font-bold text-white">30%</div>
                    <div>
                      <div className="font-bold mb-1">Higher Engagement</div>
                      <p className="text-sm text-slate-400">Dynamic, AI-optimized content leads to better audience retention.</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-4xl font-bold text-white">99.9%</div>
                    <div>
                      <div className="font-bold mb-1">Uptime Guaranteed</div>
                      <p className="text-sm text-slate-400">Reliable infrastructure that keeps your screens alive 24/7/365.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center p-8">
                  {/* Abstract data visualization placeholder */}
                  <div className="w-full space-y-4">
                    {[70, 40, 90, 60, 80].map((w, i) => (
                      <div key={i} className="h-4 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${w}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: i * 0.1 }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Floating badge */}
                <div className="absolute -top-6 -right-6 p-6 rounded-2xl bg-black border border-indigo-500/30 shadow-2xl shadow-indigo-500/20">
                  <BarChart3 className="text-indigo-400 mb-2" />
                  <div className="text-xs font-bold text-white">Live Data</div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
