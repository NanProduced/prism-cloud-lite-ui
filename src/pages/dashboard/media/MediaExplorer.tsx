import { useMemo, useState } from 'react';
import { formatBytes } from '@better-upload/client/helpers';
import {
  ArrowLeft,
  ChevronRight,
  File,
  FileText,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MoreVertical,
  Search,
  Table,
  Upload,
  Video,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/store/notificationStore';

import { ReactBitsFolder } from '@/components/react-bits/Folder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MediaAssetNode, MediaNode } from '@/types/media-library';
import { deleteNode, renameNode } from '@/services/mediaApi';
import { getErrorMessage } from '@/services/authApi';

import { MediaAssetPreviewDialog } from './MediaAssetPreviewDialog';

type MediaFilter = 'all' | 'folders' | 'image' | 'video' | 'document' | 'other';
type MediaSort = 'updatedAt' | 'name' | 'size';
type MediaViewMode = 'thumbnails' | 'list' | 'details';

const MEDIA_VIEW_MODE_STORAGE_KEY = 'prism.mediaLibrary.viewMode';

function parseMediaViewMode(value: string): MediaViewMode | null {
  if (value === 'thumbnails' || value === 'list' || value === 'details') return value;
  return null;
}

function getInitialMediaViewMode(): MediaViewMode {
  if (typeof window === 'undefined') return 'thumbnails';
  try {
    const stored = window.localStorage.getItem(MEDIA_VIEW_MODE_STORAGE_KEY);
    return stored ? (parseMediaViewMode(stored) ?? 'thumbnails') : 'thumbnails';
  } catch {
    return 'thumbnails';
  }
}

export function MediaExplorer({
  nodes,
  allFolders,
  currentFolderId,
  onFolderChange,
  onRequestUpload,
  onRequestCreateFolder,
}: {
  nodes: MediaNode[];
  allFolders: MediaNode[];
  currentFolderId: string | null;
  onFolderChange: (id: string | null) => void;
  onRequestUpload: () => void;
  onRequestCreateFolder: (parentId: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [sort, setSort] = useState<MediaSort>('updatedAt');
  const [viewMode, setViewMode] = useState<MediaViewMode>(() => getInitialMediaViewMode());
  const [previewAsset, setPreviewAsset] = useState<MediaAssetNode | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // --- Mutations ---

  const deleteMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'nodes'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'usage'] });
      toast.success('Deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error as any));
    }
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameNode(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'nodes'] });
      toast.success('Renamed successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error as any));
    }
  });

  // --- Handlers ---

  const handleViewModeChange = (value: string) => {
    const next = parseMediaViewMode(value);
    if (!next) return;
    setViewMode(next);
    try {
      window.localStorage.setItem(MEDIA_VIEW_MODE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const handlePreviewOpenChange = (open: boolean) => {
    setPreviewOpen(open);
    if (!open) setPreviewAsset(null);
  };

  const handleNodeAction = (action: string, node: MediaNode) => {
    if (action === 'Preview') {
      if (node.type !== 'asset') return;
      if (!supportsAssetPreview(node)) {
        toast.message('Preview is not available for this file type yet.');
        return;
      }
      setPreviewAsset(node);
      setPreviewOpen(true);
      return;
    }

    if (action === 'Delete') {
      if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
        deleteMutation.mutate(node.id);
      }
      return;
    }

    if (action === 'Rename') {
      const newName = prompt(`Enter new name for "${node.name}":`, node.name);
      if (newName && newName !== node.name) {
        renameMutation.mutate({ id: node.id, name: newName });
      }
      return;
    }

    toast.message(`TODO: ${action}`);
  };

  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return allFolders.find((n) => n.id === currentFolderId) ?? null;
  }, [currentFolderId, allFolders]);

  const currentPath = useMemo(() => {
    const path: Array<{ id: string; name: string; parentId: string | null }> = [];
    let cursor = currentFolderId;
    const folderMap = new Map(allFolders.map(f => [f.id, f]));

    while (cursor) {
      const node = folderMap.get(cursor);
      if (!node) break;
      path.unshift({ id: node.id, name: node.name, parentId: node.parentId });
      cursor = node.parentId;
    }
    return path;
  }, [currentFolderId, allFolders]);

  const visibleNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filteredByQuery = query ? nodes.filter((n) => n.name.toLowerCase().includes(query)) : nodes;
    const filteredByType = filterNodes(filteredByQuery, filter);
    // Sorting is now handled by the backend partially, but we can still sort locally for better UX
    return sortNodes(filteredByType, sort);
  }, [nodes, filter, searchQuery, sort]);

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              disabled={!currentFolder}
              onClick={() => onFolderChange(currentFolder?.parentId ?? null)}
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 text-sm">
              <Button
                variant="ghost"
                className="h-9 px-2 text-sm font-medium"
                onClick={() => onFolderChange(null)}
              >
                Library
              </Button>
              {currentPath.map((segment) => (
                <div key={segment.id} className="flex items-center gap-1">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    className="h-9 px-2 text-sm font-medium"
                    onClick={() => onFolderChange(segment.id)}
                  >
                    {segment.name}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search this folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between gap-2">
                  Filter: {formatFilterLabel(filter)}
                  <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Show</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(
                  [
                    ['all', 'All items'],
                    ['folders', 'Folders'],
                    ['image', 'Images'],
                    ['video', 'Videos'],
                    ['document', 'Documents'],
                    ['other', 'Other files'],
                  ] as const
                ).map(([value, label]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setFilter(value)}
                    className={cn(value === filter && 'bg-accent')}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between gap-2">
                  Sort: {formatSortLabel(sort)}
                  <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(
                  [
                    ['updatedAt', 'Recently updated'],
                    ['name', 'Name (A → Z)'],
                    ['size', 'Size (largest)'],
                  ] as const
                ).map(([value, label]) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setSort(value)}
                    className={cn(value === sort && 'bg-accent')}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between gap-2">
                  View: {formatViewModeLabel(viewMode)}
                  <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Layout</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={viewMode} onValueChange={handleViewModeChange}>
                  <DropdownMenuRadioItem value="thumbnails">
                    <LayoutGrid className="h-4 w-4" />
                    Thumbnails
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="list">
                    <List className="h-4 w-4" />
                    List
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="details">
                    <Table className="h-4 w-4" />
                    Details
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="gap-2" onClick={() => onRequestCreateFolder(currentFolderId)}>
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>

            <Button className="gap-2" onClick={onRequestUpload}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {visibleNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 px-6 py-14 text-center">
            <div className="rounded-full bg-muted p-3">
              <Folder className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">This folder is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">Upload new assets or create a folder to get started.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onRequestCreateFolder(currentFolderId)}>
                New Folder
              </Button>
              <Button onClick={onRequestUpload}>Upload</Button>
            </div>
          </div>
        ) : (
          <MediaNodeCollection
            nodes={visibleNodes}
            viewMode={viewMode}
            onOpenFolder={(id) => onFolderChange(id)}
            onAction={handleNodeAction}
          />
        )}
        </CardContent>
      </Card>

      <MediaAssetPreviewDialog
        open={previewOpen}
        onOpenChange={handlePreviewOpenChange}
        asset={previewAsset}
      />
    </>
  );
}

