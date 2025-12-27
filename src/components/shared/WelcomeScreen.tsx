import { useEffect, useState } from "react";
import { AppleHelloEnglishEffect } from "@lytenyte/components/apple-hello-effect";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeScreenProps {
  onComplete?: () => void;
  title?: string;
}

export const WelcomeScreen = ({ onComplete, title = "Welcome back" }: WelcomeScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // We want to show the animation for a minimum amount of time
    // The apple-hello animation takes about 7-8 seconds at speed 1.
    // Let's speed it up a bit for a better UX, say 2x.
    const timer = setTimeout(() => {
      // Allow it to finish
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleAnimationComplete = () => {
    // Small delay after animation finishes before transitioning
    setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
        >
          <div className="relative flex flex-col items-center">
            <AppleHelloEnglishEffect 
              speed={1.5} 
              className="h-32 md:h-48 text-white" 
              onAnimationComplete={handleAnimationComplete}
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="mt-8 text-white/50 text-sm tracking-[0.2em] uppercase font-light"
            >
              {title}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
