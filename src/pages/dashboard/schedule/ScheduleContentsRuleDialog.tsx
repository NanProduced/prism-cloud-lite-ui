import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/store/notificationStore';

import { getPrograms, getProgramDetails } from '@/services/programApi';
import type { ProgramListResp, ProgramVersionResp } from '@/types/program';
import type { ScheduleContentsRuleResp, UpsertScheduleContentsRuleReq } from '@/types/schedule';

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

function parseJsonOrToast(label: string, raw: string): unknown | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    toast.error(`${label} JSON is invalid`);
    return null;
  }
}

export function ScheduleContentsRuleDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRule?: ScheduleContentsRuleResp | null;
  existingPriorities: number[];
  onSave: (req: UpsertScheduleContentsRuleReq) => void;
}) {
  const { open, onOpenChange, initialRule, existingPriorities, onSave } = props;

  const [type, setType] = useState<'rotation' | 'spot'>('rotation');
  const [priority, setPriority] = useState<number>(1);
  const [manualReleaseProgramId, setManualReleaseProgramId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedDeviceProgramId, setSelectedDeviceProgramId] = useState<number | null>(null);

  const [ifLimitTime, setIfLimitTime] = useState(false);
  const [limitTimeText, setLimitTimeText] = useState('');
  const [ifLimitDate, setIfLimitDate] = useState(false);
  const [limitDateText, setLimitDateText] = useState('');
  const [ifLimitWeekday, setIfLimitWeekday] = useState(false);
  const [limitWeekdayText, setLimitWeekdayText] = useState('');

  const programsQuery = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
    enabled: open,
  });

  const selectedProgramDetailsQuery = useQuery({
    queryKey: ['program', selectedProgramId],
    queryFn: () => getProgramDetails(selectedProgramId),
    enabled: open && Boolean(selectedProgramId),
  });

  const programList = useMemo(() => programsQuery.data?.data || [], [programsQuery.data?.data]);
  const versions = useMemo(() => selectedProgramDetailsQuery.data?.data?.versions || [], [selectedProgramDetailsQuery.data?.data?.versions]);

  const isEdit = Boolean(initialRule?.id);
  const effectiveExistingPriorities = useMemo(() => {
    if (!isEdit) return existingPriorities;
    return existingPriorities.filter((p) => p !== initialRule!.priority);
  }, [existingPriorities, initialRule, isEdit]);

  const selectedReleaseProgramId = useMemo(() => {
    if (manualReleaseProgramId.trim()) {
      const n = Number(manualReleaseProgramId);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    return selectedDeviceProgramId && selectedDeviceProgramId > 0 ? selectedDeviceProgramId : null;
  }, [manualReleaseProgramId, selectedDeviceProgramId]);

  useEffect(() => {
    if (!open) return;
    setType((initialRule?.type as any) || 'rotation');
    setPriority(initialRule?.priority ?? 1);
    setManualReleaseProgramId(initialRule?.releaseProgramId ? String(initialRule.releaseProgramId) : '');
    setSelectedProgramId(initialRule?.programId || '');
    setSelectedDeviceProgramId(initialRule?.releaseProgramId ?? null);

    setIfLimitTime(Boolean(initialRule?.ifLimitTime));
    setLimitTimeText(initialRule?.ifLimitTime ? safeJsonStringify(initialRule?.limitTime) : '');
    setIfLimitDate(Boolean(initialRule?.ifLimitDate));
    setLimitDateText(initialRule?.ifLimitDate ? safeJsonStringify(initialRule?.limitDate) : '');
    setIfLimitWeekday(Boolean(initialRule?.ifLimitWeekday));
    setLimitWeekdayText(initialRule?.ifLimitWeekday ? safeJsonStringify(initialRule?.limitWeekday) : '');
  }, [initialRule, open]);

  const selectedProgramName = useMemo(() => {
    const found = programList.find((p: ProgramListResp) => p.id === selectedProgramId);
    return found?.name || '';
  }, [programList, selectedProgramId]);

  const selectedVersionLabel = useMemo(() => {
    const found = versions.find((v: ProgramVersionResp) => v.deviceProgramId === selectedDeviceProgramId);
    if (!found) return '';
    return `v${found.version} · deviceProgramId=${found.deviceProgramId}`;
  }, [selectedDeviceProgramId, versions]);

  function handleSave() {
    if (effectiveExistingPriorities.includes(priority)) {
      toast.error('Priority already exists in this schedule');
      return;
    }
    if (!selectedReleaseProgramId) {
      toast.error('Please select a published program version (releaseProgramId)');
      return;
    }

    const req: UpsertScheduleContentsRuleReq = {
      id: initialRule?.id ?? undefined,
      type,
      priority,
      releaseProgramId: selectedReleaseProgramId,
    };

    if (ifLimitTime) {
      const parsed = parseJsonOrToast('limitTime', limitTimeText);
      if (parsed == null) return;
      req.ifLimitTime = true;
      req.limitTime = parsed as any;
    }
    if (ifLimitDate) {
      const parsed = parseJsonOrToast('limitDate', limitDateText);
      if (parsed == null) return;
      req.ifLimitDate = true;
      req.limitDate = parsed as any;
    }
    if (ifLimitWeekday) {
      const parsed = parseJsonOrToast('limitWeekday', limitWeekdayText);
      if (parsed == null) return;
      req.ifLimitWeekday = true;
      req.limitWeekday = parsed as any;
    }

    onSave(req);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[780px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit program rule' : 'Add program rule'}</DialogTitle>
          <DialogDescription>
            A contents rule must reference a published version (releaseProgramId = deviceProgramId). Priority must be unique in a schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rotation">Rotation</SelectItem>
                <SelectItem value="spot">Spot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold">Priority</label>
            <Input type="number" value={String(priority)} onChange={(e) => setPriority(Number(e.target.value || '0'))} />
            <p className="text-xs text-muted-foreground">Must be unique per schedule.</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Release program (recommended)</label>
              <span className="text-xs text-muted-foreground">{selectedVersionLabel}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Select
                  value={selectedProgramId || '__none__'}
                  onValueChange={(v) => {
                    const next = v === '__none__' ? '' : v;
                    setSelectedProgramId(next);
                    setSelectedDeviceProgramId(null);
                    setManualReleaseProgramId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {programList.map((p: ProgramListResp) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground truncate">{selectedProgramName || 'Select a program to load versions'}</p>
              </div>

              <div className="space-y-2">
                <Select
                  value={selectedDeviceProgramId ? String(selectedDeviceProgramId) : '__none__'}
                  onValueChange={(v) => {
                    setSelectedDeviceProgramId(v === '__none__' ? null : Number(v));
                    setManualReleaseProgramId('');
                  }}
                  disabled={!selectedProgramId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProgramId ? 'Select a version...' : 'Select program first'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {selectedProgramDetailsQuery.isLoading ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                      </div>
                    ) : (
                      versions.map((v: ProgramVersionResp) => (
                        <SelectItem key={v.deviceProgramId} value={String(v.deviceProgramId)}>
                          v{v.version} · deviceProgramId={v.deviceProgramId}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This saves as releaseProgramId.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold">Or manual releaseProgramId (deviceProgramId)</label>
            <Input value={manualReleaseProgramId} onChange={(e) => setManualReleaseProgramId(e.target.value)} placeholder="e.g. 19099600" />
            <p className="text-xs text-muted-foreground">Use this when program/version list is not available. It must be a published release.</p>
          </div>

          <div className="md:col-span-2 rounded-lg border p-3 space-y-4">
            <div>
              <p className="text-sm font-semibold">Restrictions (advanced)</p>
              <p className="text-xs text-muted-foreground">Keep JSON structure consistent with device protocol.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Limit time</p>
                  <p className="text-xs text-muted-foreground">Example: {`{"start":"08:00:00","end":"18:00:00"}`}</p>
                </div>
                <Switch checked={ifLimitTime} onCheckedChange={setIfLimitTime} />
              </div>
              {ifLimitTime ? <Textarea value={limitTimeText} onChange={(e) => setLimitTimeText(e.target.value)} /> : null}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Limit date</p>
                  <p className="text-xs text-muted-foreground">Example: {`{"start":"2025-12-01","end":"2025-12-31"}`}</p>
                </div>
                <Switch checked={ifLimitDate} onCheckedChange={setIfLimitDate} />
              </div>
              {ifLimitDate ? <Textarea value={limitDateText} onChange={(e) => setLimitDateText(e.target.value)} /> : null}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Limit weekday</p>
                  <p className="text-xs text-muted-foreground">Example: {[true, true, true, true, true, false, false].join(', ')}</p>
                </div>
                <Switch checked={ifLimitWeekday} onCheckedChange={setIfLimitWeekday} />
              </div>
              {ifLimitWeekday ? <Textarea value={limitWeekdayText} onChange={(e) => setLimitWeekdayText(e.target.value)} /> : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

