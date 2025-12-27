import { useMemo, useRef, useState } from 'react';
import { toast } from '@/store/notificationStore';

import { mockMediaLibraryNodes } from '@/lib/mock/media-library';
import type { MediaNode } from '@/types/media-library';

import { CreateFolderDialog } from './CreateFolderDialog';
import { MediaExplorer } from './MediaExplorer';
import { MediaUploadPanel, type MediaUploadPanelHandle } from './MediaUploadPanel';

export default function MediaLibraryPage() {
  const [nodes, setNodes] = useState<MediaNode[]>(() => mockMediaLibraryNodes);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const uploadPanelRef = useRef<MediaUploadPanelHandle | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);

  const nodesWithComputedCounts = useMemo(() => withComputedFolderCounts(nodes), [nodes]);
  const folderNodes = useMemo(() => nodesWithComputedCounts.filter((n) => n.type === 'folder'), [nodesWithComputedCounts]);
  const assets = useMemo(() => nodesWithComputedCounts.filter((n) => n.type === 'asset'), [nodesWithComputedCounts]);

  const stats = useMemo(() => {
    const totalBytes = assets.reduce((acc, n) => acc + n.sizeBytes, 0);
    const bytesByKind = assets.reduce(
      (acc, asset) => {
        acc[asset.assetKind] += asset.sizeBytes;
        return acc;
      },
      { image: 0, video: 0, document: 0, other: 0 } as Record<'image' | 'video' | 'document' | 'other', number>,
    );
    return {
      totalBytes,
      bytesByKind,
      counts: {
        image: assets.filter((a) => a.assetKind === 'image').length,
        video: assets.filter((a) => a.assetKind === 'video').length,
        document: assets.filter((a) => a.assetKind === 'document').length,
        other: assets.filter((a) => a.assetKind === 'other').length,
        folders: folderNodes.length,
      },
    };
  }, [assets, folderNodes.length]);

  const createFolderParentLabel = useMemo(() => {
    if (!createFolderParentId) return 'Library';
    const match = folderNodes.find((n) => n.id === createFolderParentId && n.type === 'folder');
    return match?.name ?? 'Library';
  }, [createFolderParentId, folderNodes]);

  const requestCreateFolder = (parentId: string | null) => {
    setCreateFolderParentId(parentId);
    setCreateFolderOpen(true);
  };

  const handleCreateFolder = (name: string) => {
    const parentId = createFolderParentId;
    const nowIso = new Date().toISOString();
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `folder-${nowIso.replace(/[:.]/g, '-')}-${Math.random().toString(16).slice(2)}`;

    setNodes((prev) => [
      ...prev,
      {
        id,
        type: 'folder',
        name,
        parentId,
        childrenCount: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ]);

    toast.success('Folder created');
  };

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
        nodes={nodesWithComputedCounts}
        currentFolderId={currentFolderId}
        onFolderChange={setCurrentFolderId}
        onRequestUpload={() => uploadPanelRef.current?.openFilePicker()}
        onRequestCreateFolder={requestCreateFolder}
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

function withComputedFolderCounts(nodes: MediaNode[]): MediaNode[] {
  const countsByParentId = new Map<string, number>();

  for (const node of nodes) {
    if (!node.parentId) continue;
    countsByParentId.set(node.parentId, (countsByParentId.get(node.parentId) ?? 0) + 1);
  }

  return nodes.map((node) => {
    if (node.type !== 'folder') return node;
    return { ...node, childrenCount: countsByParentId.get(node.id) ?? 0 };
  });
}
