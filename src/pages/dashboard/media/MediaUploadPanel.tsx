import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatBytes } from '@better-upload/client/helpers';
import { AlertTriangle, CheckCircle2, FileText, Image as ImageIcon, Loader2, Video, X } from 'lucide-react';
import { toast } from '@/store/notificationStore';

import { Button } from '@/components/ui/button';
import { StorageCard } from '@/components/ui/dashboard';
import { FileUploadCard } from '@/components/ui/file-upload-card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { computeMd5 } from '@/lib/md5-calculator';
import { generateMediaCover } from '@/lib/media-processor';
import type { MediaAssetKind, MediaNode } from '@/types/media-library';

import { UploadSettingsDialog } from './UploadSettingsDialog';
import type { PendingUploadFile, UploadTask, UploadTaskStatus } from './uploadModels';

import {
  duplicateCheck,
  batchFinalize,
  getUploadUrls
} from '@/services/mediaApi';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export type MediaUploadPanelHandle = {
  openFilePicker: () => void;
};

export const MediaUploadPanel = forwardRef<
  MediaUploadPanelHandle,
  {
    defaultFolderId: string | null;
    folderNodes: MediaNode[];
    onRequestCreateFolder: (parentId: string | null) => void;
    stats: {
      totalBytes: number;
      quotaBytes: number;
      bytesByKind: Record<MediaAssetKind, number>;
      counts: {
        image: number;
        video: number;
        document: number;
        other: number;
        folders: number;
      };
    };
  }
