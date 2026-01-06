import { motion } from "framer-motion";
import { PrismIcon } from "@/components/shared/logo/PrismIcon";
import { RefreshCw, MessageCircle, WifiOff } from "lucide-react";
import { useSystemStore } from "@/store/systemStore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { checkHealth } = useSystemStore();
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const isAlive = await checkHealth();
      if (isAlive) {
        // If it's back, try to go home or let the reactive state update
        window.location.reload();
      }
    } finally {
      setTimeout(() => setIsChecking(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-cover bg-center overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('/images/maintenance-bg.jpg')",
        backgroundColor: "#0b0a00"
      }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      {/* Header - Logo */}
      <div className="relative z-10 w-full">
        <div className="flex items-center justify-between px-10 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <PrismIcon size={32} variant="gradient" />
            <span className="text-white text-xl font-black tracking-tighter">Prism Cloud</span>
          </motion.div>
        </div>
      </div>

      {/* Maintenance Content - Matching 404 Scale Exactly */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative inline-block mb-8">
            {/* Background large text like '404' */}
            <h1 className="text-[10rem] md:text-[18rem] font-black text-white/5 leading-none select-none tracking-tighter uppercase">Offline</h1>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-4">
                <div className="flex justify-center mb-2">
                   <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <WifiOff className="h-10 w-10 text-amber-500/80" />
                   </div>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-tight">
                  后端服务未启动<br/>
                  <span className="text-2xl md:text-4xl opacity-60 not-italic font-medium block mt-2">Backend Service Offline</span>
                </h2>
                <p className="text-slate-400 font-medium max-w-lg mx-auto mt-6">
                  检测到无法连接到本地网关或后端服务。请确保后端程序已正常运行且网络通道（如 FRP/Proxy）已开启。
                  <span className="block text-sm opacity-50 mt-1 font-normal italic">
                    Cannot reach the backend gateway. Please ensure services are running and your proxy/tunnel is active.
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
            <button
              onClick={handleRetry}
              disabled={isChecking}
              className="px-10 py-4 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-400 transition-all shadow-[0_0_40px_rgba(245,158,11,0.3)] text-lg uppercase tracking-widest flex items-center gap-3 disabled:opacity-50"
            >
              <RefreshCw className={isChecking ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
              {isChecking ? "检测中 / Pinging..." : "重试连接 / Retry Connection"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all text-lg uppercase tracking-widest"
            >
              返回首页 / Back Home
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer Decoration */}
      <div className="relative z-10 p-10 flex justify-center">
        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
           Automated Sentinel Protocol Active
        </div>
      </div>
    </div>
  );
}
