import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  Zap, 
  Settings2, 
  RefreshCw,
  MonitorPlay,
  Smartphone,
  Tv2,
  CheckCircle2
} from 'lucide-react';
import { createTranscodeTask } from '@/services/mediaApi';
import { toast } from '@/store/notificationStore';
import type { MediaAssetNode } from '@/types/media-library';
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';

const transcodeSchema = z.object({
  presetId: z.string().min(1, 'Please select a preset'),
  options: z.object({
    width: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
    crf: z.coerce.number().min(0).max(51).optional(),
    videoBitrateKbps: z.coerce.number().optional(),
    audioBitrateKbps: z.coerce.number().optional(),
    faststart: z.boolean(),
  }),
  targetFolderId: z.string().optional().nullable(),
});

type TranscodeFormValues = z.infer<typeof transcodeSchema>;

interface TranscodeDialogProps {
  asset: MediaAssetNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (taskId: string, messageId: string) => void;
}

const PRESETS = [
  { id: 'mp4_1080p_h264', name: 'Ultra HD', desc: '1080p High Quality', icon: Tv2, color: 'text-blue-500' },
  { id: 'mp4_720p_h264', name: 'Balanced', desc: '720p Standard', icon: MonitorPlay, color: 'text-indigo-500' },
  { id: 'mp4_480p_h264', name: 'Mobile', desc: '480p Efficient', icon: Smartphone, color: 'text-emerald-500' },
  { id: 'mp4_h264', name: 'Native', desc: 'Source Resolution', icon: Zap, color: 'text-amber-500' },
];

export const TranscodeDialog: React.FC<TranscodeDialogProps> = ({
  asset,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TranscodeFormValues>({
    resolver: zodResolver(transcodeSchema) as any,
    defaultValues: {
      presetId: 'mp4_720p_h264',
      options: {
        faststart: true,
        crf: 23,
      },
    },
  });

  const selectedPreset = form.watch('presetId');

  const onSubmit = async (values: TranscodeFormValues) => {
    if (!asset) return;

    setIsSubmitting(true);
    try {
      const res = await createTranscodeTask(asset.id, values);
      if (res.success && res.data) {
        toast.success(t('media.dialogs.transcode.toasts.success'));
        onOpenChange(false);
        onSuccess?.(res.data.taskId, res.data.messageId);
      } else {
        toast.error(res.error?.displayMessage || t('media.dialogs.transcode.toasts.failed'));
      }
    } catch (error) {
      toast.error(t('common.errors.unknown'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background">
        <div className="px-8 py-6 border-b bg-muted/10">
          <DialogHeader className="space-y-1.5 mb-0">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Zap className="h-5 w-5 fill-primary/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{t('media.dialogs.transcode.pipeline')}</span>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">{t('media.dialogs.transcode.title')}</DialogTitle>
            <DialogDescription className="text-sm">
              {t('media.dialogs.transcode.description', { name: asset?.name })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{t('media.dialogs.transcode.targetPreset')}</label>
                {asset?.durationMs && (
                   <span className="text-[10px] font-bold text-muted-foreground italic">
                     {t('deviceDetails.cockpit.nowPlaying.label')}: {Math.round(asset.durationMs / 1000)}s
                   </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => form.setValue('presetId', p.id)}
                    className={cn(
                      "relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer group",
                      selectedPreset === p.id 
                        ? "bg-primary/5 border-primary shadow-sm" 
                        : "border-border/60 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "p-2 w-fit rounded-lg mb-3 transition-colors",
                      selectedPreset === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <p.icon className="h-4 w-4" />
                    </div>
                    <div className="font-bold text-sm tracking-tight">{t(`media.presets.${p.id}.name`)}</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{t(`media.presets.${p.id}.desc`)}</div>
                    
                    {selectedPreset === p.id && (
                      <CheckCircle2 className="absolute top-3 right-3 h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="border border-border/60 rounded-xl overflow-hidden transition-all">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-muted/40 px-4 py-3 h-auto rounded-none">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                    <Settings2 className="h-3.5 w-3.5" />
                    {t('media.dialogs.transcode.advancedOptions')}
                  </div>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", showAdvanced ? 'rotate-180' : '')} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-4 bg-muted/5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="options.videoBitrateKbps"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground/70">{t('media.dialogs.transcode.bitrate')}</label>
                        <FormControl>
                          <Input type="number" placeholder="Auto" {...field} className="h-9 text-xs bg-background border-border/50" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="options.crf"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground/70">{t('media.dialogs.transcode.quality')}</label>
                        <FormControl>
                          <Input type="number" {...field} className="h-9 text-xs bg-background border-border/50" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="options.faststart"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border/40 p-2.5 bg-background">
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-bold block">{t('media.dialogs.transcode.faststart')}</label>
                        <p className="text-[9px] text-muted-foreground">
                          {t('media.dialogs.transcode.faststartDesc')}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="scale-90"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            <div className="px-8 py-4 -mx-8 -mb-8 bg-muted/10 border-t flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold text-xs uppercase tracking-widest px-6">
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl min-w-[140px] h-10 font-bold text-xs uppercase tracking-widest shadow-lg">
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2 fill-current" />
                )}
                {t('media.dialogs.transcode.startTask')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};