import { useNavigate, useRouteError } from "react-router-dom";
import { motion } from "framer-motion";
import { PrismIcon } from "@/components/shared/logo/PrismIcon";
import { useTranslation } from "react-i18next";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError() as any;
  const { t } = useTranslation();

  console.error(error);

  return (
    <div className="fixed inset-0 w-full h-full bg-cover bg-center overflow-hidden flex flex-col"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1440&h=900&fit=crop')",
        backgroundColor: "#0b0a00"
      }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[4px]" />

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

      {/* Error Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <div className="mb-8 inline-flex p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
            <AlertCircle className="h-16 w-16 text-rose-500" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase mb-4">
            {t('common.errors.systemAnomaly')}
          </h1>
          
          <p className="text-xl text-slate-400 font-medium mb-8">
            {error?.statusText || error?.message || t('common.errors.unexpectedError')}
          </p>

          {error?.stack && (
             <div className="mb-10 p-4 rounded-xl bg-black/40 border border-white/5 text-left overflow-hidden">
                <p className="text-[10px] font-mono text-rose-400/60 break-all line-clamp-3 italic">
                   {error.stack}
                </p>
             </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              {t('common.errors.reloadCore')}
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              <Home className="h-4 w-4" />
              {t('common.errors.returnHome')}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer Decoration */}
      <div className="relative z-10 p-10 flex justify-center">
        <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
          {t('common.errors.recoveryActive')}
        </div>
      </div>
    </div>
  );
}
