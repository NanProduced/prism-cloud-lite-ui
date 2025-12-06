import React from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { UseCases } from '@/components/landing/UseCases';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <UseCases />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
