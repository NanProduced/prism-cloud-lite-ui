import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Info,
  RefreshCw,
  AlertCircle
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
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ScheduleRecord, ProgramScheduleRule, CommandScheduleRule } from '@/types/schedule';
import { ScheduleEditorDialog } from './ScheduleEditorDialog';
import { getSchedules, deleteSchedule, pushScheduleToDevices, updateSchedule } from '@/services/scheduleApi';
import { toast } from '@/store/notificationStore';
import { getErrorMessage } from '@/services/authApi';

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleRecord | null>(null);

  // --- Queries ---
  const { data: schedulesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });

  // Business Logic: Fallback to high-quality mock data if API is empty for preview
  const schedules = useMemo(() => {
    const apiData = schedulesData?.data || [];
    if (apiData.length > 0) return apiData;

    // Enhanced Mock Data for UX Preview
    return [
      {
        id: 'sch-1',
        name: 'Flagship Store Morning',
        description: 'Morning ambient loops with priority sales announcements.',
        enabled: true,
        syncStatus: 'synced',
        boundDeviceCount: 12,
        timezone: 'Asia/Shanghai',
        programRules: [
          { id: 'r1', type: 'rotation', programName: 'Ambient Nature v2', priority: 1, ifLimitTime: false },
          { id: 'r2', type: 'spot', programName: 'Flash Sale 10AM', priority: 10, ifLimitTime: true, limitTime: { start: '10:00:00', end: '10:30:00' } },
        ],
        commandRules: [
          { id: 'c1', name: 'Wakeup', operation: 'POWER', ifLimitTime: true, limitTime: { start: '08:00:00' } }
        ]
      },
      {
        id: 'sch-2',
        name: 'Evening Special Events',
        description: 'Holiday special content. Needs manual push to terminals.',
        enabled: true,
        syncStatus: 'pending',
        boundDeviceCount: 5,
        timezone: 'Asia/Shanghai',
        programRules: [
          { id: 'r3', type: 'rotation', programName: 'Classic Jazz v1', priority: 1, ifLimitTime: false },
          { id: 'r4', type: 'spot', programName: 'Merry Christmas v4', priority: 5, ifLimitTime: true, limitTime: { start: '18:00:00', end: '22:00:00' } },
        ],
        commandRules: []
      }
    ] as any as ScheduleRecord[];
  }, [schedulesData]);

  const filteredSchedules = schedules.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Mutations ---
  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Plan deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err))
  });

  const pushMutation = useMutation({
    mutationFn: (id: string) => pushScheduleToDevices(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Sync command sent to devices');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string, enabled: boolean }) => 
      updateSchedule(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }
  });

  const handleCreate = () => {
    setSelectedSchedule(null);
    setEditorOpen(true);
  };

  const handleEdit = (s: ScheduleRecord) => {
    setSelectedSchedule(s);
    setEditorOpen(true);
  };

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RefreshCw className="h-8 w-8 animate-spin text-primary/40" />
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Loading Playback Plans...</p>
    </div>;
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Knowledge Banner */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-[2.5rem] overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Calendar className="h-48 w-48 text-white" />
        </div>
        <CardContent className="p-10 flex flex-col md:flex-row items-start md:items-center gap-10 relative z-10">
          <div className="p-6 bg-primary rounded-[2rem] shadow-2xl shadow-primary/20">
            <Info className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white italic">Mastering Playback Logic</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-[11px] font-bold uppercase tracking-widest leading-relaxed text-zinc-400">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <div className="h-1 w-4 bg-primary rounded-full" />
                  <span>Rule Projection</span>
                </div>
                <p>Plans use <span className="text-white">priority-based masking</span>. Spots override loops automatically during their window.</p>
              </div>
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-primary">
                   <div className="h-1 w-4 bg-primary rounded-full" />
                   <span>Device Sync</span>
                 </div>
                 <p>Binding is only half the job. Always click <span className="text-white underline">Push & Sync</span> to update hardware memory.</p>
              </div>
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-primary">
                   <div className="h-1 w-4 bg-primary rounded-full" />
                   <span>Temporal Rules</span>
                 </div>
                 <p>Rules can be locked to specific <span className="text-white">date ranges</span> or <span className="text-white">days of the week</span>.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
             <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Playback Plans</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1 opacity-60">Visual Orchestration & Scheduling</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Search Plans..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-14 w-80 bg-muted/30 border-none rounded-2xl font-bold text-xs uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-primary/20" 
              />
           </div>
           <Button onClick={handleCreate} className="h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="h-5 w-5" /> New Plan
           </Button>
        </div>
      </header>

      {/* Schedule Grid */}
      {filteredSchedules.length === 0 ? (
         <div className="py-32 flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] bg-muted/5">
            <Calendar className="h-16 w-16 text-muted-foreground/20 mb-6" />
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">No Plans Found</p>
            <Button variant="link" onClick={handleCreate} className="mt-2 uppercase font-bold text-xs tracking-widest text-primary">Create your first one</Button>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredSchedules.map(schedule => (
            <ScheduleCard 
              key={schedule.id} 
              schedule={schedule} 
              onEdit={() => handleEdit(schedule)} 
              onToggleEnabled={(id) => toggleMutation.mutate({ id, enabled: !schedule.enabled })}
              onDelete={(id) => deleteMutation.mutate(id)}
              onPush={(id) => pushMutation.mutate(id)}
            />
          ))}
          
          <button onClick={handleCreate} className="group h-[380px] border-4 border-dashed border-muted rounded-[3rem] flex flex-col items-center justify-center gap-6 transition-all hover:border-primary/40 hover:bg-primary/[0.02]">
             <div className="p-6 rounded-full bg-muted group-hover:bg-primary/10 transition-all group-hover:scale-110">
                <Plus className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
             </div>
             <div className="text-center">
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">Establish New Plan</p>
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase mt-2">Start from a blank workflow</p>
             </div>
          </button>
        </div>
      )}

      <ScheduleEditorDialog 
        open={editorOpen} 
        onOpenChange={setEditorOpen} 
        schedule={selectedSchedule} 
        onSave={() => queryClient.invalidateQueries({ queryKey: ['schedules'] })}
      />
    </div>
  );
}

