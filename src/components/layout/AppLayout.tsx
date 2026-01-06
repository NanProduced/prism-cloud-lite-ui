import { Outlet, Navigate, useLocation, useOutlet } from "react-router-dom";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { WelcomeScreen } from "@/components/shared/WelcomeScreen";
import { NotificationCenter } from "@/components/uitripled/notification-center";

import { sseManager } from "@/lib/sse-manager";
import { useMessageStore } from "@/store/messageStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useSystemStore } from "@/store/systemStore";
import MaintenancePage from "@/pages/MaintenancePage";
import i18n from "i18next";

import { PrismIcon } from "@/components/shared/logo";

// Loading Screen Component
const FullPageLoader = () => (
  <div className="min-h-screen bg-[#131619] flex items-center justify-center overflow-hidden">
    <div className="relative">
      {/* Background Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-brand-cyan/20 blur-[100px] rounded-full"
      />
      
      {/* Icon and Pulse */}
      <motion.div
        animate={{ 
          scale: [0.98, 1.02, 0.98],
          opacity: [0.9, 1, 0.9]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <PrismIcon size={64} variant="gradient" />
        <div className="flex gap-1.5 mt-2">
           {[0, 1, 2].map((i) => (
             <motion.div
               key={i}
               animate={{ opacity: [0.2, 1, 0.2] }}
               transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
               className="size-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(182,240,156,0.5)]"
             />
           ))}
        </div>
      </motion.div>
    </div>
  </div>
);

export const PublicLayout = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const { checkAuth, isInitializing } = useAuthStore();
  const { preferences } = useSettingsStore();
  const { isBackendUnreachable } = useSystemStore();
  const initialized = React.useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  if (isInitializing) return <FullPageLoader />;

  // Special case: Login/Register/Auth pages need backend
  const authRoutes = ['/login', '/register', '/forgot-password', '/auth'];
  const isAuthRoute = authRoutes.some(r => location.pathname.startsWith(r));
  if (isAuthRoute && isBackendUnreachable) {
    return <MaintenancePage />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <NotificationCenter />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.23, 1, 0.32, 1] 
          }}
          className="w-full"
        >
          {outlet}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const ProtectedLayout = () => {
    const { isAuthenticated, isInitializing, checkAuth, user } = useAuthStore();
    const { isBackendUnreachable } = useSystemStore();
    const { fetchInitialData } = useMessageStore();
    const { fetchSettings, preferences } = useSettingsStore();
    const [showWelcome, setShowWelcome] = useState(false);
    const initialized = React.useRef(false);
    
    useEffect(() => {
      console.log("[ProtectedLayout] State:", { isAuthenticated, isInitializing });
      if (!initialized.current) {
        initialized.current = true;
        checkAuth().catch(err => console.error("[ProtectedLayout] checkAuth failed:", err));
      }
    }, [checkAuth, isAuthenticated, isInitializing]);

    useEffect(() => {
      if (isAuthenticated && user?.publicId) {
        // Fetch initial notification data
        fetchInitialData();
        // Fetch user preferences
        fetchSettings();
        // Connect to SSE
        sseManager.connect(user.publicId);
      }
      return () => {
        if (!isAuthenticated) sseManager.disconnect();
      };
    }, [isAuthenticated, user?.publicId, fetchInitialData, fetchSettings]);

    useEffect(() => {
      // Show welcome screen only if authenticated and haven't seen it this session
      const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
      if (isAuthenticated && !hasSeenWelcome && !isInitializing) {
        setShowWelcome(true);
      }
    }, [isAuthenticated, isInitializing]);

    const handleWelcomeComplete = () => {
      setShowWelcome(false);
      sessionStorage.setItem('hasSeenWelcome', 'true');
    };

    if (isInitializing) return <FullPageLoader />;

    if (isBackendUnreachable) {
        return <MaintenancePage />;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            <NotificationCenter />
            <AnimatePresence>
              {showWelcome && (
                <WelcomeScreen 
                  title="Welcome back," 
                  userName={user?.displayName || "Guest"}
                  onComplete={handleWelcomeComplete} 
                />
              )}
            </AnimatePresence>
            <DashboardShell>
                <Outlet />
            </DashboardShell>
        </>
    );
};