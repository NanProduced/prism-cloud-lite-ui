import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquareWarning, 
  Send, 
  Paperclip, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Trash2,
  Bug,
  Lightbulb,
  MessageCircle,
  Globe
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from './RichTextEditor';
import { toast } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { submitBugReport } from '@/services/feedbackApi';
import { getUploadUrls } from '@/services/mediaApi';
import { getErrorMessage } from '@/services/authApi';
import { cn } from '@/lib/utils';
import type { UserBugReportCreateRequest } from '@/types/feedback';

const DRAFT_KEY = 'prism.feedback.draft';

type FeedbackType = 'BUG' | 'SUGGESTION' | 'OTHER';

interface FeedbackDraft {
  title: string;
  contentHtml: string;
  contactEmail: string;
  type: FeedbackType;
  attachments: { name: string; size: number; type: string }[];
}

export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [type, setType] = useState<FeedbackType>('BUG');
  const [includeUrl, setIncludeUrl] = useState(true);
  const [attachments, setAttachments] = useState<{ file: File; url?: string; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string }[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  // Initialize from user or draft
  useEffect(() => {
    if (open) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft) as FeedbackDraft;
          setTitle(draft.title || '');
          setContentHtml(draft.contentHtml || '');
          setContactEmail(draft.contactEmail || user?.email || '');
          setType(draft.type || 'BUG');
        } catch (e) {
          localStorage.removeItem(DRAFT_KEY);
        }
      } else {
        setContactEmail(user?.email || '');
      }
    }
  }, [open, user]);

  // Save draft
  useEffect(() => {
    if (open && !isSuccess) {
      const draft: FeedbackDraft = {
        title,
        contentHtml,
        contactEmail,
        type,
        attachments: attachments.map(a => ({ name: a.file.name, size: a.file.size, type: a.file.type }))
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [title, contentHtml, contactEmail, type, attachments, open, isSuccess]);

  const uploadMutation = useMutation({
    mutationFn: async (index: number) => {
      const item = attachments[index];
      if (!item || item.status === 'done' || item.status === 'uploading') return;

      setAttachments(prev => {
        const next = [...prev];
        next[index] = { ...next[index], status: 'uploading', error: undefined };
        return next;
      });

      try {
        const uploadInfo = await getUploadUrls({
          route: 'mediaLibrary',
          files: [{ name: item.file.name, size: item.file.size, type: item.file.type }],
        });

        const result = uploadInfo.files[0];
        if (!result) throw new Error('Failed to get upload URL');

        await axios.put(result.signedUrl, item.file, {
          headers: result.headers,
        });

        const baseUrl = import.meta.env.VITE_PUBLIC_ASSET_BASE_URL || window.location.origin + '/api';
        const key = result.file.objectInfo.key;
        const absoluteUrl = `${baseUrl.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;

        setAttachments(prev => {
          const next = [...prev];
          next[index] = { ...next[index], status: 'done', url: absoluteUrl };
          return next;
        });
      } catch (err) {
        setAttachments(prev => {
          const next = [...prev];
          next[index] = { ...next[index], status: 'error', error: getErrorMessage(err) };
          return next;
        });
        throw err;
      }
    }
  });

  const submitMutation = useMutation({
    mutationFn: (data: UserBugReportCreateRequest) => submitBugReport(data),
    onSuccess: (res) => {
      setIsSuccess(true);
      setReportId(res.data?.id || null);
      localStorage.removeItem(DRAFT_KEY);
      toast.success(t('feedback.toasts.submitSuccess'));
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      status: 'pending' as const
    }));
    const startIndex = attachments.length;
    setAttachments(prev => [...prev, ...newFiles]);
    
    newFiles.forEach((_, i) => {
      uploadMutation.mutate(startIndex + i);
    });
    
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentHtml.trim()) {
      toast.error(t('feedback.errors.allFieldsRequired'));
      return;
    }

    const isUploading = attachments.some(a => a.status === 'uploading');
    if (isUploading) {
      toast.info(t('feedback.errors.uploadInProgress'));
      return;
    }

    const payload: UserBugReportCreateRequest = {
      title: `[${type}] ${title}`,
      contentHtml,
      contactEmail,
      pageUrl: includeUrl ? window.location.href : undefined,
      attachments: attachments
        .filter(a => a.status === 'done' && a.url)
        .map(a => ({
          url: a.url!,
          name: a.file.name,
          mimeType: a.file.type,
          sizeBytes: a.file.size
        }))
    };

    submitMutation.mutate(payload);
  };

  const copyReportId = () => {
    if (reportId) {
      navigator.clipboard.writeText(reportId);
      toast.success(t('common.toasts.copied'));
    }
  };

  const reset = useCallback(() => {
    setTitle('');
    setContentHtml('');
    setContactEmail(user?.email || '');
    setAttachments([]);
    setType('BUG');
    setIsSuccess(false);
    setReportId(null);
  }, [user]);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open && isSuccess) {
      setTimeout(reset, 300);
    }
  };

  const categoryOptions = useMemo(() => [
    { value: 'BUG', label: t('feedback.ui.categories.BUG'), icon: Bug, color: 'text-rose-500' },
    { value: 'SUGGESTION', label: t('feedback.ui.categories.SUGGESTION'), icon: Lightbulb, color: 'text-amber-500' },
    { value: 'OTHER', label: t('feedback.ui.categories.OTHER'), icon: MessageCircle, color: 'text-blue-500' },
  ], [t]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {isSuccess ? (
          <div className="p-10 flex flex-col items-center text-center space-y-6 overflow-y-auto">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{t('feedback.success.title')}</h2>
              <p className="text-muted-foreground">
                {t('feedback.success.desc')}
              </p>
            </div>

            {reportId && (
              <div className="bg-muted p-4 rounded-lg flex items-center gap-4 w-full max-w-sm">
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{t('feedback.ui.referenceCode')}</p>
                  <p className="font-mono text-sm truncate">{reportId}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyReportId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button className="w-full max-w-sm" onClick={() => handleOpenChange(false)}>
              {t('common.actions.close')}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-center gap-2 text-primary mb-1">
                <MessageSquareWarning className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">{t('feedback.ui.subtitle')}</span>
              </div>
              <DialogTitle className="text-xl">{t('feedback.ui.title')}</DialogTitle>
              <DialogDescription className="text-xs">
                {t('feedback.ui.description') || 'Help us improve by reporting bugs or suggesting new features.'}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 max-h-[calc(90vh-140px)]">
              <form id="feedback-form" onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Category Selector */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('feedback.ui.selectType')}
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {categoryOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isActive = type === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setType(opt.value as FeedbackType)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 py-4 rounded-xl border transition-all",
                            isActive 
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                              : "border-border bg-card hover:bg-muted/50"
                          )}
                        >
                          <Icon className={cn("h-5 w-5 mb-2", isActive ? opt.color : "text-muted-foreground")} />
                          <span className={cn("text-xs font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title Section */}
                <div className="space-y-2">
                  <Label htmlFor="title">{t('feedback.ui.fields.title')}</Label>
                  <Input
                    id="title"
                    placeholder={t('feedback.ui.placeholders.title')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="focus-visible:ring-primary/20"
                    required
                  />
                </div>

                {/* Content Section */}
                <div className="space-y-2">
                  <Label>{t('feedback.ui.fields.content')}</Label>
                  <div className="rounded-lg border bg-background focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <RichTextEditor
                      content={contentHtml}
                      onChange={setContentHtml}
                      placeholder={t('feedback.ui.placeholders.content')}
                      className="border-none shadow-none"
                      editorClassName="min-h-[150px] p-4"
                    />
                  </div>
                </div>

                {/* Contact & URL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('feedback.ui.fields.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="flex items-center space-x-3 pt-6 md:pt-8">
                    <Checkbox 
                      id="includeUrl" 
                      checked={includeUrl} 
                      onCheckedChange={(checked) => setIncludeUrl(checked as boolean)}
                    />
                    <label
                      htmlFor="includeUrl"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      {t('feedback.ui.fields.includeUrl')}
                      <Globe className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </label>
                  </div>
                </div>

                {/* Attachments */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {t('feedback.ui.fields.attachments')}
                    </Label>
                    <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0">
                      {attachments.length} / 5
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 text-sm">
                         <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                         <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.file.name}</p>
                         </div>
                         <div className="flex items-center gap-1">
                            {item.status === 'uploading' && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                            {item.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                            {item.status === 'error' && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => uploadMutation.mutate(idx)}>
                                 <AlertCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive" 
                              onClick={() => removeAttachment(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                      </div>
                    ))}

                    {attachments.length < 5 && (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg hover:bg-muted/50 cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
                         <Paperclip className="h-4 w-4" />
                         <span className="text-xs font-medium">{t('feedback.ui.actions.addAttachment')}</span>
                         <input type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.txt" />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 italic">
                    {t('feedback.ui.hints.attachmentSize') || 'Max 10MB per file, up to 5 files.'}
                  </p>
                </div>
              </form>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t bg-muted/10">
               <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                  {t('common.actions.cancel')}
               </Button>
               <Button 
                form="feedback-form"
                type="submit"
                disabled={submitMutation.isPending || attachments.some(a => a.status === 'uploading')}
                className="gap-2 px-6"
               >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {t('feedback.ui.actions.submit')}
               </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}