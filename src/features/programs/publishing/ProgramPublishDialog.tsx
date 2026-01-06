import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { parseResolution } from '@/lib/resolution';
import type { Device, Tag } from '@/types/device';
import { resolveDeviceStatus } from '@/types/device';
import { getDevices } from '@/services/deviceApi';

import { deleteProgramDraft, publishProgram } from '@/services/programApi';
import { getErrorMessage } from '@/services/authApi';
import type { ProgramDetailResp, ProgramDeploymentResp, ProgramDraftResp, ProgramPublishReq } from '@/types/program';
import type { VsnDocument } from '@/features/programs/vsn/types';
import { sanitizeVsnForPersist } from '@/features/programs/vsn/sanitize';

import { useTranslation } from 'react-i18next';

type PublishScope = 'SELECTED' | 'RUNNING';
type PublishMode = 'APPEND' | 'OVERWRITE';
type VersionMode = 'CREATE' | 'EXISTING';

export type ProgramPublishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: ProgramDetailResp;
  deployments: ProgramDeploymentResp[];
  preferredDraftId?: string | null;
  initialSelectedDeviceIds?: Array<string | number> | null;
  initialVersionMode?: 'CREATE' | 'EXISTING' | null;
  initialExistingVersion?: number | null;
  lockVersionMode?: 'CREATE' | 'EXISTING' | null;
  createVsnJson?: string | null;
  coverBase64?: string | null;
  coverContentType?: string | null;
  cleanupDraftId?: string | null;
  onAfterPublish?: () => void;
};

