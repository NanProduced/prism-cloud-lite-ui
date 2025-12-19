import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, FilePlus2, History, LayoutPanelTop, MoreHorizontal, Pencil, Plus, Search, Send, Sparkles, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatBytes } from '@better-upload/client/helpers';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { mockMediaLibraryNodes } from '@/lib/mock/media-library';
import { cn } from '@/lib/utils';

import { listDeployments, undeployProgramEverywhere, type ProgramDeploymentRecord } from '@/features/programs/storage/deploymentsDb';
import { createProgram, createProgramFromSeed, deleteProgram, listPrograms, renameProgram, type ProgramRecord } from '@/features/programs/storage/programsDb';
import { addProgramAuditLog } from '@/features/programs/storage/auditLogsDb';
import { createProgramTemplate, deleteProgramTemplate, listProgramTemplates, renameProgramTemplate, type ProgramTemplateRecord } from '@/features/programs/storage/templatesDb';
import { buildMaterialSizeIndex, sumMaterialBytesForDoc } from '@/features/programs/vsn/materials';
import { summarizeVsn } from '@/features/programs/vsn/summary';
import type { VsnDocument } from '@/features/programs/vsn/types';
import { ProgramPublishDialog } from '@/features/programs/publishing/ProgramPublishDialog';

type ResolutionPreset = { label: string; width: number; height: number };

const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: '1920 × 1080 (Landscape)', width: 1920, height: 1080 },
  { label: '1080 × 1920 (Portrait)', width: 1080, height: 1920 },
  { label: '3840 × 2160 (4K)', width: 3840, height: 2160 },
  { label: '1366 × 768', width: 1366, height: 768 },
];

