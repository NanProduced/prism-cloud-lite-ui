import { FadeIn } from "@/components/ui/FadeIn";
import { useTranslation } from "react-i18next";
import { Monitor, Smartphone, Globe, Cloud, Shield, Zap, Terminal, Search } from "lucide-react";

export const AppFeatures = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-32 bg-black transition-all duration-500">
      <div className="container mx-auto px-6">
        <div className="text-center mb-24">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl text-white mb-6 font-bold tracking-tight">
              More than just <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-white to-purple-500"> 
                Digital Signage
              </span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Prism Cloud Lite provides an enterprise-grade infrastructure 
              to manage your global visual communication network with ease.
            </p>
          </FadeIn>
        </div>

        {/* Bento Grid Layout - High Fidelity */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          
          {/* Real-time Telemetry (Large) */}
          <FadeIn
            className="md:col-span-6 lg:col-span-8 bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] p-10 group hover:border-white/20 transition-all overflow-hidden relative min-h-[400px]"
          >
            <div className="relative z-10 max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                 <Monitor size={24} />
              </div>
              <h4 className="text-3xl text-white mb-4 font-bold tracking-tight">
                Real-time Device Telemetry
              </h4>
              <p className="text-gray-500 leading-relaxed">
                Track every heartbeat. Monitor CPU load, memory usage, and storage 
                health across your entire fleet in milliseconds.
              </p>
            </div>
            {/* Visual element: Waveform/Grid */}
            <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent flex items-end justify-end p-8 opacity-40 group-hover:opacity-100 transition-opacity">
               <div className="flex items-end gap-2 h-32 w-full max-w-xs">
                  {[40, 70, 45, 90, 65, 80, 50, 95, 60, 75, 40].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-indigo-500/20 rounded-t-sm" />
                  ))}
               </div>
            </div>
          </FadeIn>

          {/* Secure by Design (Square) */}
          <FadeIn
            delay={0.1}
            className="md:col-span-6 lg:col-span-4 bg-[#0a0a0a] border border-white/[0.08] rounded-[2.5rem] p-10 group hover:border-white/20 transition-all relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6">
                 <Shield size={24} />
              </div>
              <h4 className="text-2xl text-white mb-4 font-bold tracking-tight">
                End-to-End Security
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Enterprise-grade encryption for content delivery and device communication. 
                Built-in SSO and role-based access.
              </p>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:opacity-20 transition-opacity">
               <Shield size={200} />
            </div>
          </FadeIn>

          {/* Global Mesh (Medium) */}
          <FadeIn
            delay={0.2}
            className="md:col-span-3 lg:col-span-4 bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] p-10 group hover:border-white/20 transition-all relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 mb-6">
                 <Globe size={24} />
              </div>
              <h4 className="text-2xl text-white mb-4 font-bold tracking-tight">
                Global Edge Mesh
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Optimized content distribution via our global mesh network, 
                minimizing latency for multi-region deployments.
              </p>
            </div>
          </FadeIn>

          {/* AI-Powered Search (Medium) */}
          <FadeIn
            delay={0.3}
            className="md:col-span-3 lg:col-span-4 bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] p-10 group hover:border-white/20 transition-all relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6">
                 <Search size={24} />
              </div>
              <h4 className="text-2xl text-white mb-4 font-bold tracking-tight">
                Semantic Search
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Find assets and devices using natural language. 
                Our AI understands context, not just keywords.
              </p>
            </div>
          </FadeIn>

          {/* API First (Medium) */}
          <FadeIn
            delay={0.4}
            className="md:col-span-6 lg:col-span-4 bg-[#0a0a0a] border border-white/[0.08] rounded-[2.5rem] p-10 group hover:border-white/20 transition-all relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
                 <Terminal size={24} />
              </div>
              <h4 className="text-2xl text-white mb-4 font-bold tracking-tight">
                API-First Ecosystem
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Fully programmable. Integrate with your CRM, ERP, or custom 
                workflows using our robust REST API and Webhooks.
              </p>
            </div>
          </FadeIn>

        </div>
      </div>
    </section>
  );
};