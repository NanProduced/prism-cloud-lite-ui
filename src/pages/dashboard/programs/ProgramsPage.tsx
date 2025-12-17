import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FilePlus2, LayoutPanelTop } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { createProgram, createProgramFromSeed, listPrograms, type ProgramRecord } from '@/features/programs/storage/programsDb';
import { deleteProgramTemplate, listProgramTemplates, renameProgramTemplate, type ProgramTemplateRecord } from '@/features/programs/storage/templatesDb';
import { summarizeVsn } from '@/features/programs/vsn/summary';

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

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('New Program');
  const [createPresetIndex, setCreatePresetIndex] = useState(0);
  const [createMode, setCreateMode] = useState<'blank' | 'template'>('blank');
  const [createTemplateId, setCreateTemplateId] = useState<string>('');

  const tab = (searchParams.get('tab') ?? 'programs').toLowerCase();

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => p.name.toLowerCase().includes(q));
  }, [programs, query]);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => t.name.toLowerCase().includes(q));
  }, [query, templates]);

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
    const record = createProgram({ name, width: preset.width, height: preset.height });
    setPrograms(listPrograms());
    setCreateOpen(false);
    navigate(`/dashboard/programs/${record.id}/edit`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Programs</h1>
          <p className="text-sm text-muted-foreground">
            Build signage content with drafts, versions, and publishing.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="w-full sm:w-[280px]">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search programs…"
            />
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <FilePlus2 className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            'rounded-full border px-4 py-2 text-sm transition-colors',
            tab !== 'templates' ? 'border-primary/50 bg-accent text-accent-foreground' : 'hover:bg-accent/20',
          )}
          onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.delete('tab'); return p; })}
        >
          All programs
        </button>
        <button
          type="button"
          className={cn(
            'rounded-full border px-4 py-2 text-sm transition-colors',
            tab === 'templates' ? 'border-primary/50 bg-accent text-accent-foreground' : 'hover:bg-accent/20',
          )}
          onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set('tab', 'templates'); return p; })}
        >
          Templates
        </button>
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
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
              <div className="rounded-full bg-muted p-3">
                <FilePlus2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No programs found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a program to start designing content for your devices.
                </p>
              </div>
              <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                <FilePlus2 className="h-4 w-4" />
                Create program
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{program.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {program.width}×{program.height} · {program.versions.length} version{program.versions.length === 1 ? '' : 's'}
                      {program.defaultVersion ? ` · default v${program.defaultVersion}` : ''}
                      {program.drafts.length ? ` · ${program.drafts.length} draft${program.drafts.length === 1 ? '' : 's'}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {formatRelativeTime(program.updatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      variant="outline"
                      className={cn('justify-center')}
                      onClick={() => navigate(`/dashboard/programs/${program.id}`)}
                    >
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      className={cn('justify-center')}
                      onClick={() => navigate(`/dashboard/programs/${program.id}/edit`)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
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

          <div className="space-y-4">
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
              <select
                id="program-create-mode"
                value={createMode}
                onChange={(e) => setCreateMode(e.target.value as typeof createMode)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="blank">Blank program</option>
                <option value="template" disabled={templates.length === 0}>
                  Template
                </option>
              </select>
              {createMode === 'template' && templates.length === 0 && (
                <p className="text-xs text-muted-foreground">No templates yet. Create one from a program details page.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="program-resolution">
                {createMode === 'template' ? 'Template' : 'Resolution'}
              </label>
              {createMode === 'template' ? (
                <select
                  id="program-resolution"
                  value={createTemplateId}
                  onChange={(e) => setCreateTemplateId(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="" disabled>
                    Select a template…
                  </option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} · {tpl.width}×{tpl.height}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  id="program-resolution"
                  value={String(createPresetIndex)}
                  onChange={(e) => setCreatePresetIndex(Number(e.target.value))}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {RESOLUTION_PRESETS.map((preset, index) => (
                    <option key={preset.label} value={String(index)}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMode === 'template' && !createTemplateId}>
                Create &amp; open editor
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
