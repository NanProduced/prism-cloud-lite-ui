import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBlocker } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, Code2, Copy, Layers, ListChecks, Play, Redo2, Save, Send, SlidersHorizontal, Trash2, TriangleAlert, Undo2, RefreshCw } from 'lucide-react';
import { toast } from '@/store/notificationStore';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  getProgramDetails, 
  ensureDraft as ensureDraftApi, 
  saveProgramDraft, 
  renameProgram as renameProgramApi,
  deleteProgram as deleteProgramApi,
  deleteProgramDraft as deleteProgramDraftApi
} from '@/services/programApi';
import type { ProgramDetailResp, ProgramDraftResp } from '@/types/program';
import { getErrorMessage } from '@/services/authApi';
import { ProgramPublishDialog } from '@/features/programs/publishing/ProgramPublishDialog';
import { getProgramDraftSavePolicy } from '@/features/programs/storage/draftPolicyDb';

import { resolveMaterialId } from '@/features/programs/storage/materialId';
import { createBlankVsnDocument, createItemFromMedia, createScrollTextItem, createTextItem } from '@/features/programs/vsn/defaults';
import type { VsnDocument } from '@/features/programs/vsn/types';
import { validateVsnDocument } from '@/features/programs/vsn/validator';
import type { MediaAssetNode } from '@/types/media-library';

import { type EditorSelection, type EditorMaterial } from '@/features/programs/editor/types';
import {
  getPages,
  getRegions,
  addPage,
  deletePage,
  addRegion,
  duplicateRegion,
  deleteRegion,
  addItem,
  deleteItem,
  moveItemToRegion,
  patchPage,
  patchRegion,
  patchRegionRect,
  patchItem,
  resizeProgramCanvas,
  normalizeVsnForEditor,
} from '@/features/programs/editor/vsnOps';
import { clampInt, getRegionMode, canRegionAcceptItemType } from '@/features/programs/editor/utils';
import { getDevices } from '@/services/deviceApi';
import { getMediaAssets } from '@/services/mediaApi';

import { EditorLeftPanel } from '@/features/programs/editor/components/EditorLeftPanel';
import { StagePreview } from '@/features/programs/editor/components/StagePreview';
import { AdvancedTimeline } from '@/features/programs/editor/components/AdvancedTimeline';
import { InspectorPanel } from '@/features/programs/editor/components/InspectorPanel';
import { ProblemsPanel } from '@/features/programs/editor/components/ProblemsPanel';
import { VsnJsonPanel } from '@/features/programs/editor/components/VsnJsonPanel';
import { ProgramPreviewDialog } from '@/features/programs/editor/components/ProgramPreviewDialog';

type DraftPromptIntent = { type: 'switch'; nextBaseVersion: number | null } | { type: 'navigate' };

