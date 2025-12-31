import { useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from '@/store/notificationStore';

import type { UpsertScheduleCommandRuleReq, ScheduleCommandActionType } from '@/types/schedule';
import { WeekdaySelector } from '@/components/schedule/WeekdaySelector';
import { cn } from '@/lib/utils';

const WEEKDAY_MAP: Record<string, number> = {
  "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6
};
const WEEKDAY_REV = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function ScheduleCommandRuleSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRule?: UpsertScheduleCommandRuleReq | null;
  onSave: (req: UpsertScheduleCommandRuleReq) => void;
}) {
  const { open, onOpenChange, initialRule, onSave } = props;
  const isEdit = Boolean(initialRule?.id);

  // Core State
  const [actionType, setActionType] = useState<ScheduleCommandActionType>('BRIGHTNESS');
  const [opTimes, setOpTimes] = useState<string[]>([]);
  
  // Params State
  const [brightness, setBrightness] = useState(50);
  const [volume, setVolume] = useState(50);
  const [powerState, setPowerState] = useState<'wakeup' | 'sleep' | 'reboot'>('wakeup');
  const [inputSource, setInputSource] = useState('hdmi');
  const [colorTemp, setColorTemp] = useState(6500);

  // Limits State
  const [ifLimitDate, setIfLimitDate] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: "", end: "" });
  const [ifLimitWeekday, setIfLimitWeekday] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([]);

  // Load Initial State
  useEffect(() => {
    if (!open) return;
    
    // Default
    if (!initialRule) {
        setActionType('BRIGHTNESS');
        setOpTimes(["08:00:00"]);
        setBrightness(50);
        setVolume(50);
        setPowerState('wakeup');
        setInputSource('hdmi');
        setIfLimitDate(false);
        setIfLimitWeekday(false);
        return;
    }

    // Load
    setActionType(initialRule.operation.type);
    setOpTimes(initialRule.opTime || []);
    
    // Parse Params
    const body: any = initialRule.operation.body || {};
    if (initialRule.operation.type === 'BRIGHTNESS') setBrightness(Math.round((body.brightness ?? 0) / 255 * 100));
    if (initialRule.operation.type === 'VOLUME') setVolume(Math.round((body.musicvolume ?? 0) / 15 * 100));
    if (initialRule.operation.type === 'POWER') setPowerState(body.command || 'wakeup');
    if (initialRule.operation.type === 'INPUT_MODE') setInputSource(body.inputmode ?? 'hdmi');
    if (initialRule.operation.type === 'COLOR_TEMP') setColorTemp(body.colortemp ?? 6500);

    // Limits
    setIfLimitDate(Boolean(initialRule.ifLimitDate));
    if (initialRule.limitDate && typeof initialRule.limitDate === 'object') {
        const d = initialRule.limitDate as any;
        setDateRange({ start: d.start || "", end: d.end || "" });
    }
    setIfLimitWeekday(Boolean(initialRule.ifLimitWeekday));
    if (initialRule.limitWeekday && Array.isArray(initialRule.limitWeekday)) {
        const raw = initialRule.limitWeekday as any[];
        if (raw.length === 7 && typeof raw[0] === 'boolean') {
            const nums = raw.map((b, i) => b ? i : -1).filter(n => n >= 0);
            setWeekdays(nums);
        } else {
            const nums = raw.map(s => WEEKDAY_MAP[s] ?? -1).filter(n => n >= 0);
            setWeekdays(nums);
        }
    }

  }, [initialRule, open]);

  // Handlers
  const addOpTime = () => setOpTimes([...opTimes, "00:00:00"]);
  const removeOpTime = (idx: number) => setOpTimes(opTimes.filter((_, i) => i !== idx));
  const updateOpTime = (idx: number, val: string) => {
      const next = [...opTimes];
      next[idx] = val.length === 5 ? val + ":00" : val;
      setOpTimes(next);
  };

  function handleSave() {
      if (opTimes.length === 0) {
          toast.error("At least one execution time is required");
          return;
      }

      // Build Body
      let body: any = {};
      if (actionType === 'BRIGHTNESS') {
          body = { brightness: Math.round((brightness / 100) * 255) };
      }
      else if (actionType === 'VOLUME') {
          body = { musicvolume: Math.round((volume / 100) * 15) };
      }
      else if (actionType === 'POWER') {
          body = { command: powerState };
      }
      else if (actionType === 'INPUT_MODE') {
          body = { inputmode: inputSource };
      }
      else if (actionType === 'COLOR_TEMP') {
          body = { colortemp: colorTemp };
      }
      else if (actionType === 'CLEAR_CACHE') {
          body = {};
      }

      const req: UpsertScheduleCommandRuleReq = {
          id: initialRule?.id,
          operation: {
              type: actionType,
              body
          },
          opTime: opTimes,
          ifLimitDate,
          ifLimitWeekday,
      };

      if (ifLimitDate) {
          if (!dateRange.start || !dateRange.end) { toast.error("Start/End date required"); return; }
          req.limitDate = dateRange as any;
      } else {
          req.limitDate = null;
      }

      if (ifLimitWeekday) {
          if (weekdays.length === 0) { toast.error("Weekdays required"); return; }
          const boolArr = new Array(7).fill(false);
          weekdays.forEach(n => { if(n>=0 && n<7) boolArr[n] = true; });
          req.limitWeekday = boolArr;
      } else {
          req.limitWeekday = null;
      }

      onSave(req);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit command rule' : 'Add command rule'}</SheetTitle>
          <SheetDescription>
            Schedule device actions like Power, Brightness, and Volume.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
            
            {/* 1. Action Config */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-primary">1. Action configuration</h3>
                
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Action type</label>
                    <Select value={actionType} onValueChange={(v) => setActionType(v as any)}>
                        <SelectTrigger className="h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BRIGHTNESS">Set brightness</SelectItem>
                            <SelectItem value="VOLUME">Set volume</SelectItem>
                            <SelectItem value="POWER">Power control</SelectItem>
                            <SelectItem value="INPUT_MODE">Switch input</SelectItem>
                            <SelectItem value="COLOR_TEMP">Color temperature</SelectItem>
                            <SelectItem value="CLEAR_CACHE">Clear cache</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-xl border p-5 bg-muted/10 space-y-4">
                    {actionType === 'BRIGHTNESS' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold">Brightness level</label>
                                <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{brightness}%</span>
                            </div>
                            <Slider value={[brightness]} onValueChange={([v]) => setBrightness(v)} max={100} step={1} />
                        </div>
                    )}
                    {actionType === 'VOLUME' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold">Volume level</label>
                                <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{volume}%</span>
                            </div>
                            <Slider value={[volume]} onValueChange={([v]) => setVolume(v)} max={100} step={1} />
                        </div>
                    )}
                    {actionType === 'POWER' && (
                        <div className="space-y-3">
                            <label className="text-sm font-semibold">Power action</label>
                            <Tabs value={powerState} onValueChange={(v) => setPowerState(v as any)} className="w-full">
                                <TabsList className="w-full h-11 bg-muted/50 p-1">
                                    <TabsTrigger value="wakeup" className="flex-1 rounded-lg">Wake up</TabsTrigger>
                                    <TabsTrigger value="sleep" className="flex-1 rounded-lg">Sleep</TabsTrigger>
                                    <TabsTrigger value="reboot" className="flex-1 rounded-lg text-rose-600 font-semibold">Reboot</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    )}
                    {actionType === 'INPUT_MODE' && (
                        <div className="space-y-3">
                             <label className="text-sm font-semibold">Input source</label>
                             <Select value={inputSource} onValueChange={setInputSource}>
                                <SelectTrigger className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hdmi">HDMI</SelectItem>
                                    <SelectItem value="dvi">DVI</SelectItem>
                                </SelectContent>
                             </Select>
                        </div>
                    )}
                    {actionType === 'COLOR_TEMP' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold">Color temperature</label>
                                <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{colorTemp}K</span>
                            </div>
                            <Slider value={[colorTemp]} onValueChange={([v]) => setColorTemp(v)} min={2000} max={10000} step={100} />
                        </div>
                    )}
                    {actionType === 'CLEAR_CACHE' && (
                        <div className="flex items-center gap-3 text-muted-foreground py-2">
                            <Trash2 className="h-5 w-5 opacity-50" />
                            <p className="text-sm text-balance leading-relaxed">This action will clear all unused cached assets on the device at the scheduled time.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-px bg-border" />

            {/* 2. Time Config */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-primary">2. Execution time</h3>
                <div className="space-y-3">
                    {opTimes.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-3 group">
                            <div className="relative flex-1">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="time" 
                                    step="1" 
                                    value={t.slice(0, 5)} 
                                    onChange={(e) => updateOpTime(idx, e.target.value)} 
                                    className="pl-10 h-11 rounded-xl bg-muted/20 border-transparent focus:bg-background"
                                />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeOpTime(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addOpTime} className="w-full h-11 border-dashed rounded-xl gap-2 text-muted-foreground hover:text-primary">
                        <Plus className="h-4 w-4" /> Add execution time
                    </Button>
                </div>
            </div>

            <div className="h-px bg-border" />

            {/* 3. Conditions */}
             <div className="space-y-6">
                <h3 className="text-sm font-medium text-primary">3. Conditions (Optional)</h3>
                
                {/* Date Range */}
                 <div className="space-y-4 rounded-xl border p-4 bg-muted/5">
                     <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <label className="text-sm font-semibold">Valid date range</label>
                            <p className="text-xs text-muted-foreground">Action only triggers within this period.</p>
                         </div>
                         <Switch checked={ifLimitDate} onCheckedChange={setIfLimitDate} />
                     </div>
                     {ifLimitDate && (
                         <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Start date</span>
                                <Input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="rounded-lg h-10" />
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase pl-1">End date</span>
                                <Input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="rounded-lg h-10" />
                            </div>
                         </div>
                     )}
                 </div>

                 {/* Weekday */}
                 <div className="space-y-4 rounded-xl border p-4 bg-muted/5">
                     <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <label className="text-sm font-semibold">Weekly recurrence</label>
                            <p className="text-xs text-muted-foreground">Specify days of the week.</p>
                         </div>
                         <Switch checked={ifLimitWeekday} onCheckedChange={setIfLimitWeekday} />
                     </div>
                     {ifLimitWeekday && (
                         <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <WeekdaySelector value={weekdays} onChange={setWeekdays} />
                         </div>
                     )}
                 </div>
            </div>

        </div>

        <SheetFooter className="gap-3 pt-4 border-t mt-4">
           <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-11 px-8 font-semibold">Cancel</Button>
           <Button onClick={handleSave} className="h-11 px-10 font-bold shadow-lg shadow-primary/20">Save command</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}