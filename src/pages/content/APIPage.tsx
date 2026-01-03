import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { 
  Terminal, 
  Copy, 
  Check, 
  ChevronRight, 
  Lock, 
  Zap, 
  Globe, 
  Cpu, 
  Monitor, 
  Layers,
  Code2,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Endpoint {
  id: string;
  method: "GET" | "POST";
  path: string;
  titleKey: string;
  descKey: string;
  curl: string;
  response: string;
}

export default function APIPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("listDevices");
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints: Endpoint[] = [
    {
      id: "listDevices",
      method: "GET",
      path: "/api/v1/devices",
      titleKey: "apiPage.endpoints.listDevices.title",
      descKey: "apiPage.endpoints.listDevices.desc",
      curl: `curl -X GET "https://api.prismcloud.io/api/v1/devices" \
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "deviceId": 10001,
      "deviceName": "Lobby Screen A",
      "onlineStatus": 1,
      "model": "DS-2000X",
      "playingProgram": "Summer Promo"
    }
  ]
}`
    },
    {
      id: "sendCommand",
      method: "POST",
      path: "/api/v1/devices/{id}/actions",
      titleKey: "apiPage.endpoints.sendCommand.title",
      descKey: "apiPage.endpoints.sendCommand.desc",
      curl: `curl -X POST "https://api.prismcloud.io/api/v1/devices/10001/actions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ 
    "type": "POWER",
    "body": { "command": "reboot" }
  }'`,
      response: `{
  "success": true,
  "data": {
    "operationId": "8f3c0d2e-3c5b-4d8c...",
    "status": "DISPATCHED",
    "accepted": true
  }
}`
    },
    {
      id: "listPrograms",
      method: "GET",
      path: "/api/v1/programs",
      titleKey: "apiPage.endpoints.listPrograms.title",
      descKey: "apiPage.endpoints.listPrograms.desc",
      curl: `curl -X GET "https://api.prismcloud.io/api/v1/programs" \
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "name": "Corporate News",
      "width": 1920,
      "height": 1080,
      "latestVersion": 5
    }
  ]
}`
    },
    {
      id: "publishProgram",
      method: "POST",
      path: "/api/v1/programs/{id}/publish",
      titleKey: "apiPage.endpoints.publishProgram.title",
      descKey: "apiPage.endpoints.publishProgram.desc",
      curl: `curl -X POST "https://api.prismcloud.io/api/v1/programs/uuid-123/publish" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ 
    "versionMode": "EXISTING",
    "existingVersion": 5,
    "scope": "SELECTED",
    "deviceIds": [10001],
    "mode": "OVERWRITE"
  }'`,
      response: `{
  "success": true,
  "data": {
    "affected": 1,
    "results": [...] 
  }
}`
    },
    {
      id: "getMetrics",
      method: "GET",
      path: "/api/v1/telemetry/sensors/series",
      titleKey: "apiPage.endpoints.getMetrics.title",
      descKey: "apiPage.endpoints.getMetrics.desc",
      curl: `curl -X GET "https://api.prismcloud.io/api/v1/telemetry/sensors/series?deviceId=10001&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "success": true,
  "data": {
    "series": [
      {
        "metricKey": "cpu_usage",
        "points": [
          { "at": "2026-01-01T12:00:00Z", "value": 42.5 }
        ]
      }
    ]
  }
}`
    }
  ];

  const activeEndpoint = endpoints.find(e => e.id === activeTab) || endpoints[0];

  return (
    <div className="min-h-screen bg-black text-slate-50 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-black uppercase tracking-widest mb-8"
            >
              <Terminal size={14} />
              API v1.0 Stable
            </motion.div>
            <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.85]">
              {t('apiPage.title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-indigo-400 animate-gradient-x">
                {t('apiPage.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto font-medium">
              {t('apiPage.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_400px] gap-12 items-start">
            
            {/* 1. Left Sidebar Navigation */}
            <aside className="lg:sticky lg:top-28 space-y-10">
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-3">
                  {t('apiPage.sidebar.gettingStarted')}
                </div>
                <div className="space-y-1">
                  <button className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-between group">
                    {t('apiPage.sidebar.authentication')}
                    <Lock size={14} className="opacity-40 group-hover:opacity-100" />
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-between group">
                    Rate Limits
                    <Zap size={14} className="opacity-40 group-hover:opacity-100" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-3">
                  {t('apiPage.sidebar.resources')}
                </div>
                <div className="space-y-1">
                  {endpoints.map((ep) => (
                    <button 
                      key={ep.id}
                      onClick={() => setActiveTab(ep.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-between group",
                        activeTab === ep.id ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {t(ep.titleKey)}
                      <ChevronRight size={14} className={cn("transition-transform", activeTab === ep.id ? "rotate-90" : "opacity-0 group-hover:opacity-100")} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#0d0d0d] border border-white/5 space-y-4">
                <div className="text-xs font-black text-white tracking-tight uppercase">SDKs & Libraries</div>
                <div className="flex gap-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                  <Globe size={20} />
                  <Cpu size={20} />
                  <Layers size={20} />
                </div>
              </div>
            </aside>

            {/* 2. Middle Content Area (Documentation) */}
            <div className="min-w-0 space-y-16">
              <AnimatePresence mode="wait">
                <motion.section 
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        activeEndpoint.method === "GET" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      )}>
                        {activeEndpoint.method}
                      </span>
                      <code className="text-indigo-400 font-mono text-sm">{activeEndpoint.path}</code>
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-white">
                      {t(activeEndpoint.titleKey)}
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed font-medium">
                      {t(activeEndpoint.descKey)}
                    </p>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-white/5">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">Query Parameters</h4>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-white">
                          <tr>
                            <th className="px-6 py-3">Parameter</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr>
                            <td className="px-6 py-4 font-mono text-indigo-400">limit</td>
                            <td className="px-6 py-4 text-slate-500 uppercase text-[10px] font-bold">Integer</td>
                            <td className="px-6 py-4 text-slate-400">Number of records to return. Max 500.</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 font-mono text-indigo-400">cursor</td>
                            <td className="px-6 py-4 text-slate-500 uppercase text-[10px] font-bold">String</td>
                            <td className="px-6 py-4 text-slate-400">Pagination marker from previous response.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.section>
              </AnimatePresence>

              {/* Static Auth Section */}
              <section className="p-10 rounded-[40px] bg-[#0d0d0d] border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Lock size={120} />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-white">{t('apiPage.auth.title')}</h3>
                <p className="text-slate-400 font-medium">
                  {t('apiPage.auth.desc')}
                </p>
                <div className="p-6 rounded-2xl bg-black border border-white/10 font-mono text-sm text-indigo-300 relative group">
                  <span className="text-slate-600 mr-2"># {t('apiPage.auth.header')}</span>
                  Authorization: Bearer <span className="text-emerald-400">pc_live_xxxxxxxxxxxxxxxxxxxx</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy("Authorization: Bearer YOUR_API_KEY")}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
                <p className="text-xs text-rose-400/70 font-bold italic flex items-center gap-2">
                  <Shield size={12} /> {t('apiPage.auth.notice')}
                </p>
              </section>
            </div>

            {/* 3. Right Sidebar (Code Snippets) */}
            <aside className="lg:sticky lg:top-28 space-y-8">
              <div className="rounded-3xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-2xl flex flex-col h-[600px]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Request (CURL)</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-500 hover:text-white"
                    onClick={() => handleCopy(activeEndpoint.curl)}
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </Button>
                </div>
                <div className="p-6 flex-1 overflow-auto bg-black/50">
                  <pre className="font-mono text-[13px] leading-relaxed text-indigo-300 whitespace-pre-wrap">
                    <code>{activeEndpoint.curl}</code>
                  </pre>
                </div>
                <div className="px-6 py-6 border-t border-white/5 bg-white/[0.01] h-[250px] overflow-auto">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4 flex items-center gap-2">
                    <Code2 size={12} /> Example Response
                  </div>
                  <pre className="font-mono text-[11px] leading-relaxed text-emerald-400/80">
                    <code>{activeEndpoint.response}</code>
                  </pre>
                </div>
              </div>

              {/* Quick Link Card */}
              <div className="p-8 rounded-[32px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 text-center group cursor-pointer hover:border-indigo-500/50 transition-all">
                <Monitor className="mx-auto mb-4 text-indigo-400 group-hover:scale-110 transition-transform" size={32} />
                <h4 className="font-bold text-white mb-2">Webhooks</h4>
                <p className="text-xs text-slate-400 font-medium">Listen for real-time events on your servers.</p>
              </div>
            </aside>

          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
