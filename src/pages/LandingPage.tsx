import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DesignerCardSplash } from '@/components/landing/DesignerCardSplash';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FeatureSection } from '@/components/landing/FeatureSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { AppFeatures } from '@/components/landing/AppFeatures';
import { Testimonials } from '@/components/landing/Testimonials';
import { Integrations } from '@/components/landing/Integrations';
import { BlogSection } from '@/components/landing/BlogSection';
import { UseCases } from '@/components/landing/UseCases';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AnimatePresence mode="wait">
      {showSplash && (
        <DesignerCardSplash
          key="designer-splash"
          duration={2500}
          onComplete={() => setShowSplash(false)}
        />
      )}

      {!showSplash && (
        <motion.div
          key="landing-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="min-h-screen bg-black text-slate-50 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200"
        >
          <Navbar />
          <main>
            <Hero />
            <FeatureSection />
            <StatsSection />
            <AppFeatures />
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
