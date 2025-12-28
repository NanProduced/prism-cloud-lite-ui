import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Icons from 'lucide-react';
import { Check, ChevronsRight, ChevronRight, X, Clock, AlertCircle, Monitor, ShieldCheck, Search, Filter, Send, History, Database, TrendingUp, Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/store/notificationStore';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Device, Tag } from '@/types/device';
import { mockDevices } from '@/lib/mock/devices';

import { publishProgram } from '@/services/programApi';
import { getErrorMessage } from '@/services/authApi';
import type { ProgramDetailResp, ProgramDeploymentResp, ProgramPublishReq } from '@/types/program';

type PublishScope = 'SELECTED' | 'RUNNING';
type PublishMode = 'APPEND' | 'OVERWRITE';
type VersionMode = 'CREATE' | 'EXISTING';

export type ProgramPublishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: ProgramDetailResp;
  deployments: ProgramDeploymentResp[];
  preferredDraftId?: string | null;
  initialSelectedDeviceIds?: string[] | null;
  onAfterPublish?: () => void;
};

export function ProgramPublishDialog({
  open,
  onOpenChange,
  program,
  deployments,
  preferredDraftId,
  initialSelectedDeviceIds,
  onAfterPublish,
}: ProgramPublishDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const deploymentsByDeviceId = useMemo(() => new Map(deployments.map((d) => [d.deviceId, d])), [deployments]);
  const allTags = useMemo(() => collectDeviceTags(mockDevices), []);
  const latestPublished = useMemo(() => [...(program.versions || [])].sort((a, b) => b.version - a.version)[0], [program.versions]);
  
  const defaultVersionMode = useMemo(
    () => (preferredDraftId ? 'CREATE' : (program.versions?.length || 0) === 0 ? 'CREATE' : 'EXISTING'),
    [preferredDraftId, program.versions?.length],
  );

  const [deviceQuery, setDeviceQuery] = useState('');
  const [tagFilters, setTagFilters] = useState<Set<string>>(() => new Set());
  const [tagMatchMode, setTagMatchMode] = useState<'any' | 'all'>('any');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [resolutionOnly, setResolutionOnly] = useState<'any' | 'match'>('any');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(() => new Set());

  const [versionMode, setVersionMode] = useState<VersionMode>(defaultVersionMode);
  const [existingVersion, setExistingVersion] = useState<number>(latestPublished?.version ?? 1);
  const [scope, setScope] = useState<PublishScope>('SELECTED');
  const [mode, setMode] = useState<PublishMode>('APPEND');

  const predictedNewVersion = useMemo(() => Math.max(0, ...(program.versions || []).map((v) => v.version)) + 1, [program.versions]);

  // --- Mutations ---
  const publishMutation = useMutation({
    mutationFn: (data: ProgramPublishReq) => publishProgram(program.id, data),
    onSuccess: (res) => {
      const syncMsg = plan.counts.pendingSync > 0 
        ? `. ${plan.counts.pendingSync} devices will sync when online.` 
        : '';
      toast.success(`Published to ${res.data?.results.length || 0} devices${syncMsg}`);
      onAfterPublish?.();
      close();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const filteredDevices = useMemo(() => {
    const q = deviceQuery.trim().toLowerCase();
    return mockDevices.filter((device) => {
      if (onlineOnly && device.status !== 'online') return false;
      if (resolutionOnly === 'match' && (device.resolution.width !== program.width || device.resolution.height !== program.height)) return false;
      
      if (tagFilters.size > 0) {
        const deviceTagIds = device.tags.map(t => t.id);
        if (tagMatchMode === 'all') {
          if (![...tagFilters].every(id => deviceTagIds.includes(id))) return false;
        } else {
          if (![...tagFilters].some(id => deviceTagIds.includes(id))) return false;
        }
      }

      if (!q) return true;
      const name = (device.alias ?? device.deviceName).toLowerCase();
      return name.includes(q) || device.id.toLowerCase().includes(q);
    });
  }, [deviceQuery, onlineOnly, program.height, program.width, resolutionOnly, tagFilters, tagMatchMode]);

  const selectedDevices = useMemo(() => {
    const map = new Map(mockDevices.map((d) => [d.id, d]));
    return [...selectedDeviceIds].map((id) => map.get(id)).filter(Boolean) as Device[];
  }, [selectedDeviceIds]);

  const runningDeviceIds = useMemo(() => deployments.map((d) => d.deviceId), [deployments]);

  const baseTargetDeviceIds = useMemo(() => {
    if (scope === 'RUNNING') return runningDeviceIds;
    return [...selectedDeviceIds];
  }, [runningDeviceIds, scope, selectedDeviceIds]);

  const targetDeviceIds = useMemo(() => {
    if (mode === 'OVERWRITE') return baseTargetDeviceIds;
    return baseTargetDeviceIds.filter((id) => !deploymentsByDeviceId.has(id));
  }, [baseTargetDeviceIds, deploymentsByDeviceId, mode]);

  const plan = useMemo(() => {
    const targetVersion = versionMode === 'EXISTING' ? existingVersion : predictedNewVersion;
    const perDevice = baseTargetDeviceIds.map((deviceId) => {
      const device = mockDevices.find(d => d.id === deviceId);
      const current = deploymentsByDeviceId.get(deviceId)?.version ?? null;
      const willDeploy = targetDeviceIds.includes(deviceId);
      
      let action: 'deploy' | 'update' | 'rollback' | 'no-change' | 'skip' = 'skip';
      if (willDeploy) {
        if (current == null) action = 'deploy';
        else if (current === targetVersion) action = 'no-change';
        else if (current < targetVersion) action = 'update';
        else action = 'rollback';
      }

      return { 
        deviceId, 
        current, 
        target: targetVersion, 
        action,
        isOffline: device?.status !== 'online' 
      };
    });

    const counts = perDevice.reduce(
      (acc, row) => {
        acc[row.action] += 1;
        if (row.action !== 'skip' && row.isOffline) acc.pendingSync += 1;
        return acc;
      },
      { deploy: 0, update: 0, rollback: 0, 'no-change': 0, skip: 0, pendingSync: 0 } as Record<string, number>,
    );

    return { targetVersion, perDevice, counts };
  }, [baseTargetDeviceIds, deploymentsByDeviceId, existingVersion, predictedNewVersion, targetDeviceIds, versionMode]);

  const resetDialog = () => {
    setStep(0);
    setDeviceQuery('');
    setTagFilters(new Set());
    setOnlineOnly(false);
    setResolutionOnly('any');
    const initialSelected = (initialSelectedDeviceIds ?? []).filter(Boolean);
    setSelectedDeviceIds(new Set(initialSelected));
    setVersionMode(defaultVersionMode);
    setExistingVersion(latestPublished?.version ?? 1);
    setScope('SELECTED');
    const anyRunningSelected = initialSelected.some((id) => deploymentsByDeviceId.has(id));
    setMode(anyRunningSelected ? 'OVERWRITE' : 'APPEND');
  };

  useEffect(() => {
    if (!open) return;
    resetDialog();
  }, [open, program.id, latestPublished]);

  const close = () => {
    onOpenChange(false);
    resetDialog();
  };

  const canNext = useMemo(() => {
    if (step === 0) return selectedDeviceIds.size > 0 || deployments.length > 0;
    if (step === 1) {
      if (scope === 'RUNNING' && deployments.length === 0) return false;
      if (scope === 'SELECTED' && selectedDeviceIds.size === 0) return false;
      return true;
    }
    return true;
  }, [deployments.length, scope, selectedDeviceIds.size, step]);

  const onConfirm = () => {
    const draftId = preferredDraftId || [...(program.drafts || [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.id;

    publishMutation.mutate({
      versionMode,
      existingVersion: versionMode === 'EXISTING' ? existingVersion : undefined,
      draftId: versionMode === 'CREATE' ? draftId : undefined,
      scope,
      deviceIds: scope === 'SELECTED' ? [...selectedDeviceIds] : undefined,
      mode
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-[1100px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ring-1 ring-foreground/5">
        <div className="flex h-[800px] flex-col bg-background">
          {/* Header */}
          <div className="px-8 py-5 border-b flex items-center justify-between bg-muted/10">
             <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                   <DialogTitle className="text-lg font-bold tracking-tight">Publish Program</DialogTitle>
                   <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="px-1.5 py-0 h-5 bg-background border-primary/20 text-primary text-[10px] font-bold">
                        {program.name}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold opacity-50">{program.width}×{program.height}</span>
                   </div>
                </div>
             </div>
             <Button variant="ghost" size="icon" onClick={close} className="rounded-full hover:bg-muted/50">
                <X className="h-4 w-4" />
             </Button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Content Area */}
            <div className="flex-1 flex flex-col p-8 overflow-hidden border-r">
               <div className="flex items-center justify-between mb-8">
                 <PublishStepper currentStep={step} />
                 <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-30">
                   Phase {step + 1} of 3
                 </div>
               </div>
               
               <div className="flex-1 overflow-hidden">
                  {step === 0 && (
                    <DeviceSelectStep
                      allTags={allTags}
                      deviceQuery={deviceQuery}
                      filteredDevices={filteredDevices}
                      onlineOnly={onlineOnly}
                      onDeviceQueryChange={setDeviceQuery}
                      onOnlineOnlyChange={setOnlineOnly}
                      onResolutionOnlyChange={setResolutionOnly}
                      onTagFiltersChange={setTagFilters}
                      tagMatchMode={tagMatchMode}
                      onTagMatchModeChange={setTagMatchMode}
                      resolutionOnly={resolutionOnly}
                      selectedDeviceIds={selectedDeviceIds}
                      tagFilters={tagFilters}
                      onSelectedDeviceIdsChange={setSelectedDeviceIds}
                      programResolution={{ width: program.width, height: program.height }}
                      deploymentsByDeviceId={deploymentsByDeviceId}
                    />
                  )}
                  {step === 1 && (
                    <StrategyStep
                      deployments={deployments}
                      existingVersion={existingVersion}
                      mode={mode}
                      onExistingVersionChange={setExistingVersion}
                      onModeChange={setMode}
                      onScopeChange={setScope}
                      onVersionModeChange={setVersionMode}
                      predictedNewVersion={predictedNewVersion}
                      program={program}
                      scope={scope}
                      versionMode={versionMode}
                      selectedCount={selectedDeviceIds.size}
                      latest={latestPublished}
                    />
                  )}
                  {step === 2 && (
                    <ReviewStep
                      plan={plan}
                    />
                  )}
               </div>

               {/* Action Footer */}
               <div className="mt-6 flex items-center justify-between pt-6 border-t bg-background/50 backdrop-blur-sm">
                  <Button variant="ghost" onClick={step === 0 ? close : () => setStep(s => s - 1)} className="px-6 font-bold h-10">
                    {step === 0 ? 'Cancel' : 'Previous Step'}
                  </Button>
                  <Button 
                    onClick={step === 2 ? onConfirm : () => setStep(s => s + 1)} 
                    disabled={!canNext || publishMutation.isPending}
                    className="px-10 font-bold gap-2 h-10 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {publishMutation.isPending ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : step === 2 ? (
                      <><ShieldCheck className="h-4 w-4" /> Finalize & Deploy</>
                    ) : (
                      <>Continue <ChevronRight className="h-4 w-4" /></>
                    )}
                  </Button>
               </div>
            </div>

            {/* Right Summary Sidebar */}
            <div className="w-[360px] bg-muted/5 flex flex-col p-6">
               <div className="flex items-center gap-2 mb-6">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Execution Plan</h3>
               </div>
               
               <div className="flex-1 space-y-8 flex flex-col min-h-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-background border shadow-sm flex flex-col items-center">
                       <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">Targets</p>
                       <p className="text-2xl font-black tabular-nums">{baseTargetDeviceIds.length}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-background border shadow-sm flex flex-col items-center">
                       <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1 tracking-wider">Release</p>
                       <p className="text-2xl font-black tabular-nums text-primary">v{plan.targetVersion}</p>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="flex-1 flex flex-col min-h-0">
                     <div className="flex items-center justify-between mb-3 px-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Device Queue</p>
                        <Badge variant="secondary" className="h-4 text-[9px] font-black px-1.5">{selectedDeviceIds.size}</Badge>
                     </div>
                     <ScrollArea className="flex-1 -mx-2 px-2 scrollbar-thin">
                        <div className="space-y-2 pb-8">
                           {selectedDevices.map(d => (
                              <div key={d.id} className="group relative p-3 rounded-xl border bg-background shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                                 <p className="text-xs font-bold truncate pr-6 leading-tight tracking-tight">{d.alias || d.deviceName}</p>
                                 <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1.5">
                                       <div className={cn("w-1.5 h-1.5 rounded-full", d.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-300")} />
                                       <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter">{d.status}</span>
                                    </div>
                                    <div className="h-2.5 w-px bg-muted" />
                                    <span className="text-[9px] font-mono text-muted-foreground/40">{formatDeviceId(d.id)}</span>
                                 </div>
                                 <button 
                                    onClick={() => setSelectedDeviceIds(prev => {
                                      const n = new Set(prev);
                                      n.delete(d.id);
                                      return n;
                                    })}
                                    className="absolute right-2 top-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                 >
                                    <X className="h-3 w-3" />
                                 </button>
                              </div>
                           ))}
                           {selectedDeviceIds.size === 0 && (
                             <div className="py-32 text-center flex flex-col items-center gap-4 opacity-10 grayscale">
                                <div className="p-4 rounded-full border-2 border-dashed">
                                   <Monitor className="h-10 w-10" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Initialize queue<br/>to continue</p>
                             </div>
                           )}
                        </div>
                     </ScrollArea>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PublishStepper({ currentStep }: { currentStep: number }) {
  const steps = ['Select Nodes', 'Strategy', 'Manifest'];
  return (
    <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl border w-fit shadow-inner">
      {steps.map((s, idx) => (
        <div key={s} className={cn(
          "px-5 py-2 rounded-lg text-[11px] font-black transition-all flex items-center gap-2.5",
          idx === currentStep ? "bg-background text-foreground shadow-md ring-1 ring-foreground/[0.03]" : "text-muted-foreground/40"
        )}>
          <div className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center text-[9px] border transition-colors",
            idx < currentStep ? "bg-emerald-500 border-emerald-500 text-white" : idx === currentStep ? "bg-primary border-primary text-white" : "border-muted-foreground/20"
          )}>
            {idx < currentStep ? <Check className="h-2.5 w-2.5" /> : idx + 1}
          </div>
          <span className="tracking-tight uppercase">{s}</span>
        </div>
      ))}
    </div>
  );
}

interface DeviceSelectStepProps {
  filteredDevices: Device[];
  onlineOnly: boolean;
  onOnlineOnlyChange: (v: boolean) => void;
  onResolutionOnlyChange: (v: 'any' | 'match') => void;
  onSelectedDeviceIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onTagFiltersChange: Dispatch<SetStateAction<Set<string>>>;
  tagMatchMode: 'any' | 'all';
  onTagMatchModeChange: (v: 'any' | 'all') => void;
  programResolution: { width: number; height: number };
  resolutionOnly: 'any' | 'match';
  selectedDeviceIds: Set<string>;
  tagFilters: Set<string>;
  allTags: Tag[];
  deviceQuery: string;
  onDeviceQueryChange: (v: string) => void;
  deploymentsByDeviceId: Map<string, ProgramDeploymentResp>;
}

function DeviceSelectStep({
  filteredDevices,
  onlineOnly,
  onOnlineOnlyChange,
  onResolutionOnlyChange,
  onSelectedDeviceIdsChange,
  onTagFiltersChange,
  tagMatchMode,
  onTagMatchModeChange,
  programResolution,
  resolutionOnly,
  selectedDeviceIds,
  tagFilters,
  allTags,
  deviceQuery,
  onDeviceQueryChange,
  deploymentsByDeviceId
}: DeviceSelectStepProps) {
  const filteredIds = filteredDevices.map((d) => d.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedDeviceIds.has(id));

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
       <div className="flex items-center gap-3 mb-6 p-1">
          <div className="relative flex-1 group">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
             <Input 
                value={deviceQuery} 
                onChange={(e) => onDeviceQueryChange(e.target.value)} 
                placeholder="Search nodes by name, ID or IP..." 
                className="pl-10 h-11 bg-muted/20 border-border focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all rounded-xl"
             />
          </div>
          <Button variant="outline" className="font-black text-[11px] h-11 px-6 rounded-xl uppercase tracking-wider gap-2 shadow-sm" onClick={() => {
            onSelectedDeviceIdsChange((prev) => {
              const next = new Set(prev);
              if (allSelected) filteredIds.forEach((id) => next.delete(id));
              else filteredIds.forEach((id) => next.add(id));
              return next;
            });
          }}>
            {allSelected ? <><X className="h-3.5 w-3.5" /> Deselect All</> : <><Check className="h-3.5 w-3.5" /> Select Visible</>}
          </Button>
       </div>

       <div className="mb-6 space-y-4 px-1">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Quick Filters</span>
             </div>
             <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border shadow-inner">
                <button 
                  onClick={() => onTagMatchModeChange('any')}
                  className={cn("px-2 py-1 text-[9px] font-black rounded-md transition-all", tagMatchMode === 'any' ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.02]" : "text-muted-foreground/40 hover:text-muted-foreground")}
                >
                  ANY
                </button>
                <button 
                  onClick={() => onTagMatchModeChange('all')}
                  className={cn("px-2 py-1 text-[9px] font-black rounded-md transition-all", tagMatchMode === 'all' ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.02]" : "text-muted-foreground/40 hover:text-muted-foreground")}
                >
                  ALL
                </button>
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
             <button onClick={() => onOnlineOnlyChange(!onlineOnly)} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all shadow-sm", onlineOnly ? "bg-emerald-500 border-emerald-500 text-white" : "bg-card text-muted-foreground hover:border-muted-foreground/30")}>Online Only</button>
             <button onClick={() => onResolutionOnlyChange(resolutionOnly === 'match' ? 'any' : 'match')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all shadow-sm", resolutionOnly === 'match' ? "bg-primary border-primary text-white" : "bg-card text-muted-foreground hover:border-muted-foreground/30")}>
               Match {programResolution.width}x{programResolution.height}
             </button>
             <Separator orientation="vertical" className="h-5 mx-2 opacity-50" />
             
             {/* Tag Scroll Area */}
             <div className="flex-1 min-w-0 overflow-hidden relative">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scrollbar-thin">
                   {allTags.map((t) => {
                     const active = tagFilters.has(t.id);
                     const Icon = (Icons as any)[t.icon || 'Tag'] || Icons.Tag;
                     return (
                       <button 
                         key={t.id} 
                         onClick={() => onTagFiltersChange((prev) => {
                           const next = new Set(prev);
                           if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                           return next;
                         })} 
                         className={cn(
                           "px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-2 transition-all whitespace-nowrap shadow-sm", 
                           active 
                             ? "bg-accent border-primary/40 text-foreground ring-2 ring-primary/5" 
                             : "bg-muted/30 border-transparent text-muted-foreground grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:bg-muted/50"
                         )}
                         style={active ? { backgroundColor: `${t.color}15`, borderColor: `${t.color}40`, color: t.color } : {}}
                       >
                         <Icon className="h-3 w-3" style={active ? { color: t.color } : {}} />
                         {t.name}
                       </button>
                     );
                   })}
                </div>
             </div>
          </div>
       </div>

       <div className="flex-1 border rounded-[2rem] bg-muted/5 overflow-hidden flex flex-col shadow-inner">
          <div className="flex items-center gap-4 px-10 py-3.5 bg-muted/20 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 border-b">
             <span className="flex-1">Device</span>
             <span className="w-32 text-center">STATUS</span>
          </div>

          {filteredDevices.length > 0 ? (
            <ScrollArea className="flex-1 scrollbar-thin">
               <div className="divide-y divide-foreground/[0.03]">
                  {filteredDevices.map((d) => {
                     const isSelected = selectedDeviceIds.has(d.id);
                     const isConflict = d.resolution.width !== programResolution.width || d.resolution.height !== programResolution.height;
                     const deployed = deploymentsByDeviceId.get(d.id);
                     
                     return (
                        <div key={d.id} className={cn("group flex items-center gap-6 px-10 py-4 transition-all cursor-pointer relative", isSelected ? "bg-primary/[0.04]" : "hover:bg-muted/10")} onClick={() => onSelectedDeviceIdsChange((prev: Set<string>) => {
                        const next = new Set(prev);
                        if (isSelected) next.delete(d.id); else next.add(d.id);
                        return next;
                        })}>
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-all rounded-r-full", isSelected ? "bg-primary shadow-[0_0_12px_rgba(59,130,246,0.4)]" : "bg-transparent")} />
                        <Checkbox checked={isSelected} onCheckedChange={() => {}} className="rounded-md h-5 w-5" />
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center gap-2.5">
                              <span className="text-sm font-black tracking-tight group-hover:text-primary transition-colors">{d.alias || d.deviceName}</span>
                              {deployed && (
                                 <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-1.5 h-4.5 text-[9px] font-black">
                                    v{deployed.version}
                                 </Badge>
                              )}
                              {isConflict && (
                                 <TooltipProvider>
                                    <Tooltip>
                                       <TooltipTrigger asChild>
                                          <div className="p-1 rounded-full bg-amber-500/10"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /></div>
                                       </TooltipTrigger>
                                       <TooltipContent className="bg-amber-900 text-amber-50 border-amber-800 p-3 rounded-xl shadow-xl max-w-[280px]">
                                          <p className="font-bold flex items-center gap-2 mb-1 uppercase text-[10px] tracking-widest"><AlertCircle className="h-3 w-3" /> Resolution Mismatch</p>
                                          <p className="text-[11px] opacity-80 leading-relaxed">This hardware runs at {d.resolution.width}x{d.resolution.height}, but your program is {programResolution.width}x{programResolution.height}. Content scaling may occur.</p>
                                       </TooltipContent>
                                    </Tooltip>
                                 </TooltipProvider>
                              )}
                           </div>
                           <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[9px] text-muted-foreground font-mono opacity-50 tracking-tighter uppercase">{formatDeviceId(d.id)}</p>
                              <div className="h-2 w-px bg-muted" />
                              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{d.resolution.width}×{d.resolution.height}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right min-w-[80px]">
                              <div className="flex items-center gap-2 justify-end">
                                 <div className={cn("w-1.5 h-1.5 rounded-full transition-all", d.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-zinc-300")} />
                                 <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-foreground">{d.status}</span>
                              </div>
                           </div>
                        </div>
                        </div>
                     );
                  })}
               </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
               <div className="p-6 rounded-3xl bg-muted/10 border-2 border-dashed border-muted flex items-center justify-center mb-6 opacity-40">
                  <Monitor className="h-12 w-12 text-muted-foreground" />
               </div>
               <div className="space-y-2 max-w-[320px]">
                  <p className="text-base font-black uppercase tracking-[0.2em] text-foreground/80">No Nodes Found</p>
                  <p className="text-[10px] text-muted-foreground font-bold leading-relaxed opacity-60">
                     We couldn't find any devices matching your current search parameters or active filters.
                  </p>
               </div>
               <Button 
                  variant="default"
                  size="sm" 
                  className="mt-8 font-black text-[9px] uppercase tracking-[0.2em] px-10 h-10 rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                  onClick={() => {
                     onDeviceQueryChange('');
                     onOnlineOnlyChange(false);
                     onResolutionOnlyChange('any');
                     onTagFiltersChange(new Set());
                     onTagMatchModeChange('any');
                  }}
               >
                  Reset All Filters
               </Button>
            </div>
          )}
       </div>
    </div>
  );
}

interface StrategyStepProps {
  versionMode: VersionMode;
  onVersionModeChange: (v: VersionMode) => void;
  predictedNewVersion: number;
  program: ProgramDetailResp;
  existingVersion: number;
  onExistingVersionChange: (v: number) => void;
  latest: any | null;
  scope: PublishScope;
  onScopeChange: (v: PublishScope) => void;
  selectedCount: number;
  deployments: ProgramDeploymentResp[];
  mode: PublishMode;
  onModeChange: (v: PublishMode) => void;
}

function StrategyStep({ versionMode, onVersionModeChange, predictedNewVersion, program, existingVersion, onExistingVersionChange, latest, scope, onScopeChange, selectedCount, deployments, mode, onModeChange }: StrategyStepProps) {
  return (
    <ScrollArea className="h-full scrollbar-thin">
      <div className="space-y-10 animate-in fade-in slide-in-from-right-2 duration-300 py-4 pr-4">
       <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
             <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                <div className="h-1 w-6 bg-primary rounded-full" /> Lifecycle Control
             </h4>
             <Badge variant="outline" className="font-mono text-[10px] opacity-30 border-dashed">VCS: ACTIVE</Badge>
          </div>
          <div className="grid grid-cols-2 gap-6">
             <div
               role="button"
               tabIndex={0}
               aria-pressed={versionMode === 'CREATE'}
               onClick={() => onVersionModeChange('CREATE')}
               onKeyDown={(e) => {
                 if (e.key !== 'Enter' && e.key !== ' ') return;
                 e.preventDefault();
                 onVersionModeChange('CREATE');
               }}
               className={cn(
                 "flex flex-col p-8 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden group shadow-sm cursor-pointer select-none",
                 versionMode === 'CREATE' ? "border-primary bg-primary/[0.02] ring-8 ring-primary/5" : "bg-card hover:border-muted-foreground/30",
               )}
             >
                {versionMode === 'CREATE' && <div className="absolute top-5 right-5 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg"><Check className="h-4 w-4 text-white" /></div>}
                <span className="text-lg font-black mb-1.5 tracking-tight group-hover:text-primary transition-colors">Issue Production Release</span>
                <p className="text-[13px] text-muted-foreground leading-relaxed">Snapshot the current editor workspace as <span className="font-black text-foreground underline decoration-primary/30 underline-offset-2">v{predictedNewVersion}</span>. This release becomes the new baseline for global distribution.</p>
                <div className="mt-8 flex items-center gap-2">
                   <div className="px-2.5 py-1 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest shadow-md shadow-primary/20">Recommended Path</div>
                </div>
             </div>
             <div
               role="button"
               tabIndex={(program.versions?.length || 0) === 0 ? -1 : 0}
               aria-disabled={(program.versions?.length || 0) === 0}
               aria-pressed={versionMode === 'EXISTING'}
               onClick={() => {
                 if ((program.versions?.length || 0) === 0) return;
                 onVersionModeChange('EXISTING');
               }}
               onKeyDown={(e) => {
                 if ((program.versions?.length || 0) === 0) return;
                 if (e.key !== 'Enter' && e.key !== ' ') return;
                 e.preventDefault();
                 onVersionModeChange('EXISTING');
               }}
               className={cn(
                 "flex flex-col p-8 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden group shadow-sm select-none",
                 (program.versions?.length || 0) === 0 ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer",
                 versionMode === 'EXISTING' ? "border-primary bg-primary/[0.02] ring-8 ring-primary/5" : "bg-card hover:border-muted-foreground/30",
               )}
             >
                {versionMode === 'EXISTING' && <div className="absolute top-5 right-5 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg"><Check className="h-4 w-4 text-white" /></div>}
                <span className="text-lg font-black mb-1.5 tracking-tight group-hover:text-primary transition-colors">Redeploy Stable Archive</span>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">Access the version library to redistribute or roll back nodes to a previously validated and immutable release snapshot.</p>
                
                <div className="mt-auto">
                   <Select 
                      value={String(existingVersion)} 
                      onValueChange={v => onExistingVersionChange(Number(v))}
                      disabled={versionMode !== 'EXISTING'}
                   >
                      <SelectTrigger className="w-full h-12 text-xs font-black px-4 bg-muted/60 border-0 shadow-inner rounded-xl">
                         <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent>
                         {[...(program.versions || [])].reverse().map(v => (
                           <SelectItem key={v.version} value={String(v.version)} className="text-xs font-bold">
                             v{v.version} — {v.version === latest?.version ? 'CURRENT LIVE RELEASE' : 'LEGACY ARCHIVE'}
                           </SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>
             </div>
          </div>
       </div>

       <div className="space-y-6 pt-10 border-t border-dashed">
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-1">
             <div className="h-1 w-6 bg-emerald-500 rounded-full" /> Traffic Distribution
          </h4>
          <div className="grid grid-cols-2 gap-12">
             <div className="space-y-4">
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-2">Endpoint Selection</span>
                <div className="flex p-1.5 bg-muted/40 rounded-2xl gap-1.5 ring-1 ring-inset ring-foreground/5 shadow-inner">
                   <button onClick={() => onScopeChange('SELECTED')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest", scope === 'SELECTED' ? "bg-background shadow-lg text-foreground scale-[1.02]" : "text-muted-foreground/60 hover:text-muted-foreground")}>QUEUE ({selectedCount})</button>
                   <button disabled={deployments.length === 0} onClick={() => onScopeChange('RUNNING')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest", scope === 'RUNNING' ? "bg-background shadow-lg text-foreground scale-[1.02]" : "text-muted-foreground/60 hover:text-muted-foreground", deployments.length === 0 && "opacity-20 cursor-not-allowed")}>ACTIVE ({deployments.length})</button>
                </div>
             </div>
             <div className="space-y-4">
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-2">Override Protocol</span>
                <div className="flex p-1.5 bg-muted/40 rounded-2xl gap-1.5 ring-1 ring-inset ring-foreground/5 shadow-inner">
                   <button disabled={scope === 'RUNNING'} onClick={() => onModeChange('APPEND')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest", mode === 'APPEND' ? "bg-background shadow-lg text-foreground scale-[1.02]" : "text-muted-foreground/60 hover:text-muted-foreground", scope === 'RUNNING' && "opacity-20 cursor-not-allowed")}>Append</button>
                   <button onClick={() => onModeChange('OVERWRITE')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest", mode === 'OVERWRITE' ? "bg-background shadow-lg text-foreground scale-[1.02]" : "text-muted-foreground/60 hover:text-muted-foreground")}>Overwrite</button>
                </div>
             </div>
          </div>
          <div className="p-4 rounded-2xl bg-muted/20 border-2 border-dotted flex items-start gap-4 mx-1 group hover:border-muted-foreground/20 transition-colors">
             <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
             <p className="text-[11px] leading-relaxed text-muted-foreground font-bold uppercase tracking-tight opacity-70">
               {mode === 'APPEND' ? 'Policy: Incremental rollout. Nodes already running an instance of this program will be excluded from the synchronization task.' : 'Policy: Global push. Every targeted node will be forced to synchronize with the selected release version immediately.'}
             </p>
          </div>
       </div>
      </div>
    </ScrollArea>
  );
}

function ReviewStep({ plan }: { plan: any }) {
  const deviceById = useMemo(() => new Map(mockDevices.map((d) => [d.id, d])), []);
  
  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500 py-2">
       <div className="grid grid-cols-3 gap-6">
          <div className="p-7 rounded-[2.5rem] bg-emerald-500/[0.03] border-2 border-emerald-500/10 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-14 w-14 text-emerald-500" />
             </div>
             <p className="text-[10px] font-black uppercase text-emerald-700/50 mb-2 tracking-[0.2em]">Active Push</p>
             <p className="text-4xl font-black tabular-nums tracking-tighter text-emerald-700">{plan.counts.deploy + plan.counts.update + plan.counts.rollback}</p>
             <p className="text-[9px] font-bold text-emerald-600/40 uppercase mt-1">Nodes updating</p>
          </div>
          <div className="p-7 rounded-[2.5rem] bg-primary/[0.03] border-2 border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Database className="h-14 w-14 text-primary" />
             </div>
             <p className="text-[10px] font-black uppercase text-primary/50 mb-2 tracking-[0.2em]">Target State</p>
             <p className="text-4xl font-black tabular-nums tracking-tighter text-primary">v{plan.targetVersion}</p>
             <p className="text-[9px] font-bold text-primary/40 uppercase mt-1">Production Rev</p>
          </div>
          <div className="p-7 rounded-[2.5rem] bg-amber-500/[0.03] border-2 border-amber-500/10 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Clock className="h-14 w-14 text-amber-500" />
             </div>
             <p className="text-[10px] font-black uppercase text-amber-700/50 mb-2 tracking-[0.2em]">Async Sync</p>
             <p className="text-4xl font-black tabular-nums tracking-tighter text-amber-700">{plan.counts.pendingSync}</p>
             <p className="text-[9px] font-bold text-amber-600/40 uppercase mt-1">Pending Recon</p>
          </div>
       </div>

       <div className="flex-1 border-2 border-muted rounded-[2.5rem] bg-muted/5 overflow-hidden flex flex-col shadow-inner relative">
          <div className="flex items-center gap-4 px-12 py-4 bg-muted/20 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b">
             <span className="flex-1">Hardware Node</span>
             <span className="w-44 text-center">Version Transition</span>
             <span className="w-24 text-right">Status</span>
          </div>
          <ScrollArea className="flex-1">
             <div className="divide-y divide-foreground/[0.04] px-4">
                {plan.perDevice.map((row: any) => {
                  const d = deviceById.get(row.deviceId);
                  const isChange = row.action !== 'skip' && row.action !== 'no-change';
                  
                  return (
                    <div key={row.deviceId} className={cn("flex items-center gap-8 px-8 py-5 transition-all rounded-3xl mx-1 my-1.5", isChange ? "hover:bg-muted/10 bg-background/50 shadow-sm border border-foreground/[0.02]" : "opacity-30 grayscale")}>
                       <div className="min-w-0 flex-1">
                          <p className="text-sm font-black truncate tracking-tight text-foreground/90">{d?.alias || d?.deviceName}</p>
                          <div className="flex items-center gap-2.5 mt-2 opacity-50">
                             <p className="text-[9px] font-mono uppercase tracking-tighter tabular-nums">{row.deviceId}</p>
                          </div>
                       </div>
                       <div className="w-44 flex items-center justify-center gap-5">
                          <span className="text-[10px] font-black opacity-30 tabular-nums">v{row.current || '0'}</span>
                          <div className="flex items-center justify-center w-6 h-6">
                            {row.action === 'deploy' && <Plus className="h-4 w-4 text-blue-500 animate-pulse" />}
                            {row.action === 'update' && <TrendingUp className="h-4 w-4 text-emerald-500 animate-pulse" />}
                            {row.action === 'rollback' && <History className="h-4 w-4 text-amber-500 animate-pulse" />}
                            {row.action === 'no-change' && <Check className="h-4 w-4 text-muted-foreground opacity-20" />}
                            {row.action === 'skip' && <ChevronsRight className="h-4 w-4 opacity-10" />}
                          </div>
                          <span className={cn("text-[11px] font-black tabular-nums tracking-tighter px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-sm", isChange ? "" : "opacity-50 grayscale")}>v{row.target}</span>
                       </div>
                       <div className="w-24 text-right">
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-[0.1em] px-2.5 h-5.5 border-0 shadow-sm",
                            row.action === 'deploy' ? "bg-emerald-500 text-white" : row.action === 'rollback' ? "bg-amber-500 text-white" : row.action === 'update' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          )}>{row.action === 'no-change' ? 'SYNCED' : row.action}</Badge>
                       </div>
                    </div>
                  );
                })}
             </div>
          </ScrollArea>
       </div>
    </div>
  );
}

// Helpers
function collectDeviceTags(devices: Device[]): Tag[] {
  const map = new Map<string, Tag>();
  for (const device of devices) for (const tag of device.tags) map.set(tag.id, tag);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function formatDeviceId(deviceId: string): string {
  const id = deviceId.trim();
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function pickLatestPublished(program: ProgramDetailResp) {
  if (!program.versions || !program.versions.length) return null;
  return [...program.versions].sort((a, b) => b.version - a.version)[0];
}

function pickDraftForPublish(program: ProgramDetailResp, preferredDraftId?: string | null) {
  if (preferredDraftId && program.drafts) {
    const hit = program.drafts.find((d) => d.id === preferredDraftId);
    if (hit) return hit;
  }
  if (!program.drafts || !program.drafts.length) return null;
  return [...program.drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null;
}
