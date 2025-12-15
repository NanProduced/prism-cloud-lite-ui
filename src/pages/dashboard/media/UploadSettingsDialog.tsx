import { useMemo } from 'react';
import { formatBytes } from '@better-upload/client/helpers';
import { ChevronDown, FileText, Folder, FolderOpen, FolderPlus, ListCollapse, ListTree, Image as ImageIcon, Video } from 'lucide-react';
import { toast } from 'sonner';
import { expandAllFeature, hotkeysCoreFeature, selectionFeature, syncDataLoaderFeature } from '@headless-tree/core';
import { useTree } from '@headless-tree/react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tree, TreeItem, TreeItemLabel } from '@/components/ui/tree';
import { cn } from '@/lib/utils';
import type { MediaNode } from '@/types/media-library';

import type { PendingUploadFile } from './uploadModels';

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
  const folderItems = useMemo(() => buildFolderItems(folderNodes), [folderNodes]);
  const selectedTreeId = selectedFolderId ?? MY_MEDIA_ID;

  const tree = useTree<FolderItemData>({
    rootItemId: ROOT_ID,
    dataLoader: {
      getItem: (itemId) => folderItems.items[itemId],
      getChildren: (itemId) => folderItems.items[itemId]?.children ?? [],
    },
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => (folderItems.items[item.getId()]?.children.length ?? 0) > 0,
    state: {
      selectedItems: [selectedTreeId],
    },
    initialState: {
      expandedItems: folderItems.initialExpandedItems,
    },
    onPrimaryAction: (item) => {
      const id = item.getId();
      onSelectedFolderIdChange(id === MY_MEDIA_ID ? null : id);
    },
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature, expandAllFeature],
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100vw-2rem,980px)] max-w-none p-6">
        <DialogHeader>
          <DialogTitle>Upload Settings</DialogTitle>
          <DialogDescription>
            Choose destination folder and review file names. Upload will start after you confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Destination</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void tree.expandAll()}
                >
                  <ListTree className="h-4 w-4 opacity-70" />
                  <span className="hidden sm:inline">Expand all</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => tree.collapseAll()}
                >
                  <ListCollapse className="h-4 w-4 opacity-70" />
                  <span className="hidden sm:inline">Collapse all</span>
                </Button>
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
            </div>
            <Separator className="my-3" />
            <ScrollArea className="max-h-[480px] pr-2">
              <Tree tree={tree} indent={14} className="gap-0.5">
                {tree.getItems().map((item) => {
                  const id = item.getId();
                  const data = item.getItemData();
                  const hasChildren = data.children.length > 0;

                  return (
                    <TreeItem
                      key={id}
                      item={item}
                      className="disabled:opacity-100"
                      onClick={(event) => {
                        event.preventDefault();
                        item.setFocused();
                        tree.setSelectedItems([id]);
                        item.primaryAction();
                      }}
                    >
                      <TreeItemLabel
                        item={item}
                        showChevron={false}
                        className={cn("w-full justify-start", id === MY_MEDIA_ID && "font-medium")}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          {hasChildren ? (
                            <span
                              role="button"
                              tabIndex={-1}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (item.isExpanded()) item.collapse();
                                else item.expand();
                              }}
                              aria-label={item.isExpanded() ? 'Collapse' : 'Expand'}
                            >
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 transition-transform',
                                  item.isExpanded() ? 'rotate-0' : '-rotate-90',
                                )}
                              />
                            </span>
                          ) : (
                            <span className="inline-flex h-7 w-7" aria-hidden="true" />
                          )}

                          {item.isExpanded() && hasChildren ? (
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Folder className="h-4 w-4 text-muted-foreground" />
                          )}

                          <span className="truncate">{data.name}</span>
                          {hasChildren && (
                            <span className="shrink-0 text-xs text-muted-foreground">{`(${data.children.length})`}</span>
                          )}
                        </span>
                      </TreeItemLabel>
                    </TreeItem>
                  );
                })}
              </Tree>
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

            <ScrollArea className="max-h-[480px] pr-2">
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

type FolderItemData = { name: string; children: string[] };

const ROOT_ID = '__media-folder-root__';
const MY_MEDIA_ID = '__media-folder-my-media__';

function buildFolderItems(nodes: MediaNode[]): {
  items: Record<string, FolderItemData>;
  initialExpandedItems: string[];
} {
  const folders = nodes.filter((n) => n.type === 'folder');
  const folderById = new Map<string, MediaNode>(folders.map((f) => [f.id, f]));
  const childrenByParent = new Map<string | null, string[]>();

  for (const folder of folders) {
    const bucket = childrenByParent.get(folder.parentId) ?? [];
    bucket.push(folder.id);
    childrenByParent.set(folder.parentId, bucket);
  }

  for (const [parentId, ids] of childrenByParent.entries()) {
    ids.sort((a, b) => (folderById.get(a)?.name ?? '').localeCompare(folderById.get(b)?.name ?? ''));
    childrenByParent.set(parentId, ids);
  }

  const topLevel = childrenByParent.get(null) ?? [];

  const items: Record<string, FolderItemData> = {
    [ROOT_ID]: { name: 'root', children: [MY_MEDIA_ID] },
    [MY_MEDIA_ID]: { name: 'My Media', children: topLevel },
  };

  for (const folder of folders) {
    items[folder.id] = {
      name: folder.name,
      children: childrenByParent.get(folder.id) ?? [],
    };
  }

  const initialExpandedItems = Object.entries(items)
    .filter(([id, item]) => id !== ROOT_ID && item.children.length > 0)
    .map(([id]) => id);

  return { items, initialExpandedItems };
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
