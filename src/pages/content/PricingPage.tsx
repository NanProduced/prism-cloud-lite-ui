import React, { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Check, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for testing and small personal projects.",
    features: ["1 Active Screen", "500MB Storage", "Standard Support", "Basic Layouts", "Manual Scheduling"],
    cta: "Start for Free",
    popular: false
  },
  {
    name: "Pro",
    price: { monthly: 29, yearly: 24 },
    description: "Everything you need to grow your digital presence.",
    features: ["Up to 10 Screens", "10GB Storage", "Priority Support", "Advanced AI Studio", "Dynamic Scheduling", "Custom Branding"],
    cta: "Start 14-day Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: { monthly: 99, yearly: 89 },
    description: "Scalable solutions for large display networks.",
    features: ["Unlimited Screens", "100GB+ Storage", "24/7 Dedicated Support", "Global CDN Access", "API Access", "SSO & Security", "Custom Contracts"],
    cta: "Contact Sales",
    popular: false
  }
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-black text-slate-50 overflow-x-hidden">
      <Navbar />

      <main className="pt-32 pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Transparent</span> Pricing
            </motion.h1>
            <p className="text-lg text-slate-400 mb-10">
              Choose the plan that's right for your business. No hidden fees.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={cn("text-sm", !isYearly ? "text-white" : "text-slate-500")}>Monthly</span>
              <Switch 
                checked={isYearly} 
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-indigo-500"
              />
              <span className={cn("text-sm", isYearly ? "text-white" : "text-slate-500")}>Yearly</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                SAVE 20%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "relative p-8 rounded-3xl border flex flex-col transition-all duration-300",
                  plan.popular 
                    ? "bg-white/[0.05] border-indigo-500/50 scale-105 z-10 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.3)]" 
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    ${isYearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-slate-500 text-sm">/per screen</span>
                </div>

                <button className={cn(
                  "w-full py-3 rounded-xl font-bold transition-all mb-8",
                  plan.popular 
                    ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25" 
                    : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                )}>
                  {plan.cta}
                </button>

                <div className="space-y-4 flex-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">What's included</div>
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3">
                      <div className="mt-1 w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Check size={10} className="text-emerald-500" />
                      </div>
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table Link */}
          <div className="mt-24 text-center">
            <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-2 mx-auto transition-colors">
              Compare all features <Info size={14} />
            </button>
          </div>

          {/* FAQ Preview */}
          <div className="mt-32 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                { q: "Can I change plans at any time?", a: "Yes, you can upgrade or downgrade your plan at any time from your dashboard." },
                { q: "Do you offer discounts for non-profits?", a: "We do! Please contact our sales team to discuss special pricing for NGOs and educational institutions." },
                { q: "What happens if I exceed my storage limit?", a: "We'll notify you when you reach 90% of your limit. You can always upgrade for more space." }
              ].map((faq, fIdx) => (
                <div key={fIdx} className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                  <p className="text-sm text-slate-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Quote CTA */}
          <div className="mt-32 p-12 rounded-[40px] bg-indigo-500 text-white overflow-hidden relative group">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Need a custom solution?</h2>
                <p className="text-indigo-100 opacity-80 max-w-md">
                  Have specific requirements or a large-scale deployment? Let's talk about a tailor-made plan for your organization.
                </p>
              </div>
              <button className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-bold hover:bg-slate-100 transition-all shadow-xl whitespace-nowrap">
                Get a Custom Quote
              </button>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-500">
              <Zap size={200} />
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
