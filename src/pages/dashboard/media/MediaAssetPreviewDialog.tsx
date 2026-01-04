import { useEffect, useMemo } from 'react';
import { formatBytes } from '@better-upload/client/helpers';
import { ExternalLink, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { MediaAssetNode } from '@/types/media-library';

export function MediaAssetPreviewDialog({
  open,
  onOpenChange,
  asset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: MediaAssetNode | null;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenChange, open]);

  const isImage = asset?.assetKind === 'image';
  const isVideo = asset?.assetKind === 'video';
  const previewUrl = useMemo(() => {
    if (!asset) return null;
    if (asset.assetKind === 'video') return asset.assetUrl ?? null;
    if (asset.assetKind === 'image') return asset.assetUrl ?? asset.coverUrl ?? null;
    return null;
  }, [asset]);

  const metadataLine = useMemo(() => {
    if (!asset) return '';
    const parts: string[] = [];
    parts.push(formatBytes(asset.sizeBytes));
    if (asset.width && asset.height) parts.push(`${asset.width}×${asset.height}`);
    if (asset.assetKind === 'video' && asset.durationMs) parts.push(formatDuration(asset.durationMs));
    if (asset.extension) parts.push(asset.extension.toUpperCase());
    return parts.join(' · ');
  }, [asset]);

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100vw-2rem,1100px)] max-w-none p-0 overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{asset.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{metadataLine || asset.mimeType}</p>
          </div>

          <div className="flex items-center gap-2">
            {previewUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4" />
                {t('common.actions.open')}
              </Button>
            ) : null}

            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onOpenChange(false)} aria-label={t('common.actions.close')}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-black/90">
          <div className="flex max-h-[calc(90vh-5rem)] items-center justify-center p-4">
            {isImage ? (
              previewUrl ? (
                <img
                  src={previewUrl}
                  alt={asset.name}
                  className="max-h-[calc(90vh-8rem)] w-auto max-w-full rounded-md object-contain"
                />
              ) : (
                <FallbackMessage title={t('media.explorer.toasts.previewUnavailable')} desc={t('media.explorer.toasts.previewUnavailableDescImage')} />
              )
            ) : isVideo ? (
              previewUrl ? (
                <video
                  src={previewUrl}
                  poster={asset.coverUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-[calc(90vh-8rem)] w-full max-w-4xl rounded-md bg-black"
                />
              ) : (
                <FallbackMessage title={t('media.explorer.toasts.previewUnavailable')} desc={t('media.explorer.toasts.previewUnavailableDescVideo')} />
              )
            ) : (
              <FallbackMessage title={t('media.explorer.toasts.previewUnavailable')} desc={t('media.explorer.toasts.previewUnavailableDescDoc')} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FallbackMessage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-white/70">{desc}</p>
    </div>
  );
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