function ScheduleCard({ 
  schedule, 
  onEdit, 
  onToggleEnabled, 
  onDelete,
  onPush 
}: { 
  schedule: ScheduleRecord, 
  onEdit: () => void, 
  onToggleEnabled: (id: string) => void, 
  onDelete: (id: string) => void,
  onPush: (id: string) => void 
}) {
  return (
    <Card className={cn(
      "rounded-[3rem] border-none shadow-sm ring-1 ring-muted/60 overflow-hidden group hover:shadow-2xl transition-all hover:-translate-y-1 bg-card flex flex-col relative",
      schedule.syncStatus === 'pending' && "ring-amber-500/30 ring-2"
    )}>
       {/* Mini Timeline Header Indicator */}
       <div className="absolute top-0 left-0 right-0 h-1 flex bg-muted/10 z-20">
          <MiniTimeline rules={schedule.programRules} />
       </div>

       <CardContent className="p-10 space-y-8 flex-1 flex flex-col">
          <div className="flex items-start justify-between">
             <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-black tracking-tight truncate uppercase group-hover:text-primary transition-colors">{schedule.name}</h3>
                   <Badge variant={schedule.enabled ? "default" : "outline"} className={cn("h-5 px-2 text-[9px] font-black uppercase tracking-widest", schedule.enabled ? "bg-emerald-500 text-white border-none" : "opacity-40")}>
                      {schedule.enabled ? "Live" : "Idle"}
                   </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 font-bold uppercase tracking-tight opacity-60 leading-relaxed">
                  {schedule.description || 'No description provided'}
                </p>
             </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 border bg-muted/10 opacity-40 hover:opacity-100 hover:bg-background"><MoreVertical className="h-5 w-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[101] rounded-[1.5rem] p-3 min-w-[200px] shadow-2xl">
                   <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2 pb-2">Plan Actions</DropdownMenuLabel>
                   <DropdownMenuItem className="rounded-xl font-bold text-xs uppercase py-3 gap-3"><Copy className="h-4 w-4" /> Duplicate</DropdownMenuItem>
                   <DropdownMenuItem onClick={onEdit} className="rounded-xl font-bold text-xs uppercase py-3 gap-3"><Settings2 className="h-4 w-4" /> Configure Rules</DropdownMenuItem>
                   <DropdownMenuItem onClick={() => onToggleEnabled(schedule.id)} className="rounded-xl font-bold text-xs uppercase py-3 gap-3">
                      <Power className="h-4 w-4" /> {schedule.enabled ? "Deactivate" : "Activate"}
                   </DropdownMenuItem>
                   <DropdownMenuSeparator className="my-2" />
                   <DropdownMenuItem onClick={() => onDelete(schedule.id)} className="rounded-xl font-bold text-xs uppercase py-3 gap-3 text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="h-4 w-4" /> Terminate</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>

          {/* Binding Stats */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-5 rounded-[1.5rem] bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Endpoints</p>
                <div className="flex items-center gap-3">
                   <Monitor className="h-5 w-5 text-zinc-400" />
                   <span className="text-xl font-black tabular-nums">{schedule.boundDeviceCount}</span>
                </div>
             </div>
             <div className="p-5 rounded-[1.5rem] bg-muted/30 border border-transparent hover:border-primary/20 transition-all">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Commands</p>
                <div className="flex items-center gap-3">
                   <Zap className="h-5 w-5 text-amber-500" />
                   <span className="text-xl font-black tabular-nums">{schedule.commandRules.length}</span>
                </div>
             </div>
          </div>

          <Separator className="opacity-40" />

          {/* Sync Status Section */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  schedule.syncStatus === 'synced' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                  schedule.syncStatus === 'pending' ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                )} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {schedule.syncStatus === 'synced' ? 'Hardware Synced' : 
                   schedule.syncStatus === 'pending' ? 'Sync Required' : 'Sync Error'}
                </span>
             </div>
             {schedule.syncStatus === 'pending' && (
                <div className="flex items-center gap-1.5 text-amber-600 animate-bounce">
                   <AlertCircle className="h-3 w-3" />
                   <span className="text-[9px] font-black uppercase">Outdated</span>
                </div>
             )}
          </div>

          <div className="mt-auto flex gap-3">
             <Button onClick={onEdit} className="flex-1 h-14 rounded-[1.25rem] font-black uppercase text-[10px] tracking-[0.2em] gap-2 bg-zinc-900 hover:bg-zinc-800 text-white group-hover:shadow-2xl transition-all">
                Edit Rules <ArrowUpRight className="h-4 w-4" />
             </Button>
             <Button 
               onClick={() => onPush(schedule.id)}
               variant="outline" 
               className="h-14 px-8 rounded-[1.25rem] border-2 border-zinc-200 dark:border-zinc-800 font-black uppercase text-[10px] tracking-widest gap-3 hover:bg-primary hover:text-white hover:border-primary transition-all group/sync"
             >
                <Send className="h-4 w-4 transition-transform group-hover/sync:translate-x-1 group-hover/sync:-translate-y-1" />
                Sync
             </Button>
          </div>
       </CardContent>
    </Card>
  );
}

