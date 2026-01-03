import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PrismIcon } from "@/components/shared/logo/PrismIcon";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 w-full h-full bg-cover bg-center overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1440&h=900&fit=crop')",
        backgroundColor: "#0b0a00"
      }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      {/* Header - Logo and Menu */}
      <div className="relative z-10 w-full">
        <div className="flex items-center justify-between px-10 py-6">
          {/* Logo */}
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

      {/* 404 Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative inline-block mb-8">
            <h1 className="text-[12rem] md:text-[20rem] font-black text-white/10 leading-none select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">Lost in Space</h2>
                <p className="text-slate-400 font-medium max-w-md mx-auto">
                  The page you are looking for has been consumed by a black hole or never existed in this dimension.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
            <button
              onClick={() => navigate("/")}
              className="px-10 py-4 bg-indigo-500 text-white font-black rounded-2xl hover:bg-indigo-400 transition-all shadow-[0_0_40px_rgba(99,102,241,0.4)] text-lg uppercase tracking-widest"
            >
              Back to Earth
            </button>
            <button
              onClick={() => navigate("/help")}
              className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all text-lg uppercase tracking-widest"
            >
              Get Rescue
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer Decoration */}
      <div className="relative z-10 p-10 flex justify-center">
        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
          Synthetic Intelligence Monitoring Active
        </div>
      </div>
    </div>
  );
}