function MediaNodeCollection({
  nodes,
  viewMode,
  onOpenFolder,
  onAction,
}: {
  nodes: MediaNode[];
  viewMode: MediaViewMode;
  onOpenFolder: (id: string) => void;
  onAction: (action: string, node: MediaNode) => void;
}) {
  if (viewMode === 'details') {
    return <MediaNodeDetailsTable nodes={nodes} onOpenFolder={onOpenFolder} onAction={onAction} />;
  }

  if (viewMode === 'list') {
    return (
      <div className="overflow-hidden rounded-lg border bg-background">
        {nodes.map((node) => (
          <MediaNodeListRow key={node.id} node={node} onOpenFolder={onOpenFolder} onAction={onAction} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {nodes.map((node) => (
        <MediaNodeThumbnailTile key={node.id} node={node} onOpenFolder={onOpenFolder} onAction={onAction} />
      ))}
    </div>
  );
}

function MediaNodeThumbnailTile({
  node,
  onOpenFolder,
  onAction,
}: {
  node: MediaNode;
  onOpenFolder: (id: string) => void;
  onAction: (action: string, node: MediaNode) => void;
}) {
  const metaLines = getThumbnailMetaLines(node);

  const handleOpen = () => {
    if (node.type === 'folder') onOpenFolder(node.id);
    else onAction('Preview', node);
  };

  const thumbnail =
    node.type === 'folder' ? (
      <div className="flex h-full w-full items-end justify-center pb-3">
        <ReactBitsFolder interaction="hover" size={1.05} color="#6366f1" />
      </div>
    ) : node.coverUrl ? (
      <img src={node.coverUrl} alt={node.name} className="h-full w-full object-cover" loading="lazy" />
    ) : (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/30">
        {renderNodeIcon(node, 'h-10 w-10 text-muted-foreground')}
        <div className="rounded-md bg-background/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
          {node.extension?.toUpperCase() ?? (node.assetKind === 'document' ? 'DOC' : 'FILE')}
        </div>
      </div>
    );

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group rounded-xl p-2 outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        node.type === 'folder' && 'hover:bg-primary/5',
      )}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-lg bg-muted/20',
          node.type !== 'folder' && 'ring-1 ring-inset ring-border/60',
        )}
      >
        <div className="aspect-[4/3] w-full">{thumbnail}</div>

        <div className="absolute right-2 top-2 opacity-100 transition-opacity group-focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <MediaNodeActionsMenu node={node} onAction={onAction} />
        </div>

        {node.type === 'asset' && node.assetKind === 'video' && node.durationMs ? (
          <div className="absolute bottom-2 right-2 rounded-md bg-background/85 px-2 py-0.5 text-[11px] font-medium shadow-sm tabular-nums">
            {formatDuration(node.durationMs)}
          </div>
        ) : null}
      </div>

      <p className="mt-2 line-clamp-2 text-center text-sm font-medium leading-snug" title={node.name}>
        {node.name}
      </p>

      {metaLines.map((line, index) => (
        <p key={`${node.id}-meta-${index}`} className="mt-0.5 text-center text-xs text-muted-foreground tabular-nums">
          {line}
        </p>
      ))}
    </div>
  );
}