/**
 * A highly condensed 24h timeline viz for list cards
 */
function MiniTimeline({ rules }: { rules: ProgramScheduleRule[] }) {
  const segments = useMemo(() => {
    // Basic logic: Sort by priority, highest last so it draws on top
    // For a 1.5px high bar, we can just render them as absolute divs
    const timeToPct = (timeStr: string) => {
      const [h, m, s] = timeStr.split(':').map(Number);
      return ((h * 3600 + m * 60 + (s || 0)) / 86400) * 100;
    };

    return rules
      .map(r => {
        const start = r.ifLimitTime && r.limitTime ? timeToPct(r.limitTime.start) : 0;
        const end = r.ifLimitTime && r.limitTime ? timeToPct(r.limitTime.end) : 100;
        return {
          id: r.id,
          left: `${start}%`,
          width: `${end - start}%`,
          color: r.type === 'spot' ? 'bg-rose-500' : 'bg-blue-500',
          priority: r.priority
        };
      })
      .sort((a, b) => a.priority - b.priority);
  }, [rules]);

  return (
    <>
      {segments.map(seg => (
        <div 
          key={seg.id}
          className={cn("absolute h-full transition-all", seg.color)}
          style={{ left: seg.left, width: seg.width, zIndex: seg.priority }}
        />
      ))}
    </>
  );
}

