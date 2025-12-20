import { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Clock, 
  Monitor, 
  Zap, 
  Layers,
  ChevronRight,
  ArrowUpRight,
  Settings2,
  Trash2,
  Copy,
  Send
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
import { mockSchedulePolicies } from '@/lib/mock/schedules';
import type { SchedulePolicy } from '@/types/schedule';
import { ScheduleEditorDialog } from './ScheduleEditorDialog';

export default function SchedulePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [policies, setPolicies] = useState<SchedulePolicy[]>(mockSchedulePolicies);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<SchedulePolicy | null>(null);

  const filteredPolicies = policies.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedPolicy(null);
    setEditorOpen(true);
  };

  const handleEdit = (p: SchedulePolicy) => {
    setSelectedPolicy(p);
    setEditorOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-3xl border-2 border-primary/20 shadow-xl shadow-primary/5">
             <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Schedule Library</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1 opacity-60">Manage Temporal Rules & Play Policies</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Search Policies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 w-64 bg-muted/30 border-none rounded-2xl font-bold text-xs uppercase tracking-widest focus-visible:ring-2 focus-visible:ring-primary/20" 
              />
           </div>
           <Button onClick={handleCreate} className="h-12 px-8 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] gap-3 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4" /> New Policy
           </Button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <StatsCard label="Total Policies" value={policies.length} icon={Layers} />
         <StatsCard label="Active Deployments" value={policies.reduce((a, b) => a + b.deviceCount, 0)} icon={Monitor} color="text-emerald-500" />
         <StatsCard label="Timed Commands" value={policies.reduce((a, b) => a + b.commands.length, 0)} icon={Zap} color="text-amber-500" />
         <StatsCard label="Program Rules" value={policies.reduce((a, b) => a + b.contents.length, 0)} icon={Clock} color="text-blue-500" />
      </div>

      {/* Policy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPolicies.map(policy => (
          <PolicyCard key={policy.id} policy={policy} onEdit={() => handleEdit(policy)} />
        ))}
        
        {/* Empty State / Create New */}
        <button onClick={handleCreate} className="group h-[280px] border-4 border-dashed border-muted rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all hover:border-primary/40 hover:bg-primary/[0.02]">
           <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
           </div>
           <div className="text-center">
              <p className="text-sm font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">Create New Policy</p>
              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase mt-1">Start from an empty timeline</p>
           </div>
        </button>
      </div>

      <ScheduleEditorDialog 
        open={editorOpen} 
        onOpenChange={setEditorOpen} 
        policy={selectedPolicy} 
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

function PolicyCard({ policy, onEdit }: { policy: SchedulePolicy, onEdit: () => void }) {
  return (
    <Card className="rounded-[2.5rem] border-none shadow-sm ring-1 ring-muted/60 overflow-hidden group hover:shadow-2xl transition-all hover:-translate-y-1 bg-card">
       <CardContent className="p-8 space-y-6">
          <div className="flex items-start justify-between">
             <div className="space-y-1.5 min-w-0">
                <h3 className="text-xl font-black tracking-tight truncate uppercase group-hover:text-primary transition-colors">{policy.name}</h3>
                <p className="text-[11px] text-muted-foreground line-clamp-2 font-medium leading-relaxed">{policy.description}</p>
             </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 border opacity-40 hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[101] rounded-2xl p-2 min-w-[160px]">
                   <DropdownMenuItem className="rounded-xl font-bold text-xs uppercase py-3 gap-3"><Copy className="h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                   <DropdownMenuItem onClick={onEdit} className="rounded-xl font-bold text-xs uppercase py-3 gap-3"><Settings2 className="h-3.5 w-3.5" /> Edit Config</DropdownMenuItem>
                   <Separator className="my-2" />
                   <DropdownMenuItem className="rounded-xl font-bold text-xs uppercase py-3 gap-3 text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-muted/30 rounded-2xl p-4 border border-dashed flex flex-col gap-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Programs</span>
                <div className="flex items-center gap-2">
                   <Clock className="h-3.5 w-3.5 text-blue-500" />
                   <span className="text-sm font-black tabular-nums">{policy.contents.length} Rules</span>
                </div>
             </div>
             <div className="bg-muted/30 rounded-2xl p-4 border border-dashed flex flex-col gap-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Commands</span>
                <div className="flex items-center gap-2">
                   <Zap className="h-3.5 w-3.5 text-amber-500" />
                   <span className="text-sm font-black tabular-nums">{policy.commands.length} Action</span>
                </div>
             </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-muted-foreground/5">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                   <Monitor className="h-3.5 w-3.5 text-muted-foreground/40" />
                   <span className="text-[10px] font-black tabular-nums">{policy.deviceCount} Linked Nodes</span>
                </div>
             </div>
             <Button variant="ghost" size="sm" className="h-8 rounded-lg font-black text-[9px] uppercase tracking-widest gap-2 pr-1 group/btn">
                Deploy <ChevronRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
             </Button>
          </div>

          <div className="flex items-center gap-3">
             <Button onClick={onEdit} className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 bg-zinc-900 hover:bg-zinc-800 text-white group-hover:shadow-xl transition-all">
                Open Editor <ArrowUpRight className="h-4 w-4" />
             </Button>
             <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-2 hover:bg-primary/5 hover:text-primary transition-colors">
                <Send className="h-5 w-5" />
             </Button>
          </div>
       </CardContent>
    </Card>
  );
}
