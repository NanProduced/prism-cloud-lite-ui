import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Code2, Copy, ListChecks, Play, Save, Send, SlidersHorizontal, Trash2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { mockMediaLibraryNodes } from '@/lib/mock/media-library';
import { mockDevices } from '@/lib/mock/devices';

import {
  ensureDraft,
  getProgram,
  publishDraft,
  renameProgram,
  saveDraft,
  updateProgramCanvas,
  type ProgramDraftRecord,
  type ProgramRecord,
} from '@/features/programs/storage/programsDb';
import { resolveMaterialId } from '@/features/programs/storage/materialId';
import { createItemFromMedia, createScrollTextItem, createTextItem } from '@/features/programs/vsn/defaults';
import type { VsnDocument } from '@/features/programs/vsn/types';
import { validateVsnDocument } from '@/features/programs/vsn/validator';
import type { MediaAssetNode } from '@/types/media-library';

import type { EditorMaterial, EditorSelection } from '@/features/programs/editor/types';
import { EditorLeftPanel } from '@/features/programs/editor/components/EditorLeftPanel';
import { InspectorPanel } from '@/features/programs/editor/components/InspectorPanel';
import { ProblemsPanel } from '@/features/programs/editor/components/ProblemsPanel';
import { RegionTimeline } from '@/features/programs/editor/components/RegionTimeline';
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
  getItems,
  getPages,
  getRegions,
  moveItem,
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

  const [program, setProgram] = useState<ProgramRecord | null>(null);
  const [baseVersion, setBaseVersion] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProgramDraftRecord | null>(null);
  const [vsn, setVsn] = useState<VsnDocument | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selection, setSelection] = useState<EditorSelection>({ pageIndex: 0, regionIndex: null, itemIndex: null });
  const [rightTab, setRightTab] = useState<'inspector' | 'problems' | 'json'>('inspector');
  const [previewOpen, setPreviewOpen] = useState(false);

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
    const initialBase = loaded.defaultVersion ?? latest ?? null;
    setBaseVersion(initialBase);
  }, [programId]);

  useEffect(() => {
    if (!programId) return;
    const loaded = getProgram(programId);
    if (!loaded) return;
    setProgram(loaded);
    const d = ensureDraft(programId, baseVersion);
    setDraft(d);
    setVsn(d?.vsn ? normalizeVsnForEditor(d.vsn) : null);
    setDirty(false);
    setSelection({ pageIndex: 0, regionIndex: null, itemIndex: null });
  }, [baseVersion, programId]);

  const versionOptions = useMemo(() => {
    if (!program) return [];
    const versions = [...program.versions].sort((a, b) => b.version - a.version);
    return versions.map((v) => v.version);
  }, [program]);

  const materials = useMemo(() => buildEditorMaterials(mockMediaLibraryNodes), []);
  const materialIndex = useMemo(() => Object.fromEntries(materials.map((m) => [m.materialId, m])) as Record<string, EditorMaterial>, [materials]);

  const pages = useMemo(() => getPages(vsn), [vsn]);
  const regions = useMemo(() => getRegions(vsn, selection.pageIndex), [vsn, selection.pageIndex]);
  const items = useMemo(() => (selection.regionIndex == null ? [] : getItems(vsn, selection.pageIndex, selection.regionIndex)), [selection.pageIndex, selection.regionIndex, vsn]);

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

  const handleSaveDraft = () => {
    if (!draft || !vsn) return;
    saveDraft(program.id, draft.id, vsn);
    toast.success('Draft saved');
    setDirty(false);
  };

  const handlePublish = () => {
    if (!draft || !vsn) return;
    const res = validateVsnDocument(vsn, 'publish');
    if (!res.isValid) {
      toast.error(`Fix ${res.issues.filter((i) => i.severity === 'error').length} error(s) before publishing.`);
      return;
    }
    try {
      if (dirty) saveDraft(program.id, draft.id, vsn);
      const res = publishDraft(program.id, draft.id);
      if (!res) throw new Error('Publish failed.');
      setProgram(res.program);
      toast.success(`Published v${res.version.version}`);
      setBaseVersion(res.version.version);
      setDirty(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed.';
      toast.error(message);
    }
  };

  const applyVsn = (next: VsnDocument) => {
    setVsn(next);
    setDirty(true);
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
              {draft?.baseVersion ? ` · Draft from v${draft.baseVersion}` : ' · Draft'}
              {dirty ? ' · Unsaved changes' : ''}
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
            <label className="text-sm text-muted-foreground" htmlFor="base-version">
              Base
            </label>
            <select
              id="base-version"
              value={baseVersion === null ? 'blank' : String(baseVersion)}
              onChange={(e) => {
                const value = e.target.value === 'blank' ? null : Number(e.target.value);
                setBaseVersion(value);
              }}
              className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="blank">Blank</option>
              {versionOptions.map((v) => (
                <option key={v} value={String(v)}>
                  v{v}
                </option>
              ))}
            </select>
          </div>

          <Button className="gap-2" variant="outline" onClick={handleSaveDraft} disabled={!draft || !vsn || !dirty}>
            <Save className="h-4 w-4" />
            Save draft
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

      <div className="flex-1 overflow-hidden p-4">
        <div className="grid h-full gap-4 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
          <div className="min-h-0 rounded-xl border bg-card p-4">
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
                setSelection((prev) => ({ ...prev, pageIndex: clampInt(prev.pageIndex, 0, getPages(next).length - 1), regionIndex: null, itemIndex: null }));
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
          </div>

          <div className="min-h-0 grid-cols-1 gap-4 lg:grid lg:grid-rows-[minmax(0,1fr)_260px]">
            <div className="min-h-0 rounded-xl border bg-card p-4">
              <StagePreview
                doc={vsn}
                programWidth={canvasWidth}
                programHeight={canvasHeight}
                selection={selection}
                materialIndex={materialIndex}
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

            <div className="min-h-0 rounded-xl border bg-card p-4">
              <RegionTimeline
                items={items}
                selectedItemIndex={selection.itemIndex}
                materialIndex={materialIndex}
                showDevFields={devtoolsEnabled}
                onSelectItem={(index) => setSelection((prev) => ({ ...prev, itemIndex: index }))}
                onMoveItem={(from, to) => {
                  if (!vsn) return;
                  if (selection.regionIndex == null) return;
                  const next = moveItem(vsn, selection.pageIndex, selection.regionIndex, from, to);
                  if (next === vsn) return;
                  applyVsn(next);
                  setSelection((prev) => ({ ...prev, itemIndex: clampInt(prev.itemIndex ?? 0, 0, getItems(next, prev.pageIndex, prev.regionIndex ?? 0).length - 1) }));
                }}
                onDeleteItem={(index) => {
                  if (!vsn) return;
                  if (selection.regionIndex == null) return;
                  const next = deleteItem(vsn, selection.pageIndex, selection.regionIndex, index);
                  if (next === vsn) return;
                  applyVsn(next);
                  setSelection((prev) => ({ ...prev, itemIndex: null }));
                }}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-xl border bg-card p-4">
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
        </div>
      </div>

      <ProgramPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} doc={vsn} materialIndex={materialIndex} startPageIndex={selection.pageIndex} />
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