export default function ProgramsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [programs, setPrograms] = useState<ProgramRecord[]>(() => listPrograms());
  const [templates, setTemplates] = useState<ProgramTemplateRecord[]>(() => listProgramTemplates());
  const [query, setQuery] = useState('');
  const [deployments, setDeployments] = useState<ProgramDeploymentRecord[]>(() => listDeployments());

  const materialSizeIndex = useMemo(() => buildMaterialSizeIndex(mockMediaLibraryNodes), []);
  const deploymentsByProgramId = useMemo(() => {
    const map = new Map<string, ProgramDeploymentRecord[]>();
    for (const d of deployments) {
      const existing = map.get(d.programId);
      if (existing) existing.push(d);
      else map.set(d.programId, [d]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => b.deployedAt.localeCompare(a.deployedAt));
    }
    return map;
  }, [deployments]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ProgramRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProgramRecord | null>(null);

  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const [saveAsTemplateTarget, setSaveAsTemplateTarget] = useState<ProgramRecord | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<ProgramRecord | null>(null);

  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [unpublishTarget, setUnpublishTarget] = useState<ProgramRecord | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('New Program');
  const [createPresetIndex, setCreatePresetIndex] = useState(0);
  const [createMode, setCreateMode] = useState<'blank' | 'template'>('blank');
  const [createTemplateId, setCreateTemplateId] = useState<string>('');

  const tab = (searchParams.get('tab') ?? 'programs').toLowerCase();

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? programs.filter((p) => p.name.toLowerCase().includes(q)) : [...programs];
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [programs, query]);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? templates.filter((t) => t.name.toLowerCase().includes(q)) : [...templates];
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [query, templates]);

  const openPublishDialog = (program: ProgramRecord) => {
    setPublishTarget(program);
    setPublishOpen(true);
  };

  const requestUnpublish = (program: ProgramRecord) => {
    setUnpublishTarget(program);
    setUnpublishOpen(true);
  };

  const handleConfirmUnpublish = () => {
    if (!unpublishTarget) return;
    const deployed = deploymentsByProgramId.get(unpublishTarget.id) ?? [];
    undeployProgramEverywhere(unpublishTarget.id);
    setDeployments(listDeployments());
    toast.success(`Unpublished from ${deployed.length} device${deployed.length === 1 ? '' : 's'}`);
    setUnpublishOpen(false);
    setUnpublishTarget(null);
  };

  const handleProgramRename = () => {
    if (!renameTarget) return;
    const next = renameProgram(renameTarget.id, renameValue.trim() || renameTarget.name);
    if (!next) {
      toast.error('Rename failed');
      return;
    }
    setPrograms(listPrograms());
    toast.success('Program renamed');
    setRenameOpen(false);
    setRenameTarget(null);
  };

  const handleProgramDelete = () => {
    if (!deleteTarget) return;
    undeployProgramEverywhere(deleteTarget.id);
    setDeployments(listDeployments());
    const ok = deleteProgram(deleteTarget.id);
    if (!ok) {
      toast.error('Delete failed');
      return;
    }
    setPrograms(listPrograms());
    toast.success('Program deleted');
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleSaveAsTemplate = () => {
    if (!saveAsTemplateTarget) return;
    const vsn = pickProgramPreviewDoc(saveAsTemplateTarget);
    if (!vsn) {
      toast.error('No content to save as template');
      return;
    }
    createProgramTemplate({
      name: templateName.trim() || saveAsTemplateTarget.name,
      description: templateDesc.trim(),
      sourceVsn: vsn,
    });
    setTemplates(listProgramTemplates());
    toast.success('Template created');
    setSaveAsTemplateOpen(false);
    setSaveAsTemplateTarget(null);
  };

  const handleCreate = () => {
    const name = createName.trim() || 'Untitled Program';

    if (createMode === 'template') {
      const tpl = templates.find((t) => t.id === createTemplateId) ?? null;
      if (!tpl) return;
      const record = createProgramFromSeed({ name, width: tpl.width, height: tpl.height, vsn: tpl.vsn });
      setPrograms(listPrograms());
      setCreateOpen(false);
      navigate(`/dashboard/programs/${record.id}/edit?base=blank`);
      return;
    }

    const preset = RESOLUTION_PRESETS[createPresetIndex] ?? RESOLUTION_PRESETS[0];
    const p = createProgram({ name, width: preset.width, height: preset.height });
    addProgramAuditLog({
      programId: p.id,
      action: 'CREATE',
      userId: 'admin',
      userName: 'Administrator',
      details: { description: `Resolution: ${preset.width}x${preset.height}` }
    });
    setPrograms(listPrograms());
    setCreateOpen(false);
    navigate(`/dashboard/programs/${p.id}/edit`);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border shadow-inner w-fit">
          <button
            type="button"
            className={cn(
              'rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all',
              tab !== 'templates' ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.delete('tab'); return p; })}
          >
            All programs
          </button>
          <button
            type="button"
            className={cn(
              'rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all',
              tab === 'templates' ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set('tab', 'templates'); return p; })}
          >
            Templates
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-[280px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'templates' ? 'Search templates…' : 'Search programs…'}
              className="pl-9 h-9 text-sm bg-muted/20 border-border"
            />
          </div>
          <Button className="h-9 gap-2 font-bold px-4" onClick={() => setCreateOpen(true)}>
            <FilePlus2 className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LayoutPanelTop className="h-5 w-5 text-muted-foreground" />
              {tab === 'templates' ? 'Templates' : 'All Programs'}
            </CardTitle>
            <CardDescription>
              {tab === 'templates'
                ? `${filteredTemplates.length} template${filteredTemplates.length === 1 ? '' : 's'} · ${templates.length} total`
                : `${filteredPrograms.length} program${filteredPrograms.length === 1 ? '' : 's'} · ${programs.length} total`}
            </CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {tab === 'templates' ? (
            filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                <div className="rounded-full bg-muted p-3">
                  <LayoutPanelTop className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No templates yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a template from any program, then reuse it to start new programs faster.
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/dashboard/programs')}>
                  Browse programs
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTemplates.map((tpl) => (
                  <TemplateRow
                    key={tpl.id}
                    template={tpl}
                    onUse={() => {
                      setCreateMode('template');
                      setCreateTemplateId(tpl.id);
                      setCreateName(`${tpl.name} Program`);
                      setCreateOpen(true);
                    }}
                    onRename={(name) => {
                      const updated = renameProgramTemplate(tpl.id, name);
                      if (!updated) return;
                      setTemplates(listProgramTemplates());
                    }}
                    onDelete={() => {
                      const ok = deleteProgramTemplate(tpl.id);
                      if (!ok) return;
                      setTemplates(listProgramTemplates());
                    }}
                  />
                ))}
              </div>
            )
          ) : filteredPrograms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-20 text-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />
                <div className="relative rounded-full bg-muted p-5 ring-8 ring-background">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="max-w-[420px] space-y-2">
                <p className="text-xl font-semibold tracking-tight">Create your first program</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Programs are where you design your content. Combine media and text in a custom canvas, then publish to your devices in minutes.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/20" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create program
                </Button>
                <Button size="lg" variant="outline" className="px-8" onClick={() => setSearchParams({ tab: 'templates' })}>
                  Explore templates
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step 1</p>
                  <p className="mt-1 text-xs font-medium">Design Canvas</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step 2</p>
                  <p className="mt-1 text-xs font-medium">Add Media</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step 3</p>
                  <p className="mt-1 text-xs font-medium">Publish Live</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPrograms.map((program) => {
                const unpublishedChanges = hasUnpublishedChanges(program);
                const previewDoc = pickProgramPreviewDoc(program);
                const summary = summarizeVsn(previewDoc);
                const materialBytes = sumMaterialBytesForDoc(previewDoc, materialSizeIndex);
                const latestPublished = pickLatestPublished(program);

                const programDeployments = deploymentsByProgramId.get(program.id) ?? [];
                const deploymentVersions = getVersionDistribution(programDeployments);
                const isMixed = deploymentVersions.length > 1;
                const liveLabel = programDeployments.length === 0
                  ? 'Not published'
                  : isMixed
                    ? `Live (mixed) · ${programDeployments.length}`
                    : `Live v${deploymentVersions[0]?.version ?? ''} · ${programDeployments.length}`;

                return (
                  <div
                    key={program.id}
                    className="group flex flex-col gap-4 px-6 py-5 transition-all hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between border-b last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-5">
                      <div className="relative shrink-0">
                        <ProgramListThumbnail doc={previewDoc} />
                        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-foreground/5 shadow-sm" />
                      </div>
                      
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link 
                            to={`/dashboard/programs/${program.id}`}
                            className="truncate text-[15px] font-bold tracking-tight hover:text-primary transition-colors leading-none"
                          >
                            {program.name}
                          </Link>
                          {unpublishedChanges && (
                            <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 px-1.5 h-4.5 text-[10px] font-bold uppercase">
                              Unpublished
                            </Badge>
                          )}
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  className={cn(
                                    "px-1.5 h-4.5 text-[10px] font-bold uppercase cursor-help",
                                    programDeployments.length === 0
                                      ? 'bg-muted text-muted-foreground hover:bg-muted'
                                      : isMixed
                                        ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/10'
                                        : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10',
                                  )}
                                >
                                  {liveLabel}
                                </Badge>
                              </TooltipTrigger>
                              {programDeployments.length > 0 && (
                                <TooltipContent className="p-3 rounded-xl shadow-xl bg-background border ring-1 ring-foreground/5">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-wider">Distribution</p>
                                  <div className="space-y-1.5">
                                    {deploymentVersions.map(v => (
                                      <div key={v.version} className="flex items-center justify-between gap-6">
                                        <Badge variant="outline" className="h-4 px-1 text-[9px] font-black">v{v.version}</Badge>
                                        <span className="text-[10px] font-bold">{v.count} device{v.count === 1 ? '' : 's'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-foreground/70">{program.width}×{program.height}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            Version: <span className="font-semibold text-foreground/70">{latestPublished ? `v${latestPublished.version}` : 'Draft'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            Duration: <span className="font-semibold text-foreground/70">{formatDurationMs(summary.totalDurationMs)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            Size: <span className="font-semibold text-foreground/70">{formatBytes(materialBytes)}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-muted-foreground/60 italic">
                            Updated {formatRelativeTime(program.updatedAt)}
                          </p>
                          {programDeployments.length > 0 && (
                            <>
                              <Separator orientation="vertical" className="h-2.5" />
                              <p className="text-[11px] font-medium text-emerald-600">
                                {isMixed ? `Mixed: ${formatVersionDistribution(deploymentVersions)}` : 'Fully deployed'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors sm:h-9 sm:w-auto sm:px-3 sm:gap-2"
                        onClick={() => navigate(`/dashboard/programs/${program.id}/edit`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors sm:h-9 sm:w-auto sm:px-3 sm:gap-2"
                        onClick={() => openPublishDialog(program)}
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Publish</span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" aria-label="Program actions">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onSelect={() => navigate(`/dashboard/programs/${program.id}`)}
                          >
                            <History className="mr-2 h-4 w-4" />
                            View Status & History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => {
                              setRenameTarget(program);
                              setRenameValue(program.name);
                              setRenameOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setTemplateName(`${program.name} Template`);
                              setTemplateDesc('');
                              setSaveAsTemplateTarget(program);
                              setSaveAsTemplateOpen(true);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Save as template
                          </DropdownMenuItem>
                          <Separator className="my-1" />
                          {programDeployments.length > 0 && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() => requestUnpublish(program)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Unpublish all
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => {
                              setDeleteTarget(program);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete program
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreateName('New Program');
            setCreatePresetIndex(0);
            setCreateMode('blank');
            setCreateTemplateId('');
          }
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Create Program</DialogTitle>
            <DialogDescription>
              Choose a canvas size and start editing. You can publish up to 10 versions in Lite.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (createMode === 'template' && !createTemplateId) return;
              handleCreate();
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="program-name">
                Name
              </label>
              <Input
                id="program-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Lobby Screen"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="program-create-mode">
                Start from
              </label>
              <Select
                value={createMode}
                onValueChange={(v) => setCreateMode(v as typeof createMode)}
              >
                <SelectTrigger id="program-create-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Blank program</SelectItem>
                  <SelectItem value="template" disabled={templates.length === 0}>Template</SelectItem>
                </SelectContent>
              </Select>
              {createMode === 'template' && templates.length === 0 && (
                <p className="text-xs text-muted-foreground">No templates yet. Create one from a program details page.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="program-resolution">
                {createMode === 'template' ? 'Template' : 'Resolution'}
              </label>
              {createMode === 'template' ? (
                <Select
                  value={createTemplateId}
                  onValueChange={(v) => setCreateTemplateId(v)}
                >
                  <SelectTrigger id="program-resolution">
                    <SelectValue placeholder="Select a template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name} · {tpl.width}×{tpl.height}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={String(createPresetIndex)}
                  onValueChange={(v) => setCreatePresetIndex(Number(v))}
                >
                  <SelectTrigger id="program-resolution">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_PRESETS.map((preset, index) => (
                      <SelectItem key={preset.label} value={String(index)}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMode === 'template' && !createTemplateId}>
                Create &amp; open editor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={saveAsTemplateOpen}
        onOpenChange={(open) => {
          setSaveAsTemplateOpen(open);
          if (!open) {
            setSaveAsTemplateTarget(null);
            setTemplateName('');
            setTemplateDesc('');
          }
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Create a reusable template from this program's layout and content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template name</label>
              <Input 
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)} 
                placeholder="e.g. Promo Layout" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input 
                value={templateDesc} 
                onChange={(e) => setTemplateDesc(e.target.value)} 
                placeholder="e.g. Standard 16:9 promo template" 
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setSaveAsTemplateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim()}>
                Create template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {publishTarget ? (
        <ProgramPublishDialog
          open={publishOpen}
          onOpenChange={(next) => {
            setPublishOpen(next);
            if (!next) setPublishTarget(null);
          }}
          program={publishTarget}
          deployments={deploymentsByProgramId.get(publishTarget.id) ?? []}
          onAfterPublish={() => {
            setPrograms(listPrograms());
            setDeployments(listDeployments());
          }}
        />
      ) : null}

      <Dialog
        open={unpublishOpen}
        onOpenChange={(open) => {
          setUnpublishOpen(open);
          if (!open) setUnpublishTarget(null);
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Unpublish program</DialogTitle>
            <DialogDescription>Remove this program from all devices currently running it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="font-medium">{unpublishTarget?.name ?? ''}</p>
              <p className="mt-1 text-muted-foreground">
                {unpublishTarget ? (deploymentsByProgramId.get(unpublishTarget.id)?.length ?? 0) : 0} device(s) will stop playing this program.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setUnpublishOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmUnpublish} disabled={!unpublishTarget}>
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
          if (!open) setRenameTarget(null);
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
              <Button onClick={handleProgramRename} disabled={!renameTarget}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Delete program</DialogTitle>
            <DialogDescription>This removes unpublished changes and version history from your account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="font-medium">{deleteTarget?.name ?? ''}</p>
              {deleteTarget ? (
                <p className="mt-1 text-muted-foreground">
                  {deleteTarget.width}×{deleteTarget.height} · {deleteTarget.versions.length} versions
                  {hasUnpublishedChanges(deleteTarget) ? ' · Unpublished changes' : ''}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleProgramDelete} disabled={!deleteTarget}>
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

function formatVersionDistribution(versions: Array<{ version: number; count: number }>): string {
  const parts = versions.slice(0, 3).map((v) => `v${v.version}×${v.count}`);
  return versions.length > 3 ? `${parts.join(', ')}, …` : parts.join(', ');
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

function ProgramListThumbnail({ doc }: { doc: VsnDocument | null }) {
  const info = doc?.Programs?.Program?.Information;
  const w = Number.parseInt(info?.Width ?? '0', 10) || 1920;
  const h = Number.parseInt(info?.Height ?? '0', 10) || 1080;

  const page = doc?.Programs?.Program?.Pages?.Page?.[0] ?? null;
  const regions = page?.Regions?.Region;
  const regionArr = Array.isArray(regions) ? regions : [];

  const maxW = 120;
  const maxH = 72;
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

function TemplateRow({
  template,
  onUse,
  onRename,
  onDelete,
}: {
  template: ProgramTemplateRecord;
  onUse: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(template.name);
  const summary = useMemo(() => summarizeVsn(template.vsn), [template.vsn]);

  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{template.name}</p>
        {template.description ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {template.description}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {template.width}×{template.height} · {summary.regionCount} window{summary.regionCount === 1 ? '' : 's'} · {summary.pageCount} page
          {summary.pageCount === 1 ? '' : 's'} · Updated {formatRelativeTime(template.updatedAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onUse}>
          Use
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setNameDraft(template.name); setRenameOpen(true); }}>
          Rename
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Rename template</DialogTitle>
            <DialogDescription>Update the template name shown in the library.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onRename(nameDraft);
                  setRenameOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}