function MediaNodeListRow({
  node,
  onOpenFolder,
  onAction,
}: {
  node: MediaNode;
  onOpenFolder: (id: string) => void;
  onAction: (action: string, node: MediaNode) => void;
}) {
  const handleOpen = () => {
    if (node.type === 'folder') onOpenFolder(node.id);
    else onAction('Preview', node);
  };

  const subtitleMobile = formatListMobileSubtitle(node);
  const subtitleDesktop = formatListDesktopSubtitle(node);

  const leadingVisual =
    node.type === 'asset' && node.coverUrl ? (
      <img
        src={node.coverUrl}
        alt={node.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        {renderNodeIcon(node, 'h-5 w-5 text-muted-foreground')}
      </div>
    );

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        node.type === 'folder' && 'hover:bg-primary/5',
      )}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      <div
        className={cn(
          'h-10 w-12 overflow-hidden rounded-md bg-muted/20',
          node.type !== 'folder' && 'ring-1 ring-inset ring-border/60',
        )}
      >
        {leadingVisual}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={node.name}>
          {node.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground sm:hidden">{subtitleMobile}</p>
        <p className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">{subtitleDesktop}</p>
      </div>

      <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
        <span className="tabular-nums">{node.type === 'asset' ? formatBytes(node.sizeBytes) : 'Folder'}</span>
        <span className="tabular-nums">{formatRelativeTime(node.updatedAt)}</span>
      </div>

      <div className="opacity-100 transition-opacity group-focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <MediaNodeActionsMenu node={node} onAction={onAction} />
      </div>
    </div>
  );
}

