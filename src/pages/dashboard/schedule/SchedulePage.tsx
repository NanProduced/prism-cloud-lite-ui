import { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  Monitor, 
  Zap, 
  Layers,
  ArrowUpRight,
  Settings2,
  Trash2,
  Copy,
  Send,
  Power,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { mockScheduleRecords } from '@/lib/mock/schedules';
import type { ScheduleRecord } from '@/types/schedule';
import { ScheduleEditorDialog } from './ScheduleEditorDialog';

export default function SchedulePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [schedules, setSchedules] = useState<ScheduleRecord[]>(mockScheduleRecords);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleRecord | null>(null);

  const filteredSchedules = schedules.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedSchedule(null);
    setEditorOpen(true);
  };

  const handleEdit = (s: ScheduleRecord) => {
    setSelectedSchedule(s);
    setEditorOpen(true);
  };

  const handleSave = (next: ScheduleRecord) => {
    const exists = schedules.some(s => s.id === next.id);
    if (exists) {
      setSchedules(prev => prev.map(s => s.id === next.id ? next : s));
    } else {
      setSchedules(prev => [next, ...prev]);
    }
  };

  const handleToggleEnabled = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleDelete = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Knowledge Banner */}
      <Card className="bg-primary/5 border-primary/10 rounded-[2rem] overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Calendar className="h-48 w-48" />
        </div>
        <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
          <div className="p-5 bg-background rounded-3xl shadow-xl ring-1 ring-primary/10">
            <Info className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight italic">How Playback Plans Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] font-bold uppercase tracking-widest leading-relaxed opacity-70">
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">1</div>
                <p><span className="text-primary font-black">Create Plan:</span> Define content playback rules and device actions (like sleep/wake) on a timeline.</p>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">2</div>
                <p><span className="text-primary font-black">Bind Devices:</span> Assign the plan to one or more screens. A device follows one plan at a time.</p>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">3</div>
                <p><span className="text-primary font-black">Push & Verify:</span> Click <span className="text-primary font-black underline">Push Updates</span> to sync changes to hardware and check the status.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-3xl border-2 border-primary/20 shadow-xl shadow-primary/5">
             <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Playback Plans</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">Manage Timed Content & Device Actions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Search Plans..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 w-64 bg-muted/30 border-none rounded-2xl font-bold text-xs uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-primary/20" 
              />
           </div>
           <Button onClick={handleCreate} className="h-12 px-8 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4" /> New Plan
           </Button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <StatsCard label="Total Schedules" value={schedules.length} icon={Layers} />
         <StatsCard label="Bound Devices" value={schedules.reduce((a, b) => a + b.boundDeviceCount, 0)} icon={Monitor} color="text-emerald-500" />
         <StatsCard label="Command Rules" value={schedules.reduce((a, b) => a + b.commandRules.length, 0)} icon={Zap} color="text-amber-500" />
         <StatsCard label="Program Rules" value={schedules.reduce((a, b) => a + b.programRules.length, 0)} icon={Clock} color="text-blue-500" />
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSchedules.map(schedule => (
          <ScheduleCard 
            key={schedule.id} 
            schedule={schedule} 
            onEdit={() => handleEdit(schedule)} 
            onToggleEnabled={handleToggleEnabled}
            onDelete={handleDelete}
          />
        ))}
        
        {/* Empty State / Create New */}
        <button onClick={handleCreate} className="group h-[280px] border-4 border-dashed border-muted rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all hover:border-primary/40 hover:bg-primary/[0.02]">
           <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
           </div>
           <div className="text-center">
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">Create New Plan</p>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase mt-1">Start from a blank template</p>
           </div>
        </button>
      </div>

      {/* Note: SelectedSchedule type mismatch with ScheduleEditorDialog might need fixing later if it expects SchedulePolicy */}
      <ScheduleEditorDialog 
        open={editorOpen} 
        onOpenChange={setEditorOpen} 
        schedule={selectedSchedule} 
        onSave={handleSave}
      />
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, color = "text-primary" }: { label: string, value: number, icon: any, color?: string }) {
  return (
    <Card className="rounded-[2rem] border-none ring-1 ring-muted/60 bg-muted/10 p-6 flex items-center justify-between group hover:ring-primary/40 transition-all">
       <div className="space-y-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-black tabular-nums tracking-tighter">{value}</p>
       </div>
       <div className={cn("p-4 rounded-2xl bg-background border shadow-inner transition-transform group-hover:scale-110", color)}>
          <Icon className="h-6 w-6" />
       </div>
    </Card>
  );
}

