import { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Clock, 
  Zap, 
  Layers,
  Play,
  CalendarDays,
  Settings2,
  Monitor,
  ArrowRight,
  Calendar,
  Trash2,
  ChevronRight,
  GripVertical,
  Send,
  AlertTriangle,
  Info,
  Globe,
  PlusCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { parseResolution } from '@/lib/resolution';
import { getDevices } from '@/services/deviceApi';
import type { 
  ScheduleRecord, 
  ProgramScheduleRule, 
  CommandScheduleRule, 
  WeekDay,
  ContentsScheduleType
} from '@/types/schedule';
import { getPrograms, getProgramDetails } from '@/services/programApi';
import { toast } from '@/store/notificationStore';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { TimelineProjection, type TimelineRule } from '@/components/dashboard/schedule/TimelineProjection';

const WEEKDAYS: { label: string }[] = [
  { label: 'Mon' },
  { label: 'Tue' },
  { label: 'Wed' },
  { label: 'Thu' },
  { label: 'Fri' },
  { label: 'Sat' },
  { label: 'Sun' },
];

interface ScheduleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ScheduleRecord | null;
  onSave?: (next: ScheduleRecord) => void;
}

export function ScheduleEditorDialog({ open, onOpenChange, schedule: initialSchedule, onSave }: ScheduleEditorDialogProps) {
  const [draft, setDraft] = useState<ScheduleRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'programs' | 'commands' | 'devices' | 'preview'>('programs');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // --- Queries ---
  const { data: programsData, isLoading: isProgramsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
    enabled: open,
  });

  const { data: devicesRes } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
    enabled: open,
  });

  const availablePrograms = programsData?.data || [];
  const devices = devicesRes?.data || [];

  // Sync draft with initialSchedule
  useEffect(() => {
    if (initialSchedule) {
      setDraft(JSON.parse(JSON.stringify(initialSchedule)));
      if (initialSchedule.programRules.length) {
        setSelectedRuleId(initialSchedule.programRules[0].id);
      } else if (initialSchedule.commandRules.length) {
        setSelectedRuleId(initialSchedule.commandRules[0].id);
      } else {
        setSelectedRuleId(null);
      }
    } else {
      setDraft({
        id: `sch-${Date.now()}`,
        name: 'New Playback Plan',
        description: '',
        enabled: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        programRules: [],
        commandRules: [],
        boundDeviceCount: 0
      });
      setSelectedRuleId(null);
    }
  }, [initialSchedule, open]);

  // Use a state-local details fetch for version info if needed, or rely on program list which might have latestVersion
  // For selecting a program, we ideally need its versions.
  // According to program-and-schedule.md, getPrograms returns list of ProgramListResp
  // ProgramListResp doesn't have all versions, only latestVersion.
  // If we need multiple versions, we might need another approach or fetch detail.
  // For now, let's assume we use the latest version or fetch detail on select.

  const [programDetails, setProgramDetails] = useState<Record<string, any>>({});

  const handleProgramSelect = async (pId: string) => {
     if (programDetails[pId]) return;
     try {
        const res = await getProgramDetails(pId);
        if (res.data) {
           setProgramDetails(prev => ({ ...prev, [pId]: res.data }));
        }
     } catch (e) {
        toast.error('Failed to load program versions');
     }
  };

  const handleAddProgramRule = () => {
    if (!draft) return;
    const newRule: ProgramScheduleRule = {
      id: `rule-${Date.now()}`,
      type: 'rotation',
      priority: draft.programRules.length + 1,
      releaseProgramId: 0,
      programId: '',
      programName: 'Select Program',
      version: 0,
      ifLimitTime: false,
      ifLimitDate: false,
      ifLimitWeekday: false,
      limitWeekday: [true, true, true, true, true, false, false], // Mon-Fri
    };
    const next = { ...draft, programRules: [...draft.programRules, newRule] };
    setDraft(next);
    setSelectedRuleId(newRule.id);
    setActiveTab('programs');
  };

  const handleAddCommandRule = () => {
    if (!draft) return;
    const newRule: CommandScheduleRule = {
      id: `cmd-${Date.now()}`,
      name: 'Brightness Control',
      operation: { type: 'BRIGHTNESS', body: { brightness: 80 } },
      opTime: ['08:00:00'],
      ifLimitDate: false,
      ifLimitWeekday: false,
      limitWeekday: [true, true, true, true, true, true, true],
    };
    const next = { ...draft, commandRules: [...draft.commandRules, newRule] };
    setDraft(next);
    setSelectedRuleId(newRule.id);
    setActiveTab('commands');
  };

  const handleDeleteRule = (id: string) => {
    if (!draft) return;
    const next = {
      ...draft,
      programRules: draft.programRules.filter(r => r.id !== id),
      commandRules: draft.commandRules.filter(r => r.id !== id)
    };
    setDraft(next);
    if (selectedRuleId === id) setSelectedRuleId(null);
  };

  const updateProgramRule = (id: string, patch: Partial<ProgramScheduleRule>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      programRules: draft.programRules.map(r => r.id === id ? { ...r, ...patch } : r)
    });
  };

  const updateCommandRule = (id: string, patch: Partial<CommandScheduleRule>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      commandRules: draft.commandRules.map(r => r.id === id ? { ...r, ...patch } : r)
    });
  };

  const handleSave = () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error('Please enter a plan name');
      return;
    }
    const final = { ...draft, updatedAt: new Date().toISOString() };
    onSave?.(final);
    toast.success('Plan saved successfully');
    onOpenChange(false);
  };

  const handleReorderPrograms = (newOrder: ProgramScheduleRule[]) => {
    if (!draft) return;
    const updated = newOrder.map((rule, index) => ({
      ...rule,
      priority: newOrder.length - index
    }));
    setDraft({ ...draft, programRules: updated });
  };

  const handleReorderCommands = (newOrder: CommandScheduleRule[]) => {
    if (!draft) return;
    setDraft({ ...draft, commandRules: newOrder });
  };

  const selectedProgramRule = draft?.programRules.find(r => r.id === selectedRuleId);
  const selectedCommandRule = draft?.commandRules.find(r => r.id === selectedRuleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden border-0 shadow-2xl rounded-[2.5rem] bg-background flex flex-col">
        {/* Header */}
        <header className="px-8 py-5 border-b flex items-center justify-between bg-muted/5">
           <div className="flex items-center gap-6">
              <div className="p-2.5 rounded-2xl bg-zinc-900 text-white shadow-lg">
                 <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-[200px]">
                 <Input 
                   value={draft?.name || ''} 
                   onChange={(e) => setDraft(prev => prev ? { ...prev, name: e.target.value } : null)}
                   className="text-xl font-black tracking-tight uppercase border-none bg-transparent p-0 h-auto focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/30"
                   placeholder="Enter Plan Name..."
                 />
                 <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 border">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <select 
                           value={draft?.timezone || 'Asia/Shanghai'}
                           onChange={(e) => setDraft(prev => prev ? { ...prev, timezone: e.target.value } : null)}
                           className="bg-transparent border-none text-[10px] font-bold uppercase text-muted-foreground focus:ring-0 cursor-pointer"
                        >
                           <option value="Asia/Shanghai">Asia/Shanghai (GMT+8)</option>
                           <option value="UTC">UTC (GMT+0)</option>
                           <option value="America/New_York">New York (GMT-5)</option>
                           <option value="Europe/London">London (GMT+0)</option>
                        </select>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5 px-2 h-4.5">Rule-Based Plan</Badge>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="flex bg-muted/40 p-1 rounded-xl border mr-4">
                 <TabButton active={activeTab === 'programs'} onClick={() => setActiveTab('programs')} icon={<Play className="h-3 w-3" />}>Content Rules</TabButton>
                 <TabButton active={activeTab === 'commands'} onClick={() => setActiveTab('commands')} icon={<Zap className="h-3 w-3" />}>Device Actions</TabButton>
                 <TabButton active={activeTab === 'devices'} onClick={() => setActiveTab('devices')} icon={<Monitor className="h-3 w-3" />}>Bind & Sync</TabButton>
                 <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} icon={<Layers className="h-3 w-3" />}>Verify</TabButton>
              </div>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6 h-10 border">Discard</Button>
              <Button onClick={handleSave} className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 h-10 shadow-xl shadow-primary/20 gap-2">
                 <Save className="h-4 w-4" /> Save Plan
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-xl h-10 w-10 border hover:bg-muted/50">
                 <X className="h-5 w-5" />
              </Button>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
           {activeTab === 'programs' || activeTab === 'commands' ? (
             <>
               {/* Left: Rule List */}
               <div className="w-[340px] border-r bg-muted/10 flex flex-col shrink-0">
                  <div className="p-6 border-b flex items-center justify-between">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {activeTab === 'programs' ? 'Program Rules' : 'Command Rules'}
                     </h3>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={activeTab === 'programs' ? handleAddProgramRule : handleAddCommandRule}
                       className="h-7 w-7 rounded-lg border bg-background shadow-sm hover:text-primary transition-colors"
                     >
                        <Plus className="h-3.5 w-3.5" />
                     </Button>
                  </div>
                  <ScrollArea className="flex-1">
                     <div className="p-4 space-y-2">
                        {activeTab === 'programs' && (
                          <Reorder.Group axis="y" values={draft?.programRules || []} onReorder={handleReorderPrograms} className="space-y-2">
                            {draft?.programRules.map(rule => (
                              <Reorder.Item key={rule.id} value={rule}>
                                <RuleListItem 
                                  title={rule.programName}
                                  subtitle={`Priority: ${rule.priority}`}
                                  badge={rule.type}
                                  badgeColor={rule.type === 'spot' ? 'bg-rose-500' : 'bg-blue-500'}
                                  active={selectedRuleId === rule.id}
                                  onClick={() => setSelectedRuleId(rule.id)}
                                  onDelete={() => handleDeleteRule(rule.id)}
                                />
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        )}
                        {activeTab === 'commands' && (
                          <Reorder.Group axis="y" values={draft?.commandRules || []} onReorder={handleReorderCommands} className="space-y-2">
                            {draft?.commandRules.map(rule => (
                              <Reorder.Item key={rule.id} value={rule}>
                                <RuleListItem 
                                  title={rule.name}
                                  subtitle={rule.opTime.join(', ')}
                                  icon={<Zap className="h-3 w-3" />}
                                  active={selectedRuleId === rule.id}
                                  onClick={() => setSelectedRuleId(rule.id)}
                                  onDelete={() => handleDeleteRule(rule.id)}
                                />
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        )}
                        {((activeTab === 'programs' && !draft?.programRules.length) || 
                          (activeTab === 'commands' && !draft?.commandRules.length)) && (
                          <div className="py-20 px-6 text-center">
                             <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                                <Plus className="h-6 w-6 text-muted-foreground/40" />
                             </div>
                             <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest">No Rules Defined</p>
                             <Button 
                               variant="link" 
                               className="text-[10px] font-bold uppercase mt-2" 
                               onClick={activeTab === 'programs' ? handleAddProgramRule : handleAddCommandRule}
                             >
                                Create First Rule
                             </Button>
                          </div>
                        )}
                     </div>
                  </ScrollArea>
               </div>

               {/* Middle/Main: Rule Editor */}
               <div className="flex-1 bg-background flex flex-col overflow-hidden">
                  {selectedRuleId ? (
                    <ScrollArea className="flex-1">
                       <div className="max-w-[800px] mx-auto p-12 space-y-12">
                          {/* Program Specific Editor */}
                          {activeTab === 'programs' && selectedProgramRule && (
                            <section className="space-y-6">
                               <div className="flex items-center gap-4">
                                  <div className="h-8 w-1 bg-primary rounded-full" />
                                  <h2 className="text-xl font-black uppercase tracking-tight">Content Assignment</h2>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-8">
                                  <div className="col-span-2 space-y-2">
                                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Program</Label>
                                     <Select 
                                       value={selectedProgramRule.programId} 
                                       onValueChange={async (pId) => {
                                          const prog = availablePrograms.find(p => p.id === pId);
                                          if (prog) {
                                             // Fetch details to get versions and deviceProgramId
                                             try {
                                                const res = await getProgramDetails(pId);
                                                const details = res.data;
                                                const latest = details?.versions.sort((a, b) => b.version - a.version)[0];
                                                
                                                if (latest) {
                                                   updateProgramRule(selectedProgramRule.id, {
                                                      programId: pId,
                                                      programName: prog.name,
                                                      version: latest.version,
                                                      releaseProgramId: latest.deviceProgramId
                                                   });
                                                } else {
                                                   toast.error('This program has no published versions');
                                                }
                                             } catch (e) {
                                                toast.error('Failed to fetch program details');
                                             }
                                          }
                                       }}
                                     >
                                        <SelectTrigger className="h-14 rounded-xl font-bold border-2">
                                           <SelectValue placeholder="Select a program..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                           {availablePrograms.map(p => (
                                              <SelectItem key={p.id} value={p.id}>
                                                 {p.name} {p.latestVersion ? `(v${p.latestVersion})` : '(No Release)'}
                                              </SelectItem>
                                           ))}
                                        </SelectContent>
                                     </Select>
                                     <p className="text-[9px] font-bold text-muted-foreground italic opacity-60">
                                        The latest published version will be automatically assigned.
                                     </p>
                                  </div>

                                  <div className="space-y-2">
                                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Playback Type</Label>
                                     <Select 
                                       value={selectedProgramRule.type} 
                                       onValueChange={(v) => updateProgramRule(selectedProgramRule.id, { type: v as ContentsScheduleType })}
                                     >
                                        <SelectTrigger className="h-12 rounded-xl font-bold border-2">
                                           <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                           <SelectItem value="rotation">Rotation (Loop)</SelectItem>
                                           <SelectItem value="spot">Spot (Timed Insert)</SelectItem>
                                        </SelectContent>
                                     </Select>
                                  </div>
                                  <div className="space-y-2">
                                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Priority Index</Label>
                                     <Input 
                                       type="number" 
                                       value={selectedProgramRule.priority} 
                                       onChange={(e) => updateProgramRule(selectedProgramRule.id, { priority: Number(e.target.value) })}
                                       className="h-12 rounded-xl font-bold border-2" 
                                     />
                                  </div>
                               </div>
                            </section>
                          )}

                          {/* Command Specific Editor */}
                          {activeTab === 'commands' && selectedCommandRule && (
                             <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                   <div className="h-8 w-1 bg-amber-500 rounded-full" />
                                   <h2 className="text-xl font-black uppercase tracking-tight">Command Action</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                   <div className="space-y-4">
                                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Action Type</Label>
                                      <Select 
                                        value={selectedCommandRule.operation.type} 
                                        onValueChange={(v: any) => {
                                          let body = {};
                                          if (v === 'BRIGHTNESS') body = { brightness: 80 };
                                          if (v === 'VOLUME') body = { musicvolume: 10 };
                                          if (v === 'POWER') body = { command: 'sleep' };
                                          updateCommandRule(selectedCommandRule.id, { 
                                            name: v.replace('_', ' '),
                                            operation: { type: v, body } 
                                          });
                                        }}
                                      >
                                         <SelectTrigger className="h-12 rounded-xl font-bold border-2">
                                            <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent>
                                            <SelectItem value="BRIGHTNESS">Brightness Adjustment</SelectItem>
                                            <SelectItem value="VOLUME">Volume Adjustment</SelectItem>
                                            <SelectItem value="POWER">Power Management</SelectItem>
                                            <SelectItem value="REBOOT">System Reboot</SelectItem>
                                            <SelectItem value="CLEAR_CACHE">Clear Device Cache</SelectItem>
                                         </SelectContent>
                                      </Select>
                                   </div>

                                   {/* Parameter Form */}
                                   <div className="bg-muted/20 p-6 rounded-2xl border-2 border-dashed">
                                      {selectedCommandRule.operation.type === 'BRIGHTNESS' && (
                                         <div className="space-y-4">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                               <span>Target Brightness</span>
                                               <span className="text-primary font-mono bg-background px-2 py-1 rounded border">
                                                  {selectedCommandRule.operation.body?.brightness || 0}%
                                               </span>
                                            </div>
                                            <Slider 
                                               value={[selectedCommandRule.operation.body?.brightness || 0]} 
                                               max={100} 
                                               onValueChange={(v) => {
                                                  updateCommandRule(selectedCommandRule.id, { 
                                                    operation: { ...selectedCommandRule.operation, body: { brightness: v[0] } } 
                                                  });
                                               }}
                                            />
                                         </div>
                                      )}
                                      {selectedCommandRule.operation.type === 'POWER' && (
                                         <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Power Action</Label>
                                            <Select 
                                              value={selectedCommandRule.operation.body?.command} 
                                              onValueChange={(v) => updateCommandRule(selectedCommandRule.id, { 
                                                operation: { ...selectedCommandRule.operation, body: { command: v } } 
                                              })}
                                            >
                                               <SelectTrigger className="h-10 rounded-lg font-bold border">
                                                  <SelectValue />
                                               </SelectTrigger>
                                               <SelectContent>
                                                  <SelectItem value="sleep">Sleep (Standby)</SelectItem>
                                                  <SelectItem value="wakeup">Wakeup</SelectItem>
                                                  <SelectItem value="reboot">Reboot</SelectItem>
                                               </SelectContent>
                                            </Select>
                                         </div>
                                      )}
                                      {selectedCommandRule.operation.type === 'CLEAR_CACHE' && (
                                         <div className="flex items-center gap-3 text-muted-foreground italic">
                                            <Info className="h-4 w-4" />
                                            <p className="text-[10px] font-bold uppercase tracking-tighter">No parameters required.</p>
                                         </div>
                                      )}
                                   </div>

                                   {/* opTime List */}
                                   <div className="col-span-2 space-y-4">
                                      <div className="flex items-center justify-between">
                                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Execution Time Points</Label>
                                         <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => updateCommandRule(selectedCommandRule.id, { opTime: [...selectedCommandRule.opTime, '12:00:00'] })}
                                            className="h-6 text-[9px] uppercase font-black gap-1.5"
                                         >
                                            <PlusCircle className="h-3 w-3" /> Add Point
                                         </Button>
                                      </div>
                                      <div className="flex flex-wrap gap-3">
                                         {selectedCommandRule.opTime.map((time, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-background border-2 rounded-xl p-1 pr-3">
                                               <Input 
                                                  type="time" 
                                                  step="1"
                                                  value={time} 
                                                  onChange={(e) => {
                                                     const newTimes = [...selectedCommandRule.opTime];
                                                     newTimes[idx] = e.target.value;
                                                     updateCommandRule(selectedCommandRule.id, { opTime: newTimes });
                                                  }}
                                                  className="h-8 border-none focus-visible:ring-0 w-32 font-mono text-xs font-bold"
                                               />
                                               <button 
                                                  onClick={() => updateCommandRule(selectedCommandRule.id, { opTime: selectedCommandRule.opTime.filter((_, i) => i !== idx) })}
                                                  className="text-muted-foreground/40 hover:text-destructive transition-colors"
                                               >
                                                  <XCircle className="h-4 w-4" />
                                               </button>
                                            </div>
                                         ))}
                                      </div>
                                   </div>
                                </div>
                             </section>
                          )}

                          <Separator />

                          {/* Temporal Constraints */}
                          <section className="space-y-8">
                             <div className="flex items-center gap-4">
                                <div className="h-8 w-1 bg-zinc-900 rounded-full" />
                                <h2 className="text-xl font-black uppercase tracking-tight">Temporal Execution Rules</h2>
                             </div>

                             <div className="space-y-10">
                                {/* Time Limit (Only for Programs) */}
                                {activeTab === 'programs' && selectedProgramRule && (
                                <ConstraintGroup 
                                  label="Daily Time Window" 
                                  icon={<Clock className="h-4 w-4" />}
                                  enabled={selectedProgramRule.ifLimitTime}
                                  onToggle={(checked) => {
                                     updateProgramRule(selectedProgramRule.id, { 
                                       ifLimitTime: checked, 
                                       limitTime: checked ? { start: '09:00:00', end: '18:00:00' } : null 
                                     });
                                  }}
                                >
                                   <div className="flex items-center gap-4">
                                      <Input 
                                        type="time" 
                                        step="1"
                                        value={selectedProgramRule.limitTime?.start || '00:00:00'} 
                                        onChange={(e) => updateProgramRule(selectedProgramRule.id, { limitTime: { ...(selectedProgramRule.limitTime as any), start: e.target.value } })}
                                        className="h-12 rounded-xl font-bold border-2 w-48" 
                                      />
                                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                      <Input 
                                        type="time" 
                                        step="1"
                                        value={selectedProgramRule.limitTime?.end || '23:59:59'} 
                                        onChange={(e) => updateProgramRule(selectedProgramRule.id, { limitTime: { ...(selectedProgramRule.limitTime as any), end: e.target.value } })}
                                        className="h-12 rounded-xl font-bold border-2 w-48" 
                                      />
                                   </div>
                                </ConstraintGroup>
                                )}

                                {/* Weekday Limit */}
                                <ConstraintGroup 
                                  label="Weekly Recurrence" 
                                  icon={<CalendarDays className="h-4 w-4" />}
                                  enabled={selectedProgramRule?.ifLimitWeekday || selectedCommandRule?.ifLimitWeekday || false}
                                  onToggle={(checked) => {
                                     const patch = { ifLimitWeekday: checked, limitWeekday: checked ? [true,true,true,true,true,false,false] : null };
                                     if (selectedProgramRule) updateProgramRule(selectedProgramRule.id, patch);
                                     else if (selectedCommandRule) updateCommandRule(selectedCommandRule.id, patch);
                                  }}
                                >
                                   <div className="flex flex-wrap gap-2">
                                      {WEEKDAYS.map((day, idx) => {
                                        const currentDays = (selectedProgramRule?.limitWeekday || selectedCommandRule?.limitWeekday) || [true,true,true,true,true,true,true];
                                        const isSelected = currentDays[idx];
                                        return (
                                          <button 
                                            key={idx}
                                            onClick={() => {
                                              const nextDays = [...currentDays];
                                              nextDays[idx] = !isSelected;
                                              const patch = { limitWeekday: nextDays };
                                              if (selectedProgramRule) updateProgramRule(selectedProgramRule.id, patch);
                                              else if (selectedCommandRule) updateCommandRule(selectedCommandRule.id, patch);
                                            }}
                                            className={cn(
                                              "px-4 py-2.5 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                                              isSelected
                                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/10"
                                                : "bg-background hover:bg-muted/50 border-muted opacity-40 hover:opacity-100"
                                            )}
                                          >
                                             {day.label}
                                          </button>
                                        );
                                      })}
                                   </div>
                                </ConstraintGroup>

                                {/* Date Limit */}
                                <ConstraintGroup 
                                  label="Effective Date Span" 
                                  icon={<Calendar className="h-4 w-4" />}
                                  enabled={selectedProgramRule?.ifLimitDate || selectedCommandRule?.ifLimitDate || false}
                                  onToggle={(checked) => {
                                     const patch = { ifLimitDate: checked, limitDate: checked ? { start: '2025-01-01', end: '2025-12-31' } : null };
                                     if (selectedProgramRule) updateProgramRule(selectedProgramRule.id, patch);
                                     else if (selectedCommandRule) updateCommandRule(selectedCommandRule.id, patch);
                                  }}
                                >
                                   <div className="flex items-center gap-4">
                                      <Input 
                                        type="date" 
                                        value={selectedProgramRule?.limitDate?.start || selectedCommandRule?.limitDate?.start || ''} 
                                        onChange={(e) => {
                                          const patch = { limitDate: { ...((selectedProgramRule?.limitDate || selectedCommandRule?.limitDate) as any), start: e.target.value } };
                                          if (selectedProgramRule) updateProgramRule(selectedProgramRule.id, patch);
                                          else if (selectedCommandRule) updateCommandRule(selectedCommandRule.id, patch);
                                        }}
                                        className="h-12 rounded-xl font-bold border-2 w-48" 
                                      />
                                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                      <Input 
                                        type="date" 
                                        value={selectedProgramRule?.limitDate?.end || selectedCommandRule?.limitDate?.end || ''} 
                                        onChange={(e) => {
                                          const patch = { limitDate: { ...((selectedProgramRule?.limitDate || selectedCommandRule?.limitDate) as any), end: e.target.value } };
                                          if (selectedProgramRule) updateProgramRule(selectedProgramRule.id, patch);
                                          else if (selectedCommandRule) updateCommandRule(selectedCommandRule.id, patch);
                                        }}
                                        className="h-12 rounded-xl font-bold border-2 w-48" 
                                      />
                                   </div>
                                </ConstraintGroup>
                             </div>
                          </section>
                          
                          <div className="h-20" /> {/* Spacer */}
                       </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30">
                       <Settings2 className="h-16 w-16 mb-6 opacity-10" />
                       <p className="text-sm font-black uppercase tracking-widest">Select a rule or create one to begin</p>
                    </div>
                  )}
               </div>
             </>
           ) : activeTab === 'devices' ? (
              <DeviceBindingTab devices={devices} boundCount={draft?.boundDeviceCount || 0} scheduleId={draft?.id || 'Draft'} />
           ) : (
              <ExecutionPreviewTab schedule={draft} />
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean, onClick: () => void, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <button 
       onClick={onClick}
       className={cn(
         "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
         active ? "bg-background text-primary shadow-sm border border-foreground/5" : "text-muted-foreground/40 hover:text-muted-foreground"
       )}
    >
       {icon}
       {children}
    </button>
  );
}

function RuleListItem({ title, subtitle, badge, badgeColor, icon, active, onClick, onDelete }: { 
  title: string, subtitle: string | string[], badge?: string, badgeColor?: string, icon?: React.ReactNode, active: boolean, onClick: () => void, onDelete: () => void
}) {
  return (
    <div 
       onClick={onClick}
       className={cn(
         "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 group",
         active ? "bg-background border-primary shadow-lg shadow-primary/5 -translate-y-0.5" : "bg-transparent border-transparent hover:bg-background/50 hover:border-muted-foreground/10"
       )}
    >
       <GripVertical className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors shrink-0 cursor-grab active:cursor-grabbing" />
       {icon ? (
         <div className={cn("p-2 rounded-xl bg-muted/50", active && "bg-primary/10 text-primary")}>
            {icon}
         </div>
       ) : (
         <div className={cn("h-10 w-10 rounded-xl bg-muted/50 border-2 flex items-center justify-center font-black text-xs", active && "border-primary/20 text-primary")}>
            {title.charAt(0)}
         </div>
       )}
       <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-black uppercase truncate tracking-tight", active ? "text-primary" : "text-foreground/80")}>{title}</p>
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5 truncate">
             {Array.isArray(subtitle) ? subtitle.join(', ') : subtitle}
          </p>
       </div>
       <div className="flex flex-col items-end gap-1 shrink-0">
          {badge && (
            <Badge className={cn("h-4 text-[8px] font-black uppercase px-1.5 border-none", badgeColor)}>
               {badge}
            </Badge>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
          >
             <Trash2 className="h-3 w-3" />
          </button>
       </div>
    </div>
  );
}

function ConstraintGroup({ label, icon, enabled, onToggle, children }: { label: string, icon: React.ReactNode, enabled: boolean, onToggle: (val: boolean) => void, children: React.ReactNode }) {
  return (
    <div className={cn("space-y-4 transition-all duration-500", !enabled && "opacity-40 grayscale")}>
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-muted/50 border">
                {icon}
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[9px] font-black uppercase text-muted-foreground/40">{enabled ? 'Constraint Active' : 'No Limit'}</span>
             <Checkbox 
               checked={enabled} 
               onCheckedChange={(val) => onToggle(!!val)}
               className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
             />
          </div>
       </div>
       <div className={cn("pl-12", !enabled && "pointer-events-none")}>
          {children}
       </div>
    </div>
  );
}

function DeviceBindingTab({ devices, boundCount, scheduleId }: { devices: Array<{ id: string; deviceName: string; resolution: unknown }>, boundCount: number, scheduleId: string }) {
  const [isPushing, setIsPushing] = useState(false);
  const [pushResults, setPushResults] = useState<any[]>([]);
  const { formatDateTime } = useTimeFormatter();
  
  const handlePush = () => {
    setIsPushing(true);
    setPushResults([]);
    
    setTimeout(() => {
      const results = devices.slice(0, 4).map((d) => ({
        deviceId: d.id,
        deviceName: d.deviceName,
        status: Math.random() > 0.2 ? 'success' : 'failed',
        message: Math.random() > 0.2 ? 'Sync command accepted' : 'Timeout: Device unreachable',
        timestamp: formatDateTime(new Date())
      }));
      setPushResults(results);
      setIsPushing(false);
      toast.success(`Sync completed with ${results.filter(r => r.status === 'success').length} successes`);
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500">
       <div className="p-8 border-b bg-muted/5 flex items-center justify-between">
          <div>
             <h2 className="text-xl font-black uppercase tracking-tight">Node Association & Sync</h2>
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage hardware linking & push updates</p>
          </div>
          <Button 
            disabled={boundCount === 0 || isPushing} 
            onClick={handlePush}
            className="h-12 px-10 rounded-2xl font-black uppercase text-[11px] tracking-widest gap-3 shadow-xl shadow-primary/20"
          >
             <Send className={cn("h-4 w-4", isPushing && "animate-pulse")} />
             {isPushing ? 'Syncing...' : `Push to ${boundCount} Devices`}
          </Button>
       </div>

       <div className="flex-1 grid grid-cols-12 overflow-hidden">
          <div className="col-span-8 border-r bg-background overflow-hidden flex flex-col">
             {pushResults.length > 0 ? (
                <div className="flex flex-col h-full">
                   <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Sync Execution Report</h3>
                      <Button variant="ghost" size="sm" onClick={() => setPushResults([])} className="h-6 text-[9px] uppercase font-bold">Close Report</Button>
                   </div>
                   <ScrollArea className="flex-1">
                      <div className="p-4 space-y-2">
                         {pushResults.map((res, i) => (
                            <div key={i} className={cn("p-4 rounded-xl border flex items-center justify-between", res.status === 'success' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20")}>
                               <div className="flex items-center gap-4">
                                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border", res.status === 'success' ? "bg-emerald-500 text-white border-emerald-600" : "bg-red-500 text-white border-red-600")}>
                                     {res.status === 'success' ? <Monitor className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                  </div>
                                  <div>
                                     <p className="text-xs font-black uppercase">{res.deviceName}</p>
                                     <p className="text-[10px] font-bold opacity-60">{res.message}</p>
                                  </div>
                               </div>
                               <span className="text-[10px] font-mono font-bold opacity-40">{res.timestamp}</span>
                            </div>
                         ))}
                      </div>
                   </ScrollArea>
                </div>
             ) : (
                <>
                   <div className="p-4 border-b bg-muted/30 flex items-center justify-between text-[9px] font-black uppercase text-muted-foreground tracking-widest px-8">
                      <span>Associated Terminal</span>
                      <div className="flex gap-20">
                         <span className="w-24">Resolution</span>
                         <span className="w-24">Last Sync</span>
                      </div>
                   </div>
                   <ScrollArea className="flex-1">
                      <div className="p-4 space-y-2 px-8">
                         {devices.slice(0, 4).map((d, i) => {
                            const res = parseResolution(d.resolution, { width: 0, height: 0 });
                            return (
                            <div key={d.id} className="p-5 rounded-[1.5rem] border-2 border-transparent hover:border-muted-foreground/10 hover:bg-muted/10 transition-all flex items-center justify-between group">
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center border shadow-inner">
                                     <Monitor className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                     <p className="text-sm font-black uppercase tracking-tight">{d.deviceName}</p>
                                     <div className="flex items-center gap-2 mt-0.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Linked to this plan</span>
                                     </div>
                                  </div>
                               </div>
                               <div className="flex items-center gap-20">
                                  <span className="w-24 font-mono text-[10px] font-bold">{res.width}x{res.height}</span>
                                  <span className="w-24 text-[10px] font-black text-muted-foreground/40 italic">JUST NOW</span>
                               </div>
                            </div>
                         );
                         })}
                      </div>
                   </ScrollArea>
                </>
             )}
          </div>

          <div className="col-span-4 bg-muted/10 p-8 space-y-8">
             <div className="p-6 rounded-3xl bg-amber-500/5 border-2 border-dashed border-amber-500/20 space-y-4">
                <div className="flex items-center gap-3 text-amber-600">
                   <AlertTriangle className="h-5 w-5" />
                   <h3 className="text-xs font-black uppercase tracking-widest">Binding Constraints</h3>
                </div>
                <p className="text-[10px] font-bold text-amber-700/60 leading-relaxed uppercase">
                   Devices listed here are exclusively locked to <span className="underline font-black">{scheduleId}</span>. 
                   Linking them to a different plan will automatically terminate this association.
                </p>
             </div>

             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Network Health</h3>
                <div className="space-y-3">
                   <div className="flex items-center justify-between p-4 rounded-2xl bg-background border shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-tighter">Sync Success Rate</span>
                      <span className="text-xs font-black text-emerald-600">100%</span>
                   </div>
                   <div className="flex items-center justify-between p-4 rounded-2xl bg-background border shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-tighter">Average Latency</span>
                      <span className="text-xs font-black">24ms</span>
                   </div>
                </div>
             </div>

             <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-black uppercase text-[11px] tracking-widest gap-3 hover:bg-primary/5 hover:text-primary transition-all">
                <Plus className="h-4 w-4" /> Link New Terminals
             </Button>
          </div>
       </div>
    </div>
  );
}

function ExecutionPreviewTab({ schedule }: { schedule: ScheduleRecord | null }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const isRuleActive = (rule: ProgramScheduleRule | CommandScheduleRule, dateStr: string) => {
    const d = new Date(dateStr);
    if (rule.ifLimitDate && rule.limitDate) {
      const start = new Date(rule.limitDate.start);
      const end = new Date(rule.limitDate.end);
      if (d < start || d > end) return false;
    }
    if (rule.ifLimitWeekday && rule.limitWeekday) {
      // Backend index 0 = Mon. JS getUTCDay() 0 = Sun.
      const jsDay = d.getUTCDay();
      const backendIdx = jsDay === 0 ? 6 : jsDay - 1; 
      if (!rule.limitWeekday[backendIdx]) return false;
    }
    return true;
  };

  const timelineRules: TimelineRule[] = useMemo(() => {
    if (!schedule) return [];

    const programRules: TimelineRule[] = schedule.programRules
      .filter(r => isRuleActive(r, selectedDate))
      .map(r => ({
        id: r.id,
        type: r.type as 'rotation' | 'spot',
        name: r.programName,
        startTime: r.ifLimitTime && r.limitTime ? r.limitTime.start : '00:00:00',
        endTime: r.ifLimitTime && r.limitTime ? r.limitTime.end : '23:59:59',
        priority: r.priority,
        color: r.type === 'spot' ? 'rose' : 'blue'
      }));

    const commandRules: TimelineRule[] = schedule.commandRules
      .filter(r => isRuleActive(r, selectedDate))
      .flatMap(r => r.opTime.map((time, idx) => ({
        id: `${r.id}-${idx}`,
        type: 'command',
        name: r.name,
        startTime: time,
        priority: 0,
        color: 'amber',
        payload: { type: r.operation.type === 'POWER' ? 'power' : 'other' }
      })));

    return [...programRules, ...commandRules];
  }, [schedule, selectedDate]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500">
       <div className="p-4 border-b bg-background flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Play className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Rule Simulation</span>
             </div>
             <div className="h-4 w-px bg-muted" />
             <div className="flex items-center gap-2 text-muted-foreground/60">
                 <Globe className="h-3.5 w-3.5" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Zone: {schedule?.timezone || 'Auto'}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold uppercase text-muted-foreground">Simulation Date:</span>
             <Input 
               type="date" 
               value={selectedDate} 
               onChange={(e) => setSelectedDate(e.target.value)}
               className="h-9 w-36 font-bold text-xs rounded-lg border-2 bg-background focus:ring-primary/20" 
             />
          </div>
       </div>

       {timelineRules.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
             <Layers className="h-16 w-16 mb-4" />
             <p className="text-sm font-black uppercase tracking-widest">No Rules to Simulate</p>
          </div>
       ) : (
       <ScrollArea className="flex-1 bg-muted/5">
          <div className="p-12 max-w-[1200px] mx-auto space-y-12">
             <TimelineProjection rules={timelineRules} />
          </div>
       </ScrollArea>
       )}
    </div>
  );
}
