import { Outlet, Navigate, useLocation, useOutlet } from "react-router-dom";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { WelcomeScreen } from "@/components/shared/WelcomeScreen";
import { NotificationCenter } from "@/components/uitripled/notification-center";

// Loading Screen Component
const FullPageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export const PublicLayout = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const { checkAuth, isInitializing } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isInitializing) return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-black">
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
    const [showWelcome, setShowWelcome] = useState(false);
    
    useEffect(() => {
      checkAuth();
    }, [checkAuth]);

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