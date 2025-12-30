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

function getBffDisplayError(res: { error?: { displayMessage?: string; message?: string } } | null | undefined): string {
  return res?.error?.displayMessage || res?.error?.message || 'Request failed';
}

export function ScheduleBindDevicesDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleId: string;
  alreadyBoundDeviceIds: number[];
}) {
  const { open, onOpenChange, scheduleId, alreadyBoundDeviceIds } = props;
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
  const [bindResult, setBindResult] = useState<ScheduleBindDevicesResp | null>(null);

  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
    enabled: open,
  });

  const devices = useMemo(() => {
    const list = devicesQuery.data?.data || [];
    const q = keyword.trim().toLowerCase();
    const filtered = q ? list.filter((d) => (d.deviceName || '').toLowerCase().includes(q)) : list;
    return [...filtered].sort((a, b) => String(a.deviceId).localeCompare(String(b.deviceId)));
  }, [devicesQuery.data?.data, keyword]);

  const bindMutation = useMutation({
    mutationFn: () => bindDevicesToSchedule(scheduleId, selectedDeviceIds, replaceExisting),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res));
        return;
      }
      setBindResult(res.data || null);
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedule-bindings', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });

      const conflicts = res.data?.conflicts ?? 0;
      if (conflicts > 0) toast.warning('Binding completed with conflicts', { description: `Conflicts: ${conflicts}` });
      else toast.success('Devices bound');
    },
    onError: () => toast.error('Bind failed'),
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
          <DialogTitle>Bind devices</DialogTitle>
          <DialogDescription>
            One device can only bind to one schedule. If a device is already bound to another schedule, it becomes a conflict unless you choose Replace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-[360px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Search devices..." className="pl-9" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-semibold">Replace existing bindings</p>
                <p className="text-xs text-muted-foreground">Default is safer: keep existing schedule bindings.</p>
              </div>
              <Switch checked={replaceExisting} onCheckedChange={setReplaceExisting} />
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="max-h-[360px] overflow-auto divide-y">
              {devicesQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading devices...
                </div>
              ) : devices.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No devices</div>
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
                          {isBoundHere ? <span className="text-xs text-emerald-600">Already bound</span> : null}
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
              Selected: <span className="font-semibold">{selectedDeviceIds.length}</span> · Already bound to this schedule:{' '}
              <span className="font-semibold">{alreadyBoundDeviceIds.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => bindMutation.mutate()} disabled={bindMutation.isPending || selectedDeviceIds.length === 0} className="gap-2">
                {bindMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Bind
              </Button>
            </div>
          </div>

          {bindResult ? (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Result</p>
                <p className="text-xs text-muted-foreground">
                  total={bindResult.totalTargets} · bound={bindResult.bound} · conflicts={bindResult.conflicts}
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
                            <XCircle className="h-3 w-3" /> conflict (prev {String(r.previousScheduleId || '').slice(0, 8)})
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
