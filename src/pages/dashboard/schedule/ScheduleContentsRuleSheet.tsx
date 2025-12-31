import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/store/notificationStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getPrograms, getProgramDetails } from '@/services/programApi';
import type { ProgramListResp, ProgramVersionResp } from '@/types/program';
import type { ScheduleContentsRuleResp, UpsertScheduleContentsRuleReq } from '@/types/schedule';
import { WeekdaySelector } from '@/components/schedule/WeekdaySelector';

// Helpers for Date Input (Using native for MVP)
function dateToString(d: string | undefined) {
    return d || "";
}

const WEEKDAY_MAP: Record<string, number> = {
  "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6
};
const WEEKDAY_REV = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function ScheduleContentsRuleSheet(props: {
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

  // New UI State
  const [ifLimitTime, setIfLimitTime] = useState(false);
  const [limitTime, setLimitTime] = useState<{ start: string; end: string }>({ start: '08:00:00', end: '18:00:00' });
  
  const [ifLimitDate, setIfLimitDate] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: "", end: "" });
  
  const [ifLimitWeekday, setIfLimitWeekday] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([]);

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

  // Load Initial State
  useEffect(() => {
    if (!open) return;
    
    // Core Props
    setType((initialRule?.type as any) || 'rotation');
    setPriority(initialRule?.priority ?? 1);
    setManualReleaseProgramId(initialRule?.releaseProgramId ? String(initialRule.releaseProgramId) : '');
    setSelectedProgramId(initialRule?.programId || '');
    setSelectedDeviceProgramId(initialRule?.releaseProgramId ?? null);

    // Limit Time
    setIfLimitTime(Boolean(initialRule?.ifLimitTime));
    if (initialRule?.limitTime && typeof initialRule.limitTime === 'object' && !Array.isArray(initialRule.limitTime)) {
        const t = initialRule.limitTime as any;
        setLimitTime({ start: t.start || "08:00:00", end: t.end || "18:00:00" });
    } else {
        setLimitTime({ start: "08:00:00", end: "18:00:00" });
    }

    // Limit Date
    setIfLimitDate(Boolean(initialRule?.ifLimitDate));
    if (initialRule?.limitDate && typeof initialRule.limitDate === 'object') {
        const d = initialRule.limitDate as any;
        setDateRange({ start: d.start || "", end: d.end || "" });
    } else {
        setDateRange({ start: "", end: "" });
    }

    // Limit Weekday
    setIfLimitWeekday(Boolean(initialRule?.ifLimitWeekday));
    if (initialRule?.limitWeekday && Array.isArray(initialRule.limitWeekday)) {
        const raw = initialRule.limitWeekday as any as string[];
        const nums = raw.map(s => WEEKDAY_MAP[s] ?? -1).filter(n => n >= 0);
        setWeekdays(nums);
    } else {
        setWeekdays([1, 2, 3, 4, 5]); // Default workdays
    }
    
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
      toast.error('Please select a published program version');
      return;
    }

    const req: UpsertScheduleContentsRuleReq = {
      id: initialRule?.id ?? undefined,
      type,
      priority,
      releaseProgramId: selectedReleaseProgramId,
    };

    if (ifLimitTime) {
      if (!limitTime.start || !limitTime.end) {
         toast.error("Please set start and end time");
         return;
      }
      req.ifLimitTime = true;
      req.limitTime = limitTime as any;
    }
    
    if (ifLimitDate) {
      if (!dateRange.start || !dateRange.end) {
          toast.error("Please select start and end dates");
          return;
      }
      req.ifLimitDate = true;
      req.limitDate = dateRange as any;
    }
    
    if (ifLimitWeekday) {
       if (weekdays.length === 0) {
           toast.error("Please select at least one weekday");
           return;
       }
       req.ifLimitWeekday = true;
       req.limitWeekday = weekdays.map(n => WEEKDAY_REV[n]);
    }

    onSave(req);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Rule' : 'Add Rule'}</SheetTitle>
          <SheetDescription>
            Configure what to play and when.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
            
          {/* Section 1: Content */}
          <div className="space-y-4">
             <h3 className="text-sm font-medium leading-none text-primary">1. Content Strategy</h3>
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-semibold">Mode</label>
                    <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full">
                        <TabsList className="w-full">
                            <TabsTrigger value="rotation" className="flex-1">Rotation</TabsTrigger>
                            <TabsTrigger value="spot" className="flex-1">Spot</TabsTrigger>
                        </TabsList>
                    </Tabs>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-semibold">Priority</label>
                    <Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
                 </div>
             </div>
             
             <div className="space-y-2">
                <label className="text-xs font-semibold">Program</label>
                <Select
                  value={selectedProgramId || '__none__'}
                  onValueChange={(v) => {
                    const next = v === '__none__' ? '' : v;
                    setSelectedProgramId(next);
                    setSelectedDeviceProgramId(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                     {programList.map((p: ProgramListResp) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             
             {selectedProgramId && (
                 <div className="space-y-2">
                    <label className="text-xs font-semibold">Version</label>
                    <Select
                      value={selectedDeviceProgramId ? String(selectedDeviceProgramId) : '__none__'}
                      onValueChange={(v) => setSelectedDeviceProgramId(v === '__none__' ? null : Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Version" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((v: ProgramVersionResp) => (
                            <SelectItem key={v.deviceProgramId} value={String(v.deviceProgramId)}>
                              v{v.version} ({new Date(v.createdAt).toLocaleDateString()})
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
             )}
          </div>

          <div className="h-[1px] bg-border" />

          {/* Section 2: Time Constraints */}
          <div className="space-y-6">
             <h3 className="text-sm font-medium leading-none text-primary">2. Playback Constraints</h3>
             
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

             {/* Time Range */}
             <div className="space-y-3 rounded-lg border p-3">
                 <div className="flex items-center justify-between">
                     <label className="text-sm font-medium">Daily Time Range</label>
                     <Switch checked={ifLimitTime} onCheckedChange={setIfLimitTime} />
                 </div>
                 {ifLimitTime && (
                     <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Start</span>
                            <Input type="time" step="1" value={limitTime.start} onChange={(e) => setLimitTime(prev => ({ ...prev, start: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">End</span>
                            <Input type="time" step="1" value={limitTime.end} onChange={(e) => setLimitTime(prev => ({ ...prev, end: e.target.value }))} />
                        </div>
                     </div>
                 )}
             </div>

          </div>
        </div>

        <SheetFooter>
           <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handleSave}>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
