import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Copy, FilePlus2, History, LayoutPanelTop, MoreHorizontal, Pencil, Plus, Search, Send, Sparkles, Trash2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/store/notificationStore';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';

import {
  getPrograms,
  getProgramDetails,
  getProgramTemplates,
  createProgram as createProgramApi,
  renameProgram as renameProgramApi,
  deleteProgram as deleteProgramApi,
} from '@/services/programApi';
import type { ProgramListResp, ProgramTemplateResp, ProgramDetailResp } from '@/types/program';
import { getErrorMessage } from '@/services/authApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
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
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const { formatRelative } = useTimeFormatter();

  // --- Queries ---
  const { data: programsData, isLoading: isProgramsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
    staleTime: 2 * 60 * 1000, // 2 minutes for program list
    gcTime: 10 * 60 * 1000,
  });

  const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ['programs', 'templates'],
    queryFn: getProgramTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes for templates
    gcTime: 30 * 60 * 1000,
  });

  const programs = programsData?.data || [];
  const templates = templatesData?.data || [];

  // --- Mutations ---
  const createProgramMutation = useMutation({
    mutationFn: createProgramApi,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setCreateOpen(false);
      if (res.data) {
        navigate(`/dashboard/programs/${res.data.id}/edit`);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameProgramApi(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setRenameOpen(false);
      toast.success('Program renamed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProgramApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setDeleteOpen(false);
      toast.success('Program deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ProgramListResp | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProgramListResp | null>(null);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState<ProgramDetailResp | null>(null);
  const [isPublishLoading, setIsPublishLoading] = useState(false);
  const [publishInitialVersionMode, setPublishInitialVersionMode] = useState<'CREATE' | 'EXISTING' | null>(null);
  const [publishInitialExistingVersion, setPublishInitialExistingVersion] = useState<number | null>(null);
  const [publishLockVersionMode, setPublishLockVersionMode] = useState<'CREATE' | 'EXISTING' | null>(null);

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
    return list.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [query, templates]);

  const openDeployDialog = async (program: ProgramListResp) => {
    try {
      setIsPublishLoading(true);
      const res = await getProgramDetails(program.id);
      if (res.data) {
        setPublishTarget(res.data);
        const live = program.latestVersion ?? res.data.versions?.[0]?.version ?? null;
        setPublishInitialVersionMode(live ? 'EXISTING' : 'CREATE');
        setPublishInitialExistingVersion(live);
        setPublishLockVersionMode(live ? 'EXISTING' : null);
        setPublishOpen(true);
      }
    } catch (err) {
      toast.error('Failed to load program details');
    } finally {
      setIsPublishLoading(false);
    }
  };

  const handleProgramRename = () => {
    if (!renameTarget) return;
    renameMutation.mutate({ id: renameTarget.id, name: renameValue.trim() });
  };

  const handleProgramDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  const handleCreate = () => {
    const name = createName.trim() || 'Untitled Program';
    if (createMode === 'template') {
       toast.info('Starting from template not yet implemented in API');
       return;
    }
    const preset = RESOLUTION_PRESETS[createPresetIndex] ?? RESOLUTION_PRESETS[0];
    createProgramMutation.mutate({ name, width: preset.width, height: preset.height });
  };

  if (isProgramsLoading && tab !== 'templates') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary/40" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Loading Workspace...</p>
      </div>
    );
  }

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
            </div>
          ) : (
            <div className="divide-y">
              {filteredPrograms.map((program) => {
                const liveLabel = program.latestVersion ? `Live v${program.latestVersion}` : 'Not published';
                return (
                  <div
                    key={program.id}
                    className="group flex flex-col gap-4 px-6 py-5 transition-all hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between border-b last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-5">
                      <div className="relative shrink-0">
                        {program.coverUrl ? (
                          <img src={program.coverUrl} className="h-[72px] w-[120px] rounded-lg object-cover border" alt="" />
                        ) : (
                          <div className="h-[72px] w-[120px] rounded-lg bg-black flex items-center justify-center border">
                             <LayoutPanelTop className="h-6 w-6 text-white/20" />
                          </div>
                        )}
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
                          {program.unpublishedChanges && (
                            <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 px-1.5 h-4.5 text-[10px] font-bold uppercase">
                              Unpublished
                            </Badge>
                          )}
                          
                          <Badge
                            className={cn(
                              "px-1.5 h-4.5 text-[10px] font-bold uppercase",
                              !program.latestVersion
                                ? 'bg-muted text-muted-foreground hover:bg-muted'
                                : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10',
                            )}
                          >
                            {liveLabel}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold text-foreground/70">{program.width}×{program.height}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            Version: <span className="font-semibold text-foreground/70">{program.latestVersion ? `v${program.latestVersion}` : 'Draft'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-muted-foreground/60 italic">
                            Updated {formatRelative(program.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:ml-4">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors sm:h-9 sm:w-auto sm:px-3 sm:gap-2"
                        onClick={() => {
                          const base = (program.defaultVersion ?? program.latestVersion ?? 0) || 0;
                          navigate(`/dashboard/programs/${program.id}/edit${base > 0 ? `?base=${base}` : ''}`);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors sm:h-9 sm:w-auto sm:px-3 sm:gap-2"
                        onClick={() => {
                          if (!program.latestVersion) {
                            navigate(`/dashboard/programs/${program.id}/edit`);
                            return;
                          }
                          openDeployDialog(program);
                        }}
                        disabled={isPublishLoading}
                      >
                        {isPublishLoading && publishTarget?.id === program.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">
                          {isPublishLoading && publishTarget?.id === program.id ? 'Loading...' : (program.latestVersion ? 'Deploy' : 'Publish v1')}
                        </span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" aria-label="Program actions">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onSelect={() => navigate(`/dashboard/programs/${program.id}`)}>
                            <History className="mr-2 h-4 w-4" />
                            View Status & History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => { setRenameTarget(program); setRenameValue(program.name); setRenameOpen(true); }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => { setDeleteTarget(program); setDeleteOpen(true); }}>
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

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setCreateName('New Program'); setCreatePresetIndex(0); setCreateMode('blank'); } }}>
        <DialogContent className="max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ring-1 ring-foreground/5 text-foreground">
          <div className="p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FilePlus2 className="h-6 w-6" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Create Program</DialogTitle>
              <DialogDescription className="text-sm pt-2">Initialize a new program workspace.</DialogDescription>
            </DialogHeader>
            <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60" htmlFor="program-name">Program Name</label>
                <Input id="program-name" value={createName} onChange={(e) => setCreateName(e.target.value)} className="h-11 bg-muted/20 border-border/50 text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Source</label>
                  <Select value={createMode} onValueChange={(v) => setCreateMode(v as any)}>
                    <SelectTrigger className="h-11 bg-muted/20 border-border/50 font-bold text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blank" className="font-bold">Blank Canvas</SelectItem>
                      <SelectItem value="template" disabled={templates.length === 0} className="font-bold">From Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Resolution</label>
                  <Select value={String(createPresetIndex)} onValueChange={(v) => setCreatePresetIndex(Number(v))}>
                    <SelectTrigger className="h-11 bg-muted/20 border-border/50 font-bold text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{RESOLUTION_PRESETS.map((p, i) => (<SelectItem key={p.label} value={String(i)} className="font-bold">{p.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="font-bold text-xs uppercase tracking-widest px-8">Cancel</Button>
                <Button type="submit" disabled={createProgramMutation.isPending} className="font-bold text-xs uppercase tracking-widest px-10 h-11 shadow-xl">
                  {createProgramMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Create
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={(open) => { setRenameOpen(open); if (!open) setRenameTarget(null); }}>
        <DialogContent className="max-w-[420px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ring-1 ring-foreground/5 text-foreground">
          <div className="p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Pencil className="h-6 w-6" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Rename Program</DialogTitle>
              <DialogDescription className="text-sm pt-2">Enter a new name for your program.</DialogDescription>
            </DialogHeader>
            <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handleProgramRename(); }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60" htmlFor="rename-name">Program Name</label>
                <Input 
                  id="rename-name" 
                  value={renameValue} 
                  onChange={(e) => setRenameValue(e.target.value)} 
                  className="h-11 bg-muted/20 border-border/50 text-sm font-bold"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)} className="font-bold text-xs uppercase tracking-widest px-8">Cancel</Button>
                <Button type="submit" disabled={renameMutation.isPending} className="font-bold text-xs uppercase tracking-widest px-10 h-11 shadow-xl">
                  {renameMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Save
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[420px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ring-1 ring-foreground/5">
          <div className="p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold tracking-tight">Delete Program</AlertDialogTitle>
              <AlertDialogDescription className="text-sm pt-2 space-y-4">
                <span className="block">This action cannot be undone. You are about to permanently delete:</span>
                <span className="block rounded-xl bg-destructive/5 border border-destructive/10 p-4 font-bold text-destructive text-base truncate">
                  {deleteTarget?.name}
                </span>
                <span className="block">This will delete the program and all its versions from our system.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="font-bold text-xs uppercase tracking-widest px-8">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleProgramDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs uppercase tracking-widest px-10 h-10 shadow-xl shadow-destructive/20"
              >
                {deleteMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {publishTarget && (
        <ProgramPublishDialog
          open={publishOpen}
          onOpenChange={(next) => {
            setPublishOpen(next);
            if (!next) {
              setPublishTarget(null);
              setPublishInitialVersionMode(null);
              setPublishInitialExistingVersion(null);
              setPublishLockVersionMode(null);
            }
          }}
          program={publishTarget}
          deployments={publishTarget.deployments || []}
          initialVersionMode={publishInitialVersionMode}
          initialExistingVersion={publishInitialExistingVersion}
          lockVersionMode={publishLockVersionMode}
          onAfterPublish={() => queryClient.invalidateQueries({ queryKey: ['programs'] })}
        />
      )}
    </div>
  );
}

function TemplateRow({ template, onUse }: { template: ProgramTemplateResp; onUse: () => void; }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{template.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{template.width}×{template.height}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onUse}>Use</Button>
    </div>
  );
}
