import React from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { CheckCircle2, Clock, Calendar, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const roadmapItems = [
  {
    status: "completed",
    title: "Project Foundation & Core UI",
    date: "Q3 2025",
    description: "Established the base architecture using React, Vite, and Tailwind CSS. Implemented core dashboard layouts and component library.",
    features: ["Component System", "Responsive Layouts", "Authentication Flow"],
    icon: CheckCircle2,
    color: "emerald"
  },
  {
    status: "completed",
    title: "Media & Device Management",
    date: "Q4 2025",
    description: "Launched the media library for content management and the device management module for remote display control.",
    features: ["Cloud Storage", "Device Pairing", "Remote Monitoring"],
    icon: Rocket,
    color: "blue"
  },
  {
    status: "in-progress",
    title: "AI-Powered Content Studio",
    date: "Q1 2026",
    description: "Integrating Gemini API to help users generate dynamic content and intelligent schedules automatically.",
    features: ["AI Image Generation", "Smart Scheduling", "Content Recommendations"],
    icon: Clock,
    color: "purple"
  },
  {
    status: "planned",
    title: "Global CDN & Edge Computing",
    date: "Q2 2026",
    description: "Optimizing content delivery with global edge nodes to ensure ultra-low latency playback worldwide.",
    features: ["Global Distribution", "Edge Cache", "Offline Playback"],
    icon: Calendar,
    color: "amber"
  }
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "in-progress": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    planned: "bg-slate-500/10 text-slate-400 border-slate-500/20"
  }[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

  const labels = {
    completed: "Completed",
    "in-progress": "In Progress",
    planned: "Coming Soon"
  }[status] || status;

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider", styles)}>
      {labels}
    </span>
  );
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <Container>
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                Product <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Roadmap</span>
              </h1>
              <p className="text-lg text-slate-400">
                Discover our journey and what we're building next. We're committed to creating the most intelligent digital signage platform.
              </p>
            </motion.div>
          </div>

          {/* Timeline */}
          <div className="relative max-w-4xl mx-auto">
            {/* Center Line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-purple-500/50 to-transparent md:-translate-x-1/2" />

            <div className="space-y-24">
              {roadmapItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, delay: index * 0.1 }}
                  className={cn(
                    "relative flex flex-col md:flex-row gap-8 md:gap-0 items-center",
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  )}
                >
                  {/* Content Side */}
                  <div className="w-full md:w-1/2 flex justify-start md:justify-center px-8">
                    <div className={cn(
                      "relative p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm group hover:border-white/10 transition-colors",
                      item.status === "in-progress" ? "ring-1 ring-purple-500/20 shadow-[0_0_30px_-10px_rgba(168,85,247,0.2)]" : ""
                    )}>
                      <div className="flex items-center justify-between mb-4">
                        <StatusBadge status={item.status} />
                        <span className="text-sm font-mono text-slate-500">{item.date}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h3>
                      
                      <p className="text-sm text-slate-400 leading-relaxed mb-6">
                        {item.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {item.features.map((feature, fIdx) => (
                          <span key={fIdx} className="px-2 py-1 rounded bg-white/5 text-[10px] text-slate-300 border border-white/5">
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Connector dot for the card (on the line side) */}
                      <div className={cn(
                        "absolute top-8 hidden md:block w-4 h-4 rounded-full bg-black border-2",
                        item.status === "completed" ? "border-emerald-500" : 
                        item.status === "in-progress" ? "border-purple-500 animate-pulse" : "border-slate-700",
                        index % 2 === 0 ? "-left-[42px]" : "-right-[42px]"
                      )} />
                    </div>
                  </div>

                  {/* Icon on the line (Mobile) */}
                  <div className="absolute left-0 top-0 md:hidden w-8 h-8 -translate-x-1/2 rounded-full bg-black border border-white/10 flex items-center justify-center z-10">
                    <item.icon className={cn("w-4 h-4", 
                      item.color === "emerald" ? "text-emerald-400" :
                      item.color === "purple" ? "text-purple-400" :
                      item.color === "blue" ? "text-blue-400" : "text-amber-400"
                    )} />
                  </div>

                  {/* Icon on the line (Desktop) */}
                  <div className="absolute left-1/2 top-8 -translate-x-1/2 hidden md:flex items-center justify-center z-10">
                    <div className={cn(
                      "w-10 h-10 rounded-full bg-black border flex items-center justify-center shadow-xl shadow-black/50",
                      item.status === "completed" ? "border-emerald-500/50" : 
                      item.status === "in-progress" ? "border-purple-500/50" : "border-slate-800"
                    )}>
                       <item.icon className={cn("w-5 h-5", 
                        item.status === "completed" ? "text-emerald-400" : 
                        item.status === "in-progress" ? "text-purple-400" : "text-slate-500"
                      )} />
                    </div>
                  </div>

                  {/* Empty Side (Desktop) */}
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-40 text-center">
            <div className="p-12 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Have a feature request?</h2>
              <p className="text-slate-400 mb-8">
                We're always listening to our community. Tell us what you'd like to see next.
              </p>
              <button className="px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-slate-200 transition-colors">
                Share Feedback
              </button>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
