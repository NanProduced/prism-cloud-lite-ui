import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: number; // Size in pixels
  variant?: "icon" | "full"; // icon only or icon + text
}

export const Logo = ({ className = "", size = 40, variant = "full" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Style 3: Luminescence Logo */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Glow Effect */}
        <motion.div 
            initial={{ opacity: 0.5, scale: 0.8 }}
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-indigo-500/40 blur-xl rounded-full" 
        />
        
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full relative z-10 drop-shadow-lg">
            <defs>
            <linearGradient id="mainGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#a855f7"/>
            </linearGradient>
            </defs>
            {/* Glassy Triangle (Play Button) */}
            <path d="M25 20 L80 50 L25 80 Z" fill="url(#mainGrad)" fillOpacity="0.8" stroke="url(#mainGrad)" strokeWidth="2"/>
            {/* Internal Refraction Lines (Bright) */}
            <path d="M25 35 L50 50 L25 65" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6"/>
            <path d="M50 50 L75 50" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
        </svg>
      </div>

      {variant === "full" && (
        <span className="font-bold text-xl tracking-tight text-white select-none">
          Prism<span className="text-indigo-400">Cloud</span>
        </span>
      )}
    </div>
  );
};
