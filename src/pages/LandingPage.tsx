import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DesignerCardSplash } from '@/components/landing/DesignerCardSplash';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FeatureSection } from '@/components/landing/FeatureSection';
import { AIFeatureSection } from '@/components/landing/AIFeatureSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { AppFeatures } from '@/components/landing/AppFeatures';
import { Testimonials } from '@/components/landing/Testimonials';
import { Integrations } from '@/components/landing/Integrations';
import { BlogSection } from '@/components/landing/BlogSection';
import { UseCases } from '@/components/landing/UseCases';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash if it hasn't been shown in this session
    return !window.sessionStorage.getItem('landing_splash_shown');
  });

  const handleSplashComplete = () => {
    window.sessionStorage.setItem('landing_splash_shown', 'true');
    setShowSplash(false);
  };

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <DesignerCardSplash
          key="designer-splash"
          duration={2500}
          onComplete={handleSplashComplete}
        />
      ) : (
        <motion.div
          key="landing-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="min-h-screen bg-black text-slate-50 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200"
        >
          <Navbar />
          <main>
            <Hero />
            <AppFeatures />
            <FeatureSection />
            <AIFeatureSection />
            <StatsSection />
            <Testimonials />
            <Integrations />
            <BlogSection />
            <UseCases />
            <CTA />
          </main>
          <Footer />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
