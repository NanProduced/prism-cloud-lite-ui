import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/store/notificationStore';

import { useIsMobile } from '@/hooks/use-mobile';
import { ReactBitsFolder } from '@/components/react-bits/Folder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { deleteNode, renameNode, moveNodes } from '@/services/mediaApi';
import { getErrorMessage } from '@/services/authApi';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MediaAssetPreviewDialog } from './MediaAssetPreviewDialog';
import { MoveNodesDialog } from './MoveNodesDialog';
import { TranscodeDialog } from '@/features/media/components/TranscodeDialog';

type MediaFilter = 'all' | 'folders' | 'image' | 'video' | 'document' | 'other';
type MediaSort = 'updatedAt' | 'name' | 'size';
type MediaViewMode = 'thumbnails' | 'list';

const MEDIA_VIEW_MODE_STORAGE_KEY = 'prism.mediaLibrary.viewMode';

function parseMediaViewMode(value: string): MediaViewMode | null {
  if (value === 'thumbnails' || value === 'list') return value;
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
  hasMore,
  onLoadMore,
  isLoadingMore,
}: {
  nodes: MediaNode[];
  allFolders: MediaNode[];
  currentFolderId: string | null;
  onFolderChange: (id: string | null) => void;
  onRequestUpload: () => void;
  onRequestCreateFolder: (parentId: string | null) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [sort, setSort] = useState<MediaSort>('updatedAt');
  const [viewMode, setViewMode] = useState<MediaViewMode>(() => getInitialMediaViewMode());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<MediaAssetNode | null>(null);
  const [transcodeTarget, setTranscodeTarget] = useState<MediaAssetNode | null>(null);

  const [moveNodesOpen, setMoveNodesOpen] = useState(false);
  const [movingNodes, setMovingNodes] = useState<{ ids: string[]; names: string[] }>({ ids: [], names: [] });

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<MediaNode | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<MediaNode | null>(null);

  // --- Mutations ---

  const deleteMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'nodes'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'usage'] });
      toast.success(t('media.explorer.toasts.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error as any));
    }
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameNode(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'nodes'] });
      toast.success(t('media.explorer.toasts.renameSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error as any));
    }
  });

  const moveMutation = useMutation({
    mutationFn: (targetParentId: string | null) => 
      moveNodes({ nodeIds: movingNodes.ids, targetParentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'nodes'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'folders'] });
      toast.success(t('media.explorer.toasts.moveSuccess'));
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
        toast.message(t('media.explorer.toasts.previewNotAvailable'));
        return;
      }
      setPreviewAsset(node);
      setPreviewOpen(true);
      return;
    }

    if (action === 'Delete') {
      setNodeToDelete(node);
      setDeleteConfirmOpen(true);
      return;
    }

    if (action === 'Rename') {
      setRenameTarget(node);
      setRenameValue(node.name);
      setRenameOpen(true);
      return;
    }

    if (action === 'Move') {
      setMovingNodes({ ids: [node.id], names: [node.name] });
      setMoveNodesOpen(true);
      return;
    }

    if (action === 'Transcode') {
      if (node.type !== 'asset') return;
      setTranscodeTarget(node);
      return;
    }

    toast.message(`TODO: ${action}`);
  };

  const handleRenameSubmit = () => {
    if (!renameTarget || !renameValue.trim() || renameValue === renameTarget.name) {
      setRenameOpen(false);
      return;
    }
    renameMutation.mutate({ id: renameTarget.id, name: renameValue.trim() }, {
      onSuccess: () => setRenameOpen(false)
    });
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
              title={t('common.actions.back')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 text-sm">
              <Button
                variant="ghost"
                className="h-9 px-2 text-sm font-medium"
                onClick={() => onFolderChange(null)}
              >
                {t('media.explorer.breadcrumbRoot')}
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
                placeholder={t('common.search') + "..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="justify-between gap-2">
                  {t('media.explorer.filter.label')}: {formatFilterLabel(filter, t)}
                  <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.actions.view')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(
                  [
                    ['all', t('media.explorer.filter.all')],
                    ['folders', t('media.explorer.filter.folders')],
                    ['image', t('media.explorer.filter.image')],
                    ['video', t('media.explorer.filter.video')],
                    ['document', t('media.explorer.filter.document')],
                    ['other', t('media.explorer.filter.other')],
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
                  {t('media.explorer.sort.label')}: {formatSortLabel(sort, t)}
                  <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('media.explorer.sort.label')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(
                  [
                    ['updatedAt', t('media.explorer.sort.updatedAt')],
                    ['name', t('media.explorer.sort.name')],
                    ['size', t('media.explorer.sort.size')],
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
                  {t('media.explorer.view.label')}: {formatViewModeLabel(viewMode, t)}
                  <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('media.explorer.view.label')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={viewMode} onValueChange={handleViewModeChange}>
                  <DropdownMenuRadioItem value="thumbnails">
                    <LayoutGrid className="h-4 w-4" />
                    {t('media.explorer.view.thumbnails')}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="list">
                    <List className="h-4 w-4" />
                    {t('media.explorer.view.list')}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="gap-2" onClick={() => onRequestCreateFolder(currentFolderId)}>
              <FolderPlus className="h-4 w-4" />
              {t('media.explorer.actions.newFolder')}
            </Button>

            <Button className="gap-2" onClick={onRequestUpload}>
              <Upload className="h-4 w-4" />
              {t('media.explorer.actions.upload')}
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
              <p className="text-sm font-medium">{t('media.explorer.empty.title')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('media.explorer.empty.description')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onRequestCreateFolder(currentFolderId)}>
                {t('media.explorer.actions.newFolder')}
              </Button>
              <Button onClick={onRequestUpload}>{t('media.explorer.actions.upload')}</Button>
            </div>
          </div>
        ) : (
          <>
            <MediaNodeCollection
              nodes={visibleNodes}
              viewMode={viewMode}
              onOpenFolder={(id) => onFolderChange(id)}
              onAction={handleNodeAction}
            />
            {hasMore && (
              <div className="mt-8 flex justify-center pb-4">
                <Button variant="outline" onClick={onLoadMore} disabled={isLoadingMore} className="rounded-xl px-8">
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.actions.refresh')}...
                    </>
                  ) : (
                    t('media.explorer.actions.loadMore')
                  )}
                </Button>
              </div>
            )}

          </>
        )}
        </CardContent>
      </Card>

      <MediaAssetPreviewDialog
        open={previewOpen}
        onOpenChange={handlePreviewOpenChange}
        asset={previewAsset}
      />

      <TranscodeDialog
        open={!!transcodeTarget}
        onOpenChange={(open) => !open && setTranscodeTarget(null)}
        asset={transcodeTarget}
        onSuccess={(_, messageId) => {
          navigate('/dashboard/messages?tab=tasks', { state: { openMessageId: messageId } });
        }}
      />

      <MoveNodesDialog
        open={moveNodesOpen}
        onOpenChange={setMoveNodesOpen}
        nodeIds={movingNodes.ids}
        nodeNames={movingNodes.names}
        currentParentId={currentFolderId}
        onConfirm={(targetId) => moveMutation.mutate(targetId)}
      />

      <Dialog open={renameOpen} onOpenChange={(open) => { setRenameOpen(open); if (!open) setRenameTarget(null); }}>
        <DialogContent className="max-w-[420px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ring-1 ring-foreground/5 text-foreground">
          <div className="p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Pencil className="h-6 w-6" />
            </div>
            <DialogHeader>
              <DialogTitle>{t('media.dialogs.rename.title')}</DialogTitle>
              <DialogDescription className="text-sm pt-2">
                {t('media.dialogs.rename.desc', { type: renameTarget?.type === 'folder' ? t('media.dialogs.rename.folder') : t('media.dialogs.rename.asset') })}
              </DialogDescription>
            </DialogHeader>
            <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handleRenameSubmit(); }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60" htmlFor="media-rename-name">{t('media.dialogs.rename.label')}</label>
                <Input 
                  id="media-rename-name" 
                  value={renameValue} 
                  onChange={(e) => setRenameValue(e.target.value)} 
                  className="h-11 bg-muted/20 border-border/50 text-sm font-bold"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)} className="font-bold text-xs uppercase tracking-widest px-8">{t('common.actions.cancel')}</Button>
                <Button type="submit" disabled={renameMutation.isPending} className="font-bold text-xs uppercase tracking-widest px-10 h-11 shadow-xl">
                  {renameMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />} {t('common.actions.save')}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-[420px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl ring-1 ring-foreground/5">
          <div className="p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold tracking-tight">{t('media.dialogs.delete.title')}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm pt-2 space-y-4">
                <span className="block">{t('media.dialogs.delete.desc')}</span>
                <span className="block rounded-xl bg-destructive/5 border border-destructive/10 p-4 font-bold text-destructive text-base truncate">
                  {nodeToDelete?.name}
                </span>
                <span className="block">{t('media.dialogs.delete.descNote')}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-3">
              <AlertDialogCancel className="font-bold text-xs uppercase tracking-widest px-8">{t('common.actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => nodeToDelete && deleteMutation.mutate(nodeToDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs uppercase tracking-widest px-10 h-10 shadow-xl shadow-destructive/20"
              >
                {t('common.actions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
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
  const isMobile = useIsMobile();
  const { formatRelative } = useTimeFormatter();
  const metaLines = getThumbnailMetaLines(node, formatRelative);

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
      onClick={isMobile ? handleOpen : undefined}
      onDoubleClick={!isMobile ? handleOpen : undefined}
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
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { formatRelative } = useTimeFormatter();
  const handleOpen = () => {
    if (node.type === 'folder') onOpenFolder(node.id);
    else onAction('Preview', node);
  };

  const subtitleMobile = formatListMobileSubtitle(node, formatRelative, t);
  const subtitleDesktop = formatListDesktopSubtitle(node, t);

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
      onClick={isMobile ? handleOpen : undefined}
      onDoubleClick={!isMobile ? handleOpen : undefined}
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
        <span className="tabular-nums">{node.type === 'asset' ? formatBytes(node.sizeBytes) : t('media.explorer.filter.folders')}</span>
        {node.type !== 'folder' && <span className="tabular-nums">{formatRelative(node.updatedAt)}</span>}
      </div>

      <div className="opacity-100 transition-opacity group-focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
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
  const { t } = useTranslation();
  const canPreview = supportsAssetPreview(node);
  const canTranscode = node.type === 'asset' && node.assetKind === 'video';

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
        <DropdownMenuLabel>{t('common.actions.view')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canPreview ? <DropdownMenuItem onClick={() => onAction('Preview', node)}>{t('media.explorer.actions.preview')}</DropdownMenuItem> : null}
        <DropdownMenuItem onClick={() => onAction('Rename', node)}>{t('media.explorer.actions.rename')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('Move', node)}>{t('media.explorer.actions.move')}</DropdownMenuItem>
        {canTranscode ? <DropdownMenuItem onClick={() => onAction('Transcode', node)}>{t('media.explorer.actions.transcode')}</DropdownMenuItem> : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-rose-600" onClick={() => onAction('Delete', node)}>
          {t('media.explorer.actions.delete')}
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

function getThumbnailMetaLines(node: MediaNode, formatRelative: (d: string) => string): string[] {
  if (node.type === 'folder') return [];

  const sizeAndDims = `${formatBytes(node.sizeBytes)}${node.width && node.height ? ` · ${node.width}×${node.height}` : ''}`;
  if (node.assetKind === 'video') return [sizeAndDims];

  if (node.assetKind === 'image') return [sizeAndDims, formatRelative(node.updatedAt)];

  const ext = node.extension?.toUpperCase() ?? (node.assetKind === 'document' ? 'DOC' : 'FILE');
  return [`${ext} · ${formatBytes(node.sizeBytes)}`, formatRelative(node.updatedAt)];
}

function formatDetailsTypeLabel(node: MediaNode, t: TFunction): string {
  if (node.type === 'folder') return t('media.explorer.filter.folders');
  if (node.assetKind === 'video') return t('media.explorer.filter.video');
  if (node.assetKind === 'image') return t('media.explorer.filter.image');
  if (node.assetKind === 'document') return t('media.explorer.filter.document');
  return t('media.explorer.filter.other');
}

function formatDetailsSubtitle(node: MediaNode, t: TFunction): string {
  if (node.type === 'folder') return t('media.explorer.filter.folders');

  if (node.assetKind === 'video') {
    const duration = node.durationMs ? formatDuration(node.durationMs) : undefined;
    const dims = node.width && node.height ? `${node.width}×${node.height}` : undefined;
    return [duration, dims].filter(Boolean).join(' · ') || t('media.explorer.filter.video');
  }

  if (node.assetKind === 'image') {
    const dims = node.width && node.height ? `${node.width}×${node.height}` : undefined;
    return [dims, node.extension?.toUpperCase()].filter(Boolean).join(' · ') || t('media.explorer.filter.image');
  }

  const ext = node.extension?.toUpperCase();
  return [ext, node.mimeType].filter(Boolean).join(' · ') || t('media.explorer.filter.other');
}

function formatListMobileSubtitle(node: MediaNode, formatRelative: (d: string) => string, t: TFunction): string {
  if (node.type === 'folder') return t('media.explorer.filter.folders');

  const parts: string[] = [];
  parts.push(formatDetailsTypeLabel(node, t));
  parts.push(formatBytes(node.sizeBytes));

  if (node.assetKind === 'video' && node.durationMs) parts.push(formatDuration(node.durationMs));
  if ((node.assetKind === 'image' || node.assetKind === 'video') && node.width && node.height) {
    parts.push(`${node.width}×${node.height}`);
  }

  const ext = node.extension?.toUpperCase();
  if (ext && (node.assetKind === 'document' || node.assetKind === 'other')) parts.unshift(ext);

  parts.push(formatRelative(node.updatedAt));
  return parts.join(' · ');
}

function formatListDesktopSubtitle(node: MediaNode, t: TFunction): string {
  if (node.type === 'folder') return t('media.explorer.filter.folders');
  return formatDetailsSubtitle(node, t);
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

function formatFilterLabel(filter: MediaFilter, t: TFunction): string {
  switch (filter) {
    case 'folders':
      return t('media.explorer.filter.folders');
    case 'image':
      return t('media.explorer.filter.image');
    case 'video':
      return t('media.explorer.filter.video');
    case 'document':
      return t('media.explorer.filter.document');
    case 'other':
      return t('media.explorer.filter.other');
    case 'all':
    default:
      return t('media.explorer.filter.all');
  }
}

function formatSortLabel(sort: MediaSort, t: TFunction): string {
  switch (sort) {
    case 'name':
      return t('media.explorer.sort.name');
    case 'size':
      return t('media.explorer.sort.size');
    case 'updatedAt':
    default:
      return t('media.explorer.sort.updatedAt');
  }
}

function formatViewModeLabel(mode: MediaViewMode, t: TFunction): string {
  switch (mode) {
    case 'list':
      return t('media.explorer.view.list');
    case 'thumbnails':
    default:
      return t('media.explorer.view.thumbnails');
  }
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