>(function MediaUploadPanel({ defaultFolderId, folderNodes, onRequestCreateFolder, stats }, ref) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const md5ControllersRef = useRef<Map<string, AbortController>>(new Map());
  const taskTokensRef = useRef<Map<string, number>>(new Map());
  const throughputSamplesRef = useRef<Map<string, { bytes: number; timestamp: number }>>(new Map());
  const parseSessionRef = useRef(0);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadsDrawerOpen, setUploadsDrawerOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingUploadFile[]>([]);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);

  const totalQuotaBytes = stats.quotaBytes;
  const usedQuotaBytes = stats.totalBytes;
  const quotaPercent = totalQuotaBytes === 0 ? 0 : Math.round((usedQuotaBytes / totalQuotaBytes) * 100);

  const storageBreakdown = useMemo(() => {
    const categories = [
      { name: t('media.upload.categories.image'), sizeBytes: stats.bytesByKind.image, color: 'bg-indigo-500' },
      { name: t('media.upload.categories.video'), sizeBytes: stats.bytesByKind.video, color: 'bg-emerald-500' },
      { name: t('media.upload.categories.document'), sizeBytes: stats.bytesByKind.document, color: 'bg-sky-500' },
      { name: t('media.upload.categories.other'), sizeBytes: stats.bytesByKind.other, color: 'bg-slate-400' },
    ];

    const applications = [
      { name: `${t('media.upload.categories.image')} (${stats.counts.image})`, sizeBytes: stats.bytesByKind.image, icon: <ImageIcon className="h-5 w-5 text-muted-foreground" /> },
      { name: `${t('media.upload.categories.video')} (${stats.counts.video})`, sizeBytes: stats.bytesByKind.video, icon: <Video className="h-5 w-5 text-muted-foreground" /> },
      { name: `${t('media.upload.categories.document')} (${stats.counts.document})`, sizeBytes: stats.bytesByKind.document, icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
      { name: `${t('media.upload.categories.other')} (${stats.counts.other})`, sizeBytes: stats.bytesByKind.other, icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
    ];

    return { categories, applications };
  }, [stats.bytesByKind, stats.counts.document, stats.counts.image, stats.counts.other, stats.counts.video, t]);
  const openFilePicker = () => fileInputRef.current?.click();

  useImperativeHandle(
    ref,
    () => ({
      openFilePicker,
    }),
    [],
  );

  const beginUploadFlow = (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;

    const sessionId = ++parseSessionRef.current;
    setUploadFolderId(defaultFolderId);
    setPendingFiles(
      arr.map((file) => ({
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        kind: inferAssetKind(file),
        title: stripExtension(file.name),
      })),
    );
    setUploadDialogOpen(true);

    void (async () => {
      const enriched = await mapWithConcurrency(
        arr.map((file, index) => ({ file, index })),
        2,
        async ({ file, index }) => {
          const base = {
            width: undefined as number | undefined,
            height: undefined as number | undefined,
            durationMs: undefined as number | undefined,
            cover: undefined as Blob | undefined,
            parseError: undefined as string | undefined,
          };

          try {
            const kind = inferAssetKind(file);
            if (kind === 'image') {
              const dims = await getImageDimensions(file);
              base.width = dims.width;
              base.height = dims.height;
              const coverBlob = await generateMediaCover(file);
              if (coverBlob) {
                base.cover = coverBlob;
                const cDims = await getImageDimensions(coverBlob);
                base.coverWidth = cDims.width;
                base.coverHeight = cDims.height;
              }
            } else if (kind === 'video') {
              const info = await getVideoMetadata(file);
              base.width = info.width;
              base.height = info.height;
              base.durationMs = info.durationMs;
              const coverBlob = await generateMediaCover(file);
              if (coverBlob) {
                base.cover = coverBlob;
                const cDims = await getImageDimensions(coverBlob);
                base.coverWidth = cDims.width;
                base.coverHeight = cDims.height;
              }
            }
          } catch (error) {
            base.parseError = error instanceof Error ? error.message : 'Failed to parse file info.';
          }

          return { index, ...base };
        },
      );

      if (parseSessionRef.current !== sessionId) return;
      setPendingFiles((prev) => {
        const next = prev.slice();
        for (const item of enriched) {
          const current = next[item.index];
          if (!current) continue;
          next[item.index] = {
            ...current,
            width: item.width,
            height: item.height,
            durationMs: item.durationMs,
            cover: item.cover,
            coverWidth: item.coverWidth,
            coverHeight: item.coverHeight,
            parseError: item.parseError,
          };
        }
        return next;
      });
    })();
  };

  const onPendingTitleChange = (pendingId: string, title: string) => {
    setPendingFiles((prev) => prev.map((p) => (p.id === pendingId ? { ...p, title } : p)));
  };

  const nextTaskToken = (groupId: string) => {
    const next = (taskTokensRef.current.get(groupId) ?? 0) + 1;
    taskTokensRef.current.set(groupId, next);
    return next;
  };

  const isTaskTokenActive = (groupId: string, token: number) => taskTokensRef.current.get(groupId) === token;

  const clearThroughput = (groupId: string) => {
    throughputSamplesRef.current.delete(groupId);
  };

  const updateThroughput = (groupId: string, bytes: number, now: number) => {
    const prev = throughputSamplesRef.current.get(groupId);
    throughputSamplesRef.current.set(groupId, { bytes, timestamp: now });
    if (!prev) return undefined;
    const dt = (now - prev.timestamp) / 1000;
    if (dt <= 0) return undefined;
    return Math.round((bytes - prev.bytes) / dt);
  };

  const startUploadFlow = (task: UploadTask) => {
    const token = nextTaskToken(task.groupId);

    const previousMd5 = md5ControllersRef.current.get(task.groupId);
    if (previousMd5) previousMd5.abort();

    const controller = new AbortController();
    md5ControllersRef.current.set(task.groupId, controller);

    setUploadTasks((prev) =>
      prev.map((t) =>
        t.groupId === task.groupId
          ? {
              ...t,
              status: 'verifying',
              progress: 0,
              bytesUploaded: 0,
              bytesTotal: task.original.size,
              throughputBps: undefined,
              md5: undefined,
              error: undefined,
            }
          : t,
      ),
    );

    void (async () => {
      try {
        // 1. Calculate MD5
        const md5 = await computeMd5(task.original, task.groupId, {
          signal: controller.signal,
          onProgress: (percent, data) => {
            if (!isTaskTokenActive(task.groupId, token)) return;
            const now = Date.now();
            setUploadTasks((prev) =>
              prev.map((t) =>
                t.groupId === task.groupId
                  ? {
                      ...t,
                      status: 'verifying',
                      progress: percent,
                      bytesUploaded: data.processedBytes,
                      bytesTotal: data.totalBytes,
                      throughputBps: updateThroughput(task.groupId, data.processedBytes, now),
                    }
                  : t,
              ),
            );
          },
        });

        if (!isTaskTokenActive(task.groupId, token)) return;
        md5ControllersRef.current.delete(task.groupId);
        clearThroughput(task.groupId);

        // Calculate cover MD5 if cover exists (cover is small, so this is fast)
        let coverMd5: string | undefined;
        if (task.cover) {
          const coverFile = new File([task.cover], 'cover.jpg', { type: 'image/jpeg' });
          coverMd5 = await computeMd5(coverFile, `${task.groupId}-cover`);
        }

        setUploadTasks((prev) =>
          prev.map((t) =>
            t.groupId === task.groupId
              ? {
                  ...t,
                  status: 'checking',
                  md5,
                  coverMd5,
                  progress: 1,
                  bytesUploaded: task.original.size,
                  bytesTotal: task.original.size,
                  throughputBps: undefined,
                }
              : t,
          ),
        );

        // 2. Duplicate Check
        const checkRes = await duplicateCheck({
          files: [{
            clientId: task.groupId,
            md5,
            size: task.original.size,
            type: task.original.type
          }]
        });

        const checkResult = checkRes.data?.results[0];
        if (!isTaskTokenActive(task.groupId, token)) return;

        if (checkResult?.duplicate && checkResult.fileEntityId) {
          // INSTANT UPLOAD: Original file already exists, but cover still needs upload
          setUploadTasks((prev) =>
            prev.map((t) => (t.groupId === task.groupId ? { ...t, status: 'uploading', progress: 0 } : t))
          );

          let coverS3Key: string | undefined;
          if (task.cover && coverMd5) {
            // Upload cover even for instant upload (cover is generated by frontend)
            const coverUploadInfo = await getUploadUrls({
              route: 'mediaLibrary',
              files: [{ name: 'cover.jpg', size: task.cover.size, type: 'image/jpeg' }],
              metadata: {
                folderId: task.folderId || 'default',
                items: [{ name: 'cover.jpg', groupId: task.groupId, role: 'cover', md5: coverMd5 }],
              },
            });
            const coverResult = coverUploadInfo.files[0];
            if (coverResult) {
              coverS3Key = coverResult.file.objectInfo.key;
              await fetch(coverResult.signedUrl, {
                method: 'PUT',
                headers: coverResult.headers,
                body: task.cover,
              }).then((res) => {
                if (!res.ok) throw new Error(`Cover upload failed: ${res.status}`);
              });
            }
          }

          setUploadTasks((prev) =>
            prev.map((t) => (t.groupId === task.groupId ? { ...t, status: 'finalizing', progress: 1 } : t))
          );

          await finalizeUpload(task, md5, undefined, checkResult.fileEntityId, coverS3Key, undefined, coverMd5);
          return;
        }

        // 3. Get Presigned URL (Better Upload)
        setUploadTasks((prev) =>
          prev.map((t) => (t.groupId === task.groupId ? { ...t, status: 'uploading', progress: 0 } : t))
        );

        const filesToUpload = [
          {
            name: task.original.name,
            size: task.original.size,
            type: task.original.type,
          },
        ];

        const metadataItems = [
          {
            name: task.original.name,
            groupId: task.groupId,
            role: 'original',
            md5,
          },
        ];

        if (task.cover && coverMd5) {
          filesToUpload.push({
            name: 'cover.jpg',
            size: task.cover.size,
            type: 'image/jpeg',
          });
          metadataItems.push({
            name: 'cover.jpg',
            groupId: task.groupId,
            role: 'cover',
            md5: coverMd5,
          });
        }

        const uploadInfo = await getUploadUrls({
          route: 'mediaLibrary',
          files: filesToUpload,
          metadata: {
            folderId: task.folderId || 'default',
            items: metadataItems,
          },
        });

        const originalResult = uploadInfo.files[0];
        const coverResult = task.cover ? uploadInfo.files[1] : undefined;

        if (!originalResult) throw new Error('Failed to get upload URL for original file');

        const s3Key = originalResult.file.objectInfo.key;
        const uploadUrl = originalResult.signedUrl;

        // 4. Upload to S3 using axios (to support upload progress)
        const uploadOriginal = axios.put(uploadUrl, task.original, {
          headers: originalResult.headers,
          onUploadProgress: (progressEvent) => {
            if (!isTaskTokenActive(task.groupId, token)) return;
            const loaded = progressEvent.loaded || 0;
            const total = progressEvent.total || task.original.size;
            const percent = loaded / total;
            const now = Date.now();
            
            setUploadTasks((prev) =>
              prev.map((t) =>
                t.groupId === task.groupId
                  ? {
                      ...t,
                      status: 'uploading',
                      progress: percent,
                      bytesUploaded: loaded,
                      bytesTotal: total,
                      throughputBps: updateThroughput(task.groupId, loaded, now),
                    }
                  : t,
              ),
            );
          },
        }).then((res) => {
          if (res.status < 200 || res.status >= 300) throw new Error(`Original upload failed: ${res.status}`);
          return res;
        });

        const uploads: Promise<any>[] = [uploadOriginal];

        let coverS3Key: string | undefined;
        if (task.cover && coverResult) {
          coverS3Key = coverResult.file.objectInfo.key;
          uploads.push(
            axios.put(coverResult.signedUrl, task.cover, {
              headers: coverResult.headers,
            }).then((res) => {
              if (res.status < 200 || res.status >= 300) throw new Error(`Cover upload failed: ${res.status}`);
              return res;
            }),
          );
        }

        await Promise.all(uploads);

        if (!isTaskTokenActive(task.groupId, token)) return;

        // 5. Finalize in Database
        setUploadTasks((prev) =>
          prev.map((t) => (t.groupId === task.groupId ? { ...t, status: 'finalizing', progress: 1 } : t))
        );

        await finalizeUpload(task, md5, s3Key, undefined, coverS3Key, undefined, coverMd5);

      } catch (error: any) {
        if (!isTaskTokenActive(task.groupId, token)) return;
        md5ControllersRef.current.delete(task.groupId);
        clearThroughput(task.groupId);

        const message = error.error?.displayMessage || error.response?.data?.error?.displayMessage || error.message || t('media.upload.taskStatus.error');
        const canceled = message.toLowerCase().includes('cancel') || axios.isCancel(error);

        setUploadTasks((prev) =>
          prev.map((t) =>
            t.groupId === task.groupId
              ? {
                  ...t,
                  status: canceled ? 'canceled' : 'error',
                  error: canceled ? undefined : message,
                  throughputBps: undefined,
                }
              : t,
          ),
        );
      }
    })();
  };

  const finalizeUpload = async (
    task: UploadTask,
    md5: string,
    s3Key?: string,
    fileEntityId?: string,
    coverS3Key?: string,
    coverFileEntityId?: string,
    coverMd5?: string
  ) => {
    try {
      const files: any[] = [
        {
          role: 'original',
          s3Key,
          fileEntityId,
          size: task.original.size,
          type: task.original.type,
          originalName: task.original.name,
          md5,
          width: task.width,
          height: task.height,
          durationMs: task.durationMs,
        },
      ];

      if (task.cover && (coverS3Key || coverFileEntityId)) {
        files.push({
          role: 'cover',
          s3Key: coverS3Key,
          fileEntityId: coverFileEntityId,
          size: task.cover.size,
          type: 'image/jpeg',
          originalName: 'cover.jpg',
          md5: coverMd5,
          width: task.coverWidth,
          height: task.coverHeight,
        });
      }

      await batchFinalize({
        folderId: task.folderId,
        items: [
          {
            groupId: task.groupId,
            title: task.title,
            files,
          },
        ],
      });

      setUploadTasks((prev) =>
        prev.map((t) => (t.groupId === task.groupId ? { ...t, status: 'done', progress: 1 } : t))
      );

      // Refresh list and usage
      queryClient.invalidateQueries({ queryKey: ['media'] });
    } catch (error: any) {
      const message = error.error?.displayMessage || error.response?.data?.error?.displayMessage || error.message || t('media.upload.taskStatus.error');
      setUploadTasks((prev) =>
        prev.map((t) => (t.groupId === task.groupId ? { ...t, status: 'error', error: message } : t))
      );
    }
  };

  const cancelTask = (groupId: string) => {
    clearThroughput(groupId);
    const controller = md5ControllersRef.current.get(groupId);
    if (controller) controller.abort();
    md5ControllersRef.current.delete(groupId);
    nextTaskToken(groupId);
    setUploadTasks((prev) =>
      prev.map((t) => (t.groupId === groupId ? { ...t, status: 'canceled', throughputBps: undefined } : t)),
    );
  };

  const retryTask = (groupId: string) => {
    const task = uploadTasks.find((t) => t.groupId === groupId);
    if (!task) return;
    startUploadFlow(task);
  };

  const clearFinished = () => {
    setUploadTasks((prev) => prev.filter((t) => !['done', 'canceled'].includes(t.status)));
  };

  const cancelAll = () => {
    for (const task of uploadTasks) {
      if (['verifying', 'checking', 'uploading', 'finalizing'].includes(task.status)) cancelTask(task.groupId);
    }
  };

  const retryAllFailed = () => {
    for (const task of uploadTasks) {
      if (task.status === 'error') startUploadFlow(task);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const clipboard = navigator.clipboard as unknown as { read?: () => Promise<ClipboardItem[]> };
      if (!clipboard?.read) {
        toast.error(t('media.upload.toasts.clipboardNotSupported'));
        return;
      }

      const items = await clipboard.read();
      const files: File[] = [];

      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const ext = imageType === 'image/jpeg' ? 'jpg' : imageType.split('/')[1] ?? 'png';
        files.push(new File([blob], `pasted-${Date.now()}.${ext}`, { type: imageType }));
      }

      if (files.length === 0) {
        toast.message(t('media.upload.toasts.clipboardNoImage'));
        return;
      }

      beginUploadFlow(files);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.errors.unknown');
      toast.error(message);
    }
  };

  const handleUploadConfirm = () => {
    if (pendingFiles.length === 0) {
      toast.error(t('media.upload.toasts.noFilesSelected'));
      return;
    }

    const tasks: UploadTask[] = pendingFiles.map((p) => {
      const groupId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      return {
        groupId,
        folderId: uploadFolderId ?? null,
        title: p.title.trim() || stripExtension(p.file.name),
        original: p.file,
        kind: p.kind,
        status: 'verifying',
        progress: 0,
        bytesTotal: p.file.size,
        bytesUploaded: 0,
        createdAt: Date.now(),
        cover: p.cover,
        width: p.width,
        height: p.height,
        durationMs: p.durationMs,
        coverWidth: p.coverWidth,
        coverHeight: p.coverHeight,
      };
    });

    setUploadTasks((prev) => [...tasks, ...prev].slice(0, 12));
    setUploadDialogOpen(false);
    setPendingFiles([]);
    setUploadFolderId(null);

    for (const task of tasks) startUploadFlow(task);
  };

  useEffect(() => {
    const controllers = md5ControllersRef.current;
    const throughputSamples = throughputSamplesRef.current;
    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      throughputSamples.clear();
    };
  }, []);

  const recentCountLabel = useMemo(() => {
    const active = uploadTasks.filter((t) =>
      ['verifying', 'checking', 'uploading', 'finalizing'].includes(t.status),
    ).length;
    const finished = uploadTasks.length - active;
    if (uploadTasks.length === 0) return t('media.upload.noUploads');
    if (active > 0) return `${active} ${t('media.upload.active')} · ${finished} ${t('media.upload.recent')}`;
    return `${finished} ${t('media.upload.recent')}`;
  }, [uploadTasks, t]);

  const hasFinishedTasks = uploadTasks.some((task) => ['done', 'canceled'].includes(task.status));
  const hasFailedTasks = uploadTasks.some((task) => task.status === 'error');
  const hasActiveTasks = uploadTasks.some((task) => ['verifying', 'checking', 'uploading', 'finalizing'].includes(task.status));

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (!e.target.files) return;
          beginUploadFlow(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FileUploadCard
          className="lg:col-span-2"
          onChooseFiles={openFilePicker}
          onPasteFiles={() => void pasteFromClipboard()}
          onDropFiles={(files) => beginUploadFlow(files)}
        >
          {uploadTasks.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Upload activity</p>
                  <p className="text-xs text-muted-foreground">{recentCountLabel}</p>
                </div>
                {uploadTasks.length > 2 && (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => setUploadsDrawerOpen(true)}
                  >
                    View all ({uploadTasks.length})
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {uploadTasks.slice(0, 2).map((task) => (
                  <UploadTaskMiniRow
                    key={task.groupId}
                    task={task}
                    onCancel={() => cancelTask(task.groupId)}
                    onRetry={() => retryTask(task.groupId)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </FileUploadCard>

        <StorageCard
          className="h-full max-w-none"
          title="Library storage"
          totalBytes={totalQuotaBytes}
          categories={storageBreakdown.categories}
          applications={storageBreakdown.applications}
          alertMessage={
            quotaPercent >= 85 ? (
              <span className="inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Storage is getting tight — consider cleaning up unused assets.
              </span>
            ) : undefined
          }
        />
      </div>

      <Sheet open={uploadsDrawerOpen} onOpenChange={setUploadsDrawerOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t('media.upload.drawer.title')}</SheetTitle>
            <SheetDescription>{recentCountLabel}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={cancelAll} disabled={!hasActiveTasks}>
              {t('media.upload.drawer.cancelAll')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={retryAllFailed} disabled={!hasFailedTasks}>
              {t('media.upload.drawer.retryFailed')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearFinished} disabled={!hasFinishedTasks}>
              {t('media.upload.drawer.clearFinished')}
            </Button>
          </div>

          <ScrollArea className="mt-4 flex-1 pr-4">
            {uploadTasks.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">{t('media.upload.drawer.empty')}</p>
              </div>
            ) : (
              <div className="space-y-3 pb-6">
                {uploadTasks.map((task) => (
                  <UploadTaskRow
                    key={task.groupId}
                    task={task}
                    onCancel={() => cancelTask(task.groupId)}
                    onRetry={() => retryTask(task.groupId)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <UploadSettingsDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        pendingFiles={pendingFiles}
        folderNodes={folderNodes}
        selectedFolderId={uploadFolderId}
        onSelectedFolderIdChange={setUploadFolderId}
        onPendingTitleChange={onPendingTitleChange}
        onConfirm={handleUploadConfirm}
        onPickMore={openFilePicker}
        onRequestCreateFolder={onRequestCreateFolder}
      />
    </div>
  );
});

function UploadTaskMiniRow({
  task,
  onCancel,
  onRetry,
}: {
  task: UploadTask;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const icon = task.kind === 'video' ? Video : task.kind === 'image' ? ImageIcon : FileText;
  const Icon = icon;
  const showProgress = task.status === 'verifying' || task.status === 'uploading';
  const percentLabel = showProgress ? `${Math.round(task.progress * 100)}%` : undefined;
  const speedLabel = showProgress ? formatThroughput(task.throughputBps) : undefined;
  const statusLine = [formatTaskStatus(task.status), percentLabel, speedLabel].filter(Boolean).join(' · ');
  const bytesLine =
    task.status === 'verifying' || task.status === 'uploading'
      ? `${formatBytes(task.bytesUploaded)} / ${formatBytes(task.bytesTotal)}`
      : task.status === 'done'
        ? `${formatBytes(task.bytesTotal)}`
        : undefined;

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/10 px-3 py-2">
      <div className="mt-0.5 rounded-md bg-muted p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground">{statusLine}</p>
            {bytesLine && <p className="text-xs text-muted-foreground">{bytesLine}</p>}
          </div>

          <div className="flex items-center gap-1">
            {task.status === 'error' && (
              <Button variant="outline" size="sm" className="h-8" onClick={onRetry}>
                {t('common.actions.refresh')}
              </Button>
            )}
            {['verifying', 'checking', 'uploading', 'finalizing'].includes(task.status) && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
            {task.status === 'done' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {task.status === 'error' && <AlertTriangle className="h-5 w-5 text-rose-600" />}
            {['verifying', 'checking', 'finalizing'].includes(task.status) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {showProgress && <Progress value={Math.round(task.progress * 100)} className="h-1.5" />}
        {task.error && <p className="text-xs text-rose-600">{task.error}</p>}
      </div>
    </div>
  );
}

function UploadTaskRow({
  task,
  onCancel,
  onRetry,
}: {
  task: UploadTask;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const icon = task.kind === 'video' ? Video : task.kind === 'image' ? ImageIcon : FileText;
  const Icon = icon;
  const showProgress = task.status === 'verifying' || task.status === 'uploading';
  const speedLabel = showProgress ? formatThroughput(task.throughputBps) : undefined;
  const detailParts: string[] = [];
  if (task.status === 'verifying' || task.status === 'uploading') {
    detailParts.push(`${formatBytes(task.bytesUploaded)} / ${formatBytes(task.bytesTotal)}`);
    if (speedLabel) detailParts.push(speedLabel);
  } else if (task.status === 'done') {
    detailParts.push(`${formatBytes(task.bytesTotal)}`);
  }
  const detailLine = detailParts.length > 0 ? ` · ${detailParts.join(' · ')}` : '';

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background px-3 py-3">
      <div className="mt-0.5 rounded-md bg-muted p-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatTaskStatus(task.status)}
              {detailLine}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {task.status === 'error' && (
              <Button variant="outline" size="sm" className="h-8" onClick={onRetry}>
                {t('common.actions.refresh')}
              </Button>
            )}
            {['verifying', 'checking', 'uploading', 'finalizing'].includes(task.status) && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
            {task.status === 'done' && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
            {task.status === 'error' && (
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            )}
            {['verifying', 'checking', 'finalizing'].includes(task.status) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {showProgress && <Progress value={Math.round(task.progress * 100)} className="h-2" />}
        {task.error && <p className="text-xs text-rose-600">{task.error}</p>}
      </div>
    </div>
  );
}

function formatTaskStatus(status: UploadTaskStatus, t: TFunction): string {
  switch (status) {
    case 'verifying':
      return t('media.upload.taskStatus.verifying');
    case 'checking':
      return t('media.upload.taskStatus.checking');
    case 'uploading':
      return t('media.upload.taskStatus.uploading');
    case 'finalizing':
      return t('media.upload.taskStatus.finalizing');
    case 'done':
      return t('media.upload.taskStatus.done');
    case 'error':
      return t('media.upload.taskStatus.error');
    case 'canceled':
      return t('media.upload.taskStatus.canceled');
    default:
      return status;
  }
}

function formatThroughput(throughputBps?: number): string | undefined {
  if (!throughputBps || !Number.isFinite(throughputBps) || throughputBps <= 0) return undefined;
  return `${formatBytes(throughputBps)}/s`;
}

function inferAssetKind(file: File): MediaAssetKind {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (
    file.type === 'application/pdf' ||
    file.type.startsWith('text/') ||
    file.type.includes('officedocument') ||
    file.type.includes('presentation')
  ) {
    return 'document';
  }
  return 'other';
}

function stripExtension(filename: string): string {
  const index = filename.lastIndexOf('.');
  if (index <= 0) return filename;
  return filename.slice(0, index);
}

function estimateCoverBytes(file: File): number {
  const kind = inferAssetKind(file);
  if (kind === 'video') return 220_000;
  if (kind === 'image') return Math.min(350_000, Math.round(file.size * 0.25));
  return 0;
}

async function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  bitmap.close();
  return { width, height };
}

async function getVideoMetadata(file: File): Promise<{ width: number; height: number; durationMs: number }> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    const metadata = await new Promise<{ width: number; height: number; durationMs: number }>((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
        video.src = '';
      };
      const onLoaded = () => {
        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;
        const durationMs = Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : 0;
        
        cleanup();
        resolve({ width, height, durationMs });
      };
      const onError = () => {
        cleanup();
        reject(new Error('Unable to read video metadata.'));
      };
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });
    });

    return metadata;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (cursor < items.length) {
      const current = cursor++;
      results[current] = await mapper(items[current]);
    }
  });

  await Promise.all(workers);
  return results;
}