function ScheduleCard({ schedule, onEdit, onToggleEnabled, onDelete }: { schedule: ScheduleRecord, onEdit: () => void, onToggleEnabled: (id: string) => void, onDelete: (id: string) => void }) {
  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm ring-1 ring-muted/60 overflow-hidden group hover:shadow-2xl transition-all hover:-translate-y-1 bg-card flex flex-col">
       <CardContent className="p-8 space-y-6 flex-1">
          <div className="flex items-start justify-between">
             <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                   <h3 className="text-xl font-black tracking-tight truncate uppercase group-hover:text-primary transition-colors">{schedule.name}</h3>
                   <Badge variant={schedule.enabled ? "default" : "outline"} className={cn("h-4 px-1.5 text-[8px] font-black uppercase tracking-widest", schedule.enabled ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10" : "opacity-40")}>
                      {schedule.enabled ? "Active" : "Disabled"}
                   </Badge>
                   {schedule.syncStatus && (
                     <Badge variant="outline" className={cn("h-4 px-1.5 text-[8px] font-black uppercase tracking-widest border-none", 
                       schedule.syncStatus === 'synced' ? "bg-blue-500/10 text-blue-600" : 
                       schedule.syncStatus === 'pending' ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"
                     )}>
                        {schedule.syncStatus === 'synced' ? 'Synced' : schedule.syncStatus === 'pending' ? 'Push Needed' : 'Sync Failed'}
                     </Badge>
                   )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 font-medium leading-relaxed">{schedule.description}</p>
             </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 border opacity-40 hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[101] rounded-2xl p-2 min-w-[160px]">
                   <DropdownMenuItem className="rounded-xl font-bold text-xs uppercase py-3 gap-3"><Copy className="h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                   <DropdownMenuItem onClick={onEdit} className="rounded-xl font-bold text-xs uppercase py-3 gap-3"><Settings2 className="h-3.5 w-3.5" /> Edit Rules</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => onToggleEnabled(schedule.id)} className="rounded-xl font-bold text-xs uppercase py-3 gap-3"><Power className="h-3.5 w-3.5" /> {schedule.enabled ? "Disable" : "Enable"}</DropdownMenuItem>
                   <Separator className="my-2" />
                   <DropdownMenuItem onClick={() => onDelete(schedule.id)} className="rounded-xl font-bold text-xs uppercase py-3 gap-3 text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>

          {/* Quick Agenda Preview */}
          <div className="space-y-4">
             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">Today's Highlights</p>
             <div className="space-y-2">
                {schedule.programRules.length === 0 && schedule.commandRules.length === 0 ? (
                  <div className="py-8 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase">No Rules Added Yet</p>
                  </div>
                ) : (
                  <>
                    {schedule.programRules.slice(0, 2).map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border text-[10px]">
                         <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", r.type === 'spot' ? "bg-rose-500" : "bg-blue-500")} />
                            <span className="font-black uppercase truncate">{r.programName}</span>
                         </div>
                         <span className="font-bold tabular-nums opacity-40 shrink-0">
                            {r.ifLimitTime ? r.limitTime?.start.slice(0, 5) : '24/7'}
                         </span>
                      </div>
                    ))}
                    {schedule.commandRules.slice(0, 1).map(c => (
                       <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px]">
                          <div className="flex items-center gap-3">
                             <Zap className="h-3 w-3 text-amber-500" />
                             <span className="font-black uppercase">{c.name.replace('_', ' ')}</span>
                          </div>
                          <span className="font-bold tabular-nums opacity-40">{c.ifLimitTime ? c.limitTime?.start.slice(0, 5) : 'Always'}</span>
                       </div>
                    ))}
                  </>
                )}
             </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-muted-foreground/5 mt-auto">
             <div className="flex items-center gap-4">
                <div className={cn("flex items-center gap-2 px-2 py-1 rounded-lg", schedule.boundDeviceCount === 0 ? "bg-amber-500/10 text-amber-600 animate-pulse" : "bg-muted/50")}>
                   <Monitor className="h-3.5 w-3.5" />
                   <span className="text-[10px] font-black tabular-nums">{schedule.boundDeviceCount} Bound Devices</span>
                </div>
             </div>
             {schedule.boundDeviceCount === 0 && (
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-tighter animate-bounce">Pending Binding</p>
             )}
          </div>

          <div className="flex items-center gap-3">
             <Button onClick={onEdit} className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-zinc-900 hover:bg-zinc-800 text-white group-hover:shadow-xl transition-all">
                Edit Plan <ArrowUpRight className="h-4 w-4" />
             </Button>
             <Button variant="outline" className="h-12 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-tighter gap-3 hover:bg-primary/5 hover:text-primary transition-colors group/sync">
                <Send className="h-4 w-4 transition-transform group-hover/sync:translate-x-0.5 group-hover/sync:-translate-y-0.5" />
                Push & Sync
             </Button>
          </div>
       </CardContent>
    </Card>
  );
}