export default function ProgramEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { programId } = useParams<{ programId: string }>();
  const isMobile = useIsMobile();

  const searchParams = new URLSearchParams(location.search);
  const baseFromUrl = searchParams.get('base');
  const initialBaseVersion = baseFromUrl === 'blank' ? 0 : (Number.parseInt(baseFromUrl || '', 10) || 0);

  // --- State ---
  const [baseVersion, setBaseVersion] = useState<number | null>(initialBaseVersion || null);
  const [draft, setDraft] = useState<ProgramDraftResp | null>(null);
  const [vsn, setVsn] = useState<VsnDocument | null>(null);
  const [targetDeviceId, setTargetDeviceId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [past, setPast] = useState<VsnDocument[]>([]);
  const [future, setFuture] = useState<VsnDocument[]>([]);
  const [dirty, setDirty] = useState(false);
  const vsnRevisionRef = useRef(0);
  const autosaveTimerRef = useRef<number | null>(null);
  const [autosavePending, setAutosavePending] = useState(false);
  const [selection, setSelection] = useState<EditorSelection>({ pageIndex: 0, regionIndex: null, itemIndex: null });
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [rightTab, setRightTab] = useState<'inspector' | 'problems' | 'json'>('inspector');

  // --- Media Search ---
  const [mediaQuery, setMediaQuery] = useState('');
  const [debouncedMediaQuery, setDebouncedMediaQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMediaQuery(mediaQuery), 500);
    return () => clearTimeout(timer);
  }, [mediaQuery]);

  // --- Queries ---
  const programQuery = useQuery({
    queryKey: ['programs', programId],
    queryFn: () => getProgramDetails(programId!),
    enabled: !!programId,
  });

  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const mediaNodesQuery = useQuery({
    queryKey: ['media-library', 'assets', debouncedMediaQuery],
    queryFn: () => getMediaAssets({ q: debouncedMediaQuery || undefined, kinds: 'image,video', limit: 100 }),
  });

  const program = programQuery.data?.data;
  const devices = useMemo(() => devicesQuery.data?.data || [], [devicesQuery.data]);
  const materials = useMemo(() => buildEditorMaterials(mediaNodesQuery.data?.data?.items || []), [mediaNodesQuery.data]);
  const materialIndex = useMemo(() => Object.fromEntries(materials.map((m) => [m.materialId, m])) as Record<string, EditorMaterial>, [materials]);

  // Sync targetDeviceId from program data
  useEffect(() => {
    if (program?.targetDeviceId) {
      setTargetDeviceId(program.targetDeviceId);
    }
  }, [program?.targetDeviceId]);

  // --- Load Draft Logic ---
  useEffect(() => {
    if (!programId || !isInitializing || programQuery.isLoading) return;

    const load = async () => {
      try {
        const res = await ensureDraftApi(programId, baseVersion ?? undefined);
        if (res.data) {
          setDraft(res.data);
          try {
            let parsedVsn = JSON.parse(res.data.vsnJson || '{}') as VsnDocument;
            
            // If VSN is empty or has no pages, initialize it with a blank page using program resolution
            const pages = parsedVsn.Programs?.Program?.Pages?.Page;
            if (!pages || !Array.isArray(pages) || pages.length === 0) {
              const programWidth = programQuery.data?.data?.width || 1920;
              const programHeight = programQuery.data?.data?.height || 1080;
              parsedVsn = createBlankVsnDocument({ width: programWidth, height: programHeight });
            }

            setVsn(normalizeVsnForEditor(parsedVsn));
          } catch (e) {
            toast.error('Failed to parse program content');
          }
        }
      } catch (e) {
        toast.error('Failed to initialize editor');
        navigate('/dashboard/programs');
      } finally {
        setIsInitializing(false);
      }
    };
    load();
  }, [programId, baseVersion, isInitializing, navigate, programQuery.isLoading, programQuery.data]);

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: (newVsn: VsnDocument) => 
      saveProgramDraft(programId!, draft!.id, { vsnJson: JSON.stringify(newVsn) }),
    onSuccess: (res) => {
      setDirty(false);
      setAutosavePending(false);
      if (res.data) setDraft(res.data);
      queryClient.invalidateQueries({ queryKey: ['programs', programId] });
    },
    onError: (err) => toast.error(`Autosave failed: ${getErrorMessage(err)}`),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameProgramApi(programId!, name),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['programs', programId] });
       toast.success('Program renamed');
    }
  });

  // Handle Save
  const handleSaveManually = useCallback(() => {
    if (!vsn || !draft) return;
    saveMutation.mutate(vsn);
    toast.success('Workspace saved');
  }, [vsn, draft, saveMutation]);

  // Autosave Logic
  useEffect(() => {
    if (!dirty || !vsn || !draft) return;
    
    const policy = getProgramDraftSavePolicy();
    if (policy === 'manual') return;

    const delay = policy === 'aggressive' ? 2000 : 10000;
    
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    
    setAutosavePending(true);
    autosaveTimerRef.current = window.setTimeout(() => {
      saveMutation.mutate(vsn);
    }, delay);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [vsn, dirty, draft, saveMutation]);

  const pages = useMemo(() => getPages(vsn), [vsn]);
  const regions = useMemo(() => getRegions(vsn, selection.pageIndex), [vsn, selection.pageIndex]);

  const maxPageDurationMs = useMemo(() => {
    const page = pages[selection.pageIndex];
    if (!page) return 10000;
    return Number.parseInt(page.Duration ?? '10', 10) * 1000 || 10000;
  }, [pages, selection.pageIndex]);

  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();
    let frame: number;
    const tick = () => {
      const now = performance.now();
      const delta = (now - lastTime) * playbackSpeed;
      lastTime = now;
      setCurrentTime((prev) => {
        const next = prev + delta;
        return next > maxPageDurationMs ? 0 : next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, maxPageDurationMs, playbackSpeed]);

  const togglePlayback = useCallback(() => setIsPlaying((p) => !p), []);
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [sessionHasChanges, setSessionHasChanges] = useState(false);
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);
  const [draftPromptIntent, setDraftPromptIntent] = useState<DraftPromptIntent | null>(null);

  const navigationBlocker = useBlocker(sessionHasChanges);

  const requestBaseVersionChange = (next: number | null) => {
    if (next === baseVersion) return;
    if (!sessionHasChanges) {
      setBaseVersion(next);
      setIsInitializing(true); // Re-trigger load
      return;
    }
    setDraftPromptIntent({ type: 'switch', nextBaseVersion: next });
    setDraftPromptOpen(true);
  };

  useEffect(() => {
    if (navigationBlocker.state !== 'blocked') return;
    setDraftPromptIntent({ type: 'navigate' });
    setDraftPromptOpen(true);
  }, [navigationBlocker]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const versionOptions = useMemo(() => {
    if (!program) return [];
    return [...program.versions].sort((a, b) => b.version - a.version).map((v) => v.version);
  }, [program]);

  const canvasWidth = useMemo(() => {
    const w = Number.parseInt(vsn?.Programs?.Program?.Information?.Width ?? '', 10);
    return Number.isFinite(w) && w > 0 ? w : program?.width ?? 1920;
  }, [program?.width, vsn]);
  const canvasHeight = useMemo(() => {
    const h = Number.parseInt(vsn?.Programs?.Program?.Information?.Height ?? '', 10);
    return Number.isFinite(h) && h > 0 ? h : program?.height ?? 1080;
  }, [program?.height, vsn]);

  const devtoolsEnabled = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    return new URLSearchParams(location.search).has('devtools');
  }, [location.search]);

  const devValidation = useMemo(
    () => (devtoolsEnabled && vsn ? validateVsnDocument(vsn, 'publish') : { issues: [], isValid: true }),
    [devtoolsEnabled, vsn],
  );
  const errorCount = useMemo(() => devValidation.issues.filter((i) => i.severity === 'error').length, [devValidation.issues]);
  const warningCount = useMemo(() => devValidation.issues.filter((i) => i.severity === 'warning').length, [devValidation.issues]);

  const applyVsn = (next: VsnDocument, options?: { noHistory?: boolean }) => {
    if (vsn && !options?.noHistory) {
      setPast((prev) => [...prev.slice(-49), vsn]);
      setFuture([]);
    }
    vsnRevisionRef.current += 1;
    setVsn(next);
    setDirty(true);
    setSessionHasChanges(true);
  };

  const undo = useCallback(() => {
    if (past.length === 0 || !vsn) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [vsn, ...prev]);
    vsnRevisionRef.current += 1;
    setVsn(previous);
    setDirty(true);
    setSessionHasChanges(true);
  }, [past, vsn]);

  const redo = useCallback(() => {
    if (future.length === 0 || !vsn) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, vsn]);
    vsnRevisionRef.current += 1;
    setVsn(next);
    setDirty(true);
    setSessionHasChanges(true);
  }, [future, vsn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        togglePlayback();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selection.regionIndex != null && selection.itemIndex != null && vsn) {
          const next = deleteItem(vsn, selection.pageIndex, selection.regionIndex, selection.itemIndex);
          if (next !== vsn) {
            applyVsn(next);
            setSelection((prev) => ({ ...prev, itemIndex: null }));
          }
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, togglePlayback, selection, vsn]);

  if (programQuery.isLoading || isInitializing) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <RefreshCw className="h-10 w-10 animate-spin text-primary/40" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Booting Canvas Editor...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <TriangleAlert className="mx-auto h-12 w-12 text-amber-600" />
          <h2 className="text-xl font-bold">Program not found</h2>
          <p className="text-muted-foreground">The program may have been deleted or the URL is incorrect.</p>
          <Button variant="outline" asChild><Link to="/dashboard/programs"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Programs</Link></Button>
        </div>
      </div>
    );
  }

  const handlePublish = () => {
    if (!draft || !vsn) return;
    const res = validateVsnDocument(vsn, 'publish');
    if (!res.isValid) {
      toast.error(`Fix ${res.issues.filter((i) => i.severity === 'error').length} error(s) before publishing.`);
      return;
    }
    if (dirty) saveMutation.mutate(vsn);
    setPublishOpen(true);
  };

  const createRegionForInsert = (input: { name?: string; x: number; y: number; width: number; height: number }) => {
    if (!vsn) return null;
    const width = Math.min(canvasWidth, Math.max(1, Math.round(input.width)));
    const height = Math.min(canvasHeight, Math.max(1, Math.round(input.height)));
    const x = clampInt(Math.round(input.x), 0, Math.max(0, canvasWidth - width));
    const y = clampInt(Math.round(input.y), 0, Math.max(0, canvasHeight - height));
    return addRegion(vsn, selection.pageIndex, {
      name: input.name,
      rect: { X: String(x), Y: String(y), Width: String(width), Height: String(height) }
    });
  };

  const selectedRegion = selection.regionIndex == null ? null : regions[selection.regionIndex] ?? null;
  const canEditSelectedRegion = Boolean(vsn && selectedRegion);

  const handleDuplicateSelectedRegion = () => {
    if (!vsn || selection.regionIndex == null) return;
    const res = duplicateRegion(vsn, selection.pageIndex, selection.regionIndex);
    applyVsn(res.doc);
    setSelection((prev) => ({ ...prev, regionIndex: res.regionIndex, itemIndex: null }));
  };

  const handleDeleteSelectedRegion = () => {
    if (!vsn || selection.regionIndex == null) return;
    const next = deleteRegion(vsn, selection.pageIndex, selection.regionIndex);
    applyVsn(next);
    setSelection((prev) => ({ ...prev, regionIndex: null, itemIndex: null }));
  };

  const findRegionIndexAtPoint = (point: { x: number; y: number }) => {
    let bestIndex: number | null = null;
    let bestLayer = -Infinity;
    regions.forEach((region, index) => {
      const rect = region.Rect;
      const x = Number.parseInt(rect?.X ?? '0', 10) || 0;
      const y = Number.parseInt(rect?.Y ?? '0', 10) || 0;
      const w = Number.parseInt(rect?.Width ?? '0', 10) || 0;
      const h = Number.parseInt(rect?.Height ?? '0', 10) || 0;
      if (point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h) {
        const layer = Number.parseInt(region.Layer ?? '0', 10);
        if (layer >= bestLayer) {
          bestLayer = layer;
          bestIndex = index;
        }
      }
    });
    return bestIndex;
  };

  const leftPanelContent = (
    <EditorLeftPanel
      pages={pages}
      regions={regions}
      materials={materials}
      selection={selection}
      searchQuery={mediaQuery}
      onSearchChange={setMediaQuery}
      onSelectPage={(pageIndex) => setSelection({ pageIndex, regionIndex: null, itemIndex: null })}
      onSelectRegion={(regionIndex) => setSelection((prev) => ({ ...prev, regionIndex, itemIndex: null }))}
      onAddPage={() => {
        if (!vsn) return;
        const res = addPage(vsn, { width: canvasWidth, height: canvasHeight });
        applyVsn(res.doc);
        setSelection({ pageIndex: res.pageIndex, regionIndex: null, itemIndex: null });
      }}
      onDeletePage={() => {
        if (!vsn || pages.length <= 1) return;
        const next = deletePage(vsn, selection.pageIndex);
        applyVsn(next);
        setSelection((prev) => ({ ...prev, pageIndex: 0, regionIndex: null, itemIndex: null }));
      }}
      onAddRegion={() => {
        if (!vsn) return;
        const res = addRegion(vsn, selection.pageIndex, {});
        applyVsn(res.doc);
        setSelection((prev) => ({ ...prev, regionIndex: res.regionIndex, itemIndex: null }));
      }}
      onDeleteRegion={handleDeleteSelectedRegion}
      onAddTextItem={() => {
        if (!vsn) return;
        let doc = vsn;
        let rIdx = selection.regionIndex;
        if (rIdx == null) {
          const res = createRegionForInsert({ name: 'Text Window', x: 100, y: 100, width: 400, height: 200 });
          if (!res) return;
          doc = res.doc;
          rIdx = res.regionIndex;
        }
        const res = addItem(doc, selection.pageIndex, rIdx, createTextItem());
        applyVsn(res.doc);
        setSelection((prev) => ({ ...prev, regionIndex: rIdx, itemIndex: res.itemIndex }));
      }}
      onAddMaterialItem={(material) => {
        if (!vsn) return;
        let doc = vsn;
        let rIdx = selection.regionIndex;
        const source = material.source as MediaAssetNode;
        if (rIdx == null) {
          const res = createRegionForInsert({ name: material.name, x: 200, y: 200, width: 640, height: 360 });
          if (!res) return;
          doc = res.doc;
          rIdx = res.regionIndex;
        }
        const res = addItem(doc, selection.pageIndex, rIdx, createItemFromMedia(source, { materialId: material.materialId }));
        applyVsn(res.doc);
        setSelection((prev) => ({ ...prev, regionIndex: rIdx, itemIndex: res.itemIndex }));
      }}
    />
  );

  const rightPanelContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      {devtoolsEnabled && (
        <div className="flex items-center gap-2 mb-3">
          <RightTabButton active={rightTab === 'inspector'} onClick={() => setRightTab('inspector')} icon={<SlidersHorizontal className="h-4 w-4" />}>Inspector</RightTabButton>
          <RightTabButton active={rightTab === 'problems'} onClick={() => setRightTab('problems')} icon={<ListChecks className="h-4 w-4" />}>Problems</RightTabButton>
          <RightTabButton active={rightTab === 'json'} onClick={() => setRightTab('json')} icon={<Code2 className="h-4 w-4" />}>JSON</RightTabButton>
        </div>
      )}
      <div className="min-h-0 flex-1">
        {!devtoolsEnabled || rightTab === 'inspector' ? (
          <InspectorPanel
            doc={vsn}
            selection={selection}
            programName={program.name}
            programWidth={canvasWidth}
            programHeight={canvasHeight}
            targetDeviceId={targetDeviceId}
            devices={devices}
            materialIndex={materialIndex}
            showDevFields={devtoolsEnabled}
            onRenameProgram={(name) => renameMutation.mutate(name)}
            onSetProgramResolution={(res) => {
               if (!vsn) return;
               setTargetDeviceId(res.targetDeviceId);
               applyVsn(resizeProgramCanvas(vsn, res));
            }}
            onPatchPage={(pageIndex, patch) => vsn && applyVsn(patchPage(vsn, pageIndex, patch))}
            onPatchRegion={(pIdx, rIdx, patch) => vsn && applyVsn(patchRegion(vsn, pIdx, rIdx, patch))}
            onPatchRegionRect={(pIdx, rIdx, patch) => vsn && applyVsn(patchRegionRect(vsn, pIdx, rIdx, patch))}
            onPatchItem={(pIdx, rIdx, iIdx, patch) => vsn && applyVsn(patchItem(vsn, pIdx, rIdx, iIdx, patch))}
          />
        ) : rightTab === 'problems' ? (
          <ProblemsPanel issues={devValidation.issues} onJumpToSelection={(p) => setSelection({ pageIndex: p.pageIndex ?? 0, regionIndex: p.regionIndex ?? null, itemIndex: p.itemIndex ?? null })} />
        ) : (
          <VsnJsonPanel doc={vsn} />
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div className="flex flex-col gap-3 border-b bg-background/80 px-4 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate('/dashboard/programs')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight uppercase">{program.name}</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {canvasWidth}×{canvasHeight} · {baseVersion != null ? `v${baseVersion}` : 'Blank'} {dirty && '· Modified'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={baseVersion === null ? 'blank' : String(baseVersion)} onValueChange={(v) => requestBaseVersionChange(v === 'blank' ? null : Number(v))}>
            <SelectTrigger className="h-9 w-[110px] text-[10px] font-black uppercase bg-muted/20 border-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="blank" className="text-xs font-bold">Blank</SelectItem>
              {versionOptions.map(v => <SelectItem key={v} value={String(v)} className="text-xs font-bold">v{v}</SelectItem>)}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button variant="ghost" size="icon" onClick={undo} disabled={past.length === 0}><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0}><Redo2 className="h-4 w-4" /></Button>
          
          <Button variant="outline" size="sm" onClick={handleSaveManually} disabled={!dirty && !autosavePending} className="font-bold text-[10px] uppercase h-9 px-4">Save</Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="font-bold text-[10px] uppercase h-9 px-4">Preview</Button>
          <Button size="sm" onClick={handlePublish} className="font-bold text-[10px] uppercase h-9 px-6 shadow-lg shadow-primary/20">Publish</Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className={cn('grid h-full gap-4', isMobile ? 'grid-cols-1' : 'lg:grid-cols-[320px_minmax(0,1fr)_360px]')}>
          {!isMobile && <div className="min-h-0 rounded-2xl border bg-card p-4 overflow-hidden">{leftPanelContent}</div>}
          <div className="min-h-0 grid-cols-1 gap-4 lg:grid lg:grid-rows-[minmax(0,1fr)_260px]">
            <div className="min-h-0 rounded-2xl border bg-card p-4 overflow-hidden">
               <StagePreview
                 doc={vsn} programWidth={canvasWidth} programHeight={canvasHeight} selection={selection}
                 materialIndex={materialIndex} currentTime={currentTime} isPlaying={isPlaying} playbackSpeed={playbackSpeed}
                 onSelectRegion={(rIdx) => setSelection(prev => ({ ...prev, regionIndex: rIdx, itemIndex: null }))}
                 onPatchRegionRect={(pIdx, rIdx, patch) => vsn && applyVsn(patchRegionRect(vsn, pIdx, rIdx, patch))}
                 onDropMaterial={(materialId, point) => {
                    const material = materialIndex[materialId];
                    if (!material) return;
                    
                    const regionIndex = findRegionIndexAtPoint(point);
                    if (regionIndex != null) {
                       // Drop into existing region
                       if (vsn) {
                          const res = addItem(vsn, selection.pageIndex, regionIndex, createItemFromMedia(material.source as MediaAssetNode, { materialId }));
                          applyVsn(res.doc);
                          setSelection({ pageIndex: selection.pageIndex, regionIndex, itemIndex: res.itemIndex });
                       }
                    } else {
                       // Create new region for drop
                       const res = createRegionForInsert({ 
                          name: material.name, 
                          x: point.x - 320, 
                          y: point.y - 180, 
                          width: 640, 
                          height: 360 
                       });
                       if (res && res.doc) {
                          const itemRes = addItem(res.doc, selection.pageIndex, res.regionIndex, createItemFromMedia(material.source as MediaAssetNode, { materialId }));
                          applyVsn(itemRes.doc);
                          setSelection({ pageIndex: selection.pageIndex, regionIndex: res.regionIndex, itemIndex: itemRes.itemIndex });
                       }
                    }
                 }}
                 onCreateRegionRect={(pIdx, rect) => {
                    const res = createRegionForInsert({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
                    if (res) {
                       applyVsn(res.doc);
                       setSelection({ pageIndex: pIdx, regionIndex: res.regionIndex, itemIndex: null });
                    }
                 }}
               />
            </div>
            <div className="min-h-0 overflow-hidden rounded-2xl border bg-zinc-950">
               <AdvancedTimeline
                 regions={regions} selection={selection} materialIndex={materialIndex}
                 currentTime={currentTime} isPlaying={isPlaying} playbackSpeed={playbackSpeed}
                 onCurrentTimeChange={setCurrentTime} onPlaybackSpeedChange={setPlaybackSpeed}
                 onSelectItem={(rIdx, iIdx) => setSelection(prev => ({ ...prev, regionIndex: rIdx, itemIndex: iIdx }))}
                 onSelectRegion={(rIdx) => setSelection(prev => ({ ...prev, regionIndex: rIdx, itemIndex: null }))}
                 onPatchItem={(rIdx, iIdx, patch) => vsn && applyVsn(patchItem(vsn, selection.pageIndex, rIdx, iIdx, patch))}
               />
            </div>
          </div>
          {!isMobile && <div className="flex min-h-0 flex-col rounded-2xl border bg-card p-4 overflow-hidden">{rightPanelContent}</div>}
        </div>
      </div>

      <ProgramPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} doc={vsn} materialIndex={materialIndex} startPageIndex={selection.pageIndex} />
      <ProgramPublishDialog
        open={publishOpen} onOpenChange={setPublishOpen}
        program={program as any} deployments={program.deployments || []}
        preferredDraftId={draft?.id ?? null}
        onAfterPublish={() => queryClient.invalidateQueries({ queryKey: ['programs', programId] })}
      />

      <Dialog open={draftPromptOpen} onOpenChange={setDraftPromptOpen}>
        <DialogContent className="max-w-[500px] p-8">
          <TriangleAlert className="h-10 w-10 text-amber-600 mb-6" />
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>You have modified the workspace. How would you like to proceed?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => { setDraftPromptOpen(false); if (draftPromptIntent?.type === 'navigate') navigationBlocker.reset?.(); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              setSessionHasChanges(false);
              setDraftPromptOpen(false);
              if (draftPromptIntent?.type === 'switch') { setBaseVersion(draftPromptIntent.nextBaseVersion); setIsInitializing(true); }
              else navigationBlocker.proceed?.();
            }}>Discard</Button>
            <Button onClick={async () => {
               if (vsn) await saveMutation.mutateAsync(vsn);
               setSessionHasChanges(false);
               setDraftPromptOpen(false);
               if (draftPromptIntent?.type === 'switch') { setBaseVersion(draftPromptIntent.nextBaseVersion); setIsInitializing(true); }
               else navigationBlocker.proceed?.();
            }}>Save & Continue</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RightTabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase transition-all",
      active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
    )}>
      {icon} {children}
    </button>
  );
}

function buildEditorMaterials(nodes: unknown[]): EditorMaterial[] {
  const assets = (nodes as { type: string }[]).filter(n => n?.type?.toLowerCase() === 'asset') as MediaAssetNode[];
  return assets.filter(a => {
    const kind = a.assetKind?.toLowerCase();
    return kind === 'image' || kind === 'video';
  }).map(asset => ({
    assetId: asset.id,
    materialId: resolveMaterialId(asset.id),
    source: asset,
    name: asset.name,
    kind: asset.assetKind?.toLowerCase() as 'image' | 'video',
    extension: asset.extension,
    coverUrl: asset.coverUrl,
    assetUrl: asset.assetUrl,
    width: asset.width,
    height: asset.height,
    durationMs: asset.durationMs,
  }));
}