import { useMemo, useRef, useState } from 'react';

import { mockMediaLibraryNodes } from '@/lib/mock/media-library';
import type { MediaNode } from '@/types/media-library';

import { MediaExplorer } from './MediaExplorer';
import { MediaUploadPanel, type MediaUploadPanelHandle } from './MediaUploadPanel';

export default function MediaLibraryPage() {
  const [nodes] = useState<MediaNode[]>(() => mockMediaLibraryNodes);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const uploadPanelRef = useRef<MediaUploadPanelHandle | null>(null);

  const folderNodes = useMemo(() => nodes.filter((n) => n.type === 'folder'), [nodes]);
  const assets = useMemo(() => nodes.filter((n) => n.type === 'asset'), [nodes]);

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

  return (
    <div className="space-y-6">
      <MediaUploadPanel
        ref={uploadPanelRef}
        defaultFolderId={currentFolderId}
        folderNodes={folderNodes}
        stats={stats}
      />

      <MediaExplorer
        nodes={nodes}
        currentFolderId={currentFolderId}
        onFolderChange={setCurrentFolderId}
        onRequestUpload={() => uploadPanelRef.current?.openFilePicker()}
      />
    </div>
  );
}
