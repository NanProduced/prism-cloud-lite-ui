import { useState, useMemo } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Clock, 
  Zap, 
  Monitor, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  Play,
  CalendarDays
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SchedulePolicy, ContentsSchedule, CommandSchedule, WeekDay } from '@/types/schedule';

const WEEKDAYS: { key: WeekDay, label: string }[] = [
  { key: 'MON', label: 'M' },
  { key: 'TUE', label: 'T' },
  { key: 'WED', label: 'W' },
  { key: 'THU', label: 'T' },
  { key: 'FRI', label: 'F' },
  { key: 'SAT', label: 'S' },
  { key: 'SUN', label: 'S' },
];

interface ScheduleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: SchedulePolicy | null;
}

export function ScheduleEditorDialog({ open, onOpenChange, policy: initialPolicy }: ScheduleEditorDialogProps) {
  const [policy, setPolicy] = useState<SchedulePolicy | null>(initialPolicy);

  // Update local state when initialPolicy changes (e.g. from null to a real policy)
  useMemo(() => {
    setPolicy(initialPolicy);
  }, [initialPolicy]);

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 overflow-hidden border-0 shadow-2xl rounded-[3rem] bg-background flex flex-col">
        {/* Header */}
        <header className="px-10 py-6 border-b flex items-center justify-between bg-muted/5">
           <div className="flex items-center gap-5">
              <div className="p-3 rounded-2xl bg-zinc-900 text-white shadow-xl">
                 <Layers className="h-6 w-6" />
              </div>
              <div>
                 <DialogTitle className="text-2xl font-black tracking-tighter uppercase">{policy?.name || 'New Schedule Policy'}</DialogTitle>
                 <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5 px-2 h-5">Timeline Editor</Badge>
                    <Separator orientation="vertical" className="h-3" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Draft ID: {policy?.id || 'UNSAVED'}</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <Button variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6 h-11 border">Discard</Button>
              <Button className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 h-11 shadow-xl shadow-primary/20 gap-2">
                 <Save className="h-4 w-4" /> Save Strategy
              </Button>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <Button variant="ghost" size="icon" onClick={close} className="rounded-xl h-11 w-11 border hover:bg-muted/50">
                 <X className="h-5 w-5" />
              </Button>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
           {/* Left Sidebar: Controls & Rules */}
           <div className="w-[380px] border-r bg-muted/10 flex flex-col shrink-0 overflow-hidden">
              <div className="p-8 border-b bg-background/50">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                    <div className="h-1 w-6 bg-primary rounded-full" /> Rule Inventory
                 </h3>
                 <div className="grid grid-cols-2 gap-3 mt-6">
                    <Button variant="outline" className="h-14 rounded-2xl border-2 flex-col gap-1 items-start px-5 hover:bg-primary/5 hover:border-primary/20 group">
                       <Play className="h-3.5 w-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Add Program</span>
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-2 flex-col gap-1 items-start px-5 hover:bg-amber-500/5 hover:border-amber-500/20 group">
                       <Zap className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Add Command</span>
                    </Button>
                 </div>
              </div>

              <ScrollArea className="flex-1">
                 <div className="p-8 space-y-8">
                    {/* Contents Section */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Active Programs</span>
                          <Badge variant="secondary" className="h-4 text-[9px] font-black">{policy?.contents.length || 0}</Badge>
                       </div>
                       <div className="space-y-3">
                          {policy?.contents.map(c => (
                            <div key={c.id} className="p-5 rounded-3xl bg-background border-2 shadow-sm hover:border-primary/30 transition-all group">
                               <div className="flex items-start justify-between mb-3">
                                  <Badge className={cn("text-[8px] font-black uppercase tracking-tighter px-1.5 h-4.5 border-none", c.type === 'spot' ? "bg-rose-500" : "bg-blue-500")}>
                                     {c.type}
                                  </Badge>
                                  <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                                     <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                               </div>
                               <p className="text-sm font-black tracking-tight uppercase truncate">{c.programName}</p>
                               
                               {/* Weekday Selector Mini */}
                               <div className="flex gap-1 mt-3">
                                 {WEEKDAYS.map(w => (
                                   <div 
                                      key={w.key} 
                                      className={cn(
                                        "w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black border transition-colors",
                                        c.weekDays.includes(w.key) ? "bg-primary border-primary text-white" : "bg-muted/50 border-transparent text-muted-foreground/30"
                                      )}
                                   >
                                      {w.label}
                                   </div>
                                 ))}
                               </div>

                               <div className="flex items-center gap-4 mt-3 opacity-40">
                                  <div className="flex items-center gap-1.5">
                                     <Clock className="h-3 w-3" />
                                     <span className="text-[9px] font-bold tabular-nums">{c.timeRange.start.slice(0, 5)} - {c.timeRange.end.slice(0, 5)}</span>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Commands Section */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Timed Actions</span>
                          <Badge variant="secondary" className="h-4 text-[9px] font-black">{policy?.commands.length || 0}</Badge>
                       </div>
                       <div className="space-y-3">
                          {policy?.commands.map(cmd => (
                            <div key={cmd.id} className="p-5 rounded-3xl bg-background border-2 shadow-sm hover:border-amber-500/30 transition-all group">
                               <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                                     <Zap className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                     <p className="text-xs font-black uppercase truncate tracking-tight">{cmd.name.replace('_', ' ')}</p>
                                     <p className="text-[9px] font-bold text-muted-foreground tabular-nums mt-0.5">{cmd.timeRange.start.slice(0, 5)}</p>
                                  </div>
                                  <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                                     <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                               </div>
                               <div className="flex gap-1">
                                 {WEEKDAYS.map(w => (
                                   <div 
                                      key={w.key} 
                                      className={cn(
                                        "w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black border transition-colors",
                                        cmd.weekDays.includes(w.key) ? "bg-amber-500 border-amber-500 text-white" : "bg-muted/50 border-transparent text-muted-foreground/30"
                                      )}
                                   >
                                      {w.label}
                                   </div>
                                 ))}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </ScrollArea>
           </div>

           {/* Main Area: Timeline Canvas */}
           <div className="flex-1 bg-muted/5 flex flex-col overflow-hidden">
              {/* Day Context Switcher */}
              <div className="px-10 py-4 bg-background border-b flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground/60">Schedule Mapping Mode</span>
                 </div>
                 <div className="flex bg-muted/40 p-1 rounded-xl border shadow-inner">
                    <button className="px-4 py-1.5 rounded-lg text-[9px] font-black bg-background shadow-sm border border-foreground/5 uppercase tracking-widest">24H View</button>
                    <button className="px-4 py-1.5 rounded-lg text-[9px] font-black text-muted-foreground/40 hover:text-muted-foreground uppercase tracking-widest">Weekly Grid</button>
                 </div>
              </div>

              {/* Timeline Header (Hours) */}
              <div className="h-16 border-b bg-background/50 backdrop-blur-sm flex items-center shrink-0">
                 <div className="w-32 border-r h-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                 </div>
                 <div className="flex-1 flex h-full">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="flex-1 border-r last:border-r-0 h-full flex flex-col items-center justify-center gap-1 opacity-40">
                         <span className="text-[9px] font-black tabular-nums">{String(i).padStart(2, '0')}:00</span>
                         <div className="flex gap-1">
                            <div className="w-px h-1 bg-foreground/20" />
                            <div className="w-px h-1 bg-foreground/20" />
                            <div className="w-px h-1 bg-foreground/20" />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Timeline Body */}
              <ScrollArea className="flex-1">
                 <div className="p-10 space-y-12 pb-32">
                    {/* Spot Channel */}
                    <TimelineChannel label="Spot Rules" subLabel="Highest Priority" color="border-rose-500">
                       <div className="absolute top-1/2 -translate-y-1/2 left-[41.6%] right-[50%] h-12 bg-rose-500/10 border-2 border-rose-500/40 rounded-xl flex items-center px-4 gap-3 group cursor-pointer hover:bg-rose-500/20 transition-all shadow-lg shadow-rose-500/5">
                          <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 truncate">Flash Sale Alert</span>
                          <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-2">
                             <div className="h-4 w-px bg-rose-500/20" />
                             <span className="text-[9px] font-bold text-rose-700">10:00 - 12:00</span>
                          </div>
                       </div>
                    </TimelineChannel>

                    {/* Rotation Channel */}
                    <TimelineChannel label="Rotation" subLabel="Default Cycle" color="border-blue-500">
                       {/* 24/7 Long Rule Example */}
                       <div className="absolute top-1/2 -translate-y-1/2 left-[0%] right-[0%] h-12 bg-blue-500/[0.03] border-2 border-dashed border-blue-500/20 rounded-xl flex items-center px-6 gap-3 group cursor-pointer hover:bg-blue-500/[0.08] transition-all">
                          <div className="h-2 w-2 rounded-full bg-blue-500/40" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-900/40 truncate">Master Loop (Global 24H Override)</span>
                       </div>
                       
                       <div className="absolute top-1/2 -translate-y-1/2 left-[35.4%] right-[16.6%] h-12 bg-blue-500/10 border-2 border-blue-500/40 rounded-xl flex items-center px-4 gap-3 group cursor-pointer hover:bg-blue-500/20 transition-all shadow-lg shadow-blue-500/5">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 truncate">Standard Lobby Loop V4</span>
                          <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-2">
                             <div className="h-4 w-px bg-blue-500/20" />
                             <span className="text-[9px] font-bold text-blue-700">08:30 - 20:00</span>
                          </div>
                       </div>
                    </TimelineChannel>

                    {/* Command Channel */}
                    <TimelineChannel label="Commands" subLabel="Hardware Control" color="border-amber-500">
                       <CommandMarker pos="33.3%" label="Wake (08:00)" />
                       <CommandMarker pos="41.6%" label="Bright 100 (10:00)" />
                       <CommandMarker pos="91.6%" label="Sleep (22:00)" />
                    </TimelineChannel>
                 </div>
              </ScrollArea>

              {/* Legend & Help Footer */}
              <footer className="px-10 py-5 bg-background border-t flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-8">
                    <LegendItem color="bg-rose-500" label="Spot (Override)" />
                    <LegendItem color="bg-blue-500" label="Rotation (Loop)" />
                    <LegendItem color="bg-amber-500" label="Hard Command" />
                 </div>
                 <div className="flex items-center gap-3 text-muted-foreground opacity-40">
                    <Info className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Drag blocks to adjust duration 路 Double click to edit parameters</span>
                 </div>
              </footer>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TimelineChannel({ label, subLabel, color, children }: { label: string, subLabel: string, color: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
       <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("px-2.5 h-6 rounded-lg font-black uppercase text-[9px] tracking-widest border-2", color)}>{label}</Badge>
          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{subLabel}</span>
       </div>
       <div className="relative h-24 w-full bg-muted/20 border-2 border-dashed border-muted rounded-[2rem] overflow-hidden">
          {/* Hour Grid Lines */}
          <div className="absolute inset-0 flex">
             {Array.from({ length: 24 }).map((_, i) => (
               <div key={i} className="flex-1 border-r border-muted/30 last:border-r-0" />
             ))}
          </div>
          {children}
       </div>
    </div>
  );
}

function CommandMarker({ pos, label }: { pos: string, label: string }) {
  return (
    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group cursor-pointer" style={{ left: pos }}>
       <div className="px-2 py-1 rounded-lg bg-amber-500 text-white text-[8px] font-black uppercase tracking-tighter shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">{label}</div>
       <div className="w-0.5 h-10 bg-gradient-to-b from-amber-500 to-transparent" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2.5">
       <div className={cn("h-2.5 w-2.5 rounded-full shadow-sm", color)} />
       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}