function MediaNodeDetailsTable({
  nodes,
  onOpenFolder,
  onAction,
}: {
  nodes: MediaNode[];
  onOpenFolder: (id: string) => void;
  onAction: (action: string, node: MediaNode) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="grid grid-cols-[minmax(180px,1fr)_90px_44px] sm:grid-cols-[minmax(240px,1fr)_120px_90px_44px] md:grid-cols-[minmax(280px,1fr)_140px_100px_160px_44px] items-center gap-3 bg-muted/20 px-3 py-2 text-xs font-semibold text-muted-foreground">
        <div>Name</div>
        <div className="hidden sm:block">Type</div>
        <div className="text-right">Size</div>
        <div className="hidden md:block text-right">Updated</div>
        <div className="flex justify-end">
          <span className="sr-only">Actions</span>
        </div>
      </div>

      <div className="divide-y">
        {nodes.map((node) => (
          <MediaNodeDetailsRow key={node.id} node={node} onOpenFolder={onOpenFolder} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}

function MediaNodeDetailsRow({
  node,
  onOpenFolder,
  onAction,
}: {
  node: MediaNode;
  onOpenFolder: (id: string) => void;
  onAction: (action: string, node: MediaNode) => void;
}) {
  const handleOpen = () => {
    if (node.type === 'folder') onOpenFolder(node.id);
    else onAction('Preview', node);
  };

  const subtitle = formatDetailsSubtitle(node);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group grid grid-cols-[minmax(180px,1fr)_90px_44px] sm:grid-cols-[minmax(240px,1fr)_120px_90px_44px] md:grid-cols-[minmax(280px,1fr)_140px_100px_160px_44px] items-center gap-3 px-3 py-2 outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        node.type === 'folder' && 'hover:bg-primary/5',
      )}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md bg-muted/20',
            node.type !== 'folder' && 'ring-1 ring-inset ring-border/60',
          )}
        >
          {renderNodeIcon(node, 'h-5 w-5 text-muted-foreground')}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={node.name}>
            {node.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="hidden text-xs text-muted-foreground sm:block">{formatDetailsTypeLabel(node)}</div>

      <div className="text-right text-xs text-muted-foreground tabular-nums">
        {node.type === 'asset' ? formatBytes(node.sizeBytes) : '—'}
      </div>

      <div className="hidden text-right text-xs text-muted-foreground tabular-nums md:block">
        {formatRelativeTime(node.updatedAt)}
      </div>

      <div className="flex justify-end opacity-100 transition-opacity group-focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <MediaNodeActionsMenu node={node} onAction={onAction} />
      </div>
    </div>
  );
}

function MediaNodeActionsMenu({
  node,
  onAction,
}: {
  node: MediaNode;
  onAction: (action: string, node: MediaNode) => void;
}) {
  const canPreview = supportsAssetPreview(node);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(event) => event.stopPropagation()}
          aria-label="Actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canPreview ? <DropdownMenuItem onClick={() => onAction('Preview', node)}>Preview</DropdownMenuItem> : null}
        <DropdownMenuItem onClick={() => onAction('Rename', node)}>Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('Move', node)}>Move</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-rose-600" onClick={() => onAction('Delete', node)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function renderNodeIcon(node: MediaNode, className: string) {
  if (node.type === 'folder') return <Folder className={className} />;
  if (node.assetKind === 'video') return <Video className={className} />;
  if (node.assetKind === 'image') return <ImageIcon className={className} />;
  if (node.assetKind === 'document') return <FileText className={className} />;
  return <File className={className} />;
}

function getThumbnailMetaLines(node: MediaNode): string[] {
  if (node.type === 'folder') return [formatRelativeTime(node.updatedAt)];

  const sizeAndDims = `${formatBytes(node.sizeBytes)}${node.width && node.height ? ` · ${node.width}×${node.height}` : ''}`;
  if (node.assetKind === 'video') return [sizeAndDims];

  if (node.assetKind === 'image') return [sizeAndDims, formatRelativeTime(node.updatedAt)];

  const ext = node.extension?.toUpperCase() ?? (node.assetKind === 'document' ? 'DOC' : 'FILE');
  return [`${ext} · ${formatBytes(node.sizeBytes)}`, formatRelativeTime(node.updatedAt)];
}

function formatDetailsTypeLabel(node: MediaNode): string {
  if (node.type === 'folder') return 'Folder';
  if (node.assetKind === 'video') return 'Video';
  if (node.assetKind === 'image') return 'Image';
  if (node.assetKind === 'document') return 'Document';
  return 'File';
}

