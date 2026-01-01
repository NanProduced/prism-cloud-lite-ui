import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Database, Map as MapIcon, Terminal, Code2, Cpu, Cloud, Link2, Share2, Globe } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

export const Integrations = () => {
  const { t } = useTranslation();

  const integrationCategories = [
    {
      icon: <Database size={20} className="text-indigo-400" />,
      title: "Enterprise Storage",
      desc: "Native support for AWS S3, Alibaba OSS, and MinIO for reliable content hosting.",
      tags: ["S3", "OSS", "IPFS"]
    },
    {
      icon: <MapIcon size={20} className="text-purple-400" />,
      title: "Contextual Maps",
      desc: "Full integration with MapTiler and Google Maps for precise terminal tracking.",
      tags: ["MapTiler", "GIS"]
    },
    {
      icon: <Terminal size={20} className="text-blue-400" />,
      title: "Powerful API",
      desc: "Robust REST API and Webhooks to integrate with your ERP, CRM, or custom scripts.",
      tags: ["REST", "Webhooks"]
    }
  ];

  return (
    <section id="integration" className="py-32 relative bg-black overflow-hidden border-t border-white/5">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          
          {/* Left: Text Content & Cards */}
          <div className="flex-1 text-left relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8"
            >
              <Link2 size={12} />
              <span>Connectivity Hub</span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
              Easy to Integrate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                with your Workflow
              </span>
            </h2>
            
            <p className="text-gray-500 text-lg mb-12 max-w-xl font-light">
              Prism Cloud Lite isn't just a player. It's an open ecosystem designed 
              to slide perfectly into your existing enterprise infrastructure.
            </p>

            <div className="space-y-6">
              {integrationCategories.map((item, i) => (
                <div key={i} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all flex gap-6">
                   <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover:scale-110 transition-transform">
                      {item.icon}
                   </div>
                   <div>
                      <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-500 mb-4 max-w-sm">{item.desc}</p>
                      <div className="flex gap-2">
                         {item.tags.map(tag => (
                           <span key={tag} className="text-[9px] font-bold text-gray-600 border border-white/5 px-2 py-0.5 rounded uppercase tracking-wider">{tag}</span>
                         ))}
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Code & Connection Visual */}
          <div className="flex-1 w-full relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/10 blur-[120px] rounded-full" />
            
            {/* The "Integration Console" */}
            <div className="relative z-10 w-full max-w-lg mx-auto">
               
               {/* Floating Logo Circle */}
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
                 className="absolute inset-0 w-full h-full scale-125 opacity-20 pointer-events-none"
               >
                  {[Cloud, Cpu, Share2, Globe, Database].map((Icon, i) => (
                    <div key={i} 
                         className="absolute"
                         style={{ 
                           top: `${50 + 40 * Math.sin(i * 1.25)}%`, 
                           left: `${50 + 40 * Math.cos(i * 1.25)}%` 
                         }}>
                       <Icon size={24} className="text-white" />
                    </div>
                  ))}
               </motion.div>

               {/* Code Snippet Card */}
               <motion.div 
                 initial={{ opacity: 0, y: 40 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 className="bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5"
               >
                  <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between px-4">
                     <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/20" />
                        <span className="text-[10px] font-mono text-gray-500">terminal.js</span>
                     </div>
                     <div className="text-[9px] font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">SDK</div>
                  </div>
                  <div className="p-6 font-mono text-[11px] leading-relaxed">
                     <div className="flex gap-3">
                        <span className="text-gray-600">1</span>
                        <span className="text-purple-400">const</span> <span className="text-white">prism</span> = <span className="text-purple-400">require</span>(<span className="text-green-400">'@prism/sdk'</span>);
                     </div>
                     <div className="flex gap-3">
                        <span className="text-gray-600">2</span>
                     </div>
                     <div className="flex gap-3">
                        <span className="text-gray-600">3</span>
                        <span className="text-gray-500">// Deploy content to global terminals</span>
                     </div>
                     <div className="flex gap-3">
                        <span className="text-gray-600">4</span>
                        <span className="text-purple-400">await</span> <span className="text-white">prism</span>.<span className="text-blue-400">publish</span>({'{'}
                     </div>
                     <div className="flex gap-3">
                        <span className="text-gray-600">5</span>
                        <span className="text-white pl-4">programId:</span> <span className="text-green-400">"SALE_2026"</span>,
                     </div>
                     <div className="flex gap-3">
                        <span className="text-gray-600">6</span>
                        <span className="text-white pl-4">target:</span> <span className="text-green-400">"region=NYC"</span>
                     </div>
                     <div className="flex gap-3">
                        <span className="text-gray-600">7</span>
                        {'}'});
                     </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
               </motion.div>

               {/* Result Card (Overlapping) */}
               <motion.div 
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.5 }}
                 className="absolute -bottom-10 -right-6 md:-right-10 bg-[#111] border border-white/10 p-5 rounded-2xl shadow-2xl max-w-[200px]"
               >
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                        <Code2 size={16} />
                     </div>
                     <div className="text-[10px] font-bold text-white uppercase tracking-widest">API Call Success</div>
                  </div>
                  <div className="text-[9px] text-gray-500 font-medium">482 Endpoints Updated</div>
               </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};