import React from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Layout, Send, Activity, Shield, Cloud, Cpu, Sparkles, Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "AI-Powered Content Studio",
    description: "Generate stunning visuals and intelligent schedules automatically. Our AI understands your brand and helps you create content that resonates with your audience.",
    icon: Sparkles,
    color: "from-purple-500 to-indigo-500",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
    features: ["Intelligent Layouts", "Automated Resizing", "Style Transfer"]
  },
  {
    title: "Remote Fleet Management",
    description: "Control thousands of screens from a single dashboard. Real-time monitoring, remote reboots, and status alerts keep your network running smoothly.",
    icon: Activity,
    color: "from-emerald-500 to-teal-500",
    image: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=1000&auto=format&fit=crop",
    features: ["Heartbeat Monitoring", "Group Control", "Remote Updates"]
  },
  {
    title: "Seamless Content Distribution",
    description: "Deploy updates in seconds. Our global CDN ensures that your media is cached at the edge, providing instant playback and reducing bandwidth costs.",
    icon: Send,
    color: "from-blue-500 to-cyan-500",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
    features: ["Edge Caching", "Delta Updates", "Offline Support"]
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-32">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-bold mb-6 tracking-tight"
            >
              Powerful Features <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Simple to use</span>
            </motion.h1>
            <p className="text-lg text-slate-400">
              Everything you need to manage your digital displays effectively, all in one intuitive platform.
            </p>
          </div>

          <div className="space-y-40">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex flex-col gap-16 items-center",
                  idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                )}
              >
                <motion.div 
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="flex-1 space-y-8"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg",
                    feature.color
                  )}>
                    <feature.icon size={24} />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{feature.title}</h2>
                  <p className="text-lg text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-4">
                    {feature.features.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-slate-300 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-bold">
                    Learn more
                  </button>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="flex-1 w-full"
                >
                  <div className="relative group">
                    <div className={cn(
                      "absolute -inset-4 rounded-[40px] opacity-20 blur-2xl transition-all duration-700 group-hover:opacity-40 bg-gradient-to-br",
                      feature.color
                    )} />
                    <div className="relative aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Grid of smaller features */}
          <div className="mt-60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Enterprise SSO", icon: Shield, desc: "Connect with your existing identity provider." },
              { title: "Global CDN", icon: Globe2, desc: "Content delivered at light speed anywhere." },
              { title: "Auto-Scaling", icon: Cloud, desc: "System scales with your screen count automatically." },
              { title: "API First", icon: Cpu, desc: "Integrate with any system using our robust API." },
              { title: "Custom Plugins", icon: Layout, desc: "Extend functionality with our plugin system." },
              { title: "Health Alerts", icon: Activity, desc: "Get notified before issues become problems." }
            ].map((small, sIdx) => (
              <motion.div
                key={sIdx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sIdx * 0.05 }}
                className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <small.icon className="text-indigo-400 mb-4" size={24} />
                <h4 className="text-xl font-bold mb-2">{small.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{small.desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}