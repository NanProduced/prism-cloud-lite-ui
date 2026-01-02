import React, { useState } from 'react';
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

export default function SettingsAIAssistant() {
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
      toast.success('AI Model configuration saved');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save configuration');
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAIProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-assistant', 'configs'] });
      toast.success('Default provider updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAIModelConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-assistant', 'configs'] });
      toast.success('Configuration removed');
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

  const providers = [
    { id: 'local-vllm', name: 'Prism Local (VLLM)', models: ['default'] },
    { id: 'openai', name: 'OpenAI (BYOK)', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
    { id: 'gemini', name: 'Google Gemini (BYOK)', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
  ];

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading AI configurations...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>AI Assistant Settings</CardTitle>
              <CardDescription>
                Configure the LLM models that power your AI Assistant. You can use our built-in engine or Bring Your Own Key (BYOK).
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Configure AI Provider</DialogTitle>
                  <DialogDescription>
                    Connect your own AI API keys to access advanced models.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select value={provider} onValueChange={setProvider}>
                      <SelectTrigger id="provider">
                        <SelectValue placeholder="Select provider" />
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
                        <Label htmlFor="model">Model Name</Label>
                        <Select value={model} onValueChange={setModel}>
                          <SelectTrigger id="model">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.find(p => p.id === provider)?.models.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="apiKey">API Key (Write-only)</Label>
                        <Input 
                          id="apiKey" 
                          type="password" 
                          placeholder="sk-..." 
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                          Leave empty to keep existing key if editing.
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Default Provider</Label>
                      <p className="text-xs text-muted-foreground">Use this as the primary model</p>
                    </div>
                    <Switch 
                      checked={makeDefault} 
                      onCheckedChange={setMakeDefault} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
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
                    {upsertMutation.isPending ? "Saving..." : "Save Configuration"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Pro Feature Tip</AlertTitle>
            <AlertDescription className="text-xs">
              Using BYOK (Bring Your Own Key) gives you higher rate limits and access to more powerful RAG capabilities.
            </AlertDescription>
          </Alert>

          <div className="rounded-md border">
            {configs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground italic">
                No custom providers configured. Prism Local is used by default.
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
                          <p className="text-sm font-medium capitalize">{config.provider === 'local-vllm' ? 'Prism Local' : config.provider}</p>
                          {config.isDefault && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] hover:bg-emerald-500/20">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Model: <span className="font-mono">{config.model}</span>
                          {config.hasApiKey && ` • Key ending in ${config.apiKeyLast4}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!config.isDefault && (
                        <Button variant="ghost" size="sm" onClick={() => setDefaultMutation.mutate(config.provider)}>
                          Set Default
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
            Keys are encrypted and stored securely on our backend.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
