import { useEffect, useMemo, useState } from 'react';
import { formatBytes } from '@better-upload/client/helpers';
import { 
  ChevronDown, 
  FileText, 
  Folder, 
  FolderOpen, 
  FolderPlus, 
  ListCollapse, 
  ListTree, 
  Image as ImageIcon, 
  Video,
  AlertCircle, 
  Timer, 
  Library
} from 'lucide-react';
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
  onRequestCreateFolder,
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
  onRequestCreateFolder: (parentId: string | null) => void;
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
    isItemFolder: (item) => {
      const id = item.getId();
      return id === ROOT_ID || id === MY_MEDIA_ID || folderItems.items[id] !== undefined;
    },
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

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100vw-2rem,1100px)] max-w-none !p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-background">
        <div className="flex flex-col h-[min(90vh,800px)]">
          <div className="px-8 py-6 border-b bg-muted/10 shrink-0">
            <DialogHeader className="mb-0">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-bold tracking-tight">Upload Settings</DialogTitle>
                  <DialogDescription className="text-sm">
                    Review file titles and choose a destination folder for {pendingFiles.length} item(s).
                  </DialogDescription>
                </div>
                <Button variant="outline" size="sm" onClick={onPickMore} className="rounded-xl gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                  <FolderPlus className="h-4 w-4" />
                  Add More Files
                </Button>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar: Folder Tree */}
            <div className="w-[300px] border-r bg-muted/5 flex flex-col p-6 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Destination</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => onRequestCreateFolder(selectedFolderId)} title="New Folder">
                    <FolderPlus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => tree.collapseAll()} title="Collapse All">
                    <ListCollapse className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 -mx-2 px-2">
                <Tree key={Object.keys(folderItems.items).length} tree={tree} indent={14} className="gap-0.5">
                  {tree.getItems().map((item) => {
                    const id = item.getId();
                    if (id === ROOT_ID) return null;

                    const data = item.getItemData();
                    const hasChildren = data.children.length > 0;
                    const isSelected = item.isSelected();

                    return (
                      <TreeItem
                        key={id}
                        item={item}
                        className={cn(
                          "rounded-xl transition-all border border-transparent",
                          isSelected ? "bg-primary/10 border-primary/20 font-bold" : "hover:bg-muted/50"
                        )}
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
                          className="w-full justify-start py-2"
                        >
                          <span className="flex min-w-0 flex-1 items-center gap-2">
                            {hasChildren ? (
                              <span
                                role="button"
                                tabIndex={-1}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background/80"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  if (item.isExpanded()) item.collapse();
                                  else item.expand();
                                }}
                              >
                                <ChevronDown
                                  className={cn(
                                    'h-3 w-3 transition-transform',
                                    item.isExpanded() ? 'rotate-0' : '-rotate-90',
                                  )}
                                />
                              </span>
                            ) : (
                              <span className="w-6" />
                            )}

                            {id === MY_MEDIA_ID ? (
                              <Library className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                            ) : (
                              <Folder className={cn("h-4 w-4", isSelected ? "text-primary fill-primary/20" : "text-muted-foreground fill-muted-foreground/10")} />
                            )}

                            <span className="truncate text-sm">{data.name}</span>
                          </span>
                        </TreeItemLabel>
                      </TreeItem>
                    );
                  })}
                </Tree>
              </ScrollArea>
            </div>

            {/* Main Area: File List */}
            <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden p-8">
              <ScrollArea className="flex-1 -mr-4 pr-4">
                <div className="space-y-4 pb-8">
                  {pendingFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-2xl bg-muted/5">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/20 mb-3" />
                      <p className="text-sm font-bold text-muted-foreground">No files selected</p>
                    </div>
                  ) : (
                    pendingFiles.map((p) => (
                      <div key={p.id} className="group rounded-2xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md relative">
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden border">
                            <CoverPreview blob={p.cover} kind={p.kind} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                              <div className="min-w-0 flex-1 space-y-1">
                                <p className="truncate text-sm font-bold tracking-tight" title={p.file.name}>{p.file.name}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                                  <span className="bg-muted px-1.5 py-0.5 rounded">{formatBytes(p.file.size)}</span>
                                  {p.width && p.height && (
                                    <span>{p.width}×{p.height}</span>
                                  )}
                                  {p.durationMs && (
                                    <span className="flex items-center gap-1"><Timer className="h-2.5 w-2.5" />{formatDuration(p.durationMs)}</span>
                                  )}
                                </div>
                              </div>

                              <div className="w-full sm:w-[280px]">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 ml-0.5">Asset Title</p>
                                <Input
                                  value={p.title}
                                  onChange={(e) => onPendingTitleChange(p.id, e.target.value)}
                                  placeholder="Enter display title..."
                                  className="h-10 rounded-xl bg-muted/5 border-muted-foreground/20 focus-visible:ring-primary/20"
                                />
                              </div>
                            </div>

                            {p.parseError && (
                              <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <p className="text-[10px] font-medium leading-none">
                                  {p.parseError}
                                </p>
                              </div>
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

          <div className="px-8 py-4 bg-muted/20 border-t flex items-center justify-between shrink-0">
             <div className="text-xs text-muted-foreground">
               Selected Destination: <span className="font-bold text-foreground">
                 {selectedFolderId ? folderNodes.find(n => n.id === selectedFolderId)?.name : 'Library (Root)'}
               </span>
             </div>
             <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={handleClose} className="rounded-xl px-6 h-11">
                  Cancel
                </Button>
                <Button 
                  onClick={onConfirm} 
                  disabled={pendingFiles.length === 0}
                  className="rounded-xl px-10 h-11 bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl"
                >
                  Confirm & Start Upload
                </Button>
             </div>
          </div>
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
  const folderById = new Map<string, MediaNode>();
  const childrenByParent = new Map<string | null, string[]>();

  // First pass: map all folders by ID
  for (const folder of nodes) {
    folderById.set(String(folder.id), folder);
  }

  // Second pass: group by parent
  for (const folder of nodes) {
    const id = String(folder.id);
    let pid = folder.parentId;
    
    // Normalize parentId
    if (!pid || pid === '0' || pid === 'default') {
      pid = null;
    } else {
      pid = String(pid);
      // If parent ID is not in our set, treat as root
      if (!folderById.has(pid)) {
        pid = null;
      }
    }

    const bucket = childrenByParent.get(pid) ?? [];
    bucket.push(id);
    childrenByParent.set(pid, bucket);
  }

  // Sort children by name
  for (const [parentId, ids] of childrenByParent.entries()) {
    ids.sort((a, b) => (folderById.get(a)?.name ?? '').localeCompare(folderById.get(b)?.name ?? '', undefined, { sensitivity: 'base' }));
  }

  const topLevel = childrenByParent.get(null) ?? [];

  const items: Record<string, FolderItemData> = {
    [ROOT_ID]: { name: 'root', children: [MY_MEDIA_ID] },
    [MY_MEDIA_ID]: { name: 'Library', children: topLevel },
  };

  for (const folder of nodes) {
    const id = String(folder.id);
    items[id] = {
      name: folder.name,
      children: childrenByParent.get(id) ?? [],
    };
  }

  // Expand items that have children
  const initialExpandedItems = Object.entries(items)
    .filter(([_, item]) => item.children.length > 0)
    .map(([id]) => id);

  return { items, initialExpandedItems };
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function CoverPreview({ blob, kind }: { blob?: Blob; kind: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (blob) {
      const u = URL.createObjectURL(blob);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setUrl(null);
  }, [blob]);

  if (url) {
    return <img src={url} className="h-full w-full object-cover" />;
  }

  if (kind === 'video') return <Video className="h-6 w-6 text-muted-foreground" />;
  if (kind === 'image') return <ImageIcon className="h-6 w-6 text-muted-foreground" />;
  return <FileText className="h-6 w-6 text-muted-foreground" />;
}
