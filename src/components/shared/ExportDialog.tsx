import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Layers,
  Monitor,
  Film,
  Info
} from 'lucide-react';
import { getExportSchema, createExportTask } from '@/services/exportApi';
import type { ExportSchemaResponse, ExportType } from '@/types/export';
import { toast } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ExportType;
  filters: Record<string, any>;
  selectedId?: string | number;
  selectedName?: string;
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  type, 
  filters,
  selectedId,
  selectedName
}: ExportDialogProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schema, setSchema] = useState<ExportSchemaResponse | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [successTaskId, setSuccessTaskId] = useState<string | null>(null);
  
  // Scope selection: 'ALL' or 'SELECTED'
  const [scope, setScope] = useState<'ALL' | 'SELECTED'>('ALL');

  useEffect(() => {
    if (open) {
      loadSchema();
      setSuccessTaskId(null);
      // Reset scope based on whether an item is selected
      setScope(selectedId ? 'SELECTED' : 'ALL');
    }
  }, [open, type, selectedId]);

  const loadSchema = async () => {
    setIsLoadingSchema(true);
    try {
      const response = await getExportSchema(type);
      if (response.success && response.data) {
        setSchema(response.data);
        setSelectedFields(response.data.defaultFields || []);
        if (response.data.allowedFormats.length > 0) {
          setSelectedFormat(response.data.allowedFormats[0]);
        }
      } else {
        toast.error(t('export.loadSchemaFailed'));
      }
    } catch (error) {
      toast.error(t('export.loadSchemaFailed'));
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFormat) return;
    
    // Prepare final filters based on scope
    const finalFilters = { ...filters };
    if (scope === 'SELECTED' && selectedId) {
      // Map correctly based on type
      if (type.includes('DEVICE')) finalFilters.deviceId = Number(selectedId);
      if (type.includes('PROGRAM')) finalFilters.programId = selectedId;
      if (type.includes('MEDIA')) finalFilters.mediaId = selectedId;
    } else {
      // For 'ALL' scope, remove specific IDs if they exist in base filters
      delete finalFilters.deviceId;
      delete finalFilters.programId;
      delete finalFilters.lanProgramId;
      delete finalFilters.mediaId;
    }

    setIsSubmitting(true);
    try {
      const response = await createExportTask({
        exportType: type,
        format: selectedFormat,
        fields: selectedFields,
        filters: finalFilters,
        locale: i18n.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      if (response.success && response.data) {
        setSuccessTaskId(response.data.taskId);
        toast.success(t('export.success'));
      } else {
        toast.error(response.error?.message || t('export.error'));
      }
    } catch (error) {
      toast.error(t('export.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleField = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(k => k !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const getFormatIcon = (format: string) => {
    switch (format.toUpperCase()) {
      case 'CSV': return <FileText className="h-4 w-4" />;
      case 'XLSX': return <FileSpreadsheet className="h-4 w-4" />;
      case 'JSON': return <FileJson className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  const getScopeIcon = () => {
    if (type.includes('DEVICE')) return <Monitor className="h-4 w-4" />;
    if (type.includes('PROGRAM')) return <Layers className="h-4 w-4" />;
    if (type.includes('MEDIA')) return <Film className="h-4 w-4" />;
    return <Info className="h-4 w-4" />;
  };

  const handleViewTasks = () => {
    onOpenChange(false);
    navigate('/dashboard/messages?tab=tasks');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-background">
        {!successTaskId ? (
          <div className="flex flex-col">
            <div className="px-8 py-6 border-b bg-muted/10">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  {t('export.title')}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {t('export.subtitle')}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {isLoadingSchema ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  <p className="text-sm text-muted-foreground animate-pulse">{t('export.loadingSchema')}</p>
                </div>
              ) : schema ? (
                <>
                  {/* DATA SCOPE SELECTION */}
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      {t('export.scope.label')}
                    </Label>
                    <div className="flex flex-col gap-2">
                      <div
                        onClick={() => setScope('ALL')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all",
                          scope === 'ALL' 
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                            : "border-muted bg-muted/20 hover:border-muted-foreground/20"
                        )}
                      >
                        <div className="flex items-center gap-3">
                           <div className={cn(
                             "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                             scope === 'ALL' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                           )}>
                             {getScopeIcon()}
                           </div>
                           <div className="flex flex-col">
                             <span className="font-bold text-sm">{t('export.scope.all', { type: t(`export.type.${type}`) })}</span>
                             <span className="text-[10px] text-muted-foreground/60">{t('export.scope.allDesc')}</span>
                           </div>
                        </div>
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          scope === 'ALL' ? "border-primary bg-primary text-white" : "border-muted-foreground/20"
                        )}>
                          {scope === 'ALL' && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div
                        onClick={() => selectedId && setScope('SELECTED')}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                          !selectedId ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer",
                          scope === 'SELECTED' 
                            ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                            : "border-muted bg-muted/20 hover:border-muted-foreground/20"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                           <div className={cn(
                             "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                             scope === 'SELECTED' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                           )}>
                             {getScopeIcon()}
                           </div>
                           <div className="flex flex-col min-w-0">
                             <span className="font-bold text-sm truncate">{t('export.scope.selected')}</span>
                             <span className="text-[10px] text-muted-foreground/60 truncate max-w-[280px]">
                               {selectedName || selectedId || t('export.scope.noSelection')}
                             </span>
                           </div>
                        </div>
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                          scope === 'SELECTED' ? "border-primary bg-primary text-white" : "border-muted-foreground/20"
                        )}>
                          {scope === 'SELECTED' && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      {t('export.format')}
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {schema.allowedFormats.map((format) => (
                        <div
                          key={format}
                          onClick={() => setSelectedFormat(format)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all",
                            selectedFormat === format 
                              ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                              : "border-muted bg-muted/20 hover:border-muted-foreground/20"
                          )}
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                            selectedFormat === format ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {getFormatIcon(format)}
                          </div>
                          <span className="font-bold text-sm">{format}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between ml-1">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                        {t('export.fields')}
                      </Label>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">
                        {t('export.fieldsSelected', { count: selectedFields.length })}
                      </span>
                    </div>
                    <ScrollArea className="h-[180px] rounded-2xl border-2 border-muted/30 bg-muted/10 p-4">
                      <div className="grid grid-cols-1 gap-1">
                        {schema.fields.map((field) => (
                          <div 
                            key={field.key}
                            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-background/50 transition-colors cursor-pointer group"
                            onClick={() => toggleField(field.key)}
                          >
                            <Checkbox 
                              id={field.key} 
                              checked={selectedFields.includes(field.key)}
                              onCheckedChange={() => toggleField(field.key)}
                              className="rounded-md"
                            />
                            <div className="flex flex-col flex-1">
                              <label
                                htmlFor={field.key}
                                className="text-sm font-semibold leading-none cursor-pointer group-hover:text-primary transition-colors"
                              >
                                {t(field.headerI18nKey, { defaultValue: field.key })}
                              </label>
                              <span className="text-[10px] text-muted-foreground/50 font-mono mt-1 uppercase">
                                {field.valueType}
                              </span>
                            </div>
                          </div>
                        ))}
                        {schema.fields.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
                            <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs font-medium">{t('export.noFields')}</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-20" />
                  <p>{t('export.loadSchemaFailed')}</p>
                  <Button variant="link" onClick={loadSchema} className="mt-2">{t('common.actions.retry')}</Button>
                </div>
              )}
            </div>

            <DialogFooter className="px-8 py-6 border-t bg-muted/5 flex sm:justify-between items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="rounded-2xl h-12 px-6 font-bold"
              >
                {t('common.actions.cancel')}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !schema || selectedFields.length === 0}
                className="flex-1 rounded-2xl h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('export.submitting')}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t('export.submit')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="px-8 py-16 flex flex-col items-center text-center bg-muted/5">
              <div className="h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 flex mb-8 animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <DialogHeader className="space-y-3 mb-0">
                <DialogTitle className="text-2xl font-bold tracking-tight text-center">
                  {t('export.successTitle')}
                </DialogTitle>
                <DialogDescription className="text-center text-base max-w-[340px] leading-relaxed">
                  {t('export.success')}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-8 pb-10 space-y-4">
              <Button 
                className="w-full h-14 rounded-2xl bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-bold shadow-2xl flex items-center justify-center gap-2" 
                onClick={handleViewTasks}
              >
                <ExternalLink className="h-4 w-4" />
                {t('export.viewTasks')}
              </Button>
              <Button 
                variant="ghost"
                className="w-full h-12 rounded-2xl font-bold text-muted-foreground" 
                onClick={() => onOpenChange(false)}
              >
                {t('common.actions.close')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}