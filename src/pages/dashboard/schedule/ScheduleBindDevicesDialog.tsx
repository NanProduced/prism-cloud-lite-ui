import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Search, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

import { getDevices } from '@/services/deviceApi';
import { bindDevicesToSchedule } from '@/services/scheduleApi';
import type { ScheduleBindDevicesResp } from '@/types/schedule';
import type { BffResponse } from '@/types/auth';
import { useTranslation } from 'react-i18next';

function getBffDisplayError(res: BffResponse<any> | null | undefined, t: any): string {
  return res?.error?.displayMessage || res?.error?.message || t('common.errors.unknown');
}

export function ScheduleBindDevicesDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  alreadyBoundDeviceIds: number[];
}) {
  const { t } = useTranslation();
  const { open, onOpenChange, scheduleId, alreadyBoundDeviceIds } = props;
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [bindResult, setBindResult] = useState<ScheduleBindDevicesResp | null>(null);

  const devicesQuery = useQuery({
    queryKey: ['devices', 'list-for-binding'],
    queryFn: getDevices,
    enabled: open,
  });

  const devices = useMemo(() => {
    const list = devicesQuery.data?.data || [];
    if (!keyword) return list;
    const q = keyword.toLowerCase();
    return list.filter(d => 
      d.deviceName.toLowerCase().includes(q) || 
      String(d.deviceId).includes(q) ||
      (d.description || '').toLowerCase().includes(q)
    );
  }, [devicesQuery.data, keyword]);

  const bindMutation = useMutation({
    mutationFn: () => bindDevicesToSchedule(scheduleId, selectedDeviceIds, replaceExisting),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res, t));
        return;
      }
      setBindResult(res.data || null);
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedule-bindings', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });

      const conflicts = res.data?.conflicts ?? 0;
      if (conflicts > 0) {
        toast.warning(t('schedules.details.bindDevices.toasts.withConflicts'), { 
          description: t('schedules.details.bindDevices.toasts.conflictsDesc', { count: conflicts }) 
        });
      } else {
        toast.success(t('schedules.details.bindDevices.toasts.success'));
      }
    },
    onError: () => toast.error(t('schedules.details.bindDevices.toasts.failed')),
  });

  function toggleDevice(deviceId: number) {
    setSelectedDeviceIds((prev) => (prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]));
  }

  function resetState() {
    setKeyword('');
    setReplaceExisting(false);
    setSelectedDeviceIds([]);
    setBindResult(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetState();
      }}
    >
      <DialogContent className="max-w-[860px]">
        <DialogHeader>
          <DialogTitle>{t('schedules.details.bindDevices.title')}</DialogTitle>
          <DialogDescription>
            {t('schedules.details.bindDevices.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-[360px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t('schedules.details.bindDevices.searchPlaceholder')} className="pl-9" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-semibold">{t('schedules.details.bindDevices.replaceLabel')}</p>
                <p className="text-xs text-muted-foreground">{t('schedules.details.bindDevices.replaceDesc')}</p>
              </div>
              <Switch checked={replaceExisting} onCheckedChange={setReplaceExisting} />
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="max-h-[360px] overflow-auto divide-y">
              {devicesQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('schedules.details.bindDevices.loading')}
                </div>
              ) : devices.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">{t('schedules.details.bindDevices.noDevices')}</div>
              ) : (
                devices.map((d) => {
                  const id = Number(d.deviceId);
                  const checked = selectedDeviceIds.includes(id);
                  const isBoundHere = alreadyBoundDeviceIds.includes(id);
                  const name = d.deviceName || `Device ${id}`;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleDevice(id)}
                      className={cn('w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/40', checked && 'bg-muted/30')}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{name}</span>
                          <span className="text-xs text-muted-foreground font-mono">#{id}</span>
                          {isBoundHere ? <span className="text-xs text-emerald-600">{t('schedules.details.bindDevices.alreadyBound')}</span> : null}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{d.description || d.model || d.ipAddress || '—'}</p>
                      </div>
                      <div className={cn('h-6 w-6 rounded-full border flex items-center justify-center', checked && 'bg-primary text-primary-foreground border-primary')}>
                        {checked ? <Check className="h-4 w-4" /> : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {t('schedules.details.bindDevices.selected')}: <span className="font-semibold">{selectedDeviceIds.length}</span> · {t('schedules.details.bindDevices.alreadyBoundToThis')}:{' '}
              <span className="font-semibold">{alreadyBoundDeviceIds.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t('common.actions.close')}
              </Button>
              <Button onClick={() => bindMutation.mutate()} disabled={bindMutation.isPending || selectedDeviceIds.length === 0} className="gap-2">
                {bindMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('schedules.details.bindDevices.bind')}
              </Button>
            </div>
          </div>

          {bindResult ? (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t('schedules.details.bindDevices.result.title')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('schedules.details.bindDevices.result.total')}={bindResult.totalTargets} · {t('schedules.details.bindDevices.result.bound')}={bindResult.bound} · {t('schedules.details.bindDevices.result.conflicts')}={bindResult.conflicts}
                </p>
              </div>
              <div className="max-h-[220px] overflow-auto rounded border">
                <div className="divide-y">
                  {bindResult.results.map((r) => (
                    <div key={`${r.deviceId}-${r.status}`} className="px-3 py-2 flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">#{r.deviceId}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.status === 'conflict' ? (
                          <span className="inline-flex items-center gap-1 text-rose-600">
                            <XCircle className="h-3 w-3" /> {t('schedules.details.bindDevices.result.conflictStatus', { id: String(r.previousScheduleId || '').slice(0, 8) })}
                          </span>
                        ) : (
                          r.status
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}