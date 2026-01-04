import React, { useState, useMemo } from 'react';
import { Bot, Key, Check, Plus, Trash2, ShieldCheck, ExternalLink, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/store/notificationStore';
import { 
  getAIModelConfigs, 
  upsertAIModelConfig, 
  setDefaultAIProvider, 
  deleteAIModelConfig,
  type AIModelConfig 
} from '@/services/aiAssistantApi';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/registry/new-york/ui/card';
import { Button } from '@/registry/new-york/ui/button';
import { Input } from '@/registry/new-york/ui/input';
import { Label } from '@/registry/new-york/ui/label';
import { Badge } from '@/registry/new-york/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/registry/new-york/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/new-york/ui/select';
import { Switch } from '@/registry/new-york/ui/switch';
import { Separator } from '@/registry/new-york/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { useTranslation } from 'react-i18next';

export default function SettingsAIAssistant() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form State
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [makeDefault, setMakeDefault] = useState(false);

  // --- Queries ---
  const { data: configsRes, isLoading } = useQuery({
    queryKey: ['ai-assistant', 'configs'],
    queryFn: getAIModelConfigs,
  });

  const configs = configsRes?.data || [];

  // --- Mutations ---
  const upsertMutation = useMutation({
    mutationFn: upsertAIModelConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-assistant', 'configs'] });
      toast.success(t('settings.aiAssistant.dialog.success'));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || t('settings.aiAssistant.dialog.error'));
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAIProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-assistant', 'configs'] });
      toast.success(t('settings.aiAssistant.dialog.success'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAIModelConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-assistant', 'configs'] });
      toast.success(t('settings.aiAssistant.removed'));
    },
  });

  const resetForm = () => {
    setProvider('openai');
    setModel('gpt-4o-mini');
    setApiKey('');
    setEnabled(true);
    setMakeDefault(false);
  };

  const handleEdit = (config: AIModelConfig) => {
    setProvider(config.provider);
    setModel(config.model);
    setApiKey(''); // API Key is write-only
    setEnabled(config.enabled);
    setMakeDefault(config.isDefault);
    setIsDialogOpen(true);
  };

  const providers = useMemo(() => [
    { id: 'local-vllm', name: t('settings.aiAssistant.providers.localVllm'), models: ['default'] },
    { id: 'openai', name: t('settings.aiAssistant.providers.openai'), models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
    { id: 'gemini', name: t('settings.aiAssistant.providers.gemini'), models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
  ], [t]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">{t('settings.aiAssistant.loading')}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>{t('settings.aiAssistant.title')}</CardTitle>
              <CardDescription>
                {t('settings.aiAssistant.subtitle')}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> {t('settings.aiAssistant.addProvider')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('settings.aiAssistant.dialog.title')}</DialogTitle>
                  <DialogDescription>
                    {t('settings.aiAssistant.dialog.desc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="provider">{t('settings.aiAssistant.dialog.provider')}</Label>
                    <Select value={provider} onValueChange={setProvider}>
                      <SelectTrigger id="provider">
                        <SelectValue placeholder={t('settings.deviceDefaults.timezone.selectPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {provider !== 'local-vllm' && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="model">{t('settings.aiAssistant.dialog.model')}</Label>
                        <Select value={model} onValueChange={setModel}>
                          <SelectTrigger id="model">
                            <SelectValue placeholder={t('settings.deviceDefaults.timezone.selectPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.find(p => p.id === provider)?.models.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="apiKey">{t('settings.aiAssistant.dialog.apiKey')}</Label>
                        <Input 
                          id="apiKey" 
                          type="password" 
                          placeholder="sk-..." 
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                          {t('settings.aiAssistant.dialog.apiKeyHint')}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">{t('settings.aiAssistant.dialog.defaultProvider')}</Label>
                      <p className="text-xs text-muted-foreground">{t('settings.aiAssistant.dialog.defaultProviderDesc')}</p>
                    </div>
                    <Switch 
                      checked={makeDefault} 
                      onCheckedChange={setMakeDefault} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('common.actions.cancel')}</Button>
                  <Button 
                    onClick={() => upsertMutation.mutate({
                      provider,
                      model,
                      apiKey: apiKey || undefined,
                      enabled,
                      makeDefault
                    })}
                    disabled={upsertMutation.isPending}
                  >
                    {upsertMutation.isPending ? t('settings.aiAssistant.dialog.saving') : t('common.actions.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">{t('settings.aiAssistant.proTipTitle')}</AlertTitle>
            <AlertDescription className="text-xs">
              {t('settings.aiAssistant.proTipDesc')}
            </AlertDescription>
          </Alert>

          <div className="rounded-md border">
            {configs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground italic">
                {t('settings.aiAssistant.noProviders')}
              </div>
            ) : (
              <div className="divide-y">
                {configs.map((config) => (
                  <div key={config.provider} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium capitalize">{config.provider === 'local-vllm' ? t('settings.aiAssistant.providers.localName') : config.provider}</p>
                          {config.isDefault && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] hover:bg-emerald-500/20">
                              {t('hero.miniDashboard.programs.published')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('programEditor.panels.inspector.program')}: <span className="font-mono">{config.model}</span>
                          {config.hasApiKey && ` • Key ending in ${config.apiKeyLast4}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!config.isDefault && (
                        <Button variant="ghost" size="sm" onClick={() => setDefaultMutation.mutate(config.provider)}>
                          {t('settings.aiAssistant.setDefault')}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(config)}>
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(config.provider)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 p-4 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('settings.aiAssistant.keysSecure')}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
