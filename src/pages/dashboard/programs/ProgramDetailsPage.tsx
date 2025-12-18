import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, LayoutPanelTop, MoreHorizontal, Pencil, Send, Trash2, TriangleAlert, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatBytes } from '@better-upload/client/helpers';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { mockDevices } from '@/lib/mock/devices';
import { mockMediaLibraryNodes } from '@/lib/mock/media-library';
import { cn } from '@/lib/utils';

import {
  listProgramDeployments,
  undeployProgramEverywhere,
  undeployProgramFromDevices,
  type ProgramDeploymentRecord,
} from '@/features/programs/storage/deploymentsDb';
import { deleteProgram, getProgram, renameProgram, type ProgramRecord } from '@/features/programs/storage/programsDb';
import { createProgramTemplate } from '@/features/programs/storage/templatesDb';
import { buildMaterialSizeIndex, sumMaterialBytesForDoc } from '@/features/programs/vsn/materials';
import { summarizeVsn } from '@/features/programs/vsn/summary';
import type { VsnDocument } from '@/features/programs/vsn/types';
import { ProgramPublishDialog } from '@/features/programs/publishing/ProgramPublishDialog';

export default function ProgramDetailsPage() {
  const navigate = useNavigate();
  const { programId } = useParams<{ programId: string }>();

  const [program, setProgram] = useState<ProgramRecord | null>(null);
  const [deployments, setDeployments] = useState<ProgramDeploymentRecord[]>([]);

  useEffect(() => {
    if (!programId) return;
    setProgram(getProgram(programId));
    setDeployments(listProgramDeployments(programId));
  }, [programId]);

  const materialSizeIndex = useMemo(() => buildMaterialSizeIndex(mockMediaLibraryNodes), []);
  const previewDoc = useMemo(() => (program ? pickProgramPreviewDoc(program) : null), [program]);
  const summary = useMemo(() => summarizeVsn(previewDoc), [previewDoc]);
  const materialBytes = useMemo(() => sumMaterialBytesForDoc(previewDoc, materialSizeIndex), [materialSizeIndex, previewDoc]);

  const deploymentsByDeviceId = useMemo(() => new Map(deployments.map((d) => [d.deviceId, d])), [deployments]);
  const deploymentVersions = useMemo(() => getVersionDistribution(deployments), [deployments]);
  const isMixed = deploymentVersions.length > 1;
  const latestPublished = useMemo(() => (program ? pickLatestPublished(program) : null), [program]);
  const unpublishedChanges = useMemo(() => (program ? hasUnpublishedChanges(program) : false), [program]);

  const [deviceQuery, setDeviceQuery] = useState('');
  const [versionFilter, setVersionFilter] = useState<number | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setDeviceQuery('');
    setVersionFilter(null);
    setSelectedDeviceIds(new Set());
  }, [programId]);

  const deviceRows = useMemo(() => {
    return mockDevices.map((device) => ({ device, deployment: deploymentsByDeviceId.get(device.id) ?? null }));
  }, [deploymentsByDeviceId]);

  const filteredDeviceRows = useMemo(() => {
    const q = deviceQuery.trim().toLowerCase();
    return deviceRows.filter(({ device, deployment }) => {
      if (versionFilter != null && deployment?.version !== versionFilter) return false;
      if (!q) return true;
      const name = (device.alias ?? device.deviceName).toLowerCase();
      return name.includes(q) || device.id.toLowerCase().includes(q);
    });
  }, [deviceQuery, deviceRows, versionFilter]);

  const allFilteredIds = useMemo(() => filteredDeviceRows.map((r) => r.device.id), [filteredDeviceRows]);
  const allFilteredSelected = useMemo(
    () => allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedDeviceIds.has(id)),
    [allFilteredIds, selectedDeviceIds],
  );
  const someFilteredSelected = useMemo(() => allFilteredIds.some((id) => selectedDeviceIds.has(id)), [allFilteredIds, selectedDeviceIds]);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishInitialDeviceIds, setPublishInitialDeviceIds] = useState<string[]>([]);

  const openPublishDialog = (input?: { preselectedDeviceIds?: string[]; versionChoice?: string }) => {
    const defaultDevices = input?.preselectedDeviceIds?.length
      ? input.preselectedDeviceIds
      : deployments.length
        ? deployments.map((d) => d.deviceId)
        : mockDevices.filter((d) => d.status === 'online').map((d) => d.id);
    setPublishInitialDeviceIds(defaultDevices);
    setPublishOpen(true);
  };

  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [unpublishDeviceIds, setUnpublishDeviceIds] = useState<string[]>([]);
  const [unpublishLabel, setUnpublishLabel] = useState('');
  const unpublishAffectedCount = useMemo(() => {
    if (unpublishDeviceIds.length === 0) return 0;
    const requested = new Set(unpublishDeviceIds);
    return deployments.filter((d) => requested.has(d.deviceId)).length;
  }, [deployments, unpublishDeviceIds]);

  const requestUnpublish = (input: { deviceIds: string[]; label: string }) => {
    setUnpublishDeviceIds(input.deviceIds);
    setUnpublishLabel(input.label);
    setUnpublishOpen(true);
  };

  const handleConfirmUnpublish = () => {
    if (!program) return;
    const requested = new Set(unpublishDeviceIds.filter(Boolean));
    if (requested.size === 0) {
      setUnpublishOpen(false);
      return;
    }

    const deployedIds = deployments.map((d) => d.deviceId);
    const affected = deployedIds.filter((id) => requested.has(id)).length;
    if (affected === 0) {
      toast.message('Nothing to unpublish for the selected devices.');
      setUnpublishOpen(false);
      return;
    }

    const coversAll = deployedIds.length > 0 && deployedIds.every((id) => requested.has(id));

    if (coversAll) {
      undeployProgramEverywhere(program.id);
      setDeployments([]);
      toast.success('Unpublished from all devices');
    } else {
      undeployProgramFromDevices({ programId: program.id, deviceIds: [...requested] });
      setDeployments(listProgramDeployments(program.id));
      toast.success(`Unpublished from ${affected} device${affected === 1 ? '' : 's'}`);
    }

    setSelectedDeviceIds((prev) => {
      const next = new Set(prev);
      for (const id of requested) next.delete(id);
      return next;
    });

    setUnpublishOpen(false);
  };

  const handleCopyId = async () => {
    if (!program) return;
    try {
      await navigator.clipboard.writeText(program.id);
      toast.success('Copied program ID');
    } catch {
      toast.error('Copy failed');
    }
  };

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const handleRename = () => {
    if (!program) return;
    const nextName = renameValue.trim();
    if (!nextName) {
      toast.error('Name is required.');
      return;
    }
    const updated = renameProgram(program.id, nextName);
    if (!updated) {
      toast.error('Rename failed.');
      return;
    }
    setProgram(updated);
    setRenameOpen(false);
    toast.success('Renamed');
  };

  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = () => {
    if (!program) return;
    undeployProgramEverywhere(program.id);
    const ok = deleteProgram(program.id);
    if (!ok) {
      toast.error('Delete failed.');
      return;
    }
    toast.success('Program deleted');
    navigate('/dashboard/programs');
  };

  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateSourceChoice, setTemplateSourceChoice] = useState<string>('working');

  const openTemplateDialog = () => {
    if (!program) return;
    setTemplateName(`${program.name} template`);
    setTemplateDescription('');
    setTemplateSourceChoice(unpublishedChanges || program.versions.length === 0 ? 'working' : `v${latestPublished?.version ?? ''}`);
    setTemplateOpen(true);
  };

  const handleCreateTemplate = () => {
    if (!program) return;
    const name = templateName.trim();
    if (!name) {
      toast.error('Template name is required.');
      return;
    }

    let source: VsnDocument | null = null;
    if (templateSourceChoice === 'working') source = pickLatestDraft(program)?.vsn ?? null;
    else if (/^v\\d+$/.test(templateSourceChoice)) {
      const v = Number.parseInt(templateSourceChoice.slice(1), 10);
      source = program.versions.find((x) => x.version === v)?.vsn ?? null;
    }

    if (!source) {
      toast.error('Select a valid template source.');
      return;
    }

    createProgramTemplate({ name, description: templateDescription.trim() || null, sourceVsn: source });
    toast.success('Template created');
    setTemplateOpen(false);
    navigate('/dashboard/programs?tab=templates');
  };

  if (!programId) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm font-medium">Program</p>
        <p className="mt-1 text-sm text-muted-foreground">Missing program id.</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="flex items-center gap-2 text-sm font-medium">
          <TriangleAlert className="h-5 w-5 text-amber-600" />
          Program not found
        </p>
        <p className="mt-1 text-sm text-muted-foreground">The program may have been deleted or the URL is incorrect.</p>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link to="/dashboard/programs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Programs
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const liveLabel = deployments.length === 0
    ? 'Not published'
    : isMixed
      ? `Live (mixed) · ${deployments.length}`
      : `Live v${deploymentVersions[0]?.version ?? ''} · ${deployments.length}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" className="-ml-2 gap-2" asChild>
            <Link to="/dashboard/programs">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight">{program.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Publishing status and device deployments.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="outline" className="gap-2" asChild>
            <Link to={`/dashboard/programs/${program.id}/edit`}>
              <LayoutPanelTop className="h-4 w-4" />
              Editor
            </Link>
          </Button>
          <Button className="gap-2" onClick={() => setPublishOpen(true)}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
          {deployments.length > 0 ? (
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => requestUnpublish({ deviceIds: deployments.map((d) => d.deviceId), label: 'all devices' })}
            >
              <XCircle className="h-4 w-4" />
              Unpublish all
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Program actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openPublishDialog()}>
                <Send className="h-4 w-4" />
                Publish to devices…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void handleCopyId()}>
                <Copy className="h-4 w-4" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setRenameValue(program.name);
                  setRenameOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={openTemplateDialog}>
                <LayoutPanelTop className="h-4 w-4" />
                Save as template…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LayoutPanelTop className="h-5 w-5 text-muted-foreground" />
              Program
            </CardTitle>
            <CardDescription>Preview and key metrics.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {unpublishedChanges ? (
              <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">Unpublished changes</Badge>
            ) : null}
            <Badge
              className={cn(
                deployments.length === 0
                  ? 'bg-muted text-muted-foreground hover:bg-muted'
                  : isMixed
                    ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/10'
                    : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10',
              )}
            >
              {liveLabel}
            </Badge>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <ProgramLayoutThumbnail doc={previewDoc} />
            <div className="min-w-0">
              <p className="text-sm font-medium">{program.width}×{program.height}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latestPublished ? `Latest version v${latestPublished.version}` : 'No published versions yet'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDurationMs(summary.totalDurationMs)} · {formatBytes(materialBytes)} · Updated {formatRelativeTime(program.updatedAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openPublishDialog()}>
              <Send className="h-4 w-4" />
              Publish to devices…
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Deployments</CardTitle>
            <CardDescription>See where each version is running.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-colors',
                versionFilter == null ? 'border-primary/50 bg-accent text-accent-foreground' : 'hover:bg-accent/20',
              )}
              onClick={() => setVersionFilter(null)}
            >
              All devices
            </button>
            {deploymentVersions.map((v) => (
              <button
                key={v.version}
                type="button"
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  versionFilter === v.version ? 'border-primary/50 bg-accent text-accent-foreground' : 'hover:bg-accent/20',
                )}
                onClick={() => setVersionFilter(v.version)}
              >
                v{v.version} · {v.count}
              </button>
            ))}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Total devices: <span className="font-medium text-foreground">{mockDevices.length}</span></span>
              <span>Running: <span className="font-medium text-foreground">{deployments.length}</span></span>
              <span>Selected: <span className="font-medium text-foreground">{selectedDeviceIds.size}</span></span>
              {versionFilter != null ? (
                <span>Filter: <span className="font-medium text-foreground">v{versionFilter}</span></span>
              ) : null}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="w-full sm:w-[260px]">
                <Input value={deviceQuery} onChange={(e) => setDeviceQuery(e.target.value)} placeholder="Search devices…" />
              </div>
              {selectedDeviceIds.size > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => openPublishDialog({ preselectedDeviceIds: [...selectedDeviceIds] })}
                  >
                    <Send className="h-4 w-4" />
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={() => requestUnpublish({ deviceIds: [...selectedDeviceIds], label: 'selected devices' })}
                  >
                    <XCircle className="h-4 w-4" />
                    Unpublish
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedDeviceIds(new Set())}>
                    Clear
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          <Separator />
          <div className="divide-y">
            <div className="flex items-center gap-3 px-6 py-3 text-xs font-medium text-muted-foreground">
              <Checkbox
                checked={allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false}
                onCheckedChange={(next) => {
                  const checked = Boolean(next);
                  setSelectedDeviceIds((prev) => {
                    const copy = new Set(prev);
                    if (!checked) {
                      for (const id of allFilteredIds) copy.delete(id);
                      return copy;
                    }
                    for (const id of allFilteredIds) copy.add(id);
                    return copy;
                  });
                }}
              />
              <span className="w-[min(360px,45%)]">Device</span>
              <span className="hidden w-[110px] sm:block">Status</span>
              <span className="hidden w-[140px] sm:block">Resolution</span>
              <span className="flex-1">Deployment</span>
            </div>
            {filteredDeviceRows.map(({ device, deployment }) => {
              const checked = selectedDeviceIds.has(device.id);
              const statusTone =
                device.status === 'online'
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : device.status === 'offline'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-amber-500/10 text-amber-700';

              return (
                <div
                  key={device.id}
                  className={cn(
                    'flex items-start gap-3 px-6 py-4 transition-colors hover:bg-muted/20',
                    checked && 'bg-muted/20',
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) => {
                      setSelectedDeviceIds((prev) => {
                        const copy = new Set(prev);
                        if (next) copy.add(device.id);
                        else copy.delete(device.id);
                        return copy;
                      });
                    }}
                    className="mt-1"
                  />
                  <div className="min-w-0 w-[min(360px,45%)]">
                    <p className="truncate text-sm font-medium">{device.alias ?? device.deviceName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">ID {device.id}</p>
                  </div>
                  <div className="hidden w-[110px] sm:block">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs capitalize', statusTone)}>
                      {device.status}
                    </span>
                  </div>
                  <div className="hidden w-[140px] text-xs text-muted-foreground sm:block">
                    {device.resolution.width}×{device.resolution.height}
                  </div>
                  <div className="min-w-0 flex-1">
                    {deployment ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">v{deployment.version}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Deployed {formatRelativeTime(deployment.deployedAt)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not published</p>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredDeviceRows.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No devices match your filters.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ProgramPublishDialog
        open={publishOpen}
        onOpenChange={(next) => {
          setPublishOpen(next);
          if (!next) setPublishInitialDeviceIds([]);
        }}
        program={program}
        deployments={deployments}
        initialSelectedDeviceIds={publishInitialDeviceIds}
        onAfterPublish={({ program: nextProgram, deployments: nextDeployments }) => {
          setProgram(nextProgram);
          setDeployments(nextDeployments);
        }}
      />

      <Dialog
        open={unpublishOpen}
        onOpenChange={(open) => {
          setUnpublishOpen(open);
          if (!open) {
            setUnpublishDeviceIds([]);
            setUnpublishLabel('');
          }
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Unpublish program</DialogTitle>
            <DialogDescription>Remove this program from {unpublishLabel || 'devices'}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="font-medium">{program.name}</p>
              <p className="mt-1 text-muted-foreground">{unpublishAffectedCount} device(s) will stop playing this program.</p>
              {unpublishAffectedCount < unpublishDeviceIds.length ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {unpublishDeviceIds.length - unpublishAffectedCount} selected device(s) are not currently running it.
                </p>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setUnpublishOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmUnpublish}>
                Unpublish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) setRenameValue('');
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Rename program</DialogTitle>
            <DialogDescription>Update the program name across lists and editors.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Program name" />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRename} disabled={!renameValue.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={templateOpen}
        onOpenChange={(open) => {
          setTemplateOpen(open);
          if (!open) {
            setTemplateName('');
            setTemplateDescription('');
            setTemplateSourceChoice('working');
          }
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,640px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
            <DialogDescription>Create a reusable starting point for new programs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="template-name">
                  Template name
                </label>
                <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="template-source">
                  Source
                </label>
                <select
                  id="template-source"
                  value={templateSourceChoice}
                  onChange={(e) => setTemplateSourceChoice(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="working">Working copy (draft)</option>
                  {program.versions.length > 0 && <option disabled>— Published versions —</option>}
                  {[...program.versions]
                    .sort((a, b) => b.version - a.version)
                    .map((v) => (
                      <option key={v.version} value={`v${v.version}`}>
                        v{v.version}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="template-description">
                Description (optional)
              </label>
              <Input
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Short note to help teammates pick the right template…"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setTemplateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={!templateName.trim()}>
                Save template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Delete program</DialogTitle>
            <DialogDescription>This removes unpublished changes, version history, and deployments.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="font-medium">{program.name}</p>
              <p className="mt-1 text-muted-foreground">
                {program.width}×{program.height} · {program.versions.length} version{program.versions.length === 1 ? '' : 's'} · {deployments.length} device(s)
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function getVersionDistribution(deployments: ProgramDeploymentRecord[]): Array<{ version: number; count: number }> {
  const counts = new Map<number, number>();
  for (const d of deployments) {
    counts.set(d.version, (counts.get(d.version) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([version, count]) => ({ version, count }))
    .sort((a, b) => b.version - a.version);
}

function pickLatestDraft(program: ProgramRecord): ProgramRecord['drafts'][number] | null {
  if (!program.drafts.length) return null;
  return [...program.drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

function pickLatestPublished(program: ProgramRecord): ProgramRecord['versions'][number] | null {
  if (!program.versions.length) return null;
  return [...program.versions].sort((a, b) => b.version - a.version)[0] ?? null;
}

function hasUnpublishedChanges(program: ProgramRecord): boolean {
  const draft = pickLatestDraft(program);
  if (!draft) return false;
  const published = pickLatestPublished(program);
  if (!published) return true;
  return draft.updatedAt > published.createdAt;
}

function pickProgramPreviewDoc(program: ProgramRecord): VsnDocument | null {
  if (program.defaultVersion) {
    const def = program.versions.find((v) => v.version === program.defaultVersion)?.vsn ?? null;
    if (def) return def;
  }
  const latest = pickLatestPublished(program)?.vsn ?? null;
  if (latest) return latest;
  return pickLatestDraft(program)?.vsn ?? null;
}

function ProgramLayoutThumbnail({ doc }: { doc: VsnDocument | null }) {
  const info = doc?.Programs?.Program?.Information;
  const w = Number.parseInt(info?.Width ?? '0', 10) || 1920;
  const h = Number.parseInt(info?.Height ?? '0', 10) || 1080;

  const page = doc?.Programs?.Program?.Pages?.Page?.[0] ?? null;
  const regions = page?.Regions?.Region;
  const regionArr = Array.isArray(regions) ? regions : [];

  const maxW = 168;
  const maxH = 100;
  const scale = Math.min(maxW / Math.max(1, w), maxH / Math.max(1, h));
  const innerW = Math.max(1, Math.round(w * scale));
  const innerH = Math.max(1, Math.round(h * scale));
  const offsetX = Math.round((maxW - innerW) / 2);
  const offsetY = Math.round((maxH - innerH) / 2);

  return (
    <div className="relative overflow-hidden rounded-lg border bg-black/70" style={{ width: maxW, height: maxH }}>
      <div className="absolute" style={{ left: offsetX, top: offsetY, width: innerW, height: innerH }}>
        {regionArr.map((region, idx) => {
          const rect = (region as { Rect?: { X?: unknown; Y?: unknown; Width?: unknown; Height?: unknown } }).Rect;
          const x = Number.parseFloat(String(rect?.X ?? '0')) || 0;
          const y = Number.parseFloat(String(rect?.Y ?? '0')) || 0;
          const rw = Number.parseFloat(String(rect?.Width ?? '0')) || 1;
          const rh = Number.parseFloat(String(rect?.Height ?? '0')) || 1;
          return (
            <div
              key={`r-${idx}`}
              className="absolute rounded border border-white/40 bg-white/5"
              style={{
                left: x * scale,
                top: y * scale,
                width: Math.max(2, rw * scale),
                height: Math.max(2, rh * scale),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