export function ProgramPublishDialog({
  open,
  onOpenChange,
  program,
  deployments,
  preferredDraftId,
  initialSelectedDeviceIds,
  initialVersionMode,
  initialExistingVersion,
  lockVersionMode,
  createVsnJson,
  coverBase64,
  coverContentType,
  cleanupDraftId,
  onAfterPublish,
}: ProgramPublishDialogProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  // --- Queries ---
  const { data: devicesRes } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
    enabled: open,
  });

  const devices = useMemo(() => devicesRes?.data || [], [devicesRes]);

  const deploymentsByDeviceId = useMemo(() => new Map(deployments.map((d) => [d.deviceId, d])), [deployments]);
  const allTags = useMemo(() => collectDeviceTags(devices), [devices]);
  const latestPublished = useMemo(() => [...(program.versions || [])].sort((a, b) => b.version - a.version)[0], [program.versions]);
  const sortedDrafts = useMemo(() => [...(program.drafts || [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [program.drafts]);
  const latestDraft = useMemo(() => sortedDrafts[0] ?? null, [sortedDrafts]);
  const hasUnpublishedDraft = useMemo(() => {
    if (!latestDraft) return false;
    if (!latestPublished) return true;
    return latestDraft.updatedAt > latestPublished.createdAt;
  }, [latestDraft, latestPublished]);

  const preferredDraft = useMemo(() => {
    if (!preferredDraftId) return null;
    return sortedDrafts.find((d) => (d.draftId ?? d.id) === preferredDraftId) ?? null;
  }, [preferredDraftId, sortedDrafts]);

  const suggestedCreateDraft = useMemo(() => {
    if (preferredDraft) return preferredDraft;

    if (latestPublished) {
      const baseMatch = sortedDrafts.find((d) => d.baseVersion === latestPublished.version);
      if (baseMatch) return baseMatch;
    }

    const blank = sortedDrafts.find((d) => d.baseVersion === 0);
    if (blank) return blank;

    return latestDraft;
  }, [latestDraft, latestPublished, preferredDraft, sortedDrafts]);
  
  const defaultVersionMode = useMemo(
    () => {
      if (preferredDraftId) return 'CREATE';
      if (hasUnpublishedDraft) return 'CREATE';
      return (program.versions?.length || 0) === 0 ? 'CREATE' : 'EXISTING';
    },
    [hasUnpublishedDraft, preferredDraftId, program.versions?.length],
  );

  const [deviceQuery, setDeviceQuery] = useState('');
  const [tagFilters, setTagFilters] = useState<Set<string>>(() => new Set());
  const [tagMatchMode, setTagMatchMode] = useState<'any' | 'all'>('any');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [resolutionOnly, setResolutionOnly] = useState<'any' | 'match'>('any');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<number>>(() => new Set());

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
        ? t('program.publish.toasts.pendingSync', { count: plan.counts.pendingSync })
        : '';
      const canCleanupDraft = res.data && res.data.version != null && cleanupDraftId && versionMode === 'CREATE';
      toast.success(t('program.publish.toasts.published', { count: res.data?.results.length || 0 }) + syncMsg, {
        action: canCleanupDraft
          ? {
              label: t('programEditor.dialogs.unsaved.discard'),
              onClick: () => {
                void (async () => {
                  try {
                    await deleteProgramDraft(program.id, cleanupDraftId);
                    queryClient.invalidateQueries({ queryKey: ['programs'] });
                    queryClient.invalidateQueries({ queryKey: ['programs', program.id] });
                    toast.success(t('programs.details.toasts.draftDeleted'));
                  } catch (err) {
                    toast.error(getErrorMessage(err));
                  }
                })();
              },
            }
          : undefined,
      });
      onAfterPublish?.();
      close();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const filteredDevices = useMemo(() => {
    const q = deviceQuery.trim().toLowerCase();
    return devices.filter((device) => {
      const status = resolveDeviceStatus(device);
      if (onlineOnly && status !== 'online') return false;
      
      const res = parseResolution(device.resolution, { width: 0, height: 0 });
      if (resolutionOnly === 'match' && (res.width !== program.width || res.height !== program.height)) return false;
      
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
      const idStr = String(device.deviceId || device.id || '').toLowerCase();
      return name.includes(q) || idStr.includes(q);
    });
  }, [deviceQuery, onlineOnly, program.height, program.width, resolutionOnly, tagFilters, tagMatchMode, devices]);

  const selectedDevices = useMemo(() => {
    const map = new Map(devices.map((d) => [d.deviceId, d]));
    return [...selectedDeviceIds].map((id) => map.get(id)).filter(Boolean) as Device[];
  }, [selectedDeviceIds, devices]);

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
      const device = devices.find((d) => d.deviceId === deviceId);
      const current = deploymentsByDeviceId.get(deviceId)?.releaseVersion ?? null;
      const willDeploy = targetDeviceIds.includes(deviceId);
      
      let action: 'deploy' | 'update' | 'rollback' | 'no-change' | 'skip' = 'skip';
      if (willDeploy) {
        if (current == null) action = 'deploy';
        else if (current === targetVersion) action = 'no-change';
        else if (current < targetVersion) action = 'update';
        else action = 'rollback';
      }

      const status = device ? resolveDeviceStatus(device) : 'offline';

      return { 
        deviceId, 
        current, 
        target: targetVersion, 
        action,
        isOffline: status !== 'online' 
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
  }, [baseTargetDeviceIds, deploymentsByDeviceId, existingVersion, predictedNewVersion, targetDeviceIds, versionMode, devices]);

  const resetDialog = () => {
    setStep(0);
    setDeviceQuery('');
    setTagFilters(new Set());
    setOnlineOnly(false);
    setResolutionOnly('any');
    const initialSelected = (initialSelectedDeviceIds ?? []).map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
    setSelectedDeviceIds(new Set(initialSelected));

    const canUseExisting = (program.versions?.length || 0) > 0;
    const nextVersionMode: VersionMode =
      lockVersionMode === 'EXISTING' && canUseExisting ? 'EXISTING'
      : lockVersionMode === 'CREATE' ? 'CREATE'
      : initialVersionMode === 'EXISTING' && canUseExisting ? 'EXISTING'
      : initialVersionMode === 'CREATE' ? 'CREATE'
      : defaultVersionMode;

    setVersionMode(nextVersionMode);

    const nextExisting = initialExistingVersion ?? latestPublished?.version ?? 1;
    setExistingVersion(nextExisting);

    setScope('SELECTED');
    const anyRunningSelected = initialSelected.some((id) => deploymentsByDeviceId.has(id));
    setMode(anyRunningSelected ? 'OVERWRITE' : 'APPEND');
  };

  useEffect(() => {
    if (!open) return;
    resetDialog();
  }, [open, program.id, latestPublished, defaultVersionMode, initialSelectedDeviceIds, initialExistingVersion, initialVersionMode, lockVersionMode]);

  useEffect(() => {
    if (scope !== 'RUNNING') return;
    if (mode === 'APPEND') setMode('OVERWRITE');
  }, [mode, scope]);

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

  const onConfirm = async () => {
    if (versionMode === 'EXISTING') {
      publishMutation.mutate({
        versionMode: 'EXISTING',
        existingVersion,
        scope,
        deviceIds: scope === 'SELECTED' ? [...selectedDeviceIds] : undefined,
        mode,
      });
      return;
    }

    const trySanitizeVsnJson = (raw: string): string | null => {
      const trimmed = (raw ?? '').trim();
      if (!trimmed) return null;
      try {
        const parsed = JSON.parse(trimmed) as VsnDocument;
        return JSON.stringify(sanitizeVsnForPersist(parsed));
      } catch {
        return null;
      }
    };

    const normalizedVsnJson = (createVsnJson ?? '').trim();
    const selectedDraft = preferredDraft ?? suggestedCreateDraft ?? null;
    const selectedDraftId = selectedDraft ? (selectedDraft.draftId ?? selectedDraft.id ?? null) : null;

    const finalVsnJson = normalizedVsnJson || (selectedDraft?.vsnJson ? trySanitizeVsnJson(selectedDraft.vsnJson) : null);
    const finalDraftId = preferredDraftId ?? selectedDraftId;

    if (!finalVsnJson && !finalDraftId) {
      toast.error(t('program.publish.toasts.noDraft'));
      return;
    }

    publishMutation.mutate({
      versionMode: 'CREATE',
      vsnJson: finalVsnJson || undefined,
      draftId: finalVsnJson ? undefined : finalDraftId ?? undefined,
      coverBase64: coverBase64 ?? undefined,
      coverContentType: coverContentType ?? undefined,
      scope,
      deviceIds: scope === 'SELECTED' ? [...selectedDeviceIds] : undefined,
      mode,
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
                   <DialogTitle className="text-lg font-bold tracking-tight">{t('program.publish.title')}</DialogTitle>
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
                 <div className="text-[10px] font-bold text-muted-foreground tracking-widest opacity-40">
                   {t('program.publish.stepOf', { current: step + 1, total: 3 })}
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
                      createDraft={suggestedCreateDraft}
                      createVsnJsonProvided={Boolean((createVsnJson ?? '').trim())}
                      isFromEditor={Boolean(preferredDraftId) || Boolean((createVsnJson ?? '').trim())}
                      lockVersionMode={lockVersionMode ?? null}
                    />
                  )}
                  {step === 2 && (
                    <ReviewStep
                      plan={plan}
                      devices={devices}
                    />
                  )}
               </div>

               {/* Action Footer */}
               <div className="mt-6 flex items-center justify-between pt-6 border-t bg-background/50 backdrop-blur-sm">
                  <Button variant="ghost" onClick={step === 0 ? close : () => setStep(s => s - 1)} className="px-6 font-bold h-10">
                    {step === 0 ? t('common.actions.cancel') : t('program.publish.actions.previous')}
                  </Button>
                  <Button 
                    onClick={step === 2 ? onConfirm : () => setStep(s => s + 1)} 
                    disabled={!canNext || publishMutation.isPending}
                    className="px-10 font-bold gap-2 h-10 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {publishMutation.isPending ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> {t('program.publish.actions.processing')}</>
                    ) : step === 2 ? (
                      <><ShieldCheck className="h-4 w-4" /> {t('program.publish.actions.finalize')}</>
                    ) : (
                      <>{t('program.publish.actions.continue')} <ChevronRight className="h-4 w-4" /></>
                    )}
                  </Button>
               </div>
            </div>

            {/* Right Summary Sidebar */}
            <div className="w-[360px] bg-muted/5 flex flex-col p-6">
               <div className="flex items-center gap-2 mb-6">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground opacity-60">{t('program.publish.sidebar.plan')}</h3>
               </div>
               
               <div className="flex-1 space-y-8 flex flex-col min-h-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-background border shadow-sm flex flex-col items-center">
                       <p className="text-[9px] font-bold text-muted-foreground mb-1 tracking-wider opacity-60">{t('program.publish.sidebar.targets')}</p>
                       <p className="text-2xl font-black tabular-nums">{baseTargetDeviceIds.length}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-background border shadow-sm flex flex-col items-center">
                       <p className="text-[9px] font-bold text-muted-foreground mb-1 tracking-wider opacity-60">{t('program.publish.sidebar.release')}</p>
                       <p className="text-2xl font-black tabular-nums text-primary">v{plan.targetVersion}</p>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="flex-1 flex flex-col min-h-0">
                     <div className="flex items-center justify-between mb-3 px-1">
                        <p className="text-[10px] font-bold text-muted-foreground tracking-wider opacity-60">{t('program.publish.sidebar.queue')}</p>
                        <Badge variant="secondary" className="h-4 text-[9px] font-black px-1.5">{selectedDeviceIds.size}</Badge>
                     </div>
                     <ScrollArea className="flex-1">
                           {selectedDeviceIds.size === 0 && (
                             <div className="py-32 text-center flex flex-col items-center gap-4 opacity-10 grayscale">
                                <div className="p-4 rounded-full border-2 border-dashed">
                                   <Monitor className="h-10 w-10" />
                                </div>
                                <p className="text-[10px] font-bold tracking-widest leading-relaxed">{t('program.publish.sidebar.initialize')}</p>
                             </div>
                           )}
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
  const { t } = useTranslation();
  const steps = [
    t('program.publish.steps.nodes'),
    t('program.publish.steps.strategy'),
    t('program.publish.steps.manifest')
  ];
  return (
    <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-xl border w-fit shadow-inner">
      {steps.map((s, idx) => (
        <div key={s} className={cn(
          "px-5 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2.5",
          idx === currentStep ? "bg-background text-foreground shadow-md ring-1 ring-foreground/[0.03]" : "text-muted-foreground/40"
        )}>
          <div className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center text-[9px] border transition-colors",
            idx < currentStep ? "bg-emerald-500 border-emerald-500 text-white" : idx === currentStep ? "bg-primary border-primary text-white" : "border-muted-foreground/20"
          )}>
            {idx < currentStep ? <Check className="h-2.5 w-2.5" /> : idx + 1}
          </div>
          <span className="tracking-tight">{s}</span>
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
  onSelectedDeviceIdsChange: Dispatch<SetStateAction<Set<number>>>;
  onTagFiltersChange: Dispatch<SetStateAction<Set<string>>>;
  tagMatchMode: 'any' | 'all';
  onTagMatchModeChange: (v: 'any' | 'all') => void;
  programResolution: { width: number; height: number };
  resolutionOnly: 'any' | 'match';
  selectedDeviceIds: Set<number>;
  tagFilters: Set<string>;
  allTags: Tag[];
  deviceQuery: string;
  onDeviceQueryChange: (v: string) => void;
  deploymentsByDeviceId: Map<number, ProgramDeploymentResp>;
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
  const { t } = useTranslation();
  const filteredIds = filteredDevices.map((d) => d.deviceId).filter((id) => Number.isFinite(id) && id > 0);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedDeviceIds.has(id));

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
       <div className="flex items-center gap-3 mb-6 p-1">
          <div className="relative flex-1 group">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
             <Input 
                value={deviceQuery} 
                onChange={(e) => onDeviceQueryChange(e.target.value)} 
                placeholder={t('program.publish.filter.searchPlaceholder')} 
                className="pl-10 h-11 bg-muted/20 border-border focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all rounded-xl"
             />
          </div>
          <Button variant="outline" className="font-bold text-[11px] h-11 px-6 rounded-xl gap-2 shadow-sm" onClick={() => {
            onSelectedDeviceIdsChange((prev) => {
              const next = new Set(prev);
              if (allSelected) filteredIds.forEach((id) => next.delete(id));
              else filteredIds.forEach((id) => next.add(id));
              return next;
            });
          }}>
            {allSelected ? <><X className="h-3.5 w-3.5" /> {t('program.publish.actions.deselectAll')}</> : <><Check className="h-3.5 w-3.5" /> {t('program.publish.actions.selectVisible')}</>}
          </Button>
       </div>

       <div className="mb-6 space-y-4 px-1">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground tracking-widest">{t('program.publish.filter.title')}</span>
             </div>
             <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border shadow-inner">
                <button 
                  onClick={() => onTagMatchModeChange('any')}
                  className={cn("px-2 py-1 text-[9px] font-black rounded-md transition-all", tagMatchMode === 'any' ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.02]" : "text-muted-foreground/40 hover:text-muted-foreground")}
                >
                  {t('program.publish.filter.any')}
                </button>
                <button 
                  onClick={() => onTagMatchModeChange('all')}
                  className={cn("px-2 py-1 text-[9px] font-black rounded-md transition-all", tagMatchMode === 'all' ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.02]" : "text-muted-foreground/40 hover:text-muted-foreground")}
                >
                  {t('program.publish.filter.all')}
                </button>
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
             <button onClick={() => onlineOnly ? onOnlineOnlyChange(false) : onOnlineOnlyChange(true)} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold border transition-all shadow-sm", onlineOnly ? "bg-emerald-500 border-emerald-500 text-white" : "bg-card text-muted-foreground hover:border-muted-foreground/30")}>
                {t('program.publish.filter.onlineOnly')}
             </button>
             <button onClick={() => onResolutionOnlyChange(resolutionOnly === 'match' ? 'any' : 'match')} className={cn("px-4 py-2 rounded-xl text-[10px] font-bold border transition-all shadow-sm", resolutionOnly === 'match' ? "bg-primary border-primary text-white" : "bg-card text-muted-foreground hover:border-muted-foreground/30")}>
               {t('program.publish.filter.matchResolution', { width: programResolution.width, height: programResolution.height })}
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
          <div className="flex items-center gap-4 px-10 py-3.5 bg-muted/20 text-[10px] font-bold tracking-widest text-muted-foreground/60 border-b">
             <span className="flex-1">Device</span>
             <span className="w-32 text-center">Status</span>
          </div>

          {filteredDevices.length > 0 ? (
            <ScrollArea className="flex-1 scrollbar-thin">
               <div className="divide-y divide-foreground/[0.03]">
                  {filteredDevices.map((d) => {
                     const isSelected = selectedDeviceIds.has(d.deviceId);
                     const res = parseResolution(d.resolution, { width: 0, height: 0 });
                     const isConflict = res.width !== programResolution.width || res.height !== programResolution.height;
                     const deployed = deploymentsByDeviceId.get(d.deviceId);
                     
                     return (
                        <div key={d.deviceId} className={cn("group flex items-center gap-6 px-10 py-4 transition-all cursor-pointer relative", isSelected ? "bg-primary/[0.04]" : "hover:bg-muted/10")} onClick={() => onSelectedDeviceIdsChange((prev) => {
                        const next = new Set(prev);
                        if (isSelected) next.delete(d.deviceId); else next.add(d.deviceId);
                        return next;
                        })}>
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-all rounded-r-full", isSelected ? "bg-primary shadow-[0_0_12px_rgba(59,130,246,0.4)]" : "bg-transparent")} />
                        <Checkbox checked={isSelected} onCheckedChange={() => {}} className="rounded-md h-5 w-5" />
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center gap-2.5">
                              <span className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{d.alias || d.deviceName}</span>
                              {deployed && (
                                 <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-1.5 h-4.5 text-[9px] font-black">
                                    v{deployed.releaseVersion}
                                 </Badge>
                              )}
                              {isConflict && (
                                 <TooltipProvider>
                                    <Tooltip>
                                       <TooltipTrigger asChild>
                                          <div className="p-1 rounded-full bg-amber-500/10"><AlertCircle className="h-3.5 w-3.5 text-amber-500" /></div>
                                       </TooltipTrigger>
                                       <TooltipContent className="bg-amber-900 text-amber-50 border-amber-800 p-3 rounded-xl shadow-xl max-w-[280px]">
                                          <p className="font-bold flex items-center gap-2 mb-1 text-[10px] tracking-widest"><AlertCircle className="h-3 w-3" /> Resolution Mismatch</p>
                                          <p className="text-[11px] opacity-80 leading-relaxed">This hardware runs at {res.width}x{res.height}, but your program is {programResolution.width}x{programResolution.height}. Content scaling may occur.</p>
                                       </TooltipContent>
                                    </Tooltip>
                                 </TooltipProvider>
                              )}
                           </div>
                           <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[9px] text-muted-foreground font-mono opacity-50 tracking-tighter">{formatDeviceId(d.deviceId)}</p>
                              <div className="h-2 w-px bg-muted" />
                              <span className="text-[9px] font-bold text-muted-foreground/60 tracking-widest">{res.width}×{res.height}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right min-w-[80px]">
                              <div className="flex items-center gap-2 justify-end">
                                 <div className={cn("w-1.5 h-1.5 rounded-full transition-all", resolveDeviceStatus(d) === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-zinc-300")} />
                                 <span className="text-[10px] font-bold tracking-tighter text-muted-foreground group-hover:text-foreground">{resolveDeviceStatus(d)}</span>
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
                  <p className="text-base font-bold text-foreground/80">{t('program.publish.noNodes')}</p>
                  <p className="text-[10px] text-muted-foreground font-bold leading-relaxed opacity-60">
                     {t('program.publish.noNodesDesc')}
                  </p>
               </div>
               <Button 
                  variant="default"
                  size="sm" 
                  className="mt-8 font-bold text-[9px] px-10 h-10 rounded-xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                  onClick={() => {
                     onDeviceQueryChange('');
                     onOnlineOnlyChange(false);
                     onResolutionOnlyChange('any');
                     onTagFiltersChange(new Set());
                     onTagMatchModeChange('any');
                  }}
               >
                  {t('program.publish.filter.reset')}
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
  createDraft: ProgramDraftResp | null;
  createVsnJsonProvided: boolean;
  isFromEditor: boolean;
  existingVersion: number;
  onExistingVersionChange: (v: number) => void;
  latest: any | null;
  scope: PublishScope;
  onScopeChange: (v: PublishScope) => void;
  selectedCount: number;
  deployments: ProgramDeploymentResp[];
  mode: PublishMode;
  onModeChange: (v: PublishMode) => void;
  lockVersionMode: VersionMode | null;
}

function StrategyStep({ versionMode, onVersionModeChange, predictedNewVersion, program, createDraft, createVsnJsonProvided, isFromEditor, existingVersion, onExistingVersionChange, latest, scope, onScopeChange, selectedCount, deployments, mode, onModeChange, lockVersionMode }: StrategyStepProps) {
  const { t } = useTranslation();
  const draftBaseLabel = createDraft?.baseVersion == null || createDraft?.baseVersion === 0 ? t('programEditor.header.blank') : `v${createDraft?.baseVersion}`;
  const draftSourceLabel = isFromEditor ? t('programEditor.header.saveStatus.unsaved') : t('programEditor.header.saveStatus.saved');
  const draftHint = createVsnJsonProvided
    ? t('programEditor.header.saveStatus.saving')
    : createDraft
      ? `${draftSourceLabel} · ${t('programEditor.panels.inspector.labels.loopType')} ${draftBaseLabel}`
      : t('program.publish.strategy.requiresDraft');

  const canUseExisting = (program.versions?.length || 0) > 0;
  const canCreate = createVsnJsonProvided || Boolean(createDraft);
  const shouldShowCreate = lockVersionMode == null || lockVersionMode === 'CREATE';
  const shouldShowExisting = lockVersionMode == null || lockVersionMode === 'EXISTING';

  return (
    <ScrollArea className="h-full scrollbar-thin">
      <div className="space-y-10 animate-in fade-in slide-in-from-right-2 duration-300 py-4 pr-4">
       <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
             <h4 className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-3">
                <div className="h-1 w-6 bg-primary rounded-full" /> {t('program.publish.strategy.lifecycle')}
             </h4>
             <Badge variant="outline" className="font-mono text-[10px] opacity-30 border-dashed">VCS: Active</Badge>
          </div>
          <div className={cn('grid gap-6', shouldShowCreate && shouldShowExisting ? 'grid-cols-2' : 'grid-cols-1')}>
             {shouldShowCreate && (
             <div
                role="button"
                tabIndex={canCreate ? 0 : -1}
                aria-pressed={versionMode === 'CREATE'}
                aria-disabled={!canCreate}
                onClick={() => {
                  if (!canCreate) return;
                  onVersionModeChange('CREATE');
                }}
                onKeyDown={(e) => {
                  if (!canCreate) return;
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  onVersionModeChange('CREATE');
                }}
                className={cn(
                  "flex flex-col p-8 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden group shadow-sm cursor-pointer select-none",
                  !canCreate ? "opacity-40 grayscale cursor-not-allowed" : "",
                  versionMode === 'CREATE' ? "border-primary bg-primary/[0.02] ring-8 ring-primary/5" : canCreate ? "bg-card hover:border-muted-foreground/30" : "bg-card",
                )}
              >
                 {versionMode === 'CREATE' && <div className="absolute top-5 right-5 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg"><Check className="h-4 w-4 text-white" /></div>}
                 <span className="text-lg font-bold mb-1.5 tracking-tight group-hover:text-primary transition-colors">{t('program.publish.strategy.createTitle')}</span>
                 <p className="text-[13px] text-muted-foreground leading-relaxed">{t('program.publish.strategy.createDesc', { version: predictedNewVersion })}</p>
                 <p className="mt-2 text-[10px] font-bold tracking-widest text-muted-foreground/60">{draftHint}</p>
                 <div className="mt-8 flex items-center gap-2">
                    <div
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-widest shadow-md",
                        canCreate ? "bg-primary text-white shadow-primary/20" : "bg-muted text-muted-foreground shadow-none",
                      )}
                    >
                      {canCreate ? t('program.publish.strategy.release') : t('program.publish.strategy.requiresDraft')}
                    </div>
                 </div>
              </div>
             )}
             {shouldShowExisting && (
             <div
                role="button"
                tabIndex={canUseExisting ? 0 : -1}
                aria-disabled={!canUseExisting}
                aria-pressed={versionMode === 'EXISTING'}
                onClick={() => {
                  if (!canUseExisting) return;
                  onVersionModeChange('EXISTING');
                }}
                onKeyDown={(e) => {
                  if (!canUseExisting) return;
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  onVersionModeChange('EXISTING');
                }}
                className={cn(
                  "flex flex-col p-8 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden group shadow-sm select-none",
                  !canUseExisting ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer",
                  versionMode === 'EXISTING' ? "border-primary bg-primary/[0.02] ring-8 ring-primary/5" : canUseExisting ? "bg-card hover:border-muted-foreground/30" : "bg-card",
                )}
              >
                 {versionMode === 'EXISTING' && <div className="absolute top-5 right-5 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg"><Check className="h-4 w-4 text-white" /></div>}
                 <span className="text-lg font-bold mb-1.5 tracking-tight group-hover:text-primary transition-colors">{t('program.publish.strategy.existingTitle')}</span>
                 <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">{t('program.publish.strategy.existingDesc')}</p>
                
                <div className="mt-auto">
                   <Select 
                      value={String(existingVersion)} 
                      onValueChange={v => onExistingVersionChange(Number(v))}
                      disabled={versionMode !== 'EXISTING'}
                   >
                      <SelectTrigger className="w-full h-12 text-xs font-bold px-4 bg-muted/60 border-0 shadow-inner rounded-xl">
                         <SelectValue placeholder={t('program.publish.strategy.selectVersion')} />
                      </SelectTrigger>
                      <SelectContent>
                         {[...(program.versions || [])].reverse().map(v => (
                           <SelectItem key={v.version} value={String(v.version)} className="text-xs font-bold">
                             v{v.version} — {v.version === latest?.version ? t('program.publish.strategy.currentLive') : t('program.publish.strategy.legacyArchive')}
                           </SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                 </div>
              </div>
             )}
          </div>
        </div>

       <div className="space-y-6 pt-10 border-t border-dashed">
          <h4 className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-3 px-1">
             <div className="h-1 w-6 bg-emerald-500 rounded-full" /> {t('program.publish.strategy.traffic')}
          </h4>
          <div className="grid grid-cols-2 gap-12">
             <div className="space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground/60 tracking-widest ml-2">{t('program.publish.strategy.endpoint')}</span>
                <div className="flex p-1.5 bg-muted/40 rounded-2xl gap-1.5 ring-1 ring-inset ring-foreground/5 shadow-inner">
                   <button onClick={() => onScopeChange('SELECTED')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold transition-all tracking-widest", scope === 'SELECTED' ? "bg-background shadow-lg text-foreground scale-[1.02]" : "text-muted-foreground/60 hover:text-muted-foreground")}>{t('program.publish.strategy.queue')} ({selectedCount})</button>
                   <button disabled={deployments.length === 0} onClick={() => onScopeChange('RUNNING')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold transition-all tracking-widest", scope === 'RUNNING' ? "bg-background shadow-lg text-foreground scale-[1.02]" : "text-muted-foreground/60 hover:text-muted-foreground", deployments.length === 0 && "opacity-20 cursor-not-allowed")}>{t('program.publish.strategy.active')} ({deployments.length})</button>
                </div>
             </div>
             <div className="space-y-4">
                <span className="text-[10px] font-bold text-muted-foreground/60 tracking-widest ml-2">{t('program.publish.strategy.override')}</span>
                <div className="flex p-1.5 bg-muted/40 rounded-2xl gap-1.5 ring-1 ring-inset ring-foreground/5 shadow-inner">
                   <button disabled={scope === 'RUNNING'} onClick={() => onModeChange('APPEND')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold transition-all tracking-widest", mode === 'APPEND' ? "bg-background shadow-lg text-foreground scale-[1.02]" : "text-muted-foreground/60 hover:text-muted-foreground", scope === 'RUNNING' && "opacity-20 cursor-not-allowed")}>{t('program.publish.strategy.append')}</button>
                   <button onClick={() => onModeChange('OVERWRITE')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-bold transition-all tracking-widest", mode === 'OVERWRITE' ? "bg-background shadow-lg text-foreground scale-[1.02]" : "text-muted-foreground/60 hover:text-muted-foreground")}>{t('program.publish.strategy.overwrite')}</button>
                </div>
             </div>
          </div>
          <div className="p-4 rounded-2xl bg-muted/20 border-2 border-dotted flex items-start gap-4 mx-1 group hover:border-muted-foreground/20 transition-colors">
             <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
             <p className="text-[11px] leading-relaxed text-muted-foreground font-bold tracking-tight opacity-70">
               {mode === 'APPEND' ? t('program.publish.strategy.modeAppend') : t('program.publish.strategy.modeOverwrite')}
             </p>
          </div>
       </div>
      </div>
    </ScrollArea>
  );
}

function ReviewStep({ plan, devices }: { plan: any; devices: Device[] }) {
  const deviceById = useMemo(() => new Map(devices.map((d) => [d.deviceId, d])), [devices]);
  const { t } = useTranslation();
  
  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500 py-2">
       <div className="grid grid-cols-3 gap-6">
          <div className="p-7 rounded-[2.5rem] bg-emerald-500/[0.03] border-2 border-emerald-500/10 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-14 w-14 text-emerald-500" />
             </div>
             <p className="text-[10px] font-bold text-emerald-700/50 mb-2 tracking-widest">{t('program.publish.review.activePush')}</p>
             <p className="text-4xl font-black tabular-nums tracking-tighter text-emerald-700">{plan.counts.deploy + plan.counts.update + plan.counts.rollback}</p>
             <p className="text-[9px] font-bold text-emerald-600/40 mt-1">{t('program.publish.review.nodesUpdating')}</p>
          </div>
          <div className="p-7 rounded-[2.5rem] bg-primary/[0.03] border-2 border-primary/10 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Database className="h-14 w-14 text-primary" />
             </div>
             <p className="text-[10px] font-bold text-primary/50 mb-2 tracking-widest">{t('program.publish.review.targetState')}</p>
             <p className="text-4xl font-black tabular-nums tracking-tighter text-primary">v{plan.targetVersion}</p>
             <p className="text-[9px] font-bold text-primary/40 mt-1">{t('program.publish.review.productionRev')}</p>
          </div>
          <div className="p-7 rounded-[2.5rem] bg-amber-500/[0.03] border-2 border-amber-500/10 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-all">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Clock className="h-14 w-14 text-amber-500" />
             </div>
             <p className="text-[10px] font-bold text-amber-700/50 mb-2 tracking-widest">{t('program.publish.review.asyncSync')}</p>
             <p className="text-4xl font-black tabular-nums tracking-tighter text-amber-700">{plan.counts.pendingSync}</p>
             <p className="text-[9px] font-bold text-emerald-600/40 mt-1">{t('program.publish.review.pendingRecon')}</p>
          </div>
       </div>

       <div className="flex-1 border-2 border-muted rounded-[2.5rem] bg-muted/5 overflow-hidden flex flex-col shadow-inner relative">
          <div className="flex items-center gap-4 px-12 py-4 bg-muted/20 text-[10px] font-bold tracking-widest text-muted-foreground/60 border-b">
             <span className="flex-1">{t('program.publish.review.device')}</span>
             <span className="w-44 text-center">{t('program.publish.review.transition')}</span>
             <span className="w-24 text-right">{t('program.publish.review.status')}</span>
          </div>
          <ScrollArea className="flex-1">
             <div className="divide-y divide-foreground/[0.04] px-4">
                {plan.perDevice.map((row: any) => {
                  const d = deviceById.get(row.deviceId);
                  const isChange = row.action !== 'skip' && row.action !== 'no-change';
                  
                  return (
                    <div key={row.deviceId} className={cn("flex items-center gap-8 px-8 py-5 transition-all rounded-3xl mx-1 my-1.5", isChange ? "hover:bg-muted/10 bg-background/50 shadow-sm border border-foreground/[0.02]" : "opacity-30 grayscale")}>
                       <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate tracking-tight text-foreground/90">{d?.alias || d?.deviceName}</p>
                          <div className="flex items-center gap-2.5 mt-2 opacity-50">
                             <p className="text-[9px] font-mono tracking-tighter tabular-nums">{row.deviceId}</p>
                          </div>
                       </div>
                       <div className="w-44 flex items-center justify-center gap-5">
                          <span className="text-[10px] font-bold opacity-30 tabular-nums">v{row.current || '0'}</span>
                          <div className="flex items-center justify-center w-6 h-6">
                            {row.action === 'deploy' && <Plus className="h-4 w-4 text-blue-500 animate-pulse" />}
                            {row.action === 'update' && <TrendingUp className="h-4 w-4 text-emerald-500 animate-pulse" />}
                            {row.action === 'rollback' && <History className="h-4 w-4 text-amber-500 animate-pulse" />}
                            {row.action === 'no-change' && <Check className="h-4 w-4 text-muted-foreground opacity-20" />}
                            {row.action === 'skip' && <ChevronsRight className="h-4 w-4 opacity-10" />}
                          </div>
                          <span className={cn("text-[11px] font-bold tabular-nums tracking-tighter px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-sm", isChange ? "" : "opacity-50 grayscale")}>v{row.target}</span>
                       </div>
                       <div className="w-24 text-right">
                          <Badge className={cn(
                            "text-[8px] font-bold tracking-[0.1em] px-2.5 h-5.5 border-0 shadow-sm",
                            row.action === 'deploy' ? "bg-emerald-500 text-white" : row.action === 'rollback' ? "bg-amber-500 text-white" : row.action === 'update' ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          )}>{row.action === 'no-change' ? t('program.publish.review.synced') : row.action}</Badge>
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
  return [...map.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function formatDeviceId(id: any): string {
  if (id === null || id === undefined) return '';
  const str = String(id).trim();
  if (str.length <= 12) return str;
  return `${str.slice(0, 8)}…${str.slice(-4)}`;
}
