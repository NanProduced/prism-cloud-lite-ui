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
import { DatePicker, TimePicker } from '@/components/schedule/SchedulePickers';
import { useTranslation } from 'react-i18next';

// Note: Weekday index follows backend convention: 0=Mon, 1=Tue, ..., 6=Sun
// See docs/integration/program-and-schedule.md for details

export function ScheduleContentsRuleSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRule?: ScheduleContentsRuleResp | null;
  existingPriorities: number[];
  existingRules: ScheduleContentsRuleResp[];
  onSave: (req: UpsertScheduleContentsRuleReq) => void;
}) {
  const { t } = useTranslation();
  const { open, onOpenChange, initialRule, existingPriorities, existingRules, onSave } = props;

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

  const programVersionLock = useMemo(() => {
    if (!selectedProgramId) return null;
    const others = (existingRules || []).filter((r) => r.programId === selectedProgramId && r.id !== initialRule?.id);
    if (others.length === 0) return null;
    return {
      lockedReleaseProgramId: others[0].releaseProgramId,
      lockedReleaseVersion: others[0].releaseVersion ?? null,
    };
  }, [existingRules, initialRule?.id, selectedProgramId]);

  const selectedReleaseProgramId = useMemo(() => {
    if (manualReleaseProgramId.trim()) {
      const n = Number(manualReleaseProgramId);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    return selectedDeviceProgramId && selectedDeviceProgramId > 0 ? selectedDeviceProgramId : null;
  }, [manualReleaseProgramId, selectedDeviceProgramId]);

  useEffect(() => {
    if (!open) return;
    if (!programVersionLock) return;
    if (selectedDeviceProgramId !== programVersionLock.lockedReleaseProgramId) {
      setSelectedDeviceProgramId(programVersionLock.lockedReleaseProgramId);
    }
  }, [open, programVersionLock, selectedDeviceProgramId]);

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
    }
    else {
        setLimitTime({ start: "08:00:00", end: "18:00:00" });
    }

    // Limit Date
    setIfLimitDate(Boolean(initialRule?.ifLimitDate));
    if (initialRule?.limitDate && typeof initialRule.limitDate === 'object') {
        const d = initialRule.limitDate as any;
        setDateRange({ start: d.start || "", end: d.end || "" });
    }
    else {
        setDateRange({ start: "", end: "" });
    }

    // Limit Weekday (backend convention: 0=Mon, 1=Tue, ..., 6=Sun)
    setIfLimitWeekday(Boolean(initialRule?.ifLimitWeekday));
    if (initialRule?.limitWeekday && Array.isArray(initialRule.limitWeekday)) {
        const raw = initialRule.limitWeekday as boolean[];
        if (raw.length === 7 && typeof raw[0] === 'boolean') {
            // Backend boolean[7] format: index 0=Mon, 6=Sun
            const nums = raw.map((b, i) => b ? i : -1).filter(n => n >= 0);
            setWeekdays(nums);
        }
        else {
            setWeekdays([]);
        }
    }
    else {
        // Default to workdays: Mon(0), Tue(1), Wed(2), Thu(3), Fri(4)
        setWeekdays([0, 1, 2, 3, 4]);
    }
    
  }, [initialRule, open]);

  const selectedProgramName = useMemo(() => {
    const found = programList.find((p: ProgramListResp) => p.id === selectedProgramId);
    return found?.name || '';
  }, [programList, selectedProgramId]);

  const selectedVersionLabel = useMemo(() => {
    const found = versions.find((v: ProgramVersionResp) => v.deviceProgramId === selectedDeviceProgramId);
    if (!found) return '';
    return `v${found.version}`;
  }, [selectedDeviceProgramId, versions]);

  function handleSave() {
    if (effectiveExistingPriorities.includes(priority)) {
      toast.error(t('schedules.details.contentsRule.toasts.priorityExists'));
      return;
    }
    if (!Number.isFinite(priority) || priority < 0) {
      toast.error(t('schedules.details.contentsRule.toasts.priorityInvalid'));
      return;
    }
    if (!selectedReleaseProgramId) {
      toast.error(t('schedules.details.contentsRule.toasts.selectVersion'));
      return;
    }
    if (programVersionLock && selectedReleaseProgramId !== programVersionLock.lockedReleaseProgramId) {
      toast.error(t('schedules.details.contentsRule.toasts.versionConflict'));
      return;
    }

    const req: UpsertScheduleContentsRuleReq = {
      id: initialRule?.id ?? undefined,
      type,
      priority,
      releaseProgramId: selectedReleaseProgramId,
      ifLimitTime,
      ifLimitDate,
      ifLimitWeekday,
    };

    if (ifLimitTime) {
      if (!limitTime.start || !limitTime.end) {
         toast.error(t('schedules.details.contentsRule.toasts.setTime'));
         return;
      }
      req.limitTime = {
          start: limitTime.start.length === 5 ? limitTime.start + ":00" : limitTime.start,
          end: limitTime.end.length === 5 ? limitTime.end + ":00" : limitTime.end
      };
    }
    else {
      req.limitTime = null;
    }
    
    if (ifLimitDate) {
      if (!dateRange.start || !dateRange.end) {
          toast.error(t('schedules.details.contentsRule.toasts.setDates'));
          return;
      }
      req.limitDate = dateRange as any;
    }
    else {
      req.limitDate = null;
    }
    
    if (ifLimitWeekday) {
       if (weekdays.length === 0) {
           toast.error(t('schedules.details.contentsRule.toasts.setWeekday'));
           return;
       }
       const boolArr = new Array(7).fill(false);
       weekdays.forEach(n => { if(n>=0 && n<7) boolArr[n] = true; });
       req.limitWeekday = boolArr;
    }
    else {
       req.limitWeekday = null;
    }

    onSave(req);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? t('schedules.details.contentsRule.editTitle') : t('schedules.details.contentsRule.addTitle')}</SheetTitle>
          <SheetDescription>
            {t('schedules.details.contentsRule.subtitle')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
            
          {/* Section 1: Content */}
          <div className="space-y-4">
             <h3 className="text-sm font-medium leading-none text-primary">{t('schedules.details.contentsRule.content.title')}</h3>
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">{t('schedules.details.contentsRule.content.mode')}</label>
                    <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full">
                        <TabsList className="w-full h-11 bg-muted/50 p-1">
                            <TabsTrigger value="rotation" className="flex-1 rounded-lg">{t('schedules.details.programRules.rotation')}</TabsTrigger>
                            <TabsTrigger value="spot" className="flex-1 rounded-lg">{t('schedules.details.programRules.spot')}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">{t('schedules.details.contentsRule.content.priority')}</label>
                    <Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="h-11 rounded-xl" />
                 </div>
             </div>
             
             <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">{t('schedules.details.contentsRule.content.program')}</label>
                <Select
                  value={selectedProgramId || '__none__'}
                  onValueChange={(v) => {
                    const next = v === '__none__' ? '' : v;
                    setSelectedProgramId(next);
                    setSelectedDeviceProgramId(null);
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t('schedules.details.contentsRule.content.selectProgram')} />
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
                     <label className="text-xs font-semibold text-muted-foreground">{t('schedules.details.contentsRule.content.version')}</label>
                     <Select
                       value={selectedDeviceProgramId ? String(selectedDeviceProgramId) : '__none__'}
                       onValueChange={(v) => setSelectedDeviceProgramId(v === '__none__' ? null : Number(v))}
                       disabled={Boolean(programVersionLock)}
                     >
                       <SelectTrigger className="h-11">
                         <SelectValue placeholder={t('schedules.details.contentsRule.content.selectVersion')} />
                       </SelectTrigger>
                       <SelectContent>
                         {versions.map((v: ProgramVersionResp) => (
                             <SelectItem key={v.deviceProgramId} value={String(v.deviceProgramId)}>
                               v{v.version} ({new Date(v.createdAt).toLocaleDateString()})
                             </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     {programVersionLock ? (
                       <p className="text-[11px] text-muted-foreground">
                         {t('schedules.details.contentsRule.content.lockedDesc', { version: programVersionLock.lockedReleaseVersion != null ? `v${programVersionLock.lockedReleaseVersion}` : t('schedules.list.table.enabled') })}
                       </p>
                     ) : null}
                  </div>
              )}
          </div>

          <div className="h-px bg-border" />

          {/* Section 2: Time Constraints */}
          <div className="space-y-6">
             <h3 className="text-sm font-medium leading-none text-primary">{t('schedules.details.contentsRule.constraints.title')}</h3>
             
             {/* Date Range */}
             <div className="space-y-4 rounded-xl border p-4 bg-muted/5">
                 <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                        <label className="text-sm font-semibold">{t('schedules.details.contentsRule.constraints.date.title')}</label>
                        <p className="text-xs text-muted-foreground">{t('schedules.details.contentsRule.constraints.date.desc')}</p>
                     </div>
                     <Switch checked={ifLimitDate} onCheckedChange={setIfLimitDate} />
                 </div>
                 {ifLimitDate && (
                     <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase pl-1">{t('schedules.details.contentsRule.constraints.date.start')}</span>
                            <DatePicker value={dateRange.start} onChange={(val) => setDateRange(prev => ({ ...prev, start: val }))} />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase pl-1">{t('schedules.details.contentsRule.constraints.date.end')}</span>
                            <DatePicker value={dateRange.end} onChange={(val) => setDateRange(prev => ({ ...prev, end: val }))} />
                        </div>
                     </div>
                 )}
             </div>

             {/* Weekday */}
             <div className="space-y-4 rounded-xl border p-4 bg-muted/5">
                 <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                        <label className="text-sm font-semibold">{t('schedules.details.contentsRule.constraints.weekday.title')}</label>
                        <p className="text-xs text-muted-foreground">{t('schedules.details.contentsRule.constraints.weekday.desc')}</p>
                     </div>
                     <Switch checked={ifLimitWeekday} onCheckedChange={setIfLimitWeekday} />
                 </div>
                 {ifLimitWeekday && (
                     <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <WeekdaySelector value={weekdays} onChange={setWeekdays} />
                     </div>
                 )}
             </div>

             {/* Time Range */}
             <div className="space-y-4 rounded-xl border p-4 bg-muted/5">
                 <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                        <label className="text-sm font-semibold">{t('schedules.details.contentsRule.constraints.time.title')}</label>
                        <p className="text-xs text-muted-foreground">{t('schedules.details.contentsRule.constraints.time.desc')}</p>
                     </div>
                     <Switch checked={ifLimitTime} onCheckedChange={setIfLimitTime} />
                 </div>
                 {ifLimitTime && (
                     <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase pl-1">{t('schedules.details.contentsRule.constraints.time.start')}</span>
                            <TimePicker value={limitTime.start} onChange={(val) => setLimitTime(prev => ({ ...prev, start: val }))} />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase pl-1">{t('schedules.details.contentsRule.constraints.time.end')}</span>
                            <TimePicker value={limitTime.end} onChange={(val) => setLimitTime(prev => ({ ...prev, end: val }))} />
                        </div>
                     </div>
                 )}
             </div>

          </div>
        </div>

        <SheetFooter className="gap-3 pt-4 border-t mt-4">
           <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-11 px-8 font-semibold">{t('common.actions.cancel')}</Button>
           <Button onClick={handleSave} className="h-11 px-10 font-bold shadow-lg shadow-primary/20">{t('common.actions.save')}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
