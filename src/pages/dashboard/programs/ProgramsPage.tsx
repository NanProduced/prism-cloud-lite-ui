import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus2, LayoutPanelTop } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { createProgram, listPrograms, type ProgramRecord } from '@/features/programs/storage/programsDb';

type ResolutionPreset = { label: string; width: number; height: number };

const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: '1920 × 1080 (Landscape)', width: 1920, height: 1080 },
  { label: '1080 × 1920 (Portrait)', width: 1080, height: 1920 },
  { label: '3840 × 2160 (4K)', width: 3840, height: 2160 },
  { label: '1366 × 768', width: 1366, height: 768 },
];

export default function ProgramsPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramRecord[]>(() => listPrograms());
  const [query, setQuery] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('New Program');
  const [createPresetIndex, setCreatePresetIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => p.name.toLowerCase().includes(q));
  }, [programs, query]);

  const handleCreate = () => {
    const preset = RESOLUTION_PRESETS[createPresetIndex] ?? RESOLUTION_PRESETS[0];
    const name = createName.trim() || 'Untitled Program';
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

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LayoutPanelTop className="h-5 w-5 text-muted-foreground" />
              All Programs
            </CardTitle>
            <CardDescription>
              {filtered.length} program{filtered.length === 1 ? '' : 's'} · {programs.length} total
            </CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filtered.length === 0 ? (
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
              {filtered.map((program) => (
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
              <label className="text-sm font-medium" htmlFor="program-resolution">
                Resolution
              </label>
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
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create &amp; open editor</Button>
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
