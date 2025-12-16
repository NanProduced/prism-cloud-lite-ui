import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Code2, ListChecks, Save, Send, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { mockMediaLibraryNodes } from '@/lib/mock/media-library';

import {
  ensureDraft,
  getProgram,
  publishDraft,
  saveDraft,
  type ProgramDraftRecord,
  type ProgramRecord,
} from '@/features/programs/storage/programsDb';
import { resolveMaterialId } from '@/features/programs/storage/materialId';
import { createItemFromMedia, createTextItem } from '@/features/programs/vsn/defaults';
import type { VsnDocument } from '@/features/programs/vsn/types';
import { validateVsnDocument } from '@/features/programs/vsn/validator';
import type { MediaAssetNode } from '@/types/media-library';

import type { EditorMaterial, EditorSelection } from '@/features/programs/editor/types';
import { EditorLeftPanel } from '@/features/programs/editor/components/EditorLeftPanel';
import { InspectorPanel } from '@/features/programs/editor/components/InspectorPanel';
import { ProblemsPanel } from '@/features/programs/editor/components/ProblemsPanel';
import { RegionTimeline } from '@/features/programs/editor/components/RegionTimeline';
import { StagePreview } from '@/features/programs/editor/components/StagePreview';
import { VsnJsonPanel } from '@/features/programs/editor/components/VsnJsonPanel';
import {
  addItem,
  addPage,
  addRegion,
  deleteItem,
  deletePage,
  deleteRegion,
  getItems,
  getPages,
  getRegions,
  moveItem,
  patchItem,
  patchPage,
  patchRegion,
  patchRegionRect,
} from '@/features/programs/editor/vsnOps';
import { clampInt } from '@/features/programs/editor/utils';

export default function ProgramEditorPage() {
  const navigate = useNavigate();
  const { programId } = useParams<{ programId: string }>();

  const [program, setProgram] = useState<ProgramRecord | null>(null);
  const [baseVersion, setBaseVersion] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProgramDraftRecord | null>(null);
  const [vsn, setVsn] = useState<VsnDocument | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selection, setSelection] = useState<EditorSelection>({ pageIndex: 0, regionIndex: null, itemIndex: null });
  const [rightTab, setRightTab] = useState<'inspector' | 'problems' | 'json'>('inspector');

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
    if (!programId || !program) return;
    const d = ensureDraft(programId, baseVersion);
    setDraft(d);
    setVsn(d?.vsn ?? null);
    setDirty(false);
    setSelection({ pageIndex: 0, regionIndex: null, itemIndex: null });
  }, [baseVersion, program, programId]);

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

  const validation = useMemo(() => (vsn ? validateVsnDocument(vsn, 'publish') : { issues: [], isValid: false }), [vsn]);
  const errorCount = useMemo(() => validation.issues.filter((i) => i.severity === 'error').length, [validation.issues]);
  const warningCount = useMemo(() => validation.issues.filter((i) => i.severity === 'warning').length, [validation.issues]);

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
      setRightTab('problems');
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

  const ensureRegionSelected = (): number | null => {
    if (selection.regionIndex != null) return selection.regionIndex;
    if (regions.length === 0) return null;
    setSelection((prev) => ({ ...prev, regionIndex: 0, itemIndex: null }));
    return 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
              {program.width}×{program.height}
              {draft?.baseVersion ? ` · Draft from v${draft.baseVersion}` : ' · Draft'}
              {dirty ? ' · Unsaved changes' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2">
            <span className={errorCount ? 'rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-600' : 'rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground'}>
              {errorCount} error
            </span>
            <span className={warningCount ? 'rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-700' : 'rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground'}>
              {warningCount} warn
            </span>
          </div>

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
          <Button className="gap-2" onClick={handlePublish} disabled={!draft}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 lg:h-[calc(100vh-14rem)] lg:grid-cols-[320px_minmax(0,1fr)_360px]">
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
              const res = addPage(vsn, { width: program.width, height: program.height });
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
              const regionIndex = ensureRegionSelected();
              if (regionIndex == null) return;
              const res = addItem(vsn, selection.pageIndex, regionIndex, createTextItem());
              applyVsn(res.doc);
              setSelection((prev) => ({ ...prev, regionIndex, itemIndex: res.itemIndex }));
            }}
            onAddMaterialItem={(material) => {
              if (!vsn) return;
              const regionIndex = ensureRegionSelected();
              if (regionIndex == null) return;
              const source = (material.source ?? null) as MediaAssetNode | null;
              if (!source) {
                toast.error('Material missing source asset.');
                return;
              }
              const item = createItemFromMedia(source, { materialId: material.materialId });
              const res = addItem(vsn, selection.pageIndex, regionIndex, item);
              applyVsn(res.doc);
              setSelection((prev) => ({ ...prev, regionIndex, itemIndex: res.itemIndex }));
            }}
          />
        </div>

        <div className="min-h-0 grid-cols-1 gap-4 lg:grid lg:grid-rows-[minmax(0,1fr)_260px]">
          <div className="min-h-0 rounded-xl border bg-card p-4">
            <StagePreview
              doc={vsn}
              programWidth={program.width}
              programHeight={program.height}
              selection={selection}
              materialIndex={materialIndex}
              onSelectRegion={(regionIndex) => setSelection((prev) => ({ ...prev, regionIndex, itemIndex: null }))}
            />
          </div>

          <div className="min-h-0 rounded-xl border bg-card p-4">
            <RegionTimeline
              items={items}
              selectedItemIndex={selection.itemIndex}
              materialIndex={materialIndex}
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
          <div className="flex items-center gap-2">
            <RightTabButton active={rightTab === 'inspector'} onClick={() => setRightTab('inspector')} icon={<SlidersHorizontal className="h-4 w-4" />}>
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

          <div className="min-h-0 flex-1">
            {rightTab === 'inspector' ? (
              <InspectorPanel
                doc={vsn}
                selection={selection}
                materialIndex={materialIndex}
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
                issues={validation.issues}
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
