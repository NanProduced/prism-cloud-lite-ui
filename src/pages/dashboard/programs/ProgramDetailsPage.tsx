import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy, FilePlus2, LayoutPanelTop, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import {
  deleteDraft,
  deleteProgram,
  deleteProgramVersion,
  getProgram,
  renameDraft,
  renameProgram,
  setDefaultProgramVersion,
  type ProgramDraftRecord,
  type ProgramRecord,
} from '@/features/programs/storage/programsDb';
import { createProgramTemplate } from '@/features/programs/storage/templatesDb';
import type { VsnDocument } from '@/features/programs/vsn/types';
import { summarizeVsn } from '@/features/programs/vsn/summary';

type TabKey = 'overview' | 'drafts' | 'versions';

export default function ProgramDetailsPage() {
  const navigate = useNavigate();
  const { programId } = useParams<{ programId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [program, setProgram] = useState<ProgramRecord | null>(() => (programId ? getProgram(programId) : null));
  const tab = (searchParams.get('tab') as TabKey | null) ?? 'overview';

  const latestDraft = useMemo(() => pickLatestDraft(program), [program]);
  const previewDoc = latestDraft?.vsn ?? program?.versions?.[0]?.vsn ?? null;
  const summary = useMemo(() => summarizeVsn(previewDoc), [previewDoc]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(program?.name ?? '');

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [renameDraftOpen, setRenameDraftOpen] = useState(false);
  const [renameDraftTarget, setRenameDraftTarget] = useState<ProgramDraftRecord | null>(null);
  const [renameDraftValue, setRenameDraftValue] = useState('');

  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateSource, setTemplateSource] = useState<'latestDraft' | 'defaultVersion'>('latestDraft');

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
        <p className="text-sm font-medium">Program not found</p>
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

  const versionCount = program.versions.length;
  const versionLimit = 10;
  const versionUsagePct = Math.min(100, Math.round((versionCount / versionLimit) * 100));

  const goToTab = (next: TabKey) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', next);
      return p;
    });
  };

  const openEditor = (baseVersion: number | null) => {
    const q = baseVersion == null ? 'blank' : `v${baseVersion}`;
    navigate(`/dashboard/programs/${program.id}/edit?base=${encodeURIComponent(q)}`);
  };

  const handleProgramRename = () => {
    const next = renameProgram(program.id, renameValue.trim() || program.name);
    if (!next) return;
    setProgram(next);
    toast.success('Program renamed');
    setRenameOpen(false);
  };

  const handleDeleteProgram = () => {
    const ok = deleteProgram(program.id);
    if (!ok) return;
    toast.success('Program deleted');
    navigate('/dashboard/programs');
  };

  const handleRenameDraft = () => {
    if (!renameDraftTarget) return;
    const next = renameDraft(program.id, renameDraftTarget.id, renameDraftValue);
    if (!next) return;
    const reloaded = getProgram(program.id);
    setProgram(reloaded);
    toast.success('Draft renamed');
    setRenameDraftOpen(false);
  };

  const handleDeleteDraft = (draftId: string) => {
    if (program.drafts.length <= 1) {
      toast.error('Keep at least one draft.');
      return;
    }
    const next = deleteDraft(program.id, draftId);
    if (!next) return;
    setProgram(next);
    toast.success('Draft deleted');
  };

  const handleSetDefaultVersion = (version: number | null) => {
    const next = setDefaultProgramVersion(program.id, version);
    if (!next) {
      toast.error('Unable to set default version.');
      return;
    }
    setProgram(next);
    toast.success(version == null ? 'Default version cleared' : `Default set to v${version}`);
  };

  const handleDeleteVersion = (version: number) => {
    const next = deleteProgramVersion(program.id, version);
    if (!next) {
      toast.error('Cannot delete this version (it may be default or used by a draft).');
      return;
    }
    setProgram(next);
    toast.success(`Deleted v${version}`);
  };

  const handleCreateTemplate = () => {
    const source =
      templateSource === 'defaultVersion'
        ? program.versions.find((v) => v.version === program.defaultVersion)?.vsn ?? null
        : latestDraft?.vsn ?? null;
    if (!source) {
      toast.error('No source content available.');
      return;
    }
    const name = templateName.trim() || `${program.name} Template`;
    createProgramTemplate({ name, description: templateDescription, sourceVsn: source });
    toast.success('Template created');
    setTemplateOpen(false);
    navigate('/dashboard/programs?tab=templates');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate('/dashboard/programs')} title="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{program.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {program.width}×{program.height} · {summary.pageCount} page{summary.pageCount === 1 ? '' : 's'} · {summary.regionCount} window
              {summary.regionCount === 1 ? '' : 's'} · {versionCount} version{versionCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" className="gap-2" onClick={() => openEditor(program.defaultVersion ?? latestPublished(program))}>
            <LayoutPanelTop className="h-4 w-4" />
            Open editor
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setTemplateOpen(true)} disabled={!latestDraft && program.versions.length === 0}>
            <FilePlus2 className="h-4 w-4" />
            Save as template
          </Button>
          <Button variant="outline" size="icon" onClick={() => { setRenameValue(program.name); setRenameOpen(true); }} title="Rename">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            title="Delete program"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Lite allows up to {versionLimit} published versions per program.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleSetDefaultVersion(null)} disabled={program.defaultVersion == null}>
              Clear default
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={async () => {
              try {
                await navigator.clipboard.writeText(program.id);
                toast.success('Copied program id');
              } catch {
                toast.error('Copy failed');
              }
            }}>
              <Copy className="h-4 w-4" />
              Copy ID
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {versionCount}/{versionLimit} published
              {program.defaultVersion != null ? ` · default v${program.defaultVersion}` : ''}
            </span>
            <span className={cn('text-xs', versionCount >= versionLimit ? 'text-amber-700' : 'text-muted-foreground')}>
              {versionCount >= versionLimit ? 'Limit reached' : 'OK'}
            </span>
          </div>
          <Progress value={versionUsagePct} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === 'overview'} onClick={() => goToTab('overview')}>
          Overview
        </TabButton>
        <TabButton active={tab === 'drafts'} onClick={() => goToTab('drafts')}>
          Drafts
        </TabButton>
        <TabButton active={tab === 'versions'} onClick={() => goToTab('versions')}>
          Versions
        </TabButton>
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Layout</CardTitle>
              <CardDescription>First page snapshot (layout only).</CardDescription>
            </CardHeader>
            <CardContent>
              <ProgramLayoutThumbnail doc={previewDoc} />
              <div className="mt-3 text-xs text-muted-foreground">
                {summary.uniqueMaterialCount} unique material{summary.uniqueMaterialCount === 1 ? '' : 's'} · {formatDurationMs(summary.totalDurationMs)} cycle
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
              <CardDescription>How this program connects to the rest of the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="font-medium">Deploy to devices</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a published version and push it to target devices. (Schedule integration will be added next.)
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Deploy (coming soon)
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/devices">View devices</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dashboard/schedule">Open schedule</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="font-medium">Draft workflow</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drafts are working copies. Publish creates immutable versions (v1…vN) for devices.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => goToTab('drafts')}>
                    Manage drafts
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => goToTab('versions')}>
                    Manage versions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'drafts' && (
        <Card>
          <CardHeader>
            <CardTitle>Drafts</CardTitle>
            <CardDescription>Drafts are editable and can be published into new versions.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {program.drafts.length === 0 ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">No drafts.</div>
            ) : (
              <div className="divide-y">
                {[...program.drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((d) => (
                  <div key={d.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {d.name?.trim() ? d.name : d.baseVersion ? `Draft from v${d.baseVersion}` : 'Draft (blank)'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.baseVersion ? `Base v${d.baseVersion}` : 'Base blank'} · Updated {formatRelativeTime(d.updatedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditor(d.baseVersion)}>
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRenameDraftTarget(d);
                          setRenameDraftValue(d.name?.trim() ? d.name : '');
                          setRenameDraftOpen(true);
                        }}
                      >
                        Rename
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDraft(d.id)}
                        disabled={program.drafts.length <= 1}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'versions' && (
        <Card>
          <CardHeader>
            <CardTitle>Published versions</CardTitle>
            <CardDescription>Versions are immutable snapshots. To edit, create/open a draft from a version.</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {program.versions.length === 0 ? (
              <div className="px-6 py-10 text-sm text-muted-foreground">No published versions yet.</div>
            ) : (
              <div className="divide-y">
                {[...program.versions].sort((a, b) => b.version - a.version).map((v) => (
                  <div key={v.version} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        v{v.version} {program.defaultVersion === v.version ? <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Default</span> : null}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Created {formatRelativeTime(v.createdAt)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditor(v.version)}>
                        Edit from this
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefaultVersion(v.version)}
                        disabled={program.defaultVersion === v.version}
                      >
                        Set default
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteVersion(v.version)}
                        disabled={program.defaultVersion === v.version || program.drafts.some((d) => d.baseVersion === v.version)}
                        title={
                          program.defaultVersion === v.version
                            ? 'Cannot delete the default version.'
                            : program.drafts.some((d) => d.baseVersion === v.version)
                              ? 'Delete drafts based on this version first.'
                              : 'Delete version'
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Rename program</DialogTitle>
            <DialogDescription>Update the program name across lists and editors.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Program name" />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProgramRename}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Delete program</DialogTitle>
            <DialogDescription>This removes drafts and version history from your account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-3 text-sm">
              <p className="font-medium">{program.name}</p>
              <p className="mt-1 text-muted-foreground">{program.width}×{program.height} · {program.versions.length} versions · {program.drafts.length} drafts</p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteProgram}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameDraftOpen}
        onOpenChange={(open) => {
          setRenameDraftOpen(open);
          if (!open) setRenameDraftTarget(null);
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Rename draft</DialogTitle>
            <DialogDescription>Optional display name for your working copy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={renameDraftValue} onChange={(e) => setRenameDraftValue(e.target.value)} placeholder="e.g. Holiday iteration" />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setRenameDraftOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameDraft} disabled={!renameDraftTarget}>
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
            setTemplateSource('latestDraft');
          }
        }}
      >
        <DialogContent className="w-[min(100vw-2rem,560px)] max-w-none">
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
            <DialogDescription>Templates keep layout and window settings, but remove all media items.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="tpl-name">
                  Template name
                </label>
                <Input id="tpl-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder={`${program.name} Template`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="tpl-source">
                  Source
                </label>
                <select
                  id="tpl-source"
                  value={templateSource}
                  onChange={(e) => setTemplateSource(e.target.value as typeof templateSource)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="latestDraft">Latest draft (recommended)</option>
                  <option value="defaultVersion" disabled={program.defaultVersion == null}>
                    Default version
                  </option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tpl-desc">
                Description (optional)
              </label>
              <Input id="tpl-desc" value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="e.g. Two-zone layout for lobby screens" />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setTemplateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>Create template</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-full border px-4 py-2 text-sm transition-colors',
        active ? 'border-primary/50 bg-accent text-accent-foreground' : 'hover:bg-accent/20',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function pickLatestDraft(program: ProgramRecord | null): ProgramDraftRecord | null {
  if (!program || program.drafts.length === 0) return null;
  return [...program.drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

function latestPublished(program: ProgramRecord): number | null {
  if (!program.versions.length) return null;
  return Math.max(...program.versions.map((v) => v.version));
}

function ProgramLayoutThumbnail({ doc }: { doc: VsnDocument | null }) {
  const info = doc?.Programs?.Program?.Information;
  const w = Number.parseInt(info?.Width ?? '0', 10) || 1920;
  const h = Number.parseInt(info?.Height ?? '0', 10) || 1080;
  const page = doc?.Programs?.Program?.Pages?.Page?.[0] ?? null;
  const regions = page?.Regions?.Region;
  const regionArr = Array.isArray(regions) ? regions : [];
  const scale = 320 / Math.max(1, w);
  const heightPx = Math.max(120, Math.round(h * scale));

  return (
    <div className="rounded-lg border bg-muted/10 p-3">
      <div className="relative overflow-hidden rounded-md border bg-black/70" style={{ width: 320, height: heightPx }}>
        {regionArr.map((region, idx) => {
          const rect = region.Rect;
          const x = Number.parseFloat(rect?.X ?? '0') || 0;
          const y = Number.parseFloat(rect?.Y ?? '0') || 0;
          const rw = Number.parseFloat(rect?.Width ?? '0') || 1;
          const rh = Number.parseFloat(rect?.Height ?? '0') || 1;
          return (
            <div
              key={`r-${idx}`}
              className="absolute rounded border border-white/35 bg-white/5"
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

