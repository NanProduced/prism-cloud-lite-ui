import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBlocker } from 'react-router';
import { ArrowLeft, ChevronDown, Code2, Copy, Layers, ListChecks, Play, Redo2, Save, Send, SlidersHorizontal, Trash2, TriangleAlert, Undo2 } from 'lucide-react';
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
import { mockMediaLibraryNodes } from '@/lib/mock/media-library';
import { mockDevices } from '@/lib/mock/devices';
import { listProgramDeployments, type ProgramDeploymentRecord } from '@/features/programs/storage/deploymentsDb';
import { ProgramPublishDialog } from '@/features/programs/publishing/ProgramPublishDialog';
import { getProgramDraftSavePolicy } from '@/features/programs/storage/draftPolicyDb';

import { getProgram, type ProgramRecord, saveDraft, updateProgramCanvas, type ProgramDraftRecord, renameProgram, ensureDraft, deleteDraft } from '@/features/programs/storage/programsDb';
import { addProgramAuditLog } from '@/features/programs/storage/auditLogsDb';
import { resolveMaterialId } from '@/features/programs/storage/materialId';
import { createItemFromMedia, createScrollTextItem, createTextItem } from '@/features/programs/vsn/defaults';
import type { VsnDocument } from '@/features/programs/vsn/types';
import { validateVsnDocument } from '@/features/programs/vsn/validator';
import type { MediaAssetNode } from '@/types/media-library';

import type { EditorMaterial, EditorSelection } from '@/features/programs/editor/types';
import { EditorLeftPanel } from '@/features/programs/editor/components/EditorLeftPanel';
import { InspectorPanel } from '@/features/programs/editor/components/InspectorPanel';
import { ProblemsPanel } from '@/features/programs/editor/components/ProblemsPanel';
import { AdvancedTimeline } from '@/features/programs/editor/components/AdvancedTimeline';
import { StagePreview } from '@/features/programs/editor/components/StagePreview';
import { ProgramPreviewDialog } from '@/features/programs/editor/components/ProgramPreviewDialog';
import { VsnJsonPanel } from '@/features/programs/editor/components/VsnJsonPanel';
import {
  addItem,
  addPage,
  addRegion,
  duplicateRegion,
  deleteItem,
  deletePage,
  deleteRegion,
  getPages,
  getRegions,
  moveItemToRegion,
  normalizeVsnForEditor,
  patchItem,
  patchPage,
  patchRegion,
  patchRegionRect,
  resizeProgramCanvas,
} from '@/features/programs/editor/vsnOps';
import { canRegionAcceptItemType, getRegionMode, clampInt } from '@/features/programs/editor/utils';

