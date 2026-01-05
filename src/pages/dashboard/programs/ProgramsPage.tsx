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
  updateProgram as updateProgramApi,
} from '@/services/programApi';
import { getErrorMessage } from '@/services/authApi';
import { getDevices } from '@/services/deviceApi';
import type { ProgramListResp, ProgramTemplateResp, ProgramDetailResp } from '@/types/program';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { ProgramPublishDialog } from '@/features/programs/publishing/ProgramPublishDialog';
import { DeviceResolutionPicker } from '@/features/programs/editor/components/DeviceResolutionPicker';
import { parseResolution } from '@/lib/resolution';
import { useTranslation } from 'react-i18next';

type ResolutionPreset = { label: string; width: number; height: number };

const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: '1920x1080 (Horizontal)', width: 1920, height: 1080 },
  { label: '1080x1920 (Vertical)', width: 1080, height: 1920 },
  { label: '1280x720', width: 1280, height: 720 },
  { label: '720x1280', width: 720, height: 1280 },
];

export default function ProgramsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'all';
  const [query, setQuery] = useState('');
  
  const { formatRelative } = useTimeFormatter();

  const { data: programsRes, isLoading: isProgramsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
  });

  const { data: templatesRes } = useQuery({
    queryKey: ['programTemplates'],
    queryFn: getProgramTemplates,
  });

  const { data: devicesRes } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const programs = programsRes?.data || [];
  const templates = templatesRes?.data || [];
  const devices = devicesRes?.data || [];

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('New Program');
  const [createMode, setCreateMode] = useState<'blank' | 'template'>('blank');
  const [createTemplateId, setCreateTemplateId] = useState<string | null>(null);
  const [createPresetIndex, setCreatePresetIndex] = useState(0);
  const [createWidth, setCreateWidth] = useState(1920);
  const [createHeight, setCreateHeight] = useState(1080);
  const [createTargetDeviceId, setCreateTargetDeviceId] = useState<string | null>(null);
  const [isCustomResolution, setIsCustomResolution] = useState(false);

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
  const [publishLockVersionMode, setPublishLockVersionMode] = useState<'EXISTING' | null>(null);

  const filteredPrograms = useMemo(() => {
    return programs.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [programs, query]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
  }, [templates, query]);

  const createProgramMutation = useMutation({
    mutationFn: createProgramApi,
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameProgramApi(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setRenameOpen(false);
      toast.success(t('programs.toasts.renameSuccess'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProgramApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setDeleteOpen(false);
      toast.success(t('programs.toasts.deleteSuccess'));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

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
      toast.error(t('programs.toasts.loadDetailsFailed'));
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

  const handleCreate = async () => {
    const name = createName.trim() || t('programs.dialogs.create.untitled');
    if (createMode === 'template') {
       toast.info('Starting from template not yet implemented in API');
       return;
    }
    
    let width = createWidth;
    let height = createHeight;
    
    if (!isCustomResolution && createTargetDeviceId == null) {
      const preset = RESOLUTION_PRESETS[createPresetIndex] ?? RESOLUTION_PRESETS[0];
      width = preset.width;
      height = preset.height;
    }

    try {
      const res = await createProgramMutation.mutateAsync({ name, width, height });
      if (res.data) {
        if (createTargetDeviceId) {
          await updateProgramApi(res.data.id, { targetDeviceId: createTargetDeviceId });
        }
        queryClient.invalidateQueries({ queryKey: ['programs'] });
        navigate(`/dashboard/programs/${res.data.id}/edit`);
        setCreateOpen(false);
      }
    } catch (err) {
      // Error handled by mutation or toast
    }
  };

  if (isProgramsLoading && tab !== 'templates') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary/40" />
        <p className="text-xs font-bold text-muted-foreground/60">{t('programs.list.actions.loading')}</p>
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
              'rounded-lg px-4 py-1.5 text-xs font-bold transition-all',
              tab !== 'templates' ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.delete('tab'); return p; })}
          >
            {t('programs.list.tabs.all')}
          </button>
          <button
            type="button"
            className={cn(
              'rounded-lg px-4 py-1.5 text-xs font-bold transition-all',
              tab === 'templates' ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set('tab', 'templates'); return p; })}
          >
            {t('programs.list.tabs.templates')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-[280px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tab === 'templates' ? t('programs.list.search.templates') : t('programs.list.search.programs')}
              className="pl-9 h-9 text-sm bg-muted/20 border-border"
            />
          </div>
          <Button className="h-9 gap-2 font-bold px-4" onClick={() => setCreateOpen(true)}>
            <FilePlus2 className="h-4 w-4" />
            {t('programs.list.actions.create')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LayoutPanelTop className="h-5 w-5 text-muted-foreground" />
              {tab === 'templates' ? t('programs.list.tabs.templates') : t('programs.list.tabs.all')}
            </CardTitle>
            <CardDescription>
              {tab === 'templates'
                ? t('programs.list.counts.templates', { count: filteredTemplates.length }) + ' · ' + t('programs.list.counts.total', { total: templates.length })
                : t('programs.list.counts.programs', { count: filteredPrograms.length }) + ' · ' + t('programs.list.counts.total', { total: programs.length })}
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
                  <p className="text-sm font-medium">{t('programs.list.empty.templates.title')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('programs.list.empty.templates.description')}
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/dashboard/programs')}>
                  {t('programs.list.actions.browsePrograms')}
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
                <p className="text-xl font-semibold tracking-tight">{t('programs.list.empty.programs.title')}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('programs.list.empty.programs.description')}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="gap-2 px-8 shadow-lg shadow-primary/20" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  {t('programs.list.actions.create')}
                </Button>
                <Button size="lg" variant="outline" className="px-8" onClick={() => setSearchParams({ tab: 'templates' })}>
                  {t('programs.list.actions.exploreTemplates')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPrograms.map((program) => {
                const liveLabel = program.latestVersion ? t('programs.list.status.live', { version: program.latestVersion }) : t('programs.list.status.notPublished');
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
                            <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 px-1.5 h-4.5 text-[10px] font-bold">
                              {t('programs.list.status.unpublished')}
                            </Badge>
                          )}
                          
                          <Badge
                            className={cn(
                              "px-1.5 h-4.5 text-[10px] font-bold",
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
                            {t('programs.list.status.version')}: <span className="font-semibold text-foreground/70">{program.latestVersion ? `v${program.latestVersion}` : t('programs.list.status.draft')}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-muted-foreground/60 italic">
                            {t('programs.list.status.updated', { time: formatRelative(program.updatedAt) })}
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
                        <span className="hidden sm:inline">{t('programs.list.actions.edit')}</span>
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
                          {isPublishLoading && publishTarget?.id === program.id ? t('programs.list.actions.loading') : (program.latestVersion ? t('programs.list.actions.deploy') : t('programs.list.actions.publishV1'))}
                        </span>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" aria-label={t('common.actions.view')}>
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onSelect={() => navigate(`/dashboard/programs/${program.id}`)}>
                            <History className="mr-2 h-4 w-4" />
                            {t('programs.list.actions.viewStatus')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => { setRenameTarget(program); setRenameValue(program.name); setRenameOpen(true); }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('programs.list.actions.rename')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => { setDeleteTarget(program); setDeleteOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('programs.list.actions.delete')}
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

            <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setCreateName('New Program'); setCreatePresetIndex(0); setCreateMode('blank'); setCreateTargetDeviceId(null); setIsCustomResolution(false); } }}>
              <DialogContent className="max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ring-1 ring-foreground/5 text-foreground">
                <div className="p-8">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FilePlus2 className="h-6 w-6" />
                  </div>
                  <DialogHeader>
                    <DialogTitle>{t('programs.dialogs.create.title')}</DialogTitle>
                    <DialogDescription className="text-sm pt-2">{t('programs.dialogs.create.description')}</DialogDescription>
                  </DialogHeader>
                  <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground/60" htmlFor="program-name">{t('programs.dialogs.create.nameLabel')}</label>
                      <Input id="program-name" value={createName} onChange={(e) => setCreateName(e.target.value)} className="h-11 bg-muted/20 border-border/50 text-sm font-bold" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground/60">{t('programs.dialogs.create.sourceLabel')}</label>
                        <Select value={createMode} onValueChange={(v) => setCreateMode(v as any)}>
                          <SelectTrigger className="h-11 bg-muted/20 border-border/50 font-bold text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blank" className="font-bold">{t('programs.dialogs.create.blankCanvas')}</SelectItem>
                            <SelectItem value="template" disabled={templates.length === 0} className="font-bold">{t('programs.dialogs.create.fromTemplate')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
      
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-muted-foreground/60">{t('programs.dialogs.create.resolutionLabel')}</label>
                        <div className="flex items-center gap-4">
                          {!createTargetDeviceId && (
                            <button 
                              type="button" 
                              onClick={() => setIsCustomResolution(!isCustomResolution)}
                              className="text-[10px] font-bold text-primary hover:underline"
                            >
                              {isCustomResolution ? t('programs.dialogs.create.usePreset') : t('programs.dialogs.create.manualResolution')}
                            </button>
                          )}
                          <span className="text-[10px] text-muted-foreground/20">|</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              if (createTargetDeviceId) {
                                setCreateTargetDeviceId(null);
                              }
                            }}
                            className={cn("text-[10px] font-bold hover:underline", createTargetDeviceId ? "text-rose-500" : "text-primary")}
                          >
                            {createTargetDeviceId ? t('common.actions.cancel') : t('programs.dialogs.create.deviceResolution')}
                          </button>
                        </div>
                      </div>
      
                      {createTargetDeviceId ? (
                         <div className="space-y-3">
                            <DeviceResolutionPicker
                              devices={devices}
                              value={createTargetDeviceId}
                              onChange={(deviceId) => {
                                setCreateTargetDeviceId(deviceId);
                                if (deviceId) {
                                  const device = devices.find((d) => String(d.deviceId || d.id) === deviceId);
                                  if (device) {
                                    const res = parseResolution(device.resolution);
                                    setCreateWidth(res.width);
                                    setCreateHeight(res.height);
                                  }
                                }
                              }}
                            />
                            <p className="text-[10px] font-medium text-muted-foreground italic px-1">
                              {t('programEditor.panels.inspector.labels.canvasResolution')}: <span className="text-primary font-bold">{createWidth} &times; {createHeight}</span>
                            </p>
                         </div>
                      ) : isCustomResolution ? (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase pl-1">{t('programEditor.panels.inspector.labels.width')}</span>
                            <Input 
                              type="number" 
                              value={createWidth} 
                              onChange={(e) => setCreateWidth(Number(e.target.value))} 
                              className="h-11 bg-muted/20 border-border/50 font-mono font-bold" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase pl-1">{t('programEditor.panels.inspector.labels.height')}</span>
                            <Input 
                              type="number" 
                              value={createHeight} 
                              onChange={(e) => setCreateHeight(Number(e.target.value))} 
                              className="h-11 bg-muted/20 border-border/50 font-mono font-bold" 
                            />
                          </div>
                        </div>
                      ) : (
                        <Select value={String(createPresetIndex)} onValueChange={(v) => {
                          const idx = Number(v);
                          setCreatePresetIndex(idx);
                          setCreateWidth(RESOLUTION_PRESETS[idx].width);
                          setCreateHeight(RESOLUTION_PRESETS[idx].height);
                        }}>
                          <SelectTrigger className="h-11 bg-muted/20 border-border/50 font-bold text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{RESOLUTION_PRESETS.map((p, i) => (<SelectItem key={p.label} value={String(i)} className="font-bold">{p.label}</SelectItem>))}</SelectContent>
                        </Select>
                      )}
                    </div>
      
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="font-bold text-xs px-8">{t('common.actions.cancel')}</Button>
                      <Button type="submit" disabled={createProgramMutation.isPending} className="font-bold text-xs px-10 h-11 shadow-xl">
                        {createProgramMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} {t('common.actions.confirm')}
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
              <DialogTitle>{t('programs.dialogs.rename.title')}</DialogTitle>
              <DialogDescription className="text-sm pt-2">{t('programs.dialogs.rename.description')}</DialogDescription>
            </DialogHeader>
            <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handleProgramRename(); }}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground/60" htmlFor="rename-name">{t('programs.dialogs.rename.label')}</label>
                <Input 
                  id="rename-name" 
                  value={renameValue} 
                  onChange={(e) => setRenameValue(e.target.value)} 
                  className="h-11 bg-muted/20 border-border/50 text-sm font-bold"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)} className="font-bold text-xs px-8">{t('common.actions.cancel')}</Button>
                <Button type="submit" disabled={renameMutation.isPending} className="font-bold text-xs px-10 h-11 shadow-xl">
                  {renameMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} {t('common.actions.save')}
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
              <AlertDialogTitle className="text-xl font-bold tracking-tight">{t('programs.dialogs.delete.title')}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm pt-2 space-y-4">
                <span className="block">{t('programs.dialogs.delete.description')}</span>
                <span className="block rounded-xl bg-destructive/5 border border-destructive/10 p-4 font-bold text-destructive text-base truncate">
                  {deleteTarget?.name}
                </span>
                <span className="block">{t('programs.dialogs.delete.descriptionNote')}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="font-bold text-xs px-8">{t('common.actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleProgramDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs uppercase tracking-widest px-10 h-10 shadow-xl shadow-destructive/20"
              >
                {deleteMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} {t('common.actions.delete')}
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
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{template.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{template.width}×{template.height}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onUse}>{t('programs.list.actions.useTemplate')}</Button>
    </div>
  );
}
