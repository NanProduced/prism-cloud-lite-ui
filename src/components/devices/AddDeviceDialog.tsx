import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createDevice } from '@/services/deviceApi';
import { toast } from 'sonner';
import { Loader2, Copy, Check, Eye, EyeOff, ShieldAlert } from 'lucide-react';

const generateRandomAccount = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'dev';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateRandomPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const formSchema = (t: any) => z.object({
  displayName: z.string().min(1, t('auth.errors.allFieldsRequired')).max(64),
  account: z.string().min(8, t('devices.dialogs.add.deviceAccountPlaceholder')).max(64),
  password: z.string().min(12, t('devices.dialogs.add.devicePasswordPlaceholder')).max(64),
  description: z.string().max(128).optional(),
});

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddDeviceDialog({ open, onOpenChange, onSuccess }: AddDeviceDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [createdData, setCreatedData] = useState<{ account: string; password?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      displayName: '',
      account: '',
      password: '',
      description: '',
    },
  });

  // Pre-generate credentials when dialog opens
  useEffect(() => {
    if (open && !createdData) {
      form.reset({
        displayName: '',
        account: generateRandomAccount(),
        password: generateRandomPassword(),
        description: '',
      });
    }
  }, [open, createdData, form]);

  const onSubmit = async (values: z.infer<ReturnType<typeof formSchema>>) => {
    setIsLoading(true);
    try {
      const response = await createDevice(values);
      if (response.success && response.data) {
        toast.success(t('media.explorer.toasts.createSuccess'));
        setCreatedData({
          account: response.data.deviceAccount,
          password: response.data.devicePassword,
        });
        onSuccess?.();
      } else {
        toast.error(response.error?.message || t('common.errors.unknown'));
      }
    } catch (error) {
      toast.error(t('common.errors.unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.info(t('common.toasts.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setCreatedData(null);
      form.reset();
      setShowPassword(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isLoading && (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="sm:max-w-[520px] !p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background">
        {!createdData ? (
          <div className="flex flex-col">
            <div className="px-8 py-6 border-b bg-muted/10">
              <DialogHeader className="space-y-1.5 mb-0">
                <DialogTitle className="text-xl font-bold tracking-tight">{t('devices.dialogs.add.title')}</DialogTitle>
                <DialogDescription className="text-sm">
                  {t('devices.dialogs.add.description')}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground ml-0.5">{t('devices.dialogs.add.displayName')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('devices.dialogs.add.displayNamePlaceholder')} className="h-11 rounded-xl bg-muted/5 border-muted-foreground/20 focus-visible:ring-primary/30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="account"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-muted-foreground ml-0.5">{t('devices.dialogs.add.deviceAccount')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('devices.dialogs.add.deviceAccountPlaceholder')} className="h-11 rounded-xl bg-muted/5 border-muted-foreground/20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-muted-foreground ml-0.5">{t('devices.dialogs.add.devicePassword')}</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder={t('devices.dialogs.add.devicePasswordPlaceholder')} 
                                className="h-11 rounded-xl bg-muted/5 border-muted-foreground/20 pr-10 font-mono"
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground group-focus-within:text-primary"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground ml-0.5">{t('devices.dialogs.add.description')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('devices.dialogs.add.descriptionPlaceholder')} 
                            className="resize-none rounded-xl bg-muted/5 border-muted-foreground/20 min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading} className="rounded-xl h-11 px-6">
                      {t('devices.dialogs.add.cancel')}
                    </Button>
                    <Button type="submit" disabled={isLoading} className="rounded-xl h-11 px-8 bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('devices.dialogs.add.create')}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="px-8 py-12 flex flex-col items-center text-center bg-muted/5">
              <div className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 flex mb-6">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <DialogHeader className="space-y-2 mb-0">
                <DialogTitle className="text-2xl font-bold text-center">{t('devices.dialogs.add.success.title')}</DialogTitle>
                <DialogDescription className="text-center text-base max-w-[320px]">
                  {t('devices.dialogs.add.success.description')}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-8 pb-8 space-y-6">
              <div className="rounded-2xl border bg-muted/20 overflow-hidden">
                <div className="p-5 space-y-5">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground tracking-widest ml-0.5">{t('devices.dialogs.add.success.account')}</p>
                    <div className="flex items-center justify-between gap-3 bg-background rounded-xl border border-muted p-1 pr-1 pl-4">
                      <code className="text-sm font-bold font-mono">{createdData.account}</code>
                      <Button variant="secondary" size="icon" className="h-9 w-9 rounded-lg" onClick={() => handleCopy(createdData.account)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground tracking-widest ml-0.5">{t('devices.dialogs.add.success.password')}</p>
                    <div className="flex items-center justify-between gap-3 bg-background rounded-xl border border-muted p-1 pr-1 pl-4">
                      <code className="text-sm font-bold font-mono truncate">
                        {showPassword ? createdData.password : '••••••••••••••••'}
                      </code>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="secondary" size="icon" className="h-9 w-9 rounded-lg" onClick={() => handleCopy(createdData.password || '')}>
                          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
                <p className="text-xs text-rose-950/70 leading-relaxed font-medium">
                  {t('devices.dialogs.add.success.warning')}
                </p>
              </div>

              <Button className="w-full h-12 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-bold shadow-xl mt-4" onClick={handleClose}>
                {t('devices.dialogs.add.success.confirm')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
