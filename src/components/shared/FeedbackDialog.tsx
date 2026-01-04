import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageSquareWarning, 
  Send, 
  X, 
  Paperclip, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Trash2,
  ExternalLink
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
import { RichTextEditor } from './RichTextEditor';
import { toast } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { submitBugReport } from '@/services/feedbackApi';
import { getUploadUrls } from '@/services/mediaApi';
import { getErrorMessage } from '@/services/authApi';
import { cn } from '@/lib/utils';
import type { FeedbackAttachment, UserBugReportCreateRequest } from '@/types/feedback';

const DRAFT_KEY = 'prism.feedback.draft';

interface FeedbackDraft {
  title: string;
  contentHtml: string;
  contactEmail: string;
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
          // Note: we can't restore File objects, only metadata if we wanted to
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
        attachments: attachments.map(a => ({ name: a.file.name, size: a.file.size, type: a.file.type }))
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [title, contentHtml, contactEmail, attachments, open, isSuccess]);

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
        // 1. Get presigned URL
        const uploadInfo = await getUploadUrls({
          route: 'mediaLibrary', // Reusing mediaLibrary route as suggested in doc
          files: [{ name: item.file.name, size: item.file.size, type: item.file.type }],
        });

        const result = uploadInfo.files[0];
        if (!result) throw new Error('Failed to get upload URL');

        // 2. Direct upload to S3/Object Storage
        await axios.put(result.signedUrl, item.file, {
          headers: result.headers,
        });

        // 3. Construct absolute URL
        // Using the logic from documentation: VITE_PUBLIC_ASSET_BASE_URL + key
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
    
    // Auto-start upload for each
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
      title,
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
    setIsSuccess(false);
    setReportId(null);
  }, [user]);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open && isSuccess) {
      setTimeout(reset, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none">
        {isSuccess ? (
          <div className="bg-card rounded-[2.5rem] p-12 border shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="h-24 w-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 relative z-10">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
            </div>

            <div className="space-y-3 relative z-10">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{t('feedback.success.title')}</h2>
              <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {t('feedback.success.desc')}
              </p>
            </div>

            {reportId && (
              <div className="bg-muted/40 backdrop-blur-md px-6 py-5 rounded-3xl border border-border/50 flex items-center gap-4 w-full max-w-sm group hover:bg-muted/60 transition-all duration-300 relative z-10">
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 leading-none mb-2">Report ID</p>
                  <p className="font-mono text-sm font-bold text-foreground/80 truncate">{reportId}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl bg-background shadow-sm hover:scale-110 transition-all duration-200" 
                  onClick={copyReportId}
                  title="Copy ID"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button 
              className="rounded-2xl px-16 h-14 font-bold shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-105 transition-all duration-300 relative z-10 text-lg" 
              onClick={() => handleOpenChange(false)}
            >
              {t('common.actions.close')}
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-[2.5rem] border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-8 pb-6 border-b bg-gradient-to-b from-muted/20 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <MessageSquareWarning className="h-7 w-7 relative z-10" />
                </div>
                <DialogHeader className="p-0 space-y-1 text-left">
                  <DialogTitle className="text-2xl font-black tracking-tight text-foreground/90">{t('feedback.ui.title')}</DialogTitle>
                  <DialogDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{t('feedback.ui.subtitle')}</DialogDescription>
                </DialogHeader>
              </div>
              <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-muted/80 transition-colors" onClick={() => handleOpenChange(false)}>
                <X className="h-6 w-6 text-muted-foreground/60" />
              </Button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto custom-scrollbar p-8 pt-6 space-y-8">
              {/* Title Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="title" className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground/50">
                    {t('feedback.ui.fields.title')}
                  </Label>
                </div>
                <div className="relative group">
                  <Input
                    id="title"
                    placeholder={t('feedback.ui.placeholders.title')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-14 rounded-2xl bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all duration-300 font-bold text-base px-5"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-2.5">
                <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground/50 px-1">
                  {t('feedback.ui.fields.content')}
                </Label>
                <div className="relative group rounded-[2.25rem] p-1 border-2 border-dashed border-muted/30 focus-within:border-primary/20 transition-all duration-300">
                  <RichTextEditor
                    content={contentHtml}
                    onChange={setContentHtml}
                    placeholder={t('feedback.ui.placeholders.content')}
                    className="border-none bg-transparent"
                    editorClassName="min-h-[200px] px-6 py-4"
                  />
                </div>
              </div>

              {/* Contact & URL Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground/50 px-1">
                    {t('feedback.ui.fields.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-14 rounded-2xl bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all duration-300 font-bold text-sm px-5"
                  />
                </div>
                <div className="flex flex-col justify-center bg-muted/10 rounded-2xl px-5 py-3 border border-transparent hover:border-muted-foreground/10 transition-all group">
                   <label className="flex items-center gap-4 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={includeUrl} 
                          onChange={e => setIncludeUrl(e.target.checked)}
                          className="peer h-5 w-5 rounded-lg border-muted-foreground/30 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-bold text-foreground/80 transition-colors">{t('feedback.ui.fields.includeUrl')}</span>
                        <span className="text-[10px] text-muted-foreground font-medium truncate opacity-60 group-hover:opacity-100 transition-opacity">
                          {window.location.hostname}...{window.location.pathname}
                        </span>
                      </div>
                   </label>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground/50">
                    {t('feedback.ui.fields.attachments')}
                  </Label>
                  <Badge variant="outline" className="rounded-full px-3 py-0.5 bg-muted/30 border-muted-foreground/10 text-[10px] font-black opacity-40">
                    {attachments.length} / 5
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attachments.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-muted/20 border border-muted-foreground/5 group hover:bg-muted/30 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 animate-in slide-in-from-bottom-2">
                       <div className="h-11 w-11 rounded-xl bg-background border shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all">
                          <Paperclip className="h-5 w-5" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-xs font-black truncate text-foreground/80">{item.file.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mt-0.5">
                            {(item.file.size / 1024).toFixed(0)} KB
                            {item.status === 'uploading' && <span className="text-primary ml-1.5 animate-pulse">···</span>}
                          </p>
                       </div>
                       <div className="flex items-center">
                          {item.status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-primary/40" />}
                          {item.status === 'done' && (
                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                          )}
                          {item.status === 'error' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-lg" onClick={() => uploadMutation.mutate(idx)}>
                               <AlertCircle className="h-5 w-5" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl ml-1 group-hover:opacity-100 opacity-0 transition-all" 
                            onClick={() => removeAttachment(idx)}
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                       </div>
                    </div>
                  ))}

                  {attachments.length < 5 && (
                    <label className="flex items-center gap-4 p-4 border-2 border-dashed rounded-[1.25rem] bg-muted/5 hover:bg-muted/20 hover:border-primary/30 hover:shadow-inner cursor-pointer transition-all duration-300 group overflow-hidden relative">
                       <div className="h-11 w-11 rounded-xl bg-background border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:rotate-12 transition-all shadow-sm">
                          <Paperclip className="h-5 w-5" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground/60 group-hover:text-primary transition-colors">{t('feedback.ui.actions.addAttachment')}</span>
                          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">Max 10MB · Images/PDF</span>
                       </div>
                       <input type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.txt" />
                    </label>
                  )}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 border-t bg-muted/10 backdrop-blur-md flex items-center justify-between gap-4">
               <Button variant="ghost" className="rounded-2xl px-8 h-14 font-bold text-muted-foreground hover:bg-muted/80 transition-all" onClick={() => handleOpenChange(false)}>
                  {t('common.actions.cancel')}
               </Button>
               <Button 
                className="rounded-2xl px-12 h-14 font-black shadow-2xl shadow-primary/20 gap-3 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:grayscale"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || attachments.some(a => a.status === 'uploading')}
               >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  <span className="text-base uppercase tracking-wider">{t('feedback.ui.actions.submit')}</span>
               </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
