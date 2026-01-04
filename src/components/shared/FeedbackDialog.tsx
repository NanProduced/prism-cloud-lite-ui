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
          <div className="bg-card rounded-[2.5rem] p-12 border shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">{t('feedback.success.title')}</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {t('feedback.success.desc')}
              </p>
            </div>
            {reportId && (
              <div className="bg-muted/30 px-6 py-4 rounded-2xl border flex items-center gap-4 w-full max-w-xs group">
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 leading-none mb-1.5">Report ID</p>
                  <p className="font-mono text-sm font-bold truncate">{reportId}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={copyReportId}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <Button className="rounded-xl px-12 h-12 font-bold shadow-xl" onClick={() => handleOpenChange(false)}>
              {t('common.actions.close')}
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-[2.5rem] border shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 pb-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquareWarning className="h-6 w-6" />
                </div>
                <DialogHeader className="p-0 space-y-0 text-left">
                  <DialogTitle className="text-xl font-bold tracking-tight">{t('feedback.ui.title')}</DialogTitle>
                  <DialogDescription className="text-xs font-medium">{t('feedback.ui.subtitle')}</DialogDescription>
                </DialogHeader>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onClick={() => handleOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-auto custom-scrollbar p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  {t('feedback.ui.fields.title')}
                </Label>
                <Input
                  id="title"
                  placeholder={t('feedback.ui.placeholders.title')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 rounded-2xl bg-muted/20 border-transparent focus:border-primary/20 focus:bg-background transition-all font-bold text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                  {t('feedback.ui.fields.content')}
                </Label>
                <RichTextEditor
                  content={contentHtml}
                  onChange={setContentHtml}
                  placeholder={t('feedback.ui.placeholders.content')}
                  className="rounded-[2rem] border-2 border-muted/30"
                  editorClassName="min-h-[200px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    {t('feedback.ui.fields.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="h-12 rounded-2xl bg-muted/20 border-transparent focus:border-primary/20 transition-all font-bold text-sm"
                  />
                </div>
                <div className="flex flex-col justify-center gap-2 px-2">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={includeUrl} 
                        onChange={e => setIncludeUrl(e.target.checked)}
                        className="h-4 w-4 rounded border-muted-foreground/30 text-primary focus:ring-primary/20"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold group-hover:text-primary transition-colors">{t('feedback.ui.fields.includeUrl')}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{window.location.href}</span>
                      </div>
                   </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 flex items-center justify-between">
                  {t('feedback.ui.fields.attachments')}
                  <span className="font-bold lowercase opacity-40">{attachments.length}/5</span>
                </Label>
                
                <div className="grid grid-cols-1 gap-3">
                  {attachments.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/20 border-2 border-transparent group hover:bg-muted/30 transition-all">
                       <div className="h-10 w-10 rounded-xl bg-background border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <Paperclip className="h-4 w-4" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{item.file.name}</p>
                          <p className="text-[10px] font-medium text-muted-foreground">
                            {(item.file.size / 1024).toFixed(1)} KB
                            {item.status === 'uploading' && ` · ${t('media.upload.taskStatus.uploading')}...`}
                            {item.status === 'error' && ` · ${item.error}`}
                          </p>
                       </div>
                       <div className="flex items-center gap-1">
                          {item.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary/40" />}
                          {item.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          {item.status === 'error' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => uploadMutation.mutate(idx)}>
                               <AlertCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAttachment(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </div>
                  ))}

                  {attachments.length < 5 && (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[2rem] bg-muted/10 hover:bg-muted/20 hover:border-primary/20 cursor-pointer transition-all group">
                       <div className="h-10 w-10 rounded-2xl bg-background border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mb-2">
                          <Paperclip className="h-4 w-4" />
                       </div>
                       <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">{t('feedback.ui.actions.addAttachment')}</span>
                       <span className="text-[10px] text-muted-foreground/50 mt-1">{t('feedback.ui.hints.attachmentSize')}</span>
                       <input type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.txt" />
                    </label>
                  )}
                </div>
              </div>
            </form>

            <div className="p-8 border-t bg-muted/5 flex items-center justify-end gap-3 rounded-b-[2.5rem]">
               <Button variant="ghost" className="rounded-xl px-8 h-12 font-bold" onClick={() => handleOpenChange(false)}>
                  {t('common.actions.cancel')}
               </Button>
               <Button 
                className="rounded-xl px-10 h-12 font-bold shadow-xl shadow-primary/20 gap-2"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || attachments.some(a => a.status === 'uploading')}
               >
                  {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t('feedback.ui.actions.submit')}
               </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