function formatDetailsSubtitle(node: MediaNode): string {
  if (node.type === 'folder') return 'Folder';

  if (node.assetKind === 'video') {
    const duration = node.durationMs ? formatDuration(node.durationMs) : undefined;
    const dims = node.width && node.height ? `${node.width}×${node.height}` : undefined;
    return [duration, dims].filter(Boolean).join(' · ') || 'Video';
  }

  if (node.assetKind === 'image') {
    const dims = node.width && node.height ? `${node.width}×${node.height}` : undefined;
    return [dims, node.extension?.toUpperCase()].filter(Boolean).join(' · ') || 'Image';
  }

  const ext = node.extension?.toUpperCase();
  return [ext, node.mimeType].filter(Boolean).join(' · ') || 'File';
}

function formatListMobileSubtitle(node: MediaNode): string {
  if (node.type === 'folder') return `Folder · ${formatRelativeTime(node.updatedAt)}`;

  const parts: string[] = [];
  parts.push(formatDetailsTypeLabel(node));
  parts.push(formatBytes(node.sizeBytes));

  if (node.assetKind === 'video' && node.durationMs) parts.push(formatDuration(node.durationMs));
  if ((node.assetKind === 'image' || node.assetKind === 'video') && node.width && node.height) {
    parts.push(`${node.width}×${node.height}`);
  }

  const ext = node.extension?.toUpperCase();
  if (ext && (node.assetKind === 'document' || node.assetKind === 'other')) parts.unshift(ext);

  parts.push(formatRelativeTime(node.updatedAt));
  return parts.join(' · ');
}

function formatListDesktopSubtitle(node: MediaNode): string {
  if (node.type === 'folder') return 'Folder';
  return formatDetailsSubtitle(node);
}

function supportsAssetPreview(node: MediaNode): node is MediaAssetNode {
  if (node.type !== 'asset') return false;
  if (node.assetKind === 'image') return Boolean(node.assetUrl ?? node.coverUrl);
  if (node.assetKind === 'video') return Boolean(node.assetUrl);
  return false;
}

function filterNodes(nodes: MediaNode[], filter: MediaFilter): MediaNode[] {
  if (filter === 'all') return nodes;
  if (filter === 'folders') return nodes.filter((n) => n.type === 'folder');
  return nodes.filter((n) => n.type === 'asset' && n.assetKind === filter);
}

function sortNodes(nodes: MediaNode[], sort: MediaSort): MediaNode[] {
  const folders = nodes.filter((node) => node.type === 'folder');
  const assets = nodes.filter((node) => node.type === 'asset');

  const byName = (a: MediaNode, b: MediaNode) => a.name.localeCompare(b.name);
  const byUpdatedAt = (a: MediaNode, b: MediaNode) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  const bySize = (a: MediaNode, b: MediaNode) => {
    if (a.type !== 'asset' || b.type !== 'asset') return 0;
    return b.sizeBytes - a.sizeBytes;
  };

  const folderComparator = sort === 'name' ? byName : sort === 'size' ? byName : byUpdatedAt;
  const assetComparator = sort === 'name' ? byName : sort === 'size' ? bySize : byUpdatedAt;

  folders.sort(folderComparator);
  assets.sort(assetComparator);

  return [...folders, ...assets];
}

function formatFilterLabel(filter: MediaFilter): string {
  switch (filter) {
    case 'folders':
      return 'Folders';
    case 'image':
      return 'Images';
    case 'video':
      return 'Videos';
    case 'document':
      return 'Documents';
    case 'other':
      return 'Other';
    case 'all':
    default:
      return 'All';
  }
}

function formatSortLabel(sort: MediaSort): string {
  switch (sort) {
    case 'name':
      return 'Name';
    case 'size':
      return 'Size';
    case 'updatedAt':
    default:
      return 'Updated';
  }
}

function formatViewModeLabel(mode: MediaViewMode): string {
  switch (mode) {
    case 'details':
      return 'Details';
    case 'list':
      return 'List';
    case 'thumbnails':
    default:
      return 'Thumbnails';
  }
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}