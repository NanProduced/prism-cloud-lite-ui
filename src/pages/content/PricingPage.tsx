import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/landing/Container";
import { Check, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export default function PricingPage() {
  const { t, i18n } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      id: 'FREE',
      name: t('billing.free.name'),
      description: t('billing.free.description'),
      features: t('billing.free.features', { returnObjects: true }) as string[],
      cta: t('auth.register.createFreeAccount'),
      popular: false
    },
    {
      id: 'PRO',
      name: t('billing.pro.name'),
      description: t('billing.pro.description'),
      features: t('billing.pro.features', { returnObjects: true }) as string[],
      cta: t('billing.pro.button'),
      popular: true
    },
    {
      id: 'ULTRA',
      name: t('billing.ultra.name'),
      description: t('billing.ultra.description'),
      features: t('billing.ultra.features', { returnObjects: true }) as string[],
      cta: t('billing.ultra.button'),
      popular: false
    }
  ];

  const faqs = t('billing.faqs', { returnObjects: true }) as { q: string, a: string }[];

  const isZh = i18n.language.startsWith('zh');

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
              {t('billing.header').split(',')[0].trim()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{(t('billing.header').split(',')[1] || 'Transparent').trim()}</span>
            </motion.h1>
            <p className="text-lg text-slate-400 mb-10">
              {t('billing.headerDesc')}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={cn("text-sm", !isYearly ? "text-white" : "text-slate-500")}>{t('billing.monthly')}</span>
              <Switch 
                checked={isYearly} 
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-indigo-500"
              />
              <span className={cn("text-sm", isYearly ? "text-white" : "text-slate-500")}>{t('billing.yearly')}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                {t('billing.savePercent')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, idx) => {
              let priceDisplay = '';
              if (plan.id === 'FREE') {
                priceDisplay = t('billing.free.price');
              } else if (plan.id === 'PRO') {
                priceDisplay = isYearly ? t('billing.pro.priceYearly') : t('billing.pro.price');
              } else {
                priceDisplay = t('billing.ultra.price');
              }
              
              const isCustom = plan.id === 'ULTRA';

              return (
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
                      {priceDisplay}
                    </span>
                    {!isCustom && <span className="text-slate-500 text-sm">/{t('billing.pro.period')?.replace('/', '') || 'mo'}</span>}
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
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('billing.whatsIncluded')}</div>
                    {Array.isArray(plan.features) && plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3">
                        <div className="mt-1 w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <Check size={10} className="text-emerald-500" />
                        </div>
                        <span className="text-sm text-slate-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Comparison Table Link */}
          <div className="mt-24 text-center">
            <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-2 mx-auto transition-colors">
              {t('billing.compareFeatures')} <Info size={14} />
            </button>
          </div>

          {/* AI Assistant Comparison Table */}
          <div className="mt-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">{t('billing.aiComparison.title')}</h2>
              <p className="text-slate-400">{t('billing.aiComparison.subtitle')}</p>
            </div>
            
            <div className="max-w-5xl mx-auto overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest">{t('billing.aiComparison.columns.feature')}</th>
                      <th className="p-6 text-sm font-bold text-slate-400 uppercase tracking-widest text-center">{t('billing.aiComparison.columns.freeLocal')}</th>
                      <th className="p-6 text-sm font-bold text-indigo-400 uppercase tracking-widest text-center">{t('billing.aiComparison.columns.pro')}</th>
                      <th className="p-6 text-sm font-bold text-emerald-400 uppercase tracking-widest text-center">{t('billing.aiComparison.columns.freeByok')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { key: 'memory', free: 'msg10', pro: 'msg30', byok: 'msg30' },
                      { key: 'rag', free: 'rag4', pro: 'rag8', byok: 'rag8' },
                      { key: 'agent', free: 'basic', pro: 'advanced', byok: 'advanced' },
                      { key: 'quota', free: 'limit20k', pro: 'unlimited', byok: 'notApplicable' },
                    ].map((row) => (
                      <tr key={row.key} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-6">
                          <div className="font-bold text-white">{t(`billing.aiComparison.features.${row.key}`)}</div>
                          <div className="text-xs text-slate-500">{t(`billing.aiComparison.features.${row.key}Desc`)}</div>
                        </td>
                        <td className="p-6 text-center text-slate-300">{t(`billing.aiComparison.values.${row.free}`)}</td>
                        <td className="p-6 text-center text-indigo-200 font-medium">{t(`billing.aiComparison.values.${row.pro}`)}</td>
                        <td className="p-6 text-center text-emerald-200 font-medium">{t(`billing.aiComparison.values.${row.byok}`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-indigo-500/5 border-t border-white/5">
                <p className="text-sm text-indigo-300 flex items-center gap-2">
                  <Zap size={14} className="fill-indigo-500" />
                  {t('billing.aiComparison.byokNotice')}
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Preview */}
          {Array.isArray(faqs) && faqs.length > 0 && (
            <div className="mt-32 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">{t('billing.faqTitle')}</h2>
              <div className="space-y-6">
                {faqs.map((faq, fIdx) => (
                  <div key={fIdx} className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <h4 className="font-bold text-white mb-2">{faq.q}</h4>
                    <p className="text-sm text-slate-400">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Quote CTA */}
          <div className="mt-32 p-12 rounded-[40px] bg-indigo-500 text-white overflow-hidden relative group">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">{t('billing.customQuoteTitle')}</h2>
                <p className="text-indigo-100 opacity-80 max-w-md">
                  {t('billing.customQuoteDesc')}
                </p>
              </div>
              <button className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-bold hover:bg-slate-100 transition-all shadow-xl whitespace-nowrap">
                {t('billing.getCustomQuote')}
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
