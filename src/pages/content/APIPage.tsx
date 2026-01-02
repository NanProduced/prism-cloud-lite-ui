import React from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Code, Copy, Terminal, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const endpoints = [
  { method: "GET", path: "/v1/devices", desc: "List all registered devices in your workspace." },
  { method: "POST", path: "/v1/media", desc: "Upload a new media asset to the library." },
  { method: "GET", path: "/v1/programs", desc: "Retrieve a list of available programs." },
  { method: "POST", path: "/v1/deploy", desc: "Deploy a specific program to target devices." }
];

const codeExample = `// Initialize the client
const prism = new PrismClient({
  apiKey: "pc_live_..."
});

// List all devices
const devices = await prism.devices.list();

console.log(\`You have \${devices.length} active screens.\`);`;

export default function APIPage() {
  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          <div className="max-w-4xl mx-auto text-center mb-24">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Developers</span>
            </motion.h1>
            <p className="text-lg text-slate-400">
              Integrate digital signage into your own applications with our powerful, well-documented REST API and SDKs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 space-y-8">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Getting Started</div>
                <ul className="space-y-2">
                  {["Introduction", "Authentication", "Rate Limits", "Errors"].map((item) => (
                    <li key={item}>
                      <button className="text-sm text-slate-400 hover:text-white transition-colors py-1 flex items-center justify-between w-full group">
                        {item}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Resources</div>
                <ul className="space-y-2">
                  {["Devices", "Media", "Programs", "Schedules", "Users"].map((item) => (
                    <li key={item}>
                      <button className="text-sm text-slate-400 hover:text-white transition-colors py-1 flex items-center justify-between w-full group">
                        {item}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Beta Access</div>
                <p className="text-[11px] text-slate-400 mb-4">Our new GraphQL API is now in public beta.</p>
                <button className="w-full py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold">Try it now</button>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-5 space-y-12">
              <section id="introduction">
                <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                <p className="text-slate-400 leading-relaxed mb-6">
                  The Prism Cloud API is organized around REST. Our API has predictable resource-oriented URLs, accepts form-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
                </p>
                <div className="flex gap-4">
                  <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold">Full Documentation</button>
                  <button className="px-4 py-2 border border-white/10 rounded-lg text-sm font-bold">API Reference</button>
                </div>
              </section>

              <section id="authentication">
                <h2 className="text-2xl font-bold mb-4">Authentication</h2>
                <p className="text-slate-400 leading-relaxed mb-6">
                  The Prism Cloud API uses API keys to authenticate requests. You can view and manage your API keys in the dashboard.
                </p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-slate-300">
                  Authorization: Bearer YOUR_API_KEY
                </div>
              </section>

              <section id="endpoints">
                <h2 className="text-2xl font-bold mb-6">Quick Reference</h2>
                <div className="space-y-4">
                  {endpoints.map((ep, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-4 group hover:border-white/10 transition-colors">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold min-w-[50px] text-center",
                        ep.method === "GET" ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {ep.method}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-mono text-white mb-1">{ep.path}</div>
                        <div className="text-xs text-slate-500">{ep.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Code Preview */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-400">Node.js SDK</span>
                  </div>
                  <button className="text-slate-500 hover:text-white transition-colors">
                    <Copy size={14} />
                  </button>
                </div>
                <div className="p-6">
                  <pre className="font-mono text-sm leading-relaxed text-indigo-300">
                    <code>{codeExample}</code>
                  </pre>
                </div>
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Response</div>
                  <pre className="font-mono text-[10px] text-emerald-400/70">
                    {`{
  "status": "success",
  "data": [
    { "id": "dev_123", "name": "Main Entrance" },
    { "id": "dev_456", "name": "Lobby" }
  ]
}`}
                  </pre>
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
