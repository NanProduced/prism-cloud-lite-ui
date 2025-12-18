import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Pencil, Send, MoreHorizontal, History, 
  Monitor, Info, CheckCircle2, Clock, AlertCircle, 
  User, Database, Layers, XCircle, Search
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { mockDevices } from '@/lib/mock/devices';

import { getProgram, deleteProgram, type ProgramRecord } from '@/features/programs/storage/programsDb';
import { listProgramDeployments, undeployProgramEverywhere, type ProgramDeploymentRecord } from '@/features/programs/storage/deploymentsDb';
import { listProgramAuditLogs, addProgramAuditLog, type ProgramAuditLog } from '@/features/programs/storage/auditLogsDb';
import { ProgramPublishDialog } from '@/features/programs/publishing/ProgramPublishDialog';

export default function ProgramDetailsPage() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<ProgramRecord | null>(null);
  const [deployments, setDeployments] = useState<ProgramDeploymentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<ProgramAuditLog[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deviceQuery, setDeviceQuery] = useState('');

  const loadData = () => {
    if (!programId) return;
    const p = getProgram(programId);
    if (!p) {
      toast.error('Program not found');
      navigate('/dashboard/programs');
      return;
    }
    setProgram(p);
    setDeployments(listProgramDeployments(programId));
    setAuditLogs(listProgramAuditLogs(programId));
  };

  useEffect(() => { loadData(); }, [programId]);

  const filteredDeployments = useMemo(() => {
    const q = deviceQuery.toLowerCase().trim();
    return deployments.filter(d => {
      const dev = mockDevices.find(md => md.id === d.deviceId);
      const name = (dev?.alias || dev?.deviceName || d.deviceId).toLowerCase();
      return name.includes(q) || d.deviceId.toLowerCase().includes(q);
    });
  }, [deployments, deviceQuery]);

  if (!program) return null;

  return (
    <div className="flex flex-1 flex-col gap-8 p-8 max-w-[1400px] mx-auto w-full">
      {/* Top Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/programs')} className="rounded-full shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight truncate">{program.name}</h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">v{program.versions.length || '0'}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground font-medium">
               <span>{program.width}×{program.height}</span>
               <span className="opacity-30">•</span>
               <span>Modified {new Date(program.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="font-bold gap-2" onClick={() => navigate(`/dashboard/programs/${program.id}/edit`)}>
              <Pencil className="h-3.5 w-3.5" /> Edit Workspace
           </Button>
           <Button size="sm" className="font-bold gap-2 shadow-lg shadow-primary/20" onClick={() => setPublishOpen(true)}>
              <Send className="h-3.5 w-3.5" /> Publish New
           </Button>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="rounded-full border shadow-sm">
                    <MoreHorizontal className="h-4 w-4" />
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                 <DropdownMenuItem onClick={() => toast.info('Export logic here')}>
                    <Database className="mr-2 h-4 w-4" /> Export VSN Bundle
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={() => {
                       if (confirm('Undeploy this program from all devices?')) {
                          undeployProgramEverywhere(program.id);
                          addProgramAuditLog({
                             programId: program.id,
                             action: 'UNDEPLOY',
                             userId: 'admin',
                             userName: 'Administrator',
                             details: { description: 'Manual bulk undeploy' }
                          });
                          loadData();
                       }
                    }}
                 >
                    <XCircle className="mr-2 h-4 w-4" /> Undeploy All
                 </DropdownMenuItem>
                 <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={() => {
                       if (confirm('Delete program permanently?')) {
                          deleteProgram(program.id);
                          navigate('/dashboard/programs');
                       }
                    }}
                 >
                    <AlertCircle className="mr-2 h-4 w-4" /> Delete Program
                 </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Main Tabs Area */}
        <div className="space-y-8">
           <Tabs defaultValue="nodes" className="w-full">
              <TabsList className="bg-muted/40 p-1 rounded-xl w-fit">
                 <TabsTrigger value="nodes" className="px-6 rounded-lg gap-2 font-bold text-xs uppercase tracking-wider data-[state=active]:shadow-sm">
                    <Monitor className="h-3.5 w-3.5" /> Running Nodes
                 </TabsTrigger>
                 <TabsTrigger value="history" className="px-6 rounded-lg gap-2 font-bold text-xs uppercase tracking-wider data-[state=active]:shadow-sm">
                    <History className="h-3.5 w-3.5" /> Full Audit Trail
                 </TabsTrigger>
              </TabsList>

              <TabsContent value="nodes" className="mt-6 space-y-4">
                 <Card className="border-0 shadow-sm ring-1 ring-foreground/5 overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b">
                       <div className="flex items-center justify-between">
                          <div>
                             <CardTitle className="text-sm font-bold">Node Distribution</CardTitle>
                             <CardDescription className="text-xs">Live deployment status across all devices.</CardDescription>
                          </div>
                          <div className="relative w-64">
                             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                             <Input 
                                placeholder="Filter nodes..." 
                                value={deviceQuery} 
                                onChange={e => setDeviceQuery(e.target.value)}
                                className="h-8 pl-8 text-xs bg-background" 
                             />
                          </div>
                       </div>
                    </CardHeader>
                    <CardContent className="p-0">
                       <ScrollArea className="h-[500px]">
                          <div className="divide-y divide-foreground/[0.03]">
                             {filteredDeployments.map(d => {
                                const dev = mockDevices.find(md => md.id === d.deviceId);
                                return (
                                   <div key={d.deviceId} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/5">
                                      <div className="min-w-0 flex-1">
                                         <p className="text-sm font-bold truncate leading-tight">{dev?.alias || dev?.deviceName || d.deviceId}</p>
                                         <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60 uppercase">{d.deviceId.slice(0, 12)}</p>
                                      </div>
                                      <div className="flex items-center gap-6">
                                         <div className="text-right">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 mb-1 tracking-tighter">Status</p>
                                            <div className="flex items-center gap-1.5 justify-end">
                                               <div className={cn("w-1 h-1 rounded-full", dev?.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-zinc-300")} />
                                               <span className="text-[10px] font-black uppercase tracking-tighter">{dev?.status}</span>
                                            </div>
                                         </div>
                                         <div className="text-right min-w-[80px]">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 mb-1 tracking-tighter">Running</p>
                                            <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5 font-black border-primary/20 text-primary bg-primary/5">v{d.version}</Badge>
                                         </div>
                                      </div>
                                   </div>
                                );
                             })}
                             {deployments.length === 0 && (
                                <div className="py-20 text-center flex flex-col items-center gap-3 opacity-20">
                                   <Monitor className="h-12 w-12" />
                                   <p className="text-sm font-bold uppercase tracking-widest leading-tight">No Active Deployments</p>
                                   <Button size="sm" variant="outline" className="mt-2" onClick={() => setPublishOpen(true)}>Start First Deployment</Button>
                                </div>
                             )}
                          </div>
                       </ScrollArea>
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                 <Card className="border-0 shadow-sm ring-1 ring-foreground/5">
                    <CardHeader className="bg-muted/10 border-b">
                       <CardTitle className="text-sm font-bold">Audit Records</CardTitle>
                       <CardDescription className="text-xs">Immutable history of all operations for this program.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                       <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                          {auditLogs.length > 0 ? auditLogs.map((log) => (
                             <div key={log.id} className="relative flex items-start gap-6 group">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm z-10 transition-colors group-hover:border-primary/50">
                                   <AuditIcon action={log.action} />
                                </div>
                                <div className="min-w-0 flex-1 pt-0.5">
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[11px] font-black uppercase tracking-wider text-foreground">{log.action.replace('_', ' ')}</span>
                                      <span className="text-[10px] text-muted-foreground/60">• {new Date(log.timestamp).toLocaleString()}</span>
                                   </div>
                                   <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
                                      <span className="text-foreground font-bold">{log.userName}</span> {getActionDesc(log)}
                                   </p>
                                </div>
                             </div>
                          )) : (
                             <div className="py-10 text-center opacity-30 italic text-xs">No audit logs found for this program.</div>
                          )}
                       </div>
                    </CardContent>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>

        {/* Right Info Sidebar */}
        <div className="space-y-8">
           <Card className="border-0 shadow-sm ring-1 ring-foreground/5 bg-primary/[0.01]">
              <CardHeader>
                 <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" /> Overview
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-muted/20 border">
                       <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Total Nodes</p>
                       <p className="text-lg font-black">{deployments.length}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border">
                       <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Max Version</p>
                       <p className="text-lg font-black">v{program.versions.length || '1'}</p>
                    </div>
                 </div>
                 
                 <Separator className="bg-foreground/5" />
                 
                 <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                       <span className="text-muted-foreground font-bold uppercase tracking-wider">Storage ID</span>
                       <span className="font-mono opacity-60 uppercase">{program.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                       <span className="text-muted-foreground font-bold uppercase tracking-wider">Sync Integrity</span>
                       <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 h-4 px-1.5 text-[8px] font-black uppercase">Verified</Badge>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-0 shadow-sm ring-1 ring-foreground/5">
              <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-bold">Latest Release (v{program.versions.length || '1'})</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                 <div className="rounded-xl border bg-muted/20 p-4 flex flex-col items-center gap-3 overflow-hidden">
                    <div className="aspect-video w-full bg-black rounded-lg flex items-center justify-center border shadow-inner">
                       <Layers className="h-8 w-8 text-white/20" />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic text-center">Preview of the most recently published snapshot.</p>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      <ProgramPublishDialog 
        open={publishOpen} 
        onOpenChange={setPublishOpen} 
        program={program} 
        deployments={deployments}
        onAfterPublish={loadData}
      />
    </div>
  );
}

function AuditIcon({ action }: { action: string }) {
   if (action.includes('PUBLISH')) return <Send className="h-4 w-4 text-primary" />;
   if (action.includes('VERSION')) return <Database className="h-4 w-4 text-emerald-500" />;
   if (action.includes('EDIT')) return <Pencil className="h-4 w-4 text-amber-500" />;
   return <CheckCircle2 className="h-4 w-4 text-zinc-400" />;
}

function getActionDesc(log: ProgramAuditLog) {
   const { details } = log;
   switch (log.action) {
      case 'PUBLISH_START': return `initiated a deployment task targeting ${details.deviceCount} nodes with strategy: "${details.strategy}".`;
      case 'PUBLISH_COMPLETE': return `successfully pushed v${details.version} to all online nodes.`;
      case 'CREATE_VERSION': return `frozen the current draft into an immutable Release v${details.version}.`;
      case 'SAVE_DRAFT': return `saved a workspace snapshot.`;
      case 'EDIT': return `updated the program layout and material configuration.`;
      case 'CREATE': return `initialized this program from scratch.`;
      case 'UNDEPLOY': return `removed this program from all active devices.`;
      default: return `performed an operation on this program.`;
   }
}