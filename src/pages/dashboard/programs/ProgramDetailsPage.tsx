import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, 
  Monitor, Info, CheckCircle2, AlertCircle,
  Database, Layers, XCircle, Search, Pencil, MoreHorizontal, History as HistoryIcon, RefreshCw, Trash2
} from 'lucide-react';
import { toast } from '@/store/notificationStore';

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
import { 
  getProgramDetails, 
  getProgramAuditLogs, 
  deleteProgram as deleteProgramApi,
  deleteProgramDraft as deleteProgramDraftApi,
  unpublishProgram
} from '@/services/programApi';
import { getErrorMessage } from '@/services/authApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProgramPublishDialog } from '@/features/programs/publishing/ProgramPublishDialog';

export default function ProgramDetailsPage() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatDateTime } = useTimeFormatter();
  
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishPreferredDraftId, setPublishPreferredDraftId] = useState<string | null>(null);
  const [publishInitialVersionMode, setPublishInitialVersionMode] = useState<'CREATE' | 'EXISTING' | null>(null);
  const [publishInitialExistingVersion, setPublishInitialExistingVersion] = useState<number | null>(null);
  const [deviceQuery, setDeviceQuery] = useState('');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);

  // --- Queries ---
  const { data: programData, isLoading: isProgramLoading, isError } = useQuery({
    queryKey: ['programs', programId],
    queryFn: () => getProgramDetails(programId!),
    enabled: !!programId,
  });

  const { data: auditLogsData } = useQuery({
    queryKey: ['programs', programId, 'audit-logs'],
    queryFn: () => getProgramAuditLogs(programId!),
    enabled: !!programId,
  });

  const program = programData?.data;
  const deployments = program?.deployments || [];
  const auditLogs = auditLogsData?.data || [];

  // --- Mutations ---
  const deleteMutation = useMutation({
    mutationFn: () => deleteProgramApi(programId!),
    onSuccess: () => {
      toast.success('Program deleted');
      navigate('/dashboard/programs');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishProgram(programId!, { scope: 'RUNNING' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', programId] });
      toast.success('Unpublished from all devices');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteDraftMutation = useMutation({
    mutationFn: (draftId: string) => deleteProgramDraftApi(programId!, draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', programId] });
      toast.success('Draft deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const filteredDeployments = useMemo(() => {
    const q = deviceQuery.toLowerCase().trim();
    return deployments.filter(d => {
      const name = String(d.deviceName || d.deviceId || '').toLowerCase();
      const idStr = String(d.deviceId || '').toLowerCase();
      return name.includes(q) || idStr.includes(q);
    });
  }, [deployments, deviceQuery]);

  const latestRelease = useMemo(() => {
    if (!program?.versions?.length) return null;
    return [...program.versions].sort((a, b) => b.version - a.version)[0];
  }, [program]);

  const draftsSorted = useMemo(() => {
    return [...(program?.drafts || [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [program?.drafts]);
  
  const maxVersion = latestRelease?.version ?? 0;
  const hasRelease = maxVersion > 0;

  if (isProgramLoading) {
    return <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <RefreshCw className="h-8 w-8 animate-spin text-primary/40" />
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Loading Workspace Details...</p>
    </div>;
  }

  if (!program || isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <p className="text-sm font-bold uppercase tracking-widest">Program not found</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/programs')}>Back to Library</Button>
      </div>
    );
  }

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
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">v{maxVersion}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground font-medium">
               <span>{program.width}×{program.height}</span>
               <span className="opacity-30">•</span>
               <span>Modified {formatDateTime(program.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Button className="h-10 px-6 gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={() => {
             const base = (program.defaultVersion ?? maxVersion ?? 0) || 0;
             navigate(`/dashboard/programs/${programId}/edit${base > 0 ? `?base=${base}` : ''}`);
           }}>
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
                    onClick={() => setUnpublishConfirmOpen(true)}
                 >
                    <XCircle className="mr-2 h-4 w-4" /> Undeploy All
                 </DropdownMenuItem>
                 <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={() => setDeleteConfirmOpen(true)}
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
                 <TabsTrigger value="releases" className="px-6 rounded-lg gap-2 font-bold text-xs uppercase tracking-wider data-[state=active]:shadow-sm">
                    <Database className="h-3.5 w-3.5" /> Releases
                 </TabsTrigger>
                 <TabsTrigger value="drafts" className="px-6 rounded-lg gap-2 font-bold text-xs uppercase tracking-wider data-[state=active]:shadow-sm">
                    <Layers className="h-3.5 w-3.5" /> Drafts
                 </TabsTrigger>
                 <TabsTrigger value="history" className="px-6 rounded-lg gap-2 font-bold text-xs uppercase tracking-wider data-[state=active]:shadow-sm">
                    <HistoryIcon className="h-3.5 w-3.5" /> Full Audit Trail
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
                                return (
                                   <div key={d.deviceId} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/5">
                                      <div className="min-w-0 flex-1">
                                         <p className="text-sm font-bold truncate leading-tight">{d.deviceName || d.deviceId}</p>
                                         <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-60 uppercase">{String(d.deviceId ?? '').slice(0, 12) || "Unknown"}</p>
                                      </div>
                                      <div className="flex items-center gap-6">
                                         <div className="text-right">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 mb-1 tracking-tighter">Status</p>
                                            <div className="flex items-center gap-1.5 justify-end">
                                               <div className={cn("w-1 h-1 rounded-full", d.status === 'DOWNLOADED' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-amber-500")} />
                                               <span className="text-[10px] font-black uppercase tracking-tighter">{d.status || 'Assigned'}</span>
                                            </div>
                                         </div>
                                         <div className="text-right min-w-[80px]">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 mb-1 tracking-tighter">Running</p>
                                            <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5 font-black border-primary/20 text-primary bg-primary/5">v{d.releaseVersion}</Badge>
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
                                      <span className="text-[10px] text-muted-foreground/60">• {formatDateTime(log.createdAt)}</span>
                                   </div>
                                   <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
                                      <span className="text-foreground font-bold">{log.operatorName}</span> {log.action}
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

              <TabsContent value="releases" className="mt-6 space-y-4">
                 <Card className="border-0 shadow-sm ring-1 ring-foreground/5 overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b">
                       <CardTitle className="text-sm font-bold">Published Releases</CardTitle>
                       <CardDescription className="text-xs">Versions (vN) are immutable snapshots that can be deployed to devices.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                       {program.versions?.length ? (
                         <ScrollArea className="h-[520px]">
                            <div className="divide-y divide-foreground/[0.03]">
                              {[...program.versions].sort((a, b) => b.version - a.version).map((v) => (
                                <div key={v.version} className="flex items-center justify-between gap-4 px-6 py-4">
                                  <div className="min-w-0 flex-1">
                                     <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5 font-black border-primary/20 text-primary bg-primary/5">v{v.version}</Badge>
                                        <span className="text-[10px] text-muted-foreground/60">· {formatDateTime(v.createdAt)}</span>
                                     </div>
                                     <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] text-muted-foreground/70">
                                        <span className="font-mono">deviceProgramId: {v.deviceProgramId}</span>
                                        {v.deviceTitleSnapshot ? <span className="truncate max-w-[420px]">title: {v.deviceTitleSnapshot}</span> : null}
                                     </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => {
                                         navigate(`/dashboard/programs/${programId}/edit?base=${v.version}`);
                                       }}
                                     >
                                       Open baseline
                                     </Button>
                                     <Button
                                       size="sm"
                                       onClick={() => {
                                         setPublishPreferredDraftId(null);
                                         setPublishInitialVersionMode('EXISTING');
                                         setPublishInitialExistingVersion(v.version);
                                         setPublishOpen(true);
                                       }}
                                     >
                                       Deploy
                                     </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                         </ScrollArea>
                       ) : (
                         <div className="py-20 text-center flex flex-col items-center gap-3 opacity-40">
                           <Database className="h-12 w-12" />
                           <p className="text-sm font-bold uppercase tracking-widest leading-tight">No Releases Yet</p>
                            <Button size="sm" className="mt-2" onClick={() => { navigate(`/dashboard/programs/${programId}/edit`); }}>Publish v1</Button>
                          </div>
                        )}
                     </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="drafts" className="mt-6 space-y-4">
                 <Card className="border-0 shadow-sm ring-1 ring-foreground/5 overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b">
                       <CardTitle className="text-sm font-bold">Draft Snapshots</CardTitle>
                       <CardDescription className="text-xs">Drafts are editable snapshots, unique per baseVersion (Blank or vN).</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                       {draftsSorted.length ? (
                         <ScrollArea className="h-[520px]">
                            <div className="divide-y divide-foreground/[0.03]">
                              {draftsSorted.map((d) => (
                                <div key={d.draftId} className="flex items-center justify-between gap-4 px-6 py-4">
                                  <div className="min-w-0 flex-1">
                                     <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5 font-black border-amber-500/30 text-amber-700 bg-amber-500/5">
                                          {d.baseVersion > 0 ? `base v${d.baseVersion}` : 'base Blank'}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground/60">· updated {formatDateTime(d.updatedAt)}</span>
                                     </div>
                                     <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground/70 font-mono">
                                        <span>draftId: {d.draftId.slice(0, 8)}...</span>
                                     </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => {
                                         const base = d.baseVersion > 0 ? `?base=${d.baseVersion}` : '';
                                         navigate(`/dashboard/programs/${programId}/edit${base}`);
                                       }}
                                     >
                                       Open draft
                                     </Button>
                                     <Button
                                       size="sm"
                                       onClick={() => {
                                         setPublishPreferredDraftId(d.draftId);
                                         setPublishInitialVersionMode('CREATE');
                                         setPublishInitialExistingVersion(null);
                                         setPublishOpen(true);
                                       }}
                                     >
                                       Publish
                                     </Button>
                                     <Button
                                       size="sm"
                                       variant="destructive"
                                       onClick={() => deleteDraftMutation.mutate(d.draftId)}
                                       disabled={deleteDraftMutation.isPending}
                                     >
                                       Delete
                                     </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                         </ScrollArea>
                       ) : (
                         <div className="py-20 text-center flex flex-col items-center gap-3 opacity-40">
                           <Layers className="h-12 w-12" />
                           <p className="text-sm font-bold uppercase tracking-widest leading-tight">No Drafts Yet</p>
                           <Button size="sm" className="mt-2" variant="outline" onClick={() => navigate(`/dashboard/programs/${programId}/edit`)}>
                             Open editor
                           </Button>
                         </div>
                       )}
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
                       <p className="text-lg font-black">v{maxVersion}</p>
                    </div>
                 </div>
                 
                 <Separator className="bg-foreground/5" />
                 
                 <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                       <span className="text-muted-foreground font-bold uppercase tracking-wider">Storage ID</span>
                       <span className="font-mono opacity-60 uppercase">{program.id?.slice(0, 8) ?? "Unknown"}...</span>
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
                 <CardTitle className="text-sm font-bold">
                   {hasRelease ? `Latest Release (v${maxVersion})` : 'No releases yet'}
                 </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                 <div className="rounded-xl border bg-muted/20 p-4 flex flex-col items-center gap-3 overflow-hidden">
                    <div className="aspect-video w-full bg-black rounded-lg flex items-center justify-center border shadow-inner">
                       {latestRelease?.coverUrl ? (
                          <img src={latestRelease.coverUrl} className="h-full w-full object-cover rounded-md" alt="" />
                       ) : (
                          <Layers className="h-8 w-8 text-white/20" />
                       )}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic text-center">
                      {hasRelease ? 'Preview of the most recently published snapshot.' : 'Publish to create your first release (v1).'}
                    </p>
                     {!hasRelease ? (
                      <Button size="sm" className="font-bold gap-2" onClick={() => navigate(`/dashboard/programs/${programId}/edit`)}>
                        <Send className="h-3.5 w-3.5" /> Open editor
                      </Button>
                     ) : null}
                  </div>
               </CardContent>
            </Card>
        </div>
      </div>

      <ProgramPublishDialog 
        open={publishOpen} 
        onOpenChange={(next) => {
          setPublishOpen(next);
          if (!next) {
            setPublishPreferredDraftId(null);
            setPublishInitialVersionMode(null);
            setPublishInitialExistingVersion(null);
          }
        }} 
        program={program as any} 
        deployments={deployments}
        preferredDraftId={publishPreferredDraftId}
        initialVersionMode={publishInitialVersionMode}
        initialExistingVersion={publishInitialExistingVersion}
        lockVersionMode={publishInitialVersionMode}
        cleanupDraftId={publishInitialVersionMode === 'CREATE' ? publishPreferredDraftId : null}
        onAfterPublish={() => queryClient.invalidateQueries({ queryKey: ['programs', programId] })}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-[420px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ring-1 ring-foreground/5">
          <div className="p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold tracking-tight">Delete Program Permanently?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm pt-2 space-y-4">
                <span className="block">This action cannot be undone. You are about to permanently delete:</span>
                <span className="block rounded-xl bg-destructive/5 border border-destructive/10 p-4 font-bold text-destructive text-base truncate">
                  {program.name}
                </span>
                <span className="block">This will delete the program and all its versions from our system.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="font-bold text-xs uppercase tracking-widest px-8">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs uppercase tracking-widest px-10 h-10 shadow-xl shadow-destructive/20"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unpublishConfirmOpen} onOpenChange={setUnpublishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undeploy from All Devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the program on all currently assigned devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => unpublishMutation.mutate()}>
              Undeploy All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AuditIcon({ action }: { action: string }) {
   if (action.includes('PUBLISH')) return <Send className="h-4 w-4 text-primary" />;
   if (action.includes('VERSION')) return <Database className="h-4 w-4 text-emerald-500" />;
   if (action.includes('EDIT') || action.includes('SAVE')) return <Pencil className="h-4 w-4 text-amber-500" />;
   return <CheckCircle2 className="h-4 w-4 text-zinc-400" />;
}
