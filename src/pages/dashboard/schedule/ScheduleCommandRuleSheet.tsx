import { useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';

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

const WEEKDAY_MAP: Record<string, number> = {
  "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6
};
const WEEKDAY_REV = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Action Types map
const ACTION_TYPES: ScheduleCommandActionType[] = [
    'BRIGHTNESS', 'VOLUME', 'POWER', 'CLEAR_CACHE', 'INPUT_MODE', 'COLOR_TEMP'
] as any;

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
  const [powerState, setPowerState] = useState<'on' | 'off' | 'reboot'>('on');
  const [inputSource, setInputSource] = useState('HDMI-1');
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
        setPowerState('on');
        return;
    }

    // Load
    setActionType(initialRule.operation.type);
    setOpTimes(initialRule.opTime || []);
    
    // Parse Params
    const body: any = initialRule.operation.body || {};
    if (initialRule.operation.type === 'BRIGHTNESS') setBrightness(body.brightness ?? 50);
    if (initialRule.operation.type === 'VOLUME') setVolume(body.volume ?? 50);
    if (initialRule.operation.type === 'POWER') setPowerState(body.action ?? 'on');
    if (initialRule.operation.type === 'INPUT_MODE') setInputSource(body.source ?? 'HDMI-1');
    if (initialRule.operation.type === 'COLOR_TEMP') setColorTemp(body.value ?? 6500);

    // Limits
    setIfLimitDate(Boolean(initialRule.ifLimitDate));
    if (initialRule.limitDate && typeof initialRule.limitDate === 'object') {
        const d = initialRule.limitDate as any;
        setDateRange({ start: d.start || "", end: d.end || "" });
    }
    setIfLimitWeekday(Boolean(initialRule.ifLimitWeekday));
    if (initialRule.limitWeekday && Array.isArray(initialRule.limitWeekday)) {
        const raw = initialRule.limitWeekday as any as string[];
        const nums = raw.map(s => WEEKDAY_MAP[s] ?? -1).filter(n => n >= 0);
        setWeekdays(nums);
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
      if (actionType === 'BRIGHTNESS') body = { brightness };
      else if (actionType === 'VOLUME') body = { volume };
      else if (actionType === 'POWER') body = { action: powerState }; // Protocol detail: 'reboot' might be separate type or action
      else if (actionType === 'INPUT_MODE') body = { source: inputSource };
      else if (actionType === 'COLOR_TEMP') body = { value: colorTemp };
      else if (actionType === 'CLEAR_CACHE') body = {};

      // Handle Power/Reboot ambiguity
      // If type is POWER, usually action is "on" or "off". Reboot is often type="REBOOT".
      // Assuming user wants to map "reboot" to type="REBOOT" if they selected it in POWER UI?
      // Or keep strictly to type.
      // Let's assume strict type. If user selected REBOOT type, body is empty.

      const req: UpsertScheduleCommandRuleReq = {
          id: initialRule?.id,
          operation: {
              type: actionType,
              body
          },
          opTime: opTimes,
      };

      if (ifLimitDate) {
          if (!dateRange.start || !dateRange.end) { toast.error("Start/End date required"); return; }
          req.ifLimitDate = true;
          req.limitDate = dateRange as any;
      }

      if (ifLimitWeekday) {
          if (weekdays.length === 0) { toast.error("Weekdays required"); return; }
          req.ifLimitWeekday = true;
          req.limitWeekday = weekdays.map(n => WEEKDAY_REV[n]);
      }

      onSave(req);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Command Rule' : 'Add Command Rule'}</SheetTitle>
          <SheetDescription>
            Schedule device actions (Power, Brightness, etc.)
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
            
            {/* 1. Action Config */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-primary">1. Action Configuration</h3>
                
                <div className="space-y-2">
                    <label className="text-xs font-semibold">Action Type</label>
                    <Select value={actionType} onValueChange={(v) => setActionType(v as any)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BRIGHTNESS">Set Brightness</SelectItem>
                            <SelectItem value="VOLUME">Set Volume</SelectItem>
                            <SelectItem value="POWER">Power Control</SelectItem>
                            <SelectItem value="INPUT_MODE">Switch Input</SelectItem>
                            <SelectItem value="COLOR_TEMP">Color Temperature</SelectItem>
                            <SelectItem value="CLEAR_CACHE">Clear Cache</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-md border p-4 bg-muted/10">
                    {actionType === 'BRIGHTNESS' && (
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium">Brightness Level</label>
                                <span className="text-sm font-mono">{brightness}%</span>
                            </div>
                            <Slider value={[brightness]} onValueChange={([v]) => setBrightness(v)} max={100} step={1} />
                        </div>
                    )}
                    {actionType === 'VOLUME' && (
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium">Volume Level</label>
                                <span className="text-sm font-mono">{volume}%</span>
                            </div>
                            <Slider value={[volume]} onValueChange={([v]) => setVolume(v)} max={100} step={1} />
                        </div>
                    )}
                    {actionType === 'POWER' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Power Action</label>
                            <Tabs value={powerState} onValueChange={(v) => setPowerState(v as any)}>
                                <TabsList className="w-full">
                                    <TabsTrigger value="on" className="flex-1">Turn On</TabsTrigger>
                                    <TabsTrigger value="off" className="flex-1">Turn Off</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    )}
                    {actionType === 'INPUT_MODE' && (
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Input Source Name</label>
                             <Input value={inputSource} onChange={e => setInputSource(e.target.value)} placeholder="e.g. HDMI-1" />
                        </div>
                    )}
                    {actionType === 'CLEAR_CACHE' && (
                        <p className="text-sm text-muted-foreground">No additional parameters required.</p>
                    )}
                </div>
            </div>

            <div className="h-[1px] bg-border" />

            {/* 2. Time Config */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-primary">2. Execution Time</h3>
                <div className="space-y-2">
                    {opTimes.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="time" 
                                    step="1" 
                                    value={t.slice(0, 5)} 
                                    onChange={(e) => updateOpTime(idx, e.target.value)} 
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeOpTime(idx)} className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addOpTime} className="w-full border-dashed">
                        <Plus className="h-4 w-4 mr-2" /> Add execution time
                    </Button>
                </div>
            </div>

            {/* 3. Conditions */}
             <div className="space-y-4">
                <h3 className="text-sm font-medium text-primary">3. Conditions (Optional)</h3>
                
                {/* Date Range */}
                 <div className="space-y-3 rounded-lg border p-3">
                     <div className="flex items-center justify-between">
                         <label className="text-sm font-medium">Valid Date Range</label>
                         <Switch checked={ifLimitDate} onCheckedChange={setIfLimitDate} />
                     </div>
                     {ifLimitDate && (
                         <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Start</span>
                                <Input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">End</span>
                                <Input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
                            </div>
                         </div>
                     )}
                 </div>

                 {/* Weekday */}
                 <div className="space-y-3 rounded-lg border p-3">
                     <div className="flex items-center justify-between">
                         <label className="text-sm font-medium">Weekly Recurrence</label>
                         <Switch checked={ifLimitWeekday} onCheckedChange={setIfLimitWeekday} />
                     </div>
                     {ifLimitWeekday && (
                         <WeekdaySelector value={weekdays} onChange={setWeekdays} />
                     )}
                 </div>
            </div>

        </div>

        <SheetFooter>
           <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handleSave}>Save Command</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
