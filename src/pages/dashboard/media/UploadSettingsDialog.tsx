import { useMemo, useState } from 'react';
import { formatBytes } from '@better-upload/client/helpers';
import { ChevronRight, FileText, Folder, FolderPlus, Image as ImageIcon, Video } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { MediaNode } from '@/types/media-library';

import type { PendingUploadFile } from './uploadModels';

type FolderTreeNode = {
  id: string;
  name: string;
  depth: number;
  children: FolderTreeNode[];
};

export function UploadSettingsDialog({
  open,
  onOpenChange,
  pendingFiles,
  folderNodes,
  selectedFolderId,
  onSelectedFolderIdChange,
  onPendingTitleChange,
  onConfirm,
  onPickMore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingFiles: PendingUploadFile[];
  folderNodes: MediaNode[];
  selectedFolderId: string | null;
  onSelectedFolderIdChange: (id: string | null) => void;
  onPendingTitleChange: (pendingId: string, title: string) => void;
  onConfirm: () => void;
  onPickMore: () => void;
}) {
  const folderTree = useMemo(() => buildFolderTree(folderNodes), [folderNodes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-6">
        <DialogHeader>
          <DialogTitle>Upload Settings</DialogTitle>
          <DialogDescription>
            Choose destination folder and review file names. Upload will start after you confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Destination</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => toast.message('TODO: Create folder')}
              >
                <FolderPlus className="h-4 w-4" />
                New
              </Button>
            </div>
            <Separator className="my-3" />
            <ScrollArea className="max-h-[360px] pr-2">
              <FolderTree
                tree={folderTree}
                selectedId={selectedFolderId}
                onSelect={onSelectedFolderIdChange}
              />
            </ScrollArea>
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Files</p>
              <Button variant="outline" size="sm" onClick={onPickMore}>
                Add more
              </Button>
            </div>
            <Separator className="my-3" />

            <ScrollArea className="max-h-[360px] pr-2">
              <div className="space-y-3">
                {pendingFiles.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                    No files selected.
                  </div>
                ) : (
                  pendingFiles.map((p) => (
                    <div key={p.id} className="rounded-lg border bg-background px-3 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-muted p-2">
                          {p.kind === 'video' ? (
                            <Video className="h-4 w-4 text-muted-foreground" />
                          ) : p.kind === 'image' ? (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{p.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatBytes(p.file.size)}
                                {p.width && p.height ? ` · ${p.width}×${p.height}` : ''}
                                {p.durationMs ? ` · ${formatDuration(p.durationMs)}` : ''}
                              </p>
                            </div>

                            <div className="w-full sm:w-[240px]">
                              <label className="sr-only" htmlFor={`asset-title-${p.id}`}>
                                Asset title
                              </label>
                              <Input
                                id={`asset-title-${p.id}`}
                                value={p.title}
                                onChange={(e) => onPendingTitleChange(p.id, e.target.value)}
                                placeholder="Asset title"
                              />
                            </div>
                          </div>

                          {p.parseError && (
                            <p className="mt-2 text-xs text-amber-600">
                              {p.parseError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={pendingFiles.length === 0}>
            Start Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildFolderTree(nodes: MediaNode[]): FolderTreeNode[] {
  const folders = nodes.filter((n) => n.type === 'folder');
  const byParent = new Map<string | null, MediaNode[]>();
  for (const folder of folders) {
    const arr = byParent.get(folder.parentId) ?? [];
    arr.push(folder);
    byParent.set(folder.parentId, arr);
  }

  const walk = (parentId: string | null, depth: number): FolderTreeNode[] => {
    const children = (byParent.get(parentId) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
    return children.map((child) => ({
      id: child.id,
      name: child.name,
      depth,
      children: walk(child.id, depth + 1),
    }));
  };

  return walk(null, 0);
}

function FolderTree({
  tree,
  selectedId,
  onSelect,
}: {
  tree: FolderTreeNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="space-y-1">
      <FolderTreeRow
        depth={0}
        label="My Media"
        selected={selectedId == null}
        onClick={() => onSelect(null)}
      />
      {tree.map((node) => (
        <FolderTreeBranch key={node.id} node={node} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

function FolderTreeBranch({
  node,
  selectedId,
  onSelect,
}: {
  node: FolderTreeNode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div className="flex items-center">
        {hasChildren ? (
          <button
            type="button"
            className="mr-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />
          </button>
        ) : (
          <span className="mr-1 inline-flex h-6 w-6" />
        )}
        <FolderTreeRow
          depth={node.depth}
          label={node.name}
          selected={selectedId === node.id}
          onClick={() => onSelect(node.id)}
        />
      </div>

      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <FolderTreeBranch key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderTreeRow({
  depth,
  label,
  selected,
  onClick,
}: {
  depth: number;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors hover:bg-muted',
        selected && 'bg-muted font-medium',
      )}
      onClick={onClick}
      style={{ paddingLeft: `${depth * 14 + 8}px` }}
    >
      <Folder className="h-4 w-4 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