export default function ProgramEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { programId } = useParams<{ programId: string }>();
  const isMobile = useIsMobile();

  type DraftPromptIntent =
    | { type: 'navigate' }
    | { type: 'switch'; nextBaseVersion: number | null };

  const [program, setProgram] = useState<ProgramRecord | null>(null);
  const [baseVersion, setBaseVersion] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProgramDraftRecord | null>(null);
  const [vsn, setVsn] = useState<VsnDocument | null>(null);
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

  const pages = useMemo(() => getPages(vsn), [vsn]);
  const regions = useMemo(() => getRegions(vsn, selection.pageIndex), [vsn, selection.pageIndex]);

  const maxPageDurationMs = useMemo(() => {
    let max = 5000;
    regions.forEach((r) => {
      const total = r.Items.Item.reduce((sum, item) => sum + (Number(item.Duration) || 0), 0);
      if (total > max) max = total;
    });
    return max;
  }, [regions]);

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
  }, [isPlaying, maxPageDurationMs]);

  const togglePlayback = useCallback(() => setIsPlaying((p) => !p), []);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deployments, setDeployments] = useState<ProgramDeploymentRecord[]>([]);
  const [sessionHasChanges, setSessionHasChanges] = useState(false);
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);
  const [draftPromptIntent, setDraftPromptIntent] = useState<DraftPromptIntent | null>(null);

  const clearAutosaveTimer = () => {
    if (autosaveTimerRef.current != null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  };

  const persistWorkingCopy = useCallback(async (options?: { toast?: boolean; screenshot?: boolean }) => {
    if (!program || !draft || !vsn) return null;

    let thumbnail: string | undefined = undefined;
    if (options?.screenshot) {
      try {
        // Here we could use html2canvas(document.querySelector('[data-testid="program-stage"]'))
        // For now we use a placeholder or a simple schematic capture if desired.
        // thumbnail = await captureStageAsDataUrl();
      } catch (e) {
        console.error('Failed to capture screenshot', e);
      }
    }

    const saved = saveDraft(program.id, draft.id, vsn, thumbnail);
    if (saved) {
      setDraft(saved);
      addProgramAuditLog({
        programId: program.id,
        action: 'SAVE_DRAFT',
        userId: 'admin',
        userName: 'Administrator',
        details: { snapshotId: draft.id }
      });
    }
    setDirty(false);
    setAutosavePending(false);
    clearAutosaveTimer();
    if (options?.toast) toast.success('Saved');
    return saved;
  }, [draft, program, vsn]);

  const discardWorkingCopy = useCallback(() => {
    if (!program || !draft) return;
    deleteDraft(program.id, draft.id);
  }, [draft, program]);

  const navigationBlocker = useBlocker(sessionHasChanges);

  const requestBaseVersionChange = (next: number | null) => {
    if (next === baseVersion) return;
    if (!sessionHasChanges) {
      setBaseVersion(next);
      return;
    }

    const policy = getProgramDraftSavePolicy();
    if (policy === 'always') {
      persistWorkingCopy();
      setSessionHasChanges(false);
      setBaseVersion(next);
      return;
    }
    if (policy === 'never') {
      discardWorkingCopy();
      setSessionHasChanges(false);
      setBaseVersion(next);
      return;
    }

    setDraftPromptIntent({ type: 'switch', nextBaseVersion: next });
    setDraftPromptOpen(true);
  };

  useEffect(() => {
    if (navigationBlocker.state !== 'blocked') return;

    const policy = getProgramDraftSavePolicy();
    if (policy === 'always') {
      persistWorkingCopy();
      setSessionHasChanges(false);
      navigationBlocker.proceed?.();
      return;
    }

    if (policy === 'never') {
      discardWorkingCopy();
      setSessionHasChanges(false);
      navigationBlocker.proceed?.();
      return;
    }

    setDraftPromptIntent({ type: 'navigate' });
    setDraftPromptOpen(true);
  }, [discardWorkingCopy, navigationBlocker, persistWorkingCopy]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!programId) return;
    const loaded = getProgram(programId);
    setProgram(loaded);

    if (!loaded) return;
    const latest = Math.max(0, ...loaded.versions.map((v) => v.version)) || null;
    const params = new URLSearchParams(location.search);
    const baseParam = (params.get('base') ?? '').trim().toLowerCase();
    const resumeDraft = pickLatestDraft(loaded);
    let initialBase = resumeDraft?.baseVersion ?? loaded.defaultVersion ?? latest ?? null;
    if (baseParam === 'blank') initialBase = null;
    else if (baseParam) {
      const raw = baseParam.startsWith('v') ? baseParam.slice(1) : baseParam;
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        const exists = loaded.versions.some((v) => v.version === parsed);
        if (exists) initialBase = parsed;
        else toast.error(`Base version v${parsed} not found.`);
      }
    }
    setBaseVersion(initialBase);
  }, [location.search, programId]);

  useEffect(() => {
    if (!programId) return;
    setDeployments(listProgramDeployments(programId));
  }, [programId]);

  useEffect(() => {
    if (!programId) return;
    const loaded = getProgram(programId);
    if (!loaded) return;
    setProgram(loaded);
    const d = ensureDraft(programId, baseVersion);
    setDraft(d);
    setVsn(d?.vsn ? normalizeVsnForEditor(d.vsn) : null);
    setPast([]);
    setFuture([]);
    setDirty(false);
    setSessionHasChanges(false);
    setAutosavePending(false);
    clearAutosaveTimer();
    setSelection({ pageIndex: 0, regionIndex: null, itemIndex: null });
  }, [baseVersion, programId]);

  useEffect(() => {
    return () => {
      clearAutosaveTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dirty || !program || !draft || !vsn) return;
    const revision = vsnRevisionRef.current;
    setAutosavePending(true);
    clearAutosaveTimer();

    const programIdForSave = program.id;
    const draftIdForSave = draft.id;
    const doc = vsn;

    autosaveTimerRef.current = window.setTimeout(() => {
      if (vsnRevisionRef.current !== revision) return;
      const saved = saveDraft(programIdForSave, draftIdForSave, doc);
      if (saved) setDraft(saved);
      setDirty(false);
      setAutosavePending(false);
      autosaveTimerRef.current = null;
    }, 1200);

    return () => {
      clearAutosaveTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, vsn, draft?.id, program?.id]);

  const versionOptions = useMemo(() => {
    if (!program) return [];
    const versions = [...program.versions].sort((a, b) => b.version - a.version);
    return versions.map((v) => v.version);
  }, [program]);

  const materials = useMemo(() => buildEditorMaterials(mockMediaLibraryNodes), []);
  const materialIndex = useMemo(() => Object.fromEntries(materials.map((m) => [m.materialId, m])) as Record<string, EditorMaterial>, [materials]);

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

  const lastEditLogRef = useRef<number>(0);
  const applyVsn = (next: VsnDocument, options?: { noHistory?: boolean }) => {
    if (vsn && !options?.noHistory) {
      setPast((prev) => [...prev.slice(-49), vsn]);
      setFuture([]);
    }
    vsnRevisionRef.current += 1;
    setVsn(next);
    setDirty(true);
    setSessionHasChanges(true);

    // Throttle edit logs (once per 5 minutes of active editing)
    const now = Date.now();
    if (program && now - lastEditLogRef.current > 5 * 60 * 1000) {
      addProgramAuditLog({
        programId: program.id,
        action: 'EDIT',
        userId: 'admin',
        userName: 'Administrator',
        details: { description: 'Updated layout and configuration' }
      });
      lastEditLogRef.current = now;
    }
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
    toast.info('Action undone', { duration: 1500 });
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
    toast.info('Action redone', { duration: 1500 });
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

      // Timeline & Selection Navigation
      if (!isInput) {
        if (e.key === 'ArrowRight') {
          setCurrentTime((prev) => Math.min(maxPageDurationMs, prev + (e.shiftKey ? 1000 : 100)));
        } else if (e.key === 'ArrowLeft') {
          setCurrentTime((prev) => Math.max(0, prev - (e.shiftKey ? 1000 : 100)));
        } else if (e.key === '[' || e.key === ']') {
          const boundaries = new Set([0, maxPageDurationMs]);
          regions.forEach(r => {
            let t = 0;
            r.Items.Item.forEach(item => {
              t += Number(item.Duration) || 0;
              boundaries.add(t);
            });
          });
          const sorted = Array.from(boundaries).sort((a, b) => a - b);
          if (e.key === '[') {
            const next = sorted.reverse().find(b => b < currentTime - 10) ?? 0;
            setCurrentTime(next);
          } else {
            const next = sorted.find(b => b > currentTime + 10) ?? maxPageDurationMs;
            setCurrentTime(next);
          }
        } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          if (regions.length === 0) return;
          setSelection(prev => {
            const curr = prev.regionIndex ?? -1;
            const next = e.key === 'ArrowUp' 
              ? (curr <= 0 ? regions.length - 1 : curr - 1)
              : (curr >= regions.length - 1 ? 0 : curr + 1);
            return { ...prev, regionIndex: next, itemIndex: null };
          });
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  if (!programId) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm font-medium">Program Editor</p>
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

  const handlePublish = () => {
    if (!draft || !vsn) return;
    const res = validateVsnDocument(vsn, 'publish');
    if (!res.isValid) {
      toast.error(`Fix ${res.issues.filter((i) => i.severity === 'error').length} error(s) before publishing.`);
      return;
    }
    try {
      if (dirty) persistWorkingCopy();
      setPublishOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed.';
      toast.error(message);
    }
  };

  const createRegionForInsert = (input: { name?: string; x: number; y: number; width: number; height: number }) => {
    if (!vsn) return null;
    const width = Math.min(canvasWidth, Math.max(1, Math.round(input.width)));
    const height = Math.min(canvasHeight, Math.max(1, Math.round(input.height)));
    const x = clampInt(Math.round(input.x), 0, Math.max(0, canvasWidth - width));
    const y = clampInt(Math.round(input.y), 0, Math.max(0, canvasHeight - height));
    const rect = {
      X: String(x),
      Y: String(y),
      Width: String(width),
      Height: String(height),
      BorderWidth: '0',
      BorderColor: '#000000',
      BackColor: null,
    };
    return addRegion(vsn, selection.pageIndex, { name: input.name, rect });
  };

  const selectedRegion = selection.regionIndex == null ? null : regions[selection.regionIndex] ?? null;
  const canEditSelectedRegion = Boolean(vsn && selectedRegion);
  const canDeleteSelectedRegion = Boolean(vsn && selection.regionIndex != null);

  const getSelectedRegionRect = () => {
    if (!selectedRegion) return null;
    const rect = selectedRegion.Rect;
    const x = Number.parseInt(rect.X ?? '0', 10) || 0;
    const y = Number.parseInt(rect.Y ?? '0', 10) || 0;
    const width = Number.parseInt(rect.Width ?? String(canvasWidth), 10) || canvasWidth;
    const height = Number.parseInt(rect.Height ?? String(canvasHeight), 10) || canvasHeight;
    return {
      x: clampInt(x, 0, canvasWidth),
      y: clampInt(y, 0, canvasHeight),
      width: clampInt(width, 1, canvasWidth),
      height: clampInt(height, 1, canvasHeight),
    };
  };

  const patchSelectedRegionRect = (patch: { X?: string; Y?: string; Width?: string; Height?: string }) => {
    if (!vsn) return;
    if (selection.regionIndex == null) return;
    applyVsn(patchRegionRect(vsn, selection.pageIndex, selection.regionIndex, patch));
  };

  const handleDuplicateSelectedRegion = () => {
    if (!vsn) return;
    if (selection.regionIndex == null) return;
    const res = duplicateRegion(vsn, selection.pageIndex, selection.regionIndex);
    if (res.doc === vsn) return;
    applyVsn(res.doc);
    setSelection((prev) => ({ ...prev, regionIndex: res.regionIndex, itemIndex: null }));
  };

  const handleDeleteSelectedRegion = () => {
    if (!vsn) return;
    if (selection.regionIndex == null) return;
    const next = deleteRegion(vsn, selection.pageIndex, selection.regionIndex);
    if (next === vsn) return;
    applyVsn(next);
    const nextRegions = getRegions(next, selection.pageIndex);
    if (nextRegions.length === 0) {
      setSelection((prev) => ({ ...prev, regionIndex: null, itemIndex: null }));
      return;
    }
    setSelection((prev) => ({ ...prev, regionIndex: clampInt(prev.regionIndex ?? 0, 0, nextRegions.length - 1), itemIndex: null }));
  };

  const handleAlignSelectedRegion = (mode: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => {
    const rect = getSelectedRegionRect();
    if (!rect) return;

    if (mode === 'left') patchSelectedRegionRect({ X: '0' });
    if (mode === 'hcenter') patchSelectedRegionRect({ X: String(Math.round((canvasWidth - rect.width) / 2)) });
    if (mode === 'right') patchSelectedRegionRect({ X: String(Math.max(0, canvasWidth - rect.width)) });
    if (mode === 'top') patchSelectedRegionRect({ Y: '0' });
    if (mode === 'vcenter') patchSelectedRegionRect({ Y: String(Math.round((canvasHeight - rect.height) / 2)) });
    if (mode === 'bottom') patchSelectedRegionRect({ Y: String(Math.max(0, canvasHeight - rect.height)) });
  };

  const handleFillSelectedRegion = (mode: 'full' | 'horizontal' | 'vertical') => {
    if (mode === 'full') {
      patchSelectedRegionRect({ X: '0', Y: '0', Width: String(canvasWidth), Height: String(canvasHeight) });
      return;
    }
    if (mode === 'horizontal') {
      patchSelectedRegionRect({ X: '0', Width: String(canvasWidth) });
      return;
    }
    patchSelectedRegionRect({ Y: '0', Height: String(canvasHeight) });
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
      if (w <= 0 || h <= 0) return;
      const inside = point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
      if (!inside) return;

      const layer = Number.parseInt(region.Layer ?? '', 10);
      const layerScore = Number.isFinite(layer) ? layer : index;
      if (layerScore >= bestLayer) {
        bestLayer = layerScore;
        bestIndex = index;
      }
    });

    return bestIndex;
  };

  const handleRenameProgram = (name: string) => {
    const updated = renameProgram(program.id, name);
    if (!updated) return;
    setProgram(updated);
    toast.success('Program renamed');
  };

  const handleSetProgramResolution = (input: { width: number; height: number; targetDeviceId: string | null }) => {
    if (canvasWidth === input.width && canvasHeight === input.height) {
      const updated = updateProgramCanvas(program.id, input);
      if (updated) setProgram(updated);
      return;
    }
    if (!vsn) return;
    const nextDoc = resizeProgramCanvas(vsn, { width: input.width, height: input.height });
    applyVsn(nextDoc);
    const updated = updateProgramCanvas(program.id, input);
    if (updated) setProgram(updated);
  };

  const leftPanelContent = (
    <EditorLeftPanel
      pages={pages}
      regions={regions}
      materials={materials}
      selection={selection}
      onSelectPage={(pageIndex) => setSelection({ pageIndex, regionIndex: null, itemIndex: null })}
      onSelectRegion={(regionIndex) => setSelection((prev) => ({ ...prev, regionIndex, itemIndex: null }))}
      onAddPage={() => {
        if (!vsn) return;
        const res = addPage(vsn, { width: canvasWidth, height: canvasHeight });
        applyVsn(res.doc);
        setSelection({ pageIndex: res.pageIndex, regionIndex: null, itemIndex: null });
      }}
      onDeletePage={() => {
        if (!vsn) return;
        const next = deletePage(vsn, selection.pageIndex);
        if (next === vsn) return;
        applyVsn(next);
        setSelection((prev) => ({
          ...prev,
          pageIndex: clampInt(prev.pageIndex, 0, getPages(next).length - 1),
          regionIndex: null,
          itemIndex: null,
        }));
      }}
      onAddRegion={() => {
        if (!vsn) return;
        const res = addRegion(vsn, selection.pageIndex, {});
        applyVsn(res.doc);
        setSelection((prev) => ({ ...prev, regionIndex: res.regionIndex, itemIndex: null }));
      }}
      onDeleteRegion={() => {
        if (!vsn) return;
        if (selection.regionIndex == null) return;
        const next = deleteRegion(vsn, selection.pageIndex, selection.regionIndex);
        if (next === vsn) return;
        applyVsn(next);
        setSelection((prev) => ({ ...prev, regionIndex: null, itemIndex: null }));
      }}
      onAddTextItem={() => {
        if (!vsn) return;
        let doc = vsn;
        let regionIndex = selection.regionIndex;
        if (regionIndex == null) {
          const width = Math.round(canvasWidth * 0.6);
          const height = Math.round(canvasHeight * 0.2);
          const x = Math.round((canvasWidth - width) / 2);
          const y = Math.round(canvasHeight * 0.1);
          const res = createRegionForInsert({ name: 'Text Window', x, y, width, height });
          if (!res) return;
          doc = res.doc;
          regionIndex = res.regionIndex;
        }

        const targetRegion = getRegions(doc, selection.pageIndex)[regionIndex] ?? null;
        const targetMode = getRegionMode(targetRegion);
        if (targetRegion) {
          const desiredType = targetMode === 'ticker' ? '5' : '4';
          if (!canRegionAcceptItemType(targetMode, desiredType)) {
            toast.error('This window type does not support text items.');
            return;
          }
        }

        const res = addItem(
          doc,
          selection.pageIndex,
          regionIndex,
          targetMode === 'ticker' ? createScrollTextItem() : createTextItem(),
        );
        applyVsn(res.doc);
        setSelection((prev) => ({ ...prev, regionIndex, itemIndex: res.itemIndex }));
      }}
      onAddMaterialItem={(material) => {
        if (!vsn) return;
        let doc = vsn;
        let regionIndex = selection.regionIndex;
        if (regionIndex == null) {
          const maxW = Math.round(canvasWidth * 0.6);
          const maxH = Math.round(canvasHeight * 0.6);
          const srcW = material.width ?? maxW;
          const srcH = material.height ?? maxH;
          const scale = Math.min(1, maxW / srcW, maxH / srcH);
          const width = Math.max(80, Math.round(srcW * scale));
          const height = Math.max(60, Math.round(srcH * scale));
          const x = Math.round((canvasWidth - width) / 2);
          const y = Math.round((canvasHeight - height) / 2);
          const res = createRegionForInsert({ name: material.name, x, y, width, height });
          if (!res) return;
          doc = res.doc;
          regionIndex = res.regionIndex;
        }

        const source = (material.source ?? null) as MediaAssetNode | null;
        if (!source) {
          toast.error('Material missing source asset.');
          return;
        }
        const item = createItemFromMedia(source, { materialId: material.materialId });

        const targetRegion = getRegions(doc, selection.pageIndex)[regionIndex] ?? null;
        const targetMode = getRegionMode(targetRegion);
        if (targetRegion && !canRegionAcceptItemType(targetMode, item.Type)) {
          toast.error('This window type does not support this item type.');
          return;
        }

        const res = addItem(doc, selection.pageIndex, regionIndex, item);
        applyVsn(res.doc);
        setSelection((prev) => ({ ...prev, regionIndex, itemIndex: res.itemIndex }));
      }}
    />
  );

  const rightPanelContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      {devtoolsEnabled && (
        <>
          <div className="flex items-center gap-2">
            <RightTabButton
              active={rightTab === 'inspector'}
              onClick={() => setRightTab('inspector')}
              icon={<SlidersHorizontal className="h-4 w-4" />}
            >
              Inspector
            </RightTabButton>
            <RightTabButton active={rightTab === 'problems'} onClick={() => setRightTab('problems')} icon={<ListChecks className="h-4 w-4" />}>
              Problems
            </RightTabButton>
            <RightTabButton active={rightTab === 'json'} onClick={() => setRightTab('json')} icon={<Code2 className="h-4 w-4" />}>
              JSON
            </RightTabButton>
          </div>
          <Separator className="my-3" />
        </>
      )}

      <div className="min-h-0 flex-1">
        {!devtoolsEnabled || rightTab === 'inspector' ? (
          <InspectorPanel
            doc={vsn}
            selection={selection}
            programName={program.name}
            programWidth={canvasWidth}
            programHeight={canvasHeight}
            targetDeviceId={program.targetDeviceId ?? null}
            devices={mockDevices}
            materialIndex={materialIndex}
            showDevFields={devtoolsEnabled}
            onRenameProgram={handleRenameProgram}
            onSetProgramResolution={handleSetProgramResolution}
            onPatchPage={(pageIndex, patch) => {
              if (!vsn) return;
              applyVsn(patchPage(vsn, pageIndex, patch));
            }}
            onPatchRegion={(pageIndex, regionIndex, patch) => {
              if (!vsn) return;
              applyVsn(patchRegion(vsn, pageIndex, regionIndex, patch));
            }}
            onPatchRegionRect={(pageIndex, regionIndex, patch) => {
              if (!vsn) return;
              applyVsn(patchRegionRect(vsn, pageIndex, regionIndex, patch));
            }}
            onPatchItem={(pageIndex, regionIndex, itemIndex, patch) => {
              if (!vsn) return;
              applyVsn(patchItem(vsn, pageIndex, regionIndex, itemIndex, patch));
            }}
          />
        ) : rightTab === 'problems' ? (
          <ProblemsPanel
            issues={devValidation.issues}
            onJumpToSelection={(partial) => {
              if (typeof partial.pageIndex === 'number') {
                setSelection({
                  pageIndex: partial.pageIndex,
                  regionIndex: partial.regionIndex ?? null,
                  itemIndex: partial.itemIndex ?? null,
                });
                setRightTab('inspector');
              }
            }}
          />
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
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate('/dashboard/programs')}
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{program.name}</h1>
            <p className="text-sm text-muted-foreground">
              {canvasWidth}×{canvasHeight}
              {baseVersion != null ? ` · Based on v${baseVersion}` : ' · Blank'}
              {dirty ? (autosavePending ? ' · Saving…' : ' · Unsaved changes') : ' · Saved'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {devtoolsEnabled && (
            <div className="flex items-center gap-2">
              <span
                className={
                  errorCount
                    ? 'rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-600'
                    : 'rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground'
                }
              >
                {errorCount} error
              </span>
              <span
                className={
                  warningCount
                    ? 'rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-700'
                    : 'rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground'
                }
              >
                {warningCount} warn
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60" htmlFor="base-version">
              Edit from
            </label>
            <Select
              value={baseVersion === null ? 'blank' : String(baseVersion)}
              onValueChange={(v) => {
                const value = v === 'blank' ? null : Number(v);
                requestBaseVersionChange(value);
              }}
            >
              <SelectTrigger id="base-version" className="h-9 w-[100px] font-bold text-xs bg-muted/20 border-border">
                <SelectValue placeholder="Base version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank" className="text-xs font-bold">Blank</SelectItem>
                {versionOptions.map((v) => (
                  <SelectItem key={v} value={String(v)} className="text-xs font-bold">
                    v{v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mr-2 flex items-center gap-1 border-r pr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={undo}
              disabled={past.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={redo}
              disabled={future.length === 0}
              title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <Button
            className="gap-2"
            variant="outline"
            onClick={() => persistWorkingCopy({ toast: true })}
            disabled={!draft || !vsn || (!dirty && !autosavePending)}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button className="gap-2" variant="outline" onClick={() => setPreviewOpen(true)} disabled={!vsn}>
            <Play className="h-4 w-4" />
            Preview
          </Button>
          <Button className="gap-2" onClick={handlePublish} disabled={!draft}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 pb-24 lg:pb-4">
        <div
          className={cn(
            'grid h-full gap-4',
            isMobile ? 'grid-cols-1' : 'lg:grid-cols-[320px_minmax(0,1fr)_360px]',
          )}
        >
          {!isMobile && (
            <div className="min-h-0 rounded-xl border bg-card p-4">
              {leftPanelContent}
            </div>
          )}

          <div className="min-h-0 grid-cols-1 gap-4 lg:grid lg:grid-rows-[minmax(0,1fr)_260px]">
            <div className="min-h-0 rounded-xl border bg-card p-4">
              <StagePreview
                doc={vsn}
                programWidth={canvasWidth}
                programHeight={canvasHeight}
                selection={selection}
                materialIndex={materialIndex}
                currentTime={currentTime}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                onSelectRegion={(regionIndex) => setSelection((prev) => ({ ...prev, regionIndex, itemIndex: null }))}
                onPatchRegionRect={(pageIndex, regionIndex, patch) => {
                  if (!vsn) return;
                  applyVsn(patchRegionRect(vsn, pageIndex, regionIndex, patch));
                }}
                onCreateRegionRect={(pageIndex, rect) => {
                  if (!vsn) return;
                  const res = addRegion(vsn, pageIndex, {
                    name: 'Window',
                    rect: {
                      X: String(rect.x),
                      Y: String(rect.y),
                      Width: String(rect.width),
                      Height: String(rect.height),
                      BorderWidth: '0',
                      BorderColor: '#000000',
                      BackColor: null,
                    },
                  });
                  applyVsn(res.doc);
                  setSelection({ pageIndex, regionIndex: res.regionIndex, itemIndex: null });
                }}
                onDropMaterial={(materialId, point) => {
                  if (!vsn) return;
                  const material = materialIndex[materialId];
                  const source = (material?.source ?? null) as MediaAssetNode | null;
                  if (!material || !source) {
                    toast.error('Material missing source asset.');
                    return;
                  }

                  const hitRegionIndex = findRegionIndexAtPoint(point);
                  let doc = vsn;
                  let regionIndex: number | null = hitRegionIndex;

                  if (regionIndex == null) {
                    const maxW = Math.round(canvasWidth * 0.6);
                    const maxH = Math.round(canvasHeight * 0.6);
                    const srcW = material.width ?? maxW;
                    const srcH = material.height ?? maxH;
                    const scale = Math.min(1, maxW / srcW, maxH / srcH);
                    const width = Math.max(80, Math.round(srcW * scale));
                    const height = Math.max(60, Math.round(srcH * scale));
                    const x = Math.round(point.x - width / 2);
                    const y = Math.round(point.y - height / 2);

                    const regionRes = createRegionForInsert({
                      name: material.name,
                      x,
                      y,
                      width,
                      height,
                    });
                    if (!regionRes) return;
                    doc = regionRes.doc;
                    regionIndex = regionRes.regionIndex;
                  }

                  if (regionIndex == null) return;

                  const item = createItemFromMedia(source, { materialId });
                  const targetRegion = getRegions(doc, selection.pageIndex)[regionIndex] ?? null;
                  const targetMode = getRegionMode(targetRegion);
                  if (targetRegion && !canRegionAcceptItemType(targetMode, item.Type)) {
                    toast.error('This window type does not support this item type.');
                    return;
                  }
                  const itemRes = addItem(doc, selection.pageIndex, regionIndex, item);
                  applyVsn(itemRes.doc);
                  setSelection((prev) => ({ ...prev, regionIndex, itemIndex: itemRes.itemIndex }));
                }}
                toolbar={
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleDuplicateSelectedRegion}
                      disabled={!canEditSelectedRegion}
                      title="Copy window"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={handleDeleteSelectedRegion}
                      disabled={!canDeleteSelectedRegion}
                      title="Delete window"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2" disabled={!canEditSelectedRegion}>
                          Align
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAlignSelectedRegion('left')}>Left</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAlignSelectedRegion('hcenter')}>Horizontal center</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAlignSelectedRegion('right')}>Right</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAlignSelectedRegion('top')}>Top</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAlignSelectedRegion('vcenter')}>Vertical center</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAlignSelectedRegion('bottom')}>Bottom</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-2" disabled={!canEditSelectedRegion}>
                          Fill
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleFillSelectedRegion('full')}>Full screen</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFillSelectedRegion('horizontal')}>Horizontal fill</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFillSelectedRegion('vertical')}>Vertical fill</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              />
            </div>

            <div className="min-h-0 overflow-hidden rounded-xl border bg-zinc-950">
              <AdvancedTimeline
                regions={regions}
                selection={selection}
                materialIndex={materialIndex}
                currentTime={currentTime}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                onCurrentTimeChange={setCurrentTime}
                onPlaybackSpeedChange={setPlaybackSpeed}
                onSelectItem={(rIdx, iIdx) =>
                  setSelection((prev) => ({ ...prev, regionIndex: rIdx, itemIndex: iIdx }))
                }
                onSelectRegion={(rIdx) => setSelection((prev) => ({ ...prev, regionIndex: rIdx, itemIndex: null }))}
                onPatchItem={(rIdx, iIdx, patch) => {
                  if (!vsn) return;
                  applyVsn(patchItem(vsn, selection.pageIndex, rIdx, iIdx, patch));
                }}
                onDeleteItem={(rIdx, iIdx) => {
                  if (!vsn) return;
                  const next = deleteItem(vsn, selection.pageIndex, rIdx, iIdx);
                  if (next === vsn) return;
                  applyVsn(next);
                  setSelection((prev) => ({ ...prev, itemIndex: null }));
                }}
                onMoveItem={(fromRIdx, fromIIdx, toRIdx, toIIdx) => {
                  if (!vsn) return;
                  const next = moveItemToRegion(vsn, selection.pageIndex, fromRIdx, fromIIdx, toRIdx, toIIdx);
                  if (next === vsn) return;
                  applyVsn(next);
                  setSelection((prev) => ({ ...prev, regionIndex: toRIdx, itemIndex: toIIdx }));
                }}
              />
            </div>
          </div>

          {!isMobile && (
            <div className="flex min-h-0 flex-col rounded-xl border bg-card p-4">
              {rightPanelContent}
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background/95 p-2 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <Layers className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(320px,85vw)] p-0">
              <div className="flex h-full flex-col p-4">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>Structure & Media</SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1">{leftPanelContent}</div>
              </div>
            </SheetContent>
          </Sheet>

          <Separator orientation="vertical" className="h-8" />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(360px,90vw)] p-0">
              <div className="flex h-full flex-col p-4">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>Properties</SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1">{rightPanelContent}</div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <ProgramPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} doc={vsn} materialIndex={materialIndex} startPageIndex={selection.pageIndex} />
      <ProgramPublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        program={program}
        deployments={deployments}
        preferredDraftId={draft?.id ?? null}
        onAfterPublish={({ program: nextProgram, deployments: nextDeployments }) => {
          setProgram(nextProgram);
          setDeployments(nextDeployments);
          if (nextProgram.defaultVersion != null) setBaseVersion(nextProgram.defaultVersion);
        }}
      />

      <Dialog
        open={draftPromptOpen}
        onOpenChange={(next) => {
          setDraftPromptOpen(next);
          if (!next) {
            if (draftPromptIntent?.type === 'navigate') navigationBlocker.reset?.();
            setDraftPromptIntent(null);
          }
        }}
      >
        <DialogContent className="max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ring-1 ring-foreground/5">
          <div className="bg-background">
            <div className="p-10 pb-6">
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-amber-500/10 text-amber-600 shadow-inner">
                <TriangleAlert className="h-7 w-7" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Unpublished Changes</DialogTitle>
                <DialogDescription className="text-sm leading-relaxed pt-3 opacity-70">
                  Your workspace has active modifications. Choose how to handle these changes before navigating away.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8">
                <div className="rounded-[1.5rem] border border-border/40 bg-muted/20 p-6 transition-all hover:bg-muted/30">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 mb-3">Workspace Context</p>
                  <p className="text-lg font-black tracking-tight text-foreground/80">{program.name}</p>
                  <div className="mt-5 flex items-center gap-4">
                    <Badge variant="outline" className="h-6 px-2 font-black text-[10px] bg-background border-border/50 uppercase tracking-wider">
                      {baseVersion == null ? 'Blank Baseline' : `Baseline v${baseVersion}`}
                    </Badge>
                    <div className="h-4 w-px bg-border/40" />
                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                      Snap: {draft?.id ? draft.id.slice(0, 8) : 'New'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-10 pt-8 sm:flex-row sm:items-center border-t bg-muted/5">
              <Button
                type="button"
                variant="ghost"
                className="font-black text-[10px] uppercase tracking-[0.2em] px-6 h-11"
                onClick={() => {
                  setDraftPromptOpen(false);
                  if (draftPromptIntent?.type === 'navigate') navigationBlocker.reset?.();
                  setDraftPromptIntent(null);
                }}
              >
                Return
              </Button>
              <div className="hidden sm:block flex-1" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="font-black text-[10px] uppercase tracking-[0.15em] px-8 h-11 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                  onClick={() => {
                    discardWorkingCopy();
                    setSessionHasChanges(false);
                    setDraftPromptOpen(false);
                    const intent = draftPromptIntent;
                    setDraftPromptIntent(null);
                    if (intent?.type === 'switch') setBaseVersion(intent.nextBaseVersion);
                    else if (intent?.type === 'navigate') navigationBlocker.proceed?.();
                  }}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  className="font-black text-[10px] uppercase tracking-[0.15em] px-10 h-11 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => {
                    persistWorkingCopy();
                    setSessionHasChanges(false);
                    setDraftPromptOpen(false);
                    const intent = draftPromptIntent;
                    setDraftPromptIntent(null);
                    if (intent?.type === 'switch') setBaseVersion(intent.nextBaseVersion);
                    else if (intent?.type === 'navigate') navigationBlocker.proceed?.();
                  }}
                >
                  Save Draft
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RightTabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={
        active
          ? 'inline-flex items-center gap-2 rounded-full border border-primary/50 bg-accent px-3 py-1 text-xs font-medium'
          : 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-accent/20'
      }
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function buildEditorMaterials(nodes: unknown[]): EditorMaterial[] {
  const assets = (nodes as { type: string }[]).filter((n) => n && typeof n === 'object' && (n as { type: string }).type === 'asset') as MediaAssetNode[];
  return assets
    .filter((a) => a.assetKind === 'image' || a.assetKind === 'video')
    .map((asset) => {
      const materialId = resolveMaterialId(asset.id);
      return {
        assetId: asset.id,
        materialId,
        source: asset,
        name: asset.name,
        kind: asset.assetKind,
        extension: asset.extension,
        coverUrl: asset.coverUrl,
        assetUrl: asset.assetUrl,
        width: asset.width,
        height: asset.height,
        durationMs: asset.durationMs,
      } satisfies EditorMaterial;
    });
}

function pickLatestDraft(program: ProgramRecord): ProgramDraftRecord | null {
  if (!program.drafts.length) return null;
  return [...program.drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}
