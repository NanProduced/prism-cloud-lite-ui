import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Copy, Loader2, ShieldCheck, XCircle, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/store/notificationStore';
import { getDeviceCommandLog } from '@/services/logApi';
import type { DeviceCommandLogDetail } from '@/types/log';
import { getTrackingLevelLabelKey } from '@/features/logs/commandLogI18n';

export function CommandLogDetailDialog(props: { logId: number | null; onClose: () => void }) {
  const { logId, onClose } = props;
  const { t } = useTranslation();

  const { data: detailRes, isLoading, isError } = useQuery({
    queryKey: ['device-command-log-detail', logId],
    queryFn: () => getDeviceCommandLog(logId as number),
    enabled: logId !== null,
  });

  const detail: DeviceCommandLogDetail | null = detailRes?.success ? (detailRes.data ?? null) : null;
  const payloadForDisplay = (() => {
    if (!detail?.payload) return null;
    try {
      return JSON.parse(detail.payload);
    } catch {
      return detail.payload;
    }
  })();

  return (
    <Dialog open={logId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-[2rem] p-0 border-none shadow-2xl">
        <div className="bg-primary/5 p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogHeader className="p-0 text-left">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {t('logs.command.detail.title')}
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground font-medium mt-1">{t('logs.command.detail.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium">{t('logs.command.detail.loading')}</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">{t('logs.command.detail.loadFailed')}</span>
            </div>
          )}

          {detail && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border shadow-sm">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t('logs.command.detail.operationId')}</p>
                  <p className="text-xs font-mono font-bold break-all">{detail.operationId}</p>
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border shadow-sm">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t('logs.command.detail.queuedId')}</p>
                  <p className="text-xs font-mono font-bold">{detail.queuedId ?? '—'}</p>
                </div>
                <div className="space-y-1.5 p-4 rounded-2xl bg-muted/30 border shadow-sm">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t('logs.command.detail.trackingLevel')}</p>
                  <p className="text-xs font-bold tracking-tight">{t(getTrackingLevelLabelKey(detail.trackingLevel))}</p>
                </div>
              </div>

              {detail.errorMessage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-500" />
                    <p className="text-[10px] font-bold tracking-widest text-rose-500">{t('logs.command.detail.errorMessage')}</p>
                  </div>
                  <div className="text-xs text-rose-600 bg-rose-50/50 p-4 rounded-2xl border border-rose-100 font-bold leading-relaxed shadow-sm">
                    {detail.errorMessage}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{t('logs.command.detail.payload')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] font-bold gap-1.5"
                    onClick={() => {
                      navigator.clipboard.writeText(detail.payload ?? '');
                      toast.success(t('logs.common.copied'));
                    }}
                  >
                    <Copy className="h-3 w-3" />
                    {t('logs.command.detail.copyPayload')}
                  </Button>
                </div>
                <div className="bg-slate-950 rounded-2xl p-6 overflow-hidden border border-slate-800 shadow-xl group relative">
                  <pre className="text-xs text-emerald-400 font-mono overflow-auto max-h-[400px] custom-scrollbar leading-relaxed">
                    {payloadForDisplay
                      ? JSON.stringify(payloadForDisplay, null, 2)
                      : JSON.stringify({ info: t('logs.command.detail.noPayload') }, null, 2)}
                  </pre>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 tracking-widest">
                      Read-Only
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" className="rounded-xl font-bold tracking-widest text-xs" onClick={onClose}>
              {t('logs.common.close')}
            </Button>
            <Button className="rounded-xl font-bold tracking-widest text-xs px-6" onClick={onClose}>
              {t('logs.common.done')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

