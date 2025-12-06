import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PrismIcon } from "@/components/shared/logo/PrismIcon";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1440&h=900&fit=crop')",
        backgroundColor: "#0b0a00"
      }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 mix-blend-multiply" />

      {/* Header - Logo and Menu */}
      <div className="relative z-10">
        <div className="flex items-center justify-between px-10 py-6 border-b border-white/10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="h-6 flex items-center gap-2"
          >
            <div className="h-6 w-6 flex items-center justify-center">
              <PrismIcon size={24} variant="gradient" />
            </div>
            <span className="text-gray-300 font-semibold">Prism Cloud</span>
          </motion.div>

          {/* Menu */}
          <div className="flex items-center gap-8">
            <nav className="flex gap-8">
              <a href="/" className="text-white/70 hover:text-white transition-colors font-semibold text-sm">
                About
              </a>
              <a href="/" className="text-white/70 hover:text-white transition-colors font-semibold text-sm">
                Products
              </a>
              <a href="/" className="text-white/70 hover:text-white transition-colors font-semibold text-sm">
                Pricing
              </a>
              <a href="/" className="text-white/70 hover:text-white transition-colors font-semibold text-sm">
                Login
              </a>
            </nav>
            <button className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 19a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 110-12 6 6 0 010 12zm3.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 404 Content */}
      <div className="relative z-10 h-screen flex flex-col items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* 404 Number */}
          <div className="mb-4">
            <h1 className="text-9xl font-bold text-white drop-shadow-lg">404</h1>
          </div>

          {/* Error Message */}
          <p className="text-2xl text-white mb-12 font-light tracking-wide">
            Sorry, we were unable to find that page
          </p>

          {/* Search Bar */}
          <div className="flex justify-center mb-12">
            <div className="w-96 relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-6 py-3 bg-white/10 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors backdrop-blur-sm"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11 19a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 110-12 6 6 0 010 12zm3.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go Back Home
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
