import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Check, ChevronsRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TagChip } from '@/components/devices/TagChip';
import { cn } from '@/lib/utils';
import type { Device, Tag } from '@/types/device';
import { mockDevices } from '@/lib/mock/devices';

import { deployProgramVersionToDevices, listProgramDeployments, type ProgramDeploymentRecord } from '@/features/programs/storage/deploymentsDb';
import { getProgram, publishDraft, type ProgramRecord } from '@/features/programs/storage/programsDb';

type PublishScope = 'selected' | 'running';
type PublishMode = 'append' | 'overwrite';
type VersionMode = 'create' | 'existing';

export type ProgramPublishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: ProgramRecord;
  deployments: ProgramDeploymentRecord[];
  preferredDraftId?: string | null;
  initialSelectedDeviceIds?: string[] | null;
  onAfterPublish?: (next: { program: ProgramRecord; deployments: ProgramDeploymentRecord[] }) => void;
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
  const [step, setStep] = useState(0);

  const deploymentsByDeviceId = useMemo(() => new Map(deployments.map((d) => [d.deviceId, d])), [deployments]);
  const allTags = useMemo(() => collectDeviceTags(mockDevices), []);
  const defaultExistingVersion = useMemo(() => pickLatestPublished(program)?.version ?? 1, [program]);
  const defaultVersionMode = useMemo(
    () => (preferredDraftId ? 'create' : program.versions.length === 0 ? 'create' : 'existing'),
    [preferredDraftId, program.versions.length],
  );

  const [deviceQuery, setDeviceQuery] = useState('');
  const [tagFilters, setTagFilters] = useState<Set<string>>(() => new Set());
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [resolutionOnly, setResolutionOnly] = useState<'any' | 'match'>('any');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(() => new Set());

  const [versionMode, setVersionMode] = useState<VersionMode>('create');
  const [existingVersion, setExistingVersion] = useState<number>(() => pickLatestPublished(program)?.version ?? 1);
  const [scope, setScope] = useState<PublishScope>('selected');
  const [mode, setMode] = useState<PublishMode>('append');

  const predictedNewVersion = useMemo(() => Math.max(0, ...program.versions.map((v) => v.version)) + 1, [program.versions]);

  const filteredDevices = useMemo(() => {
    const q = deviceQuery.trim().toLowerCase();
    return mockDevices.filter((device) => {
      if (onlineOnly && device.status !== 'online') return false;
      if (resolutionOnly === 'match' && (device.resolution.width !== program.width || device.resolution.height !== program.height)) return false;
      if (tagFilters.size > 0 && !device.tags.some((t) => tagFilters.has(t.id))) return false;
      if (!q) return true;
      const name = (device.alias ?? device.deviceName).toLowerCase();
      return name.includes(q) || device.id.toLowerCase().includes(q);
    });
  }, [deviceQuery, onlineOnly, program.height, program.width, resolutionOnly, tagFilters]);

  const selectedDevices = useMemo(() => {
    const map = new Map(mockDevices.map((d) => [d.id, d]));
    return [...selectedDeviceIds].map((id) => map.get(id)).filter(Boolean) as Device[];
  }, [selectedDeviceIds]);

  const runningDeviceIds = useMemo(() => deployments.map((d) => d.deviceId), [deployments]);

  const baseTargetDeviceIds = useMemo(() => {
    if (scope === 'running') return runningDeviceIds;
    return [...selectedDeviceIds];
  }, [runningDeviceIds, scope, selectedDeviceIds]);

  const targetDeviceIds = useMemo(() => {
    if (mode === 'overwrite') return baseTargetDeviceIds;
    return baseTargetDeviceIds.filter((id) => !deploymentsByDeviceId.has(id));
  }, [baseTargetDeviceIds, deploymentsByDeviceId, mode]);

  const skippedDeviceIds = useMemo(() => {
    if (mode !== 'append') return [];
    const set = new Set(targetDeviceIds);
    return baseTargetDeviceIds.filter((id) => !set.has(id));
  }, [baseTargetDeviceIds, mode, targetDeviceIds]);

  const plan = useMemo(() => {
    const targetVersion = versionMode === 'existing' ? existingVersion : predictedNewVersion;
    const perDevice = baseTargetDeviceIds.map((deviceId) => {
      const current = deploymentsByDeviceId.get(deviceId)?.version ?? null;
      const willDeploy = targetDeviceIds.includes(deviceId);
      if (!willDeploy) return { deviceId, current, target: targetVersion, action: 'skip' as const };
      if (current == null) return { deviceId, current, target: targetVersion, action: 'deploy' as const };
      if (current === targetVersion) return { deviceId, current, target: targetVersion, action: 'no-change' as const };
      if (current < targetVersion) return { deviceId, current, target: targetVersion, action: 'update' as const };
      return { deviceId, current, target: targetVersion, action: 'rollback' as const };
    });

    const counts = perDevice.reduce(
      (acc, row) => {
        acc[row.action] += 1;
        return acc;
      },
      { deploy: 0, update: 0, rollback: 0, 'no-change': 0, skip: 0 } as Record<string, number>,
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
    setExistingVersion(defaultExistingVersion);
    setScope('selected');
    const anyRunningSelected = initialSelected.some((id) => deploymentsByDeviceId.has(id));
    setMode(anyRunningSelected ? 'overwrite' : 'append');
  };

  useEffect(() => {
    if (!open) return;
    resetDialog();
  }, [open, program.id, defaultExistingVersion, defaultVersionMode]);

  const close = () => {
    onOpenChange(false);
    resetDialog();
  };

  const canNext = useMemo(() => {
    if (step === 0) return selectedDeviceIds.size > 0 || deployments.length > 0;
    if (step === 1) {
      if (scope === 'running' && deployments.length === 0) return false;
      if (scope === 'selected' && selectedDeviceIds.size === 0) return false;
      if (versionMode === 'existing') return program.versions.some((v) => v.version === existingVersion);
      return Boolean(pickDraftForPublish(program, preferredDraftId)) && predictedNewVersion > 0;
    }
    return true;
  }, [deployments.length, existingVersion, preferredDraftId, predictedNewVersion, program, scope, selectedDeviceIds.size, step, versionMode]);

  const onConfirm = () => {
    try {
      let version = plan.targetVersion;
      if (versionMode === 'create') {
        const draft = pickDraftForPublish(program, preferredDraftId);
        if (!draft) throw new Error('No draft snapshot available to publish.');
        const res = publishDraft(program.id, draft.id);
        if (!res) throw new Error('Create version failed.');
        version = res.version.version;
      }

      const deviceIds = targetDeviceIds;
      if (deviceIds.length === 0) {
        toast.error('No devices would be affected by this strategy.');
        return;
      }

      deployProgramVersionToDevices({ programId: program.id, version, deviceIds });
      const nextDeployments = listProgramDeployments(program.id);
      const loaded = getProgram(program.id);
      if (!loaded) throw new Error('Program missing after publish.');
      toast.success(`Published v${version} to ${deviceIds.length} device${deviceIds.length === 1 ? '' : 's'}`);
      onAfterPublish?.({ program: loaded, deployments: nextDeployments });
      close();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed.';
      toast.error(message);
    }
  };

  const goNext = () => {
    if (step === 0) {
      if (selectedDeviceIds.size === 0 && deployments.length > 0) {
        setScope('running');
        setMode('overwrite');
      }
      setStep(1);
      return;
    }

    setStep(2);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="w-[min(100vw-2rem,980px)] max-w-none">
        <DialogHeader className="pr-10">
          <DialogTitle>Publish program</DialogTitle>
          <DialogDescription>
            Choose devices, strategy, and confirm the deployment plan. A device can only run one version of this program.
          </DialogDescription>
        </DialogHeader>

        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="icon" onClick={close} aria-label="Close publish dialog">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <PublishStepper currentStep={step} />
        {step === 0 ? (
          <DeviceSelectStep
            allTags={allTags}
            deploymentsByDeviceId={deploymentsByDeviceId}
            deviceQuery={deviceQuery}
            filteredDevices={filteredDevices}
            onlineOnly={onlineOnly}
            onDeviceQueryChange={setDeviceQuery}
            onOnlineOnlyChange={setOnlineOnly}
            onResolutionOnlyChange={setResolutionOnly}
            onTagFiltersChange={setTagFilters}
            resolutionOnly={resolutionOnly}
            selectedDeviceIds={selectedDeviceIds}
            selectedDevices={selectedDevices}
            tagFilters={tagFilters}
            onSelectedDeviceIdsChange={setSelectedDeviceIds}
            programResolution={{ width: program.width, height: program.height }}
          />
        ) : step === 1 ? (
          <StrategyStep
            deployments={deployments}
            existingVersion={existingVersion}
            mode={mode}
            onExistingVersionChange={setExistingVersion}
            onModeChange={setMode}
            onScopeChange={(next) => {
              setScope(next);
              if (next === 'running') setMode('overwrite');
            }}
            onVersionModeChange={setVersionMode}
            predictedNewVersion={predictedNewVersion}
            preferredDraftId={preferredDraftId}
            program={program}
            scope={scope}
            versionMode={versionMode}
            selectedCount={selectedDeviceIds.size}
          />
        ) : (
          <ReviewStep
            deploymentsByDeviceId={deploymentsByDeviceId}
            plan={plan}
            scope={scope}
            skippedDeviceIds={skippedDeviceIds}
            targetDeviceIds={targetDeviceIds}
            versionMode={versionMode}
          />
        )}

        <Separator className="my-2" />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {step === 2 ? (
              <span>
                <ChevronsRight className="mr-1 inline h-3.5 w-3.5" />
                Review changes before publishing.
              </span>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={step === 0 ? close : () => setStep((s) => Math.max(0, s - 1))}>
              {step === 0 ? 'Cancel' : (
                <span className="inline-flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </span>
              )}
            </Button>
            {step < 2 ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canNext}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={onConfirm} className="gap-2">
                <Check className="h-4 w-4" />
                Publish
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function collectDeviceTags(devices: Device[]): Tag[] {
  const map = new Map<string, Tag>();
  for (const device of devices) {
    for (const tag of device.tags) map.set(tag.id, tag);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function pickLatestPublished(program: ProgramRecord): ProgramRecord['versions'][number] | null {
  if (!program.versions.length) return null;
  return [...program.versions].sort((a, b) => b.version - a.version)[0] ?? null;
}

function pickDraftForPublish(program: ProgramRecord, preferredDraftId?: string | null): ProgramRecord['drafts'][number] | null {
  if (preferredDraftId) {
    const hit = program.drafts.find((d) => d.id === preferredDraftId) ?? null;
    if (hit) return hit;
  }
  if (!program.drafts.length) return null;
  return [...program.drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

function PublishStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { title: 'Devices', description: 'Choose targets' },
    { title: 'Strategy', description: 'Pick version & scope' },
    { title: 'Review', description: 'Confirm changes' },
  ];

  return (
    <div className="mt-2 rounded-lg border bg-muted/20 px-4 py-3">
      <div className="flex items-center justify-between">
        {steps.map((s, idx) => {
          const state = idx < currentStep ? 'complete' : idx === currentStep ? 'active' : 'upcoming';
          return (
            <div key={s.title} className="flex flex-1 items-center gap-3">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold',
                state === 'complete' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
                state === 'active' && 'border-primary/40 bg-accent text-accent-foreground',
                state === 'upcoming' && 'bg-background text-muted-foreground',
              )}>
                {state === 'complete' ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <div className="min-w-0">
                <p className={cn('truncate text-sm font-medium', state === 'upcoming' && 'text-muted-foreground')}>{s.title}</p>
                <p className="truncate text-xs text-muted-foreground">{s.description}</p>
              </div>
              {idx < steps.length - 1 ? (
                <div className={cn('mx-3 hidden h-[2px] flex-1 rounded-full sm:block', idx < currentStep ? 'bg-emerald-500/30' : 'bg-border')} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type DeviceSelectStepProps = {
  allTags: Tag[];
  deploymentsByDeviceId: Map<string, ProgramDeploymentRecord>;
  deviceQuery: string;
  filteredDevices: Device[];
  onlineOnly: boolean;
  resolutionOnly: 'any' | 'match';
  selectedDeviceIds: Set<string>;
  selectedDevices: Device[];
  tagFilters: Set<string>;
  programResolution: { width: number; height: number };
  onDeviceQueryChange: (next: string) => void;
  onOnlineOnlyChange: (next: boolean) => void;
  onResolutionOnlyChange: (next: 'any' | 'match') => void;
  onSelectedDeviceIdsChange: Dispatch<SetStateAction<Set<string>>>;
  onTagFiltersChange: Dispatch<SetStateAction<Set<string>>>;
};

function DeviceSelectStep({
  allTags,
  deploymentsByDeviceId,
  deviceQuery,
  filteredDevices,
  onlineOnly,
  onDeviceQueryChange,
  onOnlineOnlyChange,
  onResolutionOnlyChange,
  onSelectedDeviceIdsChange,
  onTagFiltersChange,
  programResolution,
  resolutionOnly,
  selectedDeviceIds,
  selectedDevices,
  tagFilters,
}: DeviceSelectStepProps) {
  const filteredIds = useMemo(() => filteredDevices.map((d) => d.id), [filteredDevices]);
  const runningFilteredIds = useMemo(
    () => filteredDevices.filter((d) => deploymentsByDeviceId.has(d.id)).map((d) => d.id),
    [deploymentsByDeviceId, filteredDevices],
  );
  const notRunningFilteredIds = useMemo(
    () => filteredDevices.filter((d) => !deploymentsByDeviceId.has(d.id)).map((d) => d.id),
    [deploymentsByDeviceId, filteredDevices],
  );
  const allFilteredSelected = useMemo(
    () => filteredIds.length > 0 && filteredIds.every((id) => selectedDeviceIds.has(id)),
    [filteredIds, selectedDeviceIds],
  );
  const someFilteredSelected = useMemo(() => filteredIds.some((id) => selectedDeviceIds.has(id)), [filteredIds, selectedDeviceIds]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Device list</p>
            <p className="text-xs text-muted-foreground">Filter and pick target devices.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                onSelectedDeviceIdsChange((prev) => {
                  const next = new Set(prev);
                  for (const id of filteredIds) next.add(id);
                  return next;
                });
              }}
              disabled={filteredIds.length === 0}
            >
              Select filtered
            </Button>
            {deploymentsByDeviceId.size > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onSelectedDeviceIdsChange((prev) => {
                    const next = new Set(prev);
                    for (const id of runningFilteredIds) next.add(id);
                    return next;
                  });
                }}
                disabled={runningFilteredIds.length === 0}
              >
                Select running
              </Button>
            ) : null}
            {deploymentsByDeviceId.size > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  onSelectedDeviceIdsChange((prev) => {
                    const next = new Set(prev);
                    for (const id of notRunningFilteredIds) next.add(id);
                    return next;
                  });
                }}
                disabled={notRunningFilteredIds.length === 0}
              >
                Select not running
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="ghost" onClick={() => onSelectedDeviceIdsChange(new Set())} disabled={selectedDeviceIds.size === 0}>
              Clear
            </Button>
          </div>
        </div>
        <Separator />
        <div className="space-y-3 px-4 py-3">
          <Input value={deviceQuery} onChange={(e) => onDeviceQueryChange(e.target.value)} placeholder="Search devices…" />

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox checked={onlineOnly} onCheckedChange={(v) => onOnlineOnlyChange(Boolean(v))} />
              Online only
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={resolutionOnly === 'match'}
                onCheckedChange={(v) => onResolutionOnlyChange(Boolean(v) ? 'match' : 'any')}
              />
              Match {programResolution.width}×{programResolution.height}
            </label>
          </div>

          {allTags.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Tags</p>
              <div className="flex flex-wrap items-center gap-2">
                {allTags.map((tag) => {
                  const active = tagFilters.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={cn('rounded-full transition-opacity', active ? '' : 'opacity-60 hover:opacity-100')}
                      onClick={() => {
                        onTagFiltersChange((prev) => {
                          const next = new Set(prev);
                          if (next.has(tag.id)) next.delete(tag.id);
                          else next.add(tag.id);
                          return next;
                        });
                      }}
                    >
                      <TagChip tag={tag} className={cn(active && 'border-primary/50 bg-accent')} />
                    </button>
                  );
                })}
                {tagFilters.size > 0 ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    onClick={() => onTagFiltersChange(new Set())}
                  >
                    Clear tags
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <Separator />

        <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground">
          <Checkbox
            checked={allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false}
            onCheckedChange={(v) => {
              const checked = Boolean(v);
              onSelectedDeviceIdsChange((prev) => {
                const next = new Set(prev);
                if (!checked) {
                  for (const id of filteredIds) next.delete(id);
                  return next;
                }
                for (const id of filteredIds) next.add(id);
                return next;
              });
            }}
          />
          <span className="flex-1">Device</span>
          <span className="hidden w-[120px] text-right sm:block">Resolution</span>
          <span className="w-[120px] text-right">Current</span>
        </div>

        <ScrollArea className="h-[360px]">
          <div className="divide-y">
            {filteredDevices.map((device) => {
              const checked = selectedDeviceIds.has(device.id);
              const current = deploymentsByDeviceId.get(device.id);
              const statusTone =
                device.status === 'online'
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : device.status === 'offline'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-amber-500/10 text-amber-700';

              const shownTags = device.tags.slice(0, 2);
              const more = device.tags.length - shownTags.length;

              return (
                <div
                  key={device.id}
                  className={cn('flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/20', checked && 'bg-muted/20')}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => {
                      onSelectedDeviceIdsChange((prev) => {
                        const next = new Set(prev);
                        if (v) next.add(device.id);
                        else next.delete(device.id);
                        return next;
                      });
                    }}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{device.alias ?? device.deviceName}</p>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs capitalize', statusTone)}>{device.status}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {shownTags.map((t) => (
                        <TagChip key={t.id} tag={t} className="px-1.5 py-0.5 text-[11px]" iconClassName="h-2.5 w-2.5" />
                      ))}
                      {more > 0 ? (
                        <Badge variant="outline" className="px-2 py-0.5 text-[11px] text-muted-foreground">
                          +{more}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="hidden w-[120px] text-right text-xs text-muted-foreground sm:block">
                    {device.resolution.width}×{device.resolution.height}
                  </div>
                  <div className="w-[120px] text-right">
                    {current ? (
                      <Badge variant="outline">v{current.version}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">none</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredDevices.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No devices match your filters.</div>
            ) : null}
          </div>
        </ScrollArea>
      </div>

      <div className="rounded-lg border">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Selected</p>
            <p className="text-xs text-muted-foreground">{selectedDeviceIds.size} device(s)</p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={() => onSelectedDeviceIdsChange(new Set())} disabled={selectedDeviceIds.size === 0}>
            Clear
          </Button>
        </div>
        <Separator />
        <div className="grid grid-cols-[1fr_92px_92px_44px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="truncate">Device</span>
          <span className="text-right">Resolution</span>
          <span className="text-right">Current</span>
          <span className="text-right"> </span>
        </div>
        <ScrollArea className="h-[420px]">
          <div className="divide-y">
            {selectedDevices.map((device) => {
              const current = deploymentsByDeviceId.get(device.id);
              return (
                <div key={device.id} className="grid grid-cols-[1fr_92px_92px_44px] items-center gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{device.alias ?? device.deviceName}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{device.id}</p>
                  </div>
                  <p className="text-right text-xs text-muted-foreground">{device.resolution.width}×{device.resolution.height}</p>
                  <div className="text-right">
                    {current ? <Badge variant="outline">v{current.version}</Badge> : <span className="text-xs text-muted-foreground">none</span>}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label="Remove device"
                      onClick={() => {
                        onSelectedDeviceIdsChange((prev) => {
                          const next = new Set(prev);
                          next.delete(device.id);
                          return next;
                        });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {selectedDevices.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No devices selected yet.</div>
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

type StrategyStepProps = {
  deployments: ProgramDeploymentRecord[];
  program: ProgramRecord;
  predictedNewVersion: number;
  preferredDraftId?: string | null;
  selectedCount: number;
  existingVersion: number;
  versionMode: VersionMode;
  scope: PublishScope;
  mode: PublishMode;
  onExistingVersionChange: (next: number) => void;
  onVersionModeChange: (next: VersionMode) => void;
  onScopeChange: (next: PublishScope) => void;
  onModeChange: (next: PublishMode) => void;
};

function StrategyStep({
  deployments,
  existingVersion,
  mode,
  onExistingVersionChange,
  onModeChange,
  onScopeChange,
  onVersionModeChange,
  predictedNewVersion,
  preferredDraftId,
  program,
  scope,
  versionMode,
  selectedCount,
}: StrategyStepProps) {
  const draft = useMemo(() => pickDraftForPublish(program, preferredDraftId), [preferredDraftId, program]);
  const latest = useMemo(() => pickLatestPublished(program), [program]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">Version</p>
        <p className="mt-1 text-xs text-muted-foreground">Choose a version to deploy.</p>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            className={cn(
              'w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/20',
              versionMode === 'create' && 'border-primary/40 bg-accent',
            )}
            onClick={() => onVersionModeChange('create')}
          >
            <p className="text-sm font-medium">Create a new version from working changes</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {program.versions.length === 0 ? `Creates v${predictedNewVersion} (first publish).` : `Creates v${predictedNewVersion}.`}
              {draft?.baseVersion != null ? ` Based on v${draft.baseVersion}.` : ' Based on blank.'}
            </p>
            {!draft ? (
              <p className="mt-2 text-xs text-amber-700">No draft snapshot found. Open the editor to create one.</p>
            ) : null}
          </button>

          <button
            type="button"
            className={cn(
              'w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/20',
              versionMode === 'existing' && 'border-primary/40 bg-accent',
            )}
            onClick={() => onVersionModeChange('existing')}
            disabled={program.versions.length === 0}
          >
            <p className="text-sm font-medium">Deploy an existing version</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose from published versions. Older versions are read-only.
            </p>
            <div className="mt-3">
              <select
                value={String(existingVersion)}
                onChange={(e) => onExistingVersionChange(Number(e.target.value))}
                disabled={program.versions.length === 0 || versionMode !== 'existing'}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60"
              >
                {[...program.versions]
                  .slice()
                  .sort((a, b) => b.version - a.version)
                  .map((v) => (
                    <option key={v.version} value={String(v.version)}>
                      v{v.version}{latest?.version === v.version ? ' (latest)' : ''}
                    </option>
                  ))}
              </select>
            </div>
            {program.versions.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No published versions yet.</p>
            ) : null}
          </button>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">Deployment strategy</p>
        <p className="mt-1 text-xs text-muted-foreground">Choose scope and whether to overwrite existing deployments.</p>

        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Scope</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={cn('rounded-lg border p-3 text-left transition-colors hover:bg-muted/20', scope === 'selected' && 'border-primary/40 bg-accent')}
                onClick={() => onScopeChange('selected')}
              >
                <p className="text-sm font-medium">Selected devices</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedCount} selected</p>
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors hover:bg-muted/20',
                  scope === 'running' && 'border-primary/40 bg-accent',
                  deployments.length === 0 && 'cursor-not-allowed opacity-60 hover:bg-transparent',
                )}
                onClick={() => deployments.length > 0 && onScopeChange('running')}
              >
                <p className="text-sm font-medium">Devices already running it</p>
                <p className="mt-1 text-xs text-muted-foreground">{deployments.length} device(s)</p>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Mode</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={cn(
                  'rounded-lg border p-3 text-left transition-colors hover:bg-muted/20',
                  mode === 'append' && 'border-primary/40 bg-accent',
                  scope === 'running' && 'cursor-not-allowed opacity-60 hover:bg-transparent',
                )}
                onClick={() => scope !== 'running' && onModeChange('append')}
                disabled={scope === 'running'}
              >
                <p className="text-sm font-medium">Append only</p>
                <p className="mt-1 text-xs text-muted-foreground">Deploy only to devices that don’t have this program yet.</p>
              </button>
              <button
                type="button"
                className={cn('rounded-lg border p-3 text-left transition-colors hover:bg-muted/20', mode === 'overwrite' && 'border-primary/40 bg-accent')}
                onClick={() => onModeChange('overwrite')}
              >
                <p className="text-sm font-medium">Overwrite</p>
                <p className="mt-1 text-xs text-muted-foreground">Deploy to all target devices (updates existing deployments).</p>
              </button>
            </div>
            {mode === 'overwrite' ? (
              <p className="text-xs text-muted-foreground">
                This enables updates and rollbacks. Devices already on the same version may still be re-deployed.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type ReviewStepProps = {
  deploymentsByDeviceId: Map<string, ProgramDeploymentRecord>;
  plan: {
    targetVersion: number;
    perDevice: Array<{ deviceId: string; current: number | null; target: number; action: 'deploy' | 'update' | 'rollback' | 'no-change' | 'skip' }>;
    counts: Record<string, number>;
  };
  scope: PublishScope;
  targetDeviceIds: string[];
  skippedDeviceIds: string[];
  versionMode: VersionMode;
};

function ReviewStep({ deploymentsByDeviceId, plan, scope, targetDeviceIds, versionMode }: ReviewStepProps) {
  const deviceById = useMemo(() => new Map(mockDevices.map((d) => [d.id, d])), []);

  return (
    <div className="rounded-lg border">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Review</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {versionMode === 'create' ? `Will create v${plan.targetVersion} and deploy it.` : `Will deploy v${plan.targetVersion}.`}
            {scope === 'running' ? ' Scope: all running devices.' : ` Scope: selected devices.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">Deploy {plan.counts.deploy ?? 0}</Badge>
          <Badge variant="outline">Update {plan.counts.update ?? 0}</Badge>
          <Badge variant="outline">Rollback {plan.counts.rollback ?? 0}</Badge>
          <Badge variant="outline">Skip {plan.counts.skip ?? 0}</Badge>
        </div>
      </div>
      <Separator />
      <div className="px-4 py-3">
        {targetDeviceIds.length === 0 ? (
          <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            No devices would be affected by this strategy.
          </div>
        ) : null}
      </div>
      <Separator />
      <ScrollArea className="h-[360px]">
        <div className="divide-y">
          {plan.perDevice.map((row) => {
            const device = deviceById.get(row.deviceId) ?? null;
            const current = deploymentsByDeviceId.get(row.deviceId);
            const name = device?.alias ?? device?.deviceName ?? row.deviceId;
            const actionTone =
              row.action === 'deploy'
                ? 'bg-emerald-500/10 text-emerald-700'
                : row.action === 'update'
                  ? 'bg-sky-500/10 text-sky-700'
                  : row.action === 'rollback'
                    ? 'bg-amber-500/10 text-amber-700'
                    : row.action === 'skip'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-muted text-muted-foreground';

            return (
              <div key={row.deviceId} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current {current ? `v${current.version}` : 'none'} → Target v{row.target}
                  </p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2 py-1 text-xs font-medium', actionTone)}>
                  {row.action === 'no-change' ? 'no change' : row.action}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="px-4 py-3 text-xs text-muted-foreground">
        Versions are immutable. Publishing creates a new version; existing versions cannot be modified or deleted.
      </div>
    </div>
  );
}
