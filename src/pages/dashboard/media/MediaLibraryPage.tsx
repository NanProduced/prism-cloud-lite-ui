import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/store/notificationStore';

import { 
  getMediaNodes, 
  getMediaUsage, 
  createFolder,
  getAllFolders
} from '@/services/mediaApi';
import { getErrorMessage } from '@/services/authApi';
import type { MediaNode } from '@/types/media-library';

import { CreateFolderDialog } from './CreateFolderDialog';
import { MediaExplorer } from './MediaExplorer';
import { MediaUploadPanel, type MediaUploadPanelHandle } from './MediaUploadPanel';

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const uploadPanelRef = useRef<MediaUploadPanelHandle | null>(null);
  
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<MediaNode[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- Queries ---

  useEffect(() => {
    setNodes([]);
    setNextCursor(null);
  }, [currentFolderId]);

  const { data: nodesData, isLoading: isNodesLoading } = useQuery({
    queryKey: ['media', 'nodes', currentFolderId],
    queryFn: () => getMediaNodes({ parentId: currentFolderId, limit: 100 }),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Sync initial query data to state
  useEffect(() => {
    if (nodesData?.success && nodesData.data) {
      setNodes(nodesData.data.items);
      setNextCursor(nodesData.data.nextCursor);
    }
  }, [nodesData]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await getMediaNodes({ 
        parentId: currentFolderId, 
        limit: 100, 
        cursor: nextCursor 
      });
      if (res.success && res.data) {
        setNodes(prev => [...prev, ...res.data!.items]);
        setNextCursor(res.data.nextCursor);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const { data: usageData } = useQuery({
    queryKey: ['media', 'usage'],
    queryFn: getMediaUsage,
  });

  const { data: allFoldersData } = useQuery({
    queryKey: ['media', 'folders'],
    queryFn: getAllFolders,
  });

  // --- Mutations ---

  const createFolderMutation = useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'nodes'] });
      queryClient.invalidateQueries({ queryKey: ['media', 'folders'] });
      toast.success('Folder created');
      setCreateFolderOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error as any));
    }
  });

  // --- Derived Data ---

  const folderNodes = allFoldersData?.data || [];
  
  const stats = useMemo(() => {
    const usage = usageData?.data;
    return {
      totalBytes: usage?.usedBytes || 0,
      quotaBytes: usage?.quotaBytes || 2 * 1024 * 1024 * 1024,
      bytesByKind: usage?.bytesByKind || { image: 0, video: 0, document: 0, other: 0 },
      counts: usage?.counts || {
        image: 0,
        video: 0,
        document: 0,
        other: 0,
        folders: 0,
      },
    };
  }, [usageData]);

  const createFolderParentLabel = useMemo(() => {
    if (!createFolderParentId) return 'Library';
    const match = folderNodes.find((n) => n.id === createFolderParentId);
    return match?.name ?? 'Library';
  }, [createFolderParentId, folderNodes]);

  // --- Handlers ---

  const requestCreateFolder = (parentId: string | null) => {
    setCreateFolderParentId(parentId);
    setCreateFolderOpen(true);
  };

  const handleCreateFolder = (name: string) => {
    createFolderMutation.mutate({
      name,
      parentId: createFolderParentId
    });
  };

  useEffect(() => {
    const handleRefresh = () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    };

    window.addEventListener('prism.device.updated' as any, handleRefresh);
    window.addEventListener('prism.operation.updated' as any, handleRefresh);
    window.addEventListener('prism.subscription.updated' as any, handleRefresh);

    return () => {
      window.removeEventListener('prism.device.updated' as any, handleRefresh);
      window.removeEventListener('prism.operation.updated' as any, handleRefresh);
      window.removeEventListener('prism.subscription.updated' as any, handleRefresh);
    };
  }, [queryClient]);

  if (isNodesLoading && nodes.length === 0) {
    return <div className="flex justify-center p-12 text-muted-foreground">Loading media library...</div>;
  }

  return (
    <div className="space-y-6">
      <MediaUploadPanel
        ref={uploadPanelRef}
        defaultFolderId={currentFolderId}
        folderNodes={folderNodes}
        stats={stats}
        onRequestCreateFolder={requestCreateFolder}
      />

      <MediaExplorer
        nodes={nodes}
        allFolders={folderNodes}
        currentFolderId={currentFolderId}
        onFolderChange={setCurrentFolderId}
        onRequestUpload={() => uploadPanelRef.current?.openFilePicker()}
        onRequestCreateFolder={requestCreateFolder}
        hasMore={!!nextCursor}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={(open) => {
          setCreateFolderOpen(open);
          if (!open) setCreateFolderParentId(null);
        }}
        parentLabel={createFolderParentLabel}
        onCreate={handleCreateFolder}
      />
    </div>
  );
}