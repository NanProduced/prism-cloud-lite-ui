import { useMemo, useState } from 'react';
import { formatBytes } from '@better-upload/client/helpers';
import { ArrowLeft, ChevronRight, FileText, Folder, FolderPlus, Image as ImageIcon, MoreVertical, Search, Upload, Video } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MediaAssetKind, MediaNode } from '@/types/media-library';

type MediaFilter = 'all' | 'folders' | 'image' | 'video' | 'document' | 'other';
type MediaSort = 'updatedAt' | 'name' | 'size';

export function MediaExplorer({
  nodes,
  currentFolderId,
  onFolderChange,
  onRequestUpload,
}: {
  nodes: MediaNode[];
  currentFolderId: string | null;
  onFolderChange: (id: string | null) => void;
  onRequestUpload: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [sort, setSort] = useState<MediaSort>('updatedAt');

  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, MediaNode[]>();
    for (const node of nodes) {
      const list = map.get(node.parentId) ?? [];
      list.push(node);
      map.set(node.parentId, list);
    }
    return map;
  }, [nodes]);

  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    const node = nodesById.get(currentFolderId);
    if (!node || node.type !== 'folder') return null;
    return node;
  }, [currentFolderId, nodesById]);

  const currentPath = useMemo(() => {
    const path: Array<{ id: string; name: string; parentId: string | null }> = [];
    let cursor = currentFolderId;
    while (cursor) {
      const node = nodesById.get(cursor);
      if (!node || node.type !== 'folder') break;
      path.unshift({ id: node.id, name: node.name, parentId: node.parentId });
      cursor = node.parentId;
    }
    return path;
  }, [currentFolderId, nodesById]);

  const visibleNodes = useMemo(() => {
    const list = childrenByParent.get(currentFolderId) ?? [];
    const query = searchQuery.trim().toLowerCase();
    const filteredByQuery = query ? list.filter((n) => n.name.toLowerCase().includes(query)) : list;
    const filteredByType = filterNodes(filteredByQuery, filter);
    return sortNodes(filteredByType, sort);
  }, [childrenByParent, currentFolderId, filter, searchQuery, sort]);

  return (
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
                My Media
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

            <Button variant="outline" className="gap-2" onClick={() => toast.message('TODO: Create folder')}>
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
              <Button variant="outline" onClick={() => toast.message('TODO: Create folder')}>
                New Folder
              </Button>
              <Button onClick={onRequestUpload}>Upload</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleNodes.map((node) => (
              <MediaNodeCard
                key={node.id}
                node={node}
                onOpenFolder={(id) => onFolderChange(id)}
                onAction={(action) => toast.message(`TODO: ${action}`)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MediaNodeCard({
  node,
  onOpenFolder,
  onAction,
}: {
  node: MediaNode;
  onOpenFolder: (id: string) => void;
  onAction: (action: string) => void;
}) {
  const ActionIcon =
    node.type === 'folder'
      ? Folder
      : node.assetKind === 'video'
        ? Video
        : node.assetKind === 'image'
          ? ImageIcon
          : FileText;

  const subtitle =
    node.type === 'folder'
      ? `${node.childrenCount} items`
      : node.assetKind === 'video'
        ? `${node.durationMs ? formatDuration(node.durationMs) : 'Video'}${node.width && node.height ? ` · ${node.width}×${node.height}` : ''}`
        : node.assetKind === 'image'
          ? `${node.width && node.height ? `${node.width}×${node.height}` : 'Image'}`
          : `${node.extension?.toUpperCase() ?? 'File'} · ${formatBytes(node.sizeBytes)}`;

  const thumbnail =
    node.type === 'folder' ? (
      <div className="flex h-full w-full items-center justify-center bg-muted/40">
        <ActionIcon className="h-10 w-10 text-muted-foreground" />
      </div>
    ) : node.coverUrl ? (
      <img src={node.coverUrl} alt={node.name} className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-muted/40">
        <ActionIcon className="h-10 w-10 text-muted-foreground" />
      </div>
    );

  return (
    <Card
      className={cn('group cursor-pointer overflow-hidden transition-shadow hover:shadow-md', node.type === 'folder' && 'hover:border-primary/40')}
      onClick={() => {
        if (node.type === 'folder') onOpenFolder(node.id);
        else toast.message('TODO: Preview asset');
      }}
    >
      <CardContent className="p-0">
        <div className="relative h-32 w-full overflow-hidden bg-muted">
          {thumbnail}
          {node.type === 'asset' && (
            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs shadow-sm">
              <ActionIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{formatAssetKindLabel(node.assetKind)}</span>
            </div>
          )}
        </div>

        <div className="flex h-[116px] flex-col px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{node.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {node.type === 'asset' && (
                  <DropdownMenuItem onClick={() => onAction('Preview')}>Preview</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onAction('Rename')}>Rename</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('Move')}>Move</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-rose-600" onClick={() => onAction('Delete')}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>{node.type === 'asset' ? formatBytes(node.sizeBytes) : 'Folder'}</span>
            <span>{formatRelativeTime(node.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function filterNodes(nodes: MediaNode[], filter: MediaFilter): MediaNode[] {
  if (filter === 'all') return nodes;
  if (filter === 'folders') return nodes.filter((n) => n.type === 'folder');
  return nodes.filter((n) => n.type === 'asset' && n.assetKind === filter);
}

function sortNodes(nodes: MediaNode[], sort: MediaSort): MediaNode[] {
  const withFolderFirst = nodes.slice().sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return 0;
  });

  switch (sort) {
    case 'name':
      return withFolderFirst.sort((a, b) => a.name.localeCompare(b.name));
    case 'size':
      return withFolderFirst.sort((a, b) => {
        const aSize = a.type === 'asset' ? a.sizeBytes : 0;
        const bSize = b.type === 'asset' ? b.sizeBytes : 0;
        return bSize - aSize;
      });
    case 'updatedAt':
    default:
      return withFolderFirst.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
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

function formatAssetKindLabel(kind: MediaAssetKind): string {
  if (kind === 'video') return 'Video';
  if (kind === 'image') return 'Image';
  if (kind === 'document') return 'Doc';
  return 'File';
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
