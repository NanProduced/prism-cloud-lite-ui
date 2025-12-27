import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Zap, 
  ArrowRight,
  Loader2,
  Check
} from "lucide-react";
import { Button } from "@/registry/new-york/ui/button";
import { 
  Dialog, 
  DialogContent,
} from "@/registry/new-york/ui/dialog";
import { Input } from "@/registry/new-york/ui/input";
import { Label } from "@/registry/new-york/ui/label";
import { Badge } from "@/registry/new-york/ui/badge";
import { toast } from "@/store/notificationStore";
import { 
  getUserSubscription, 
  redeemSubscriptionCode 
} from "@/services/userApi";
import type { SubscriptionSnapshot } from "@/types/user";
import HexTaBillingPlanSelector, { type SelectablePlan } from "@lytenyte/components/ui/billing-plan-selector";

interface BillingPlanSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillingPlanSelector({ open, onOpenChange }: BillingPlanSelectorProps) {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showRedeemInput, setShowRedeemInput] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    if (open) {
      const fetchSubscription = async () => {
        setLoading(true);
        try {
          const res = await getUserSubscription();
          if (res.success && res.data) setSubscription(res.data);
        } catch (error) {
          console.error("Failed to fetch subscription:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchSubscription();
    }
  }, [open]);

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setIsRedeeming(true);
    try {
      const res = await redeemSubscriptionCode({ code: redeemCode.trim() });
      if (res.success && res.data) {
        toast.success(t('billing.redeem.success'));
        // Success with re-login guidance
        toast.info(t('billing.reloginNotice'), { duration: 8000 });
        setSubscription(res.data);
        setShowRedeemInput(false);
        setRedeemCode("");
      } else {
        toast.error(t('billing.redeem.error'));
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
    } finally {
      setIsRedeeming(false);
    }
  };

  const plans: SelectablePlan[] = [
    {
      id: 'FREE',
      name: t('billing.free.name'),
      description: t('billing.free.description'),
      price: { monthly: 0, annual: 0 },
      features: ((t('billing.free.features', { returnObjects: true }) as string[]) || []).map((f: string) => ({ name: f, included: true })),
      isCurrent: subscription?.tier === 'FREE',
      ctaLabel: t('billing.currentPlan'),
      disabled: subscription?.tier === 'FREE'
    },
    {
      id: 'PRO',
      name: t('billing.pro.name'),
      description: t('billing.pro.description'),
      price: { monthly: 29, annual: 290 },
      features: ((t('billing.pro.features', { returnObjects: true }) as string[]) || []).map((f: string) => ({ name: f, included: true })),
      isPopular: true,
      isCurrent: subscription?.tier === 'PRO',
      ctaLabel: subscription?.tier === 'PRO' ? t('billing.currentPlan') : t('billing.pro.button'),
      disabled: false
    },
    {
      id: 'ULTRA',
      name: t('billing.ultra.name'),
      description: t('billing.ultra.description'),
      price: { monthly: 0, annual: 0 },
      customPriceLabel: t('billing.ultra.price'),
      features: ((t('billing.ultra.features', { returnObjects: true }) as string[]) || []).map((f: string) => ({ name: f, included: true })),
      isCurrent: subscription?.tier === 'ULTRA',
      ctaLabel: t('billing.ultra.button'),
      disabled: false
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 overflow-hidden border-none bg-transparent shadow-none sm:max-w-[1100px]">
        <div className="bg-background rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col md:flex-row h-full min-h-[700px]">
          
          {/* Left Panel: Sidebar Info */}
          <div className="w-full md:w-[320px] bg-muted/30 p-8 flex flex-col border-b md:border-b-0 md:border-r border-border">
            <div className="mb-10">
              <Badge variant="outline" className="mb-4 bg-background px-3 py-1 text-xs font-semibold rounded-full border-primary/20 text-primary">
                PRISM CLOUD LITE
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight mb-3">Subscription</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Unlock full potential of your digital presence with our premium plans.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-background border border-border shadow-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{t('billing.currentPlan')}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xl">{subscription?.tier || 'FREE'}</span>
                  {subscription?.proActive && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-none px-2.5 py-0.5">Active</Badge>
                  )}
                </div>
                {subscription?.endAt && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {t('billing.expiresAt', { date: new Date(subscription.endAt).toLocaleDateString() })}
                  </p>
                )}
              </div>

              {!showRedeemInput ? (
                <Button 
                  variant="ghost" 
                  className="w-full justify-between group rounded-xl h-12 px-5 bg-background border border-border hover:border-primary/30 transition-all shadow-sm"
                  onClick={() => setShowRedeemInput(true)}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{t('billing.redeem.title')}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-5 rounded-2xl bg-background border border-primary/20 shadow-lg"
                >
                  <Label htmlFor="selector-code" className="text-xs font-bold text-primary">{t('billing.redeem.placeholder')}</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="selector-code"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                      className="h-10 rounded-xl font-mono text-sm border-primary/20"
                      placeholder="PRDEMO-XXXX"
                      autoFocus
                    />
                    <Button 
                      className="h-10 rounded-xl px-4 shrink-0 shadow-sm"
                      onClick={handleRedeem}
                      disabled={isRedeeming || !redeemCode.trim()}
                    >
                      {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </Button>
                  </div>
                  <button className="text-[11px] text-muted-foreground hover:text-primary transition-colors underline underline-offset-4" onClick={() => setShowRedeemInput(false)}>
                    {t('auth.common.back')}
                  </button>
                </motion.div>
              )}
            </div>

            <div className="mt-auto pt-10">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-primary/80 font-medium">
                  Need help? Contact our support for custom enterprise solutions.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: HexTaUI Plan Selector */}
          <div className="flex-1 p-10 overflow-y-auto bg-background">
            <HexTaBillingPlanSelector 
              plans={plans}
              selectedPlanId={subscription?.tier}
              billingPeriod={billingPeriod}
              onBillingPeriodChange={setBillingPeriod}
              onPlanSelect={(id) => {
                if (id === 'PRO') setShowRedeemInput(true);
                else if (id === 'ULTRA') window.open("mailto:sales@prismcloud.dev");
              }}
              showAnnualSavings={true}
              layout="grid"
              className="max-w-none"
            />
            
            <div className="mt-12 flex items-center justify-center gap-4 text-[11px] text-muted-foreground border-t pt-8">
              <span>Secure Payment</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
              <span>Cancel Anytime</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}