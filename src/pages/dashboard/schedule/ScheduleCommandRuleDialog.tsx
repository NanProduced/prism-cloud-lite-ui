import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/store/notificationStore';

import type { ScheduleCommandActionType, UpsertScheduleCommandRuleReq } from '@/types/schedule';

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

function normalizeTimeToHms(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const parts = s.split(':').map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const sec = parts.length === 3 ? Number(parts[2]) : 0;
  if (![h, m, sec].every((n) => Number.isInteger(n) && n >= 0)) return null;
  if (h > 23 || m > 59 || sec > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function parseOpTimeInput(raw: string): string[] | null {
  const parts = raw
    .split(',')
    .map((t) => normalizeTimeToHms(t))
    .filter((t): t is string => Boolean(t));
  if (parts.length === 0) return null;
  return Array.from(new Set(parts));
}

function getDefaultBodyByType(type: ScheduleCommandActionType): Record<string, unknown> {
  if (type === 'BRIGHTNESS') return { brightness: 70 };
  if (type === 'VOLUME') return { musicvolume: 50 };
  if (type === 'COLOR_TEMP') return { colortemp: 6500 };
  if (type === 'INPUT_MODE') return { inputmode: 'hdmi' };
  if (type === 'POWER') return { command: 'sleep' };
  return {};
}

export function ScheduleCommandRuleDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRule?: UpsertScheduleCommandRuleReq | null;
  onSave: (req: UpsertScheduleCommandRuleReq) => void;
}) {
  const { open, onOpenChange, initialRule, onSave } = props;

  const [type, setType] = useState<ScheduleCommandActionType>('BRIGHTNESS');
  const [opTimeInput, setOpTimeInput] = useState('08:00');

  const [brightness, setBrightness] = useState<number>(70);
  const [musicVolume, setMusicVolume] = useState<number>(50);
  const [colorTemp, setColorTemp] = useState<number>(6500);
  const [inputMode, setInputMode] = useState<'hdmi' | 'dvi'>('hdmi');
  const [powerCommand, setPowerCommand] = useState<'sleep' | 'wakeup' | 'reboot'>('sleep');

  const [ifLimitDate, setIfLimitDate] = useState(false);
  const [limitDateText, setLimitDateText] = useState('');
  const [ifLimitWeekday, setIfLimitWeekday] = useState(false);
  const [limitWeekdayText, setLimitWeekdayText] = useState('');

  const isEdit = Boolean(initialRule?.id);

  useEffect(() => {
    if (!open) return;

    const ruleType = initialRule?.operation?.type || 'BRIGHTNESS';
    setType(ruleType);
    setOpTimeInput((initialRule?.opTime || []).join(', ') || '08:00');

    const body = (initialRule?.operation?.body || {}) as Record<string, unknown>;
    setBrightness(typeof body.brightness === 'number' ? body.brightness : 70);
    setMusicVolume(typeof body.musicvolume === 'number' ? body.musicvolume : typeof body.volume === 'number' ? body.volume : 50);
    setColorTemp(typeof body.colortemp === 'number' ? body.colortemp : 6500);
    setInputMode(body.inputmode === 'dvi' ? 'dvi' : 'hdmi');
    setPowerCommand(body.command === 'wakeup' ? 'wakeup' : body.command === 'reboot' ? 'reboot' : 'sleep');

    setIfLimitDate(Boolean(initialRule?.ifLimitDate));
    setLimitDateText(initialRule?.ifLimitDate ? safeJsonStringify(initialRule.limitDate) : '');
    setIfLimitWeekday(Boolean(initialRule?.ifLimitWeekday));
    setLimitWeekdayText(initialRule?.ifLimitWeekday ? safeJsonStringify(initialRule.limitWeekday) : '');
  }, [initialRule, open]);

  const previewBody = useMemo(() => {
    if (type === 'BRIGHTNESS') return { brightness };
    if (type === 'VOLUME') return { musicvolume: musicVolume };
    if (type === 'COLOR_TEMP') return { colortemp: colorTemp };
    if (type === 'INPUT_MODE') return { inputmode: inputMode };
    if (type === 'POWER') return { command: powerCommand };
    return {};
  }, [brightness, colorTemp, inputMode, musicVolume, powerCommand, type]);

  function handleTypeChange(next: ScheduleCommandActionType) {
    setType(next);
    if (!initialRule) {
      const defaults = getDefaultBodyByType(next);
      if (next === 'BRIGHTNESS' && typeof defaults.brightness === 'number') setBrightness(defaults.brightness);
      if (next === 'VOLUME' && typeof defaults.musicvolume === 'number') setMusicVolume(defaults.musicvolume);
      if (next === 'COLOR_TEMP' && typeof defaults.colortemp === 'number') setColorTemp(defaults.colortemp);
      if (next === 'INPUT_MODE' && (defaults.inputmode === 'hdmi' || defaults.inputmode === 'dvi')) setInputMode(defaults.inputmode);
      if (next === 'POWER' && (defaults.command === 'sleep' || defaults.command === 'wakeup' || defaults.command === 'reboot')) setPowerCommand(defaults.command);
    }
  }

  function handleSave() {
    const opTime = parseOpTimeInput(opTimeInput);
    if (!opTime) {
      toast.error('Invalid opTime, example: 08:00, 18:30:00');
      return;
    }

    const req: UpsertScheduleCommandRuleReq = {
      id: initialRule?.id ?? undefined,
      operation: { type, body: previewBody },
      opTime,
    };

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
      <DialogContent className="max-w-[760px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit command rule' : 'Add command rule'}</DialogTitle>
          <DialogDescription>
            UI submits operation + opTime only. Payload JSON is generated by backend (raw payload editing is not supported).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold">Action type</label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRIGHTNESS">Brightness</SelectItem>
                <SelectItem value="VOLUME">Volume</SelectItem>
                <SelectItem value="COLOR_TEMP">Color temperature</SelectItem>
                <SelectItem value="INPUT_MODE">Input mode</SelectItem>
                <SelectItem value="POWER">Power</SelectItem>
                <SelectItem value="CLEAR_CACHE">Clear cache</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold">opTime (comma separated)</label>
            <Input value={opTimeInput} onChange={(e) => setOpTimeInput(e.target.value)} placeholder="08:00, 12:00, 18:00" />
            <p className="text-xs text-muted-foreground">Accepts HH:mm or HH:mm:ss.</p>
          </div>

          {type === 'BRIGHTNESS' ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold">Brightness (0-100)</label>
              <Input type="number" value={String(brightness)} onChange={(e) => setBrightness(Number(e.target.value || '0'))} />
            </div>
          ) : null}

          {type === 'VOLUME' ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold">Music volume (0-100)</label>
              <Input type="number" value={String(musicVolume)} onChange={(e) => setMusicVolume(Number(e.target.value || '0'))} />
            </div>
          ) : null}

          {type === 'COLOR_TEMP' ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold">Color temperature</label>
              <Input type="number" value={String(colorTemp)} onChange={(e) => setColorTemp(Number(e.target.value || '0'))} />
            </div>
          ) : null}

          {type === 'INPUT_MODE' ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold">Input mode</label>
              <Select value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hdmi">HDMI</SelectItem>
                  <SelectItem value="dvi">DVI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {type === 'POWER' ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold">Command</label>
              <Select value={powerCommand} onValueChange={(v) => setPowerCommand(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select command..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sleep">Sleep</SelectItem>
                  <SelectItem value="wakeup">Wake up</SelectItem>
                  <SelectItem value="reboot">Reboot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {type === 'CLEAR_CACHE' ? (
            <div className="md:col-span-2 rounded-lg border p-3">
              <p className="text-sm font-semibold">Clear cache</p>
              <p className="text-xs text-muted-foreground">No parameters.</p>
            </div>
          ) : null}

          <div className="md:col-span-2 rounded-lg border p-3 space-y-4">
            <div>
              <p className="text-sm font-semibold">Restrictions (advanced)</p>
              <p className="text-xs text-muted-foreground">Keep JSON structure consistent with device protocol.</p>
            </div>

            <div className="space-y-3">
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

          <div className="md:col-span-2 rounded-lg border p-3">
            <p className="text-xs font-semibold mb-2">Operation preview</p>
            <pre className="text-xs bg-muted/30 rounded p-2 overflow-auto">
              {safeJsonStringify({ type, body: previewBody, opTime: parseOpTimeInput(opTimeInput) })}
            </pre>
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

