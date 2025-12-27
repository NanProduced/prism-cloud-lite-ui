import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  Check, 
  CreditCard, 
  Zap, 
  ShieldCheck, 
  Clock, 
  History,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/registry/new-york/ui/button";
import { Badge } from "@/registry/new-york/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/registry/new-york/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/registry/new-york/ui/dialog";
import { Input } from "@/registry/new-york/ui/input";
import { Label } from "@/registry/new-york/ui/label";
import { toast } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import { 
  getUserSubscription, 
  redeemSubscriptionCode, 
  getSubscriptionHistory 
} from "@/services/userApi";
import type { SubscriptionSnapshot, SubscriptionHistoryItem, SubscriptionTier } from "@/types/user";
import { cn } from "@/lib/utils";

export default function BillingPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, historyRes] = await Promise.all([
        getUserSubscription(),
        getSubscriptionHistory({ page: 0, size: 10 })
      ]);
      
      if (subRes.success) setSubscription(subRes.data);
      if (historyRes.success && historyRes.data) setHistory(historyRes.data.items || []);
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    
    setIsRedeeming(true);
    try {
      const response = await redeemSubscriptionCode({ code: redeemCode.trim() });
      if (response.success && response.data) {
        toast.success(t('billing.redeem.success'));
        // Success with re-login guidance
        toast.info(t('billing.reloginNotice'), { duration: 8000 });
        setSubscription(response.data);
        setIsRedeemOpen(false);
        setRedeemCode("");
        // Refresh history
        const histRes = await getSubscriptionHistory({ page: 0, size: 10 });
        if (histRes.success && histRes.data) setHistory(histRes.data.items || []);
      } else {
        toast.error(t('billing.redeem.error'));
      }
    } catch (error) {
      toast.error(t('auth.errors.networkError'));
    } finally {
      setIsRedeeming(false);
    }
  };

  const tiers = [
    {
      id: 'FREE' as SubscriptionTier,
      name: t('billing.free.name'),
      price: t('billing.free.price'),
      description: t('billing.free.description'),
      features: t('billing.free.features', { returnObjects: true }) as string[],
      buttonText: t('auth.register.createFreeAccount'),
      disabled: subscription?.tier === 'FREE',
      popular: false
    },
    {
      id: 'PRO' as SubscriptionTier,
      name: t('billing.pro.name'),
      price: t('billing.pro.price'),
      period: t('billing.pro.period'),
      description: t('billing.pro.description'),
      features: t('billing.pro.features', { returnObjects: true }) as string[],
      buttonText: t('billing.pro.button'),
      disabled: subscription?.tier === 'PRO',
      popular: true
    },
    {
      id: 'ULTRA' as SubscriptionTier,
      name: t('billing.ultra.name'),
      price: t('billing.ultra.price'),
      description: t('billing.ultra.description'),
      features: (t('billing.ultra.features', { returnObjects: true }) || []) as string[],
      buttonText: t('billing.ultra.button'),
      disabled: subscription?.tier === 'ULTRA',
      popular: false
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('billing.title')}</h1>
        <p className="text-muted-foreground">{t('billing.subtitle')}</p>
      </div>

      {/* Current Plan Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('billing.currentPlan')}</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{subscription?.tier || 'FREE'}</h2>
                  {subscription?.proActive && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none">Active</Badge>
                  )}
                </div>
                {subscription?.endAt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('billing.expiresAt', { date: formatDate(subscription.endAt) })}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <Zap className="w-4 h-4" />
                    {t('billing.redeem.button')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('billing.redeem.title')}</DialogTitle>
                    <DialogDescription>{t('billing.redeem.description')}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">{t('billing.redeem.placeholder')}</Label>
                      <Input 
                        id="code" 
                        placeholder="PRDEMO-XXXX-XXXX" 
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRedeemOpen(false)}>
                      {t('auth.common.back')}
                    </Button>
                    <Button 
                      onClick={handleRedeem} 
                      disabled={isRedeeming || !redeemCode.trim()}
                    >
                      {isRedeeming ? t('billing.redeem.submitting') : t('billing.redeem.button')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => toast.info("Coming Soon")}>
                {t('footer.contact')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier, idx) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={cn(
              "h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden",
              tier.popular ? "border-primary ring-1 ring-primary" : "border-border",
              subscription?.tier === tier.id && "bg-muted/30"
            )}>
              {tier.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{tier.description}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {Array.isArray(tier.features) && tier.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 rounded-full p-0.5 bg-emerald-500/10 text-emerald-500">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={tier.popular ? "default" : "outline"}
                  disabled={tier.disabled}
                  onClick={() => {
                    if (tier.id === 'PRO') setIsRedeemOpen(true);
                    else if (tier.id === 'ULTRA') window.open("mailto:sales@prismcloud.dev");
                    else toast.info("You are already on this plan");
                  }}
                >
                  {subscription?.tier === tier.id ? t('billing.currentPlan') : tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Help Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Card className="bg-slate-50 border-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Need help with plans?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Compare our features in detail or speak with a solution expert to find the right fit for your organization.
            </p>
            <Button variant="link" className="p-0 h-auto gap-2 text-primary font-semibold">
              View Feature Comparison <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-lg">About Demo Environment</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This is a demonstration environment. Real payments are disabled. Use demo codes like <strong>PRDEMO30D</strong> to test Pro features.
            </p>
            <Button variant="link" className="p-0 h-auto gap-2 text-amber-600 font-semibold" onClick={() => setIsRedeemOpen(true)}>
              Redeem a code now <Zap className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      {history.length > 0 && (
        <div className="space-y-4 pt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5" />
              Redemption History
            </h3>
          </div>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4 font-medium">{item.type}</td>
                    <td className="px-4 py-4 font-mono text-xs">{item.code || '-'}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {item.success ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100">Success</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100">Failed</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
