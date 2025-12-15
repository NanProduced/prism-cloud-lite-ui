import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { formatBytes } from '@better-upload/client/helpers';
import { AlertTriangle, CheckCircle2, FileText, Image as ImageIcon, Loader2, Video, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { StorageCard } from '@/components/ui/dashboard';
import { FileUploadCard } from '@/components/ui/file-upload-card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { computeMd5 } from '@/lib/md5-calculator';
import type { MediaAssetKind, MediaNode } from '@/types/media-library';

import { UploadSettingsDialog } from './UploadSettingsDialog';
import type { PendingUploadFile, UploadTask, UploadTaskStatus } from './uploadModels';

export type MediaUploadPanelHandle = {
  openFilePicker: () => void;
};

export const MediaUploadPanel = forwardRef<
  MediaUploadPanelHandle,
  {
    defaultFolderId: string | null;
    folderNodes: MediaNode[];
    stats: {
      totalBytes: number;
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
>(function MediaUploadPanel({ defaultFolderId, folderNodes, stats }, ref) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const taskTimersRef = useRef<Map<string, number>>(new Map());
  const md5ControllersRef = useRef<Map<string, AbortController>>(new Map());
  const taskTokensRef = useRef<Map<string, number>>(new Map());
  const throughputSamplesRef = useRef<Map<string, { bytes: number; timestamp: number }>>(new Map());
  const parseSessionRef = useRef(0);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadsDrawerOpen, setUploadsDrawerOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingUploadFile[]>([]);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);

  const totalQuotaBytes = 2 * 1024 * 1024 * 1024;
  const usedQuotaBytes = Math.min(stats.totalBytes, totalQuotaBytes);
  const quotaPercent = totalQuotaBytes === 0 ? 0 : Math.round((usedQuotaBytes / totalQuotaBytes) * 100);

  const storageBreakdown = useMemo(() => {
    const categories = [
      { name: 'Images', sizeBytes: stats.bytesByKind.image, color: 'bg-indigo-500' },
      { name: 'Videos', sizeBytes: stats.bytesByKind.video, color: 'bg-emerald-500' },
      { name: 'Docs', sizeBytes: stats.bytesByKind.document, color: 'bg-sky-500' },
      { name: 'Other', sizeBytes: stats.bytesByKind.other, color: 'bg-slate-400' },
    ];

    const applications = [
      { name: `Images (${stats.counts.image})`, sizeBytes: stats.bytesByKind.image, icon: <ImageIcon className="h-5 w-5 text-muted-foreground" /> },
      { name: `Videos (${stats.counts.video})`, sizeBytes: stats.bytesByKind.video, icon: <Video className="h-5 w-5 text-muted-foreground" /> },
      { name: `Docs (${stats.counts.document})`, sizeBytes: stats.bytesByKind.document, icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
      { name: `Other (${stats.counts.other})`, sizeBytes: stats.bytesByKind.other, icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
    ];

    return { categories, applications };
  }, [stats.bytesByKind, stats.counts.document, stats.counts.image, stats.counts.other, stats.counts.video]);

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
            parseError: undefined as string | undefined,
          };

          try {
            const kind = inferAssetKind(file);
            if (kind === 'image') {
              const dims = await getImageDimensions(file);
              base.width = dims.width;
              base.height = dims.height;
            } else if (kind === 'video') {
              const info = await getVideoMetadata(file);
              base.width = info.width;
              base.height = info.height;
              base.durationMs = info.durationMs;
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

  const updateThroughput = (groupId: string, bytesUploaded: number, timestamp: number) => {
    const previous = throughputSamplesRef.current.get(groupId);
    throughputSamplesRef.current.set(groupId, { bytes: bytesUploaded, timestamp });

    if (!previous) return undefined;
    const deltaMs = timestamp - previous.timestamp;
    const deltaBytes = bytesUploaded - previous.bytes;
    if (deltaMs <= 0 || deltaBytes <= 0) return undefined;
    return (deltaBytes / deltaMs) * 1000;
  };

  const stopMockTimer = (groupId: string) => {
    const timer = taskTimersRef.current.get(groupId);
    if (timer) window.clearInterval(timer);
    taskTimersRef.current.delete(groupId);
  };

  const startMockUploadProgress = (groupId: string) => {
    stopMockTimer(groupId);
    clearThroughput(groupId);

    const timerId = window.setInterval(() => {
      const now = Date.now();
      setUploadTasks((prev) =>
        prev.map((t) => {
          if (t.groupId !== groupId) return t;
          if (t.status === 'canceled' || t.status === 'error' || t.status === 'done') return t;

          const nextProgress = Math.min(1, t.progress + 0.03);
          const status: UploadTaskStatus =
            nextProgress < 0.86 ? 'uploading' : nextProgress < 0.98 ? 'finalizing' : 'done';
          const bytesUploaded = Math.round(t.bytesTotal * nextProgress);

          const isProgressing = status === 'uploading';
          const throughputBps = isProgressing ? updateThroughput(groupId, bytesUploaded, now) : undefined;
          if (!isProgressing) clearThroughput(groupId);

          if (status === 'done') {
            clearThroughput(groupId);
            return { ...t, progress: 1, status, bytesUploaded: t.bytesTotal, throughputBps: undefined };
          }

          return { ...t, progress: nextProgress, status, bytesUploaded, throughputBps };
        }),
      );
    }, 160);

    taskTimersRef.current.set(groupId, timerId);
  };

  const startUploadFlow = (task: UploadTask) => {
    stopMockTimer(task.groupId);
    clearThroughput(task.groupId);

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

        setUploadTasks((prev) =>
          prev.map((t) =>
            t.groupId === task.groupId
              ? {
                  ...t,
                  status: 'checking',
                  md5,
                  progress: 1,
                  bytesUploaded: task.original.size,
                  bytesTotal: task.original.size,
                  throughputBps: undefined,
                }
              : t,
          ),
        );

        const checkResult = await checkDuplicate({
          clientId: task.groupId,
          md5,
          size: task.original.size,
          type: task.original.type,
        }).catch(() => ({ duplicate: false }));

        if (!isTaskTokenActive(task.groupId, token)) return;

        if (checkResult.duplicate) {
          setUploadTasks((prev) =>
            prev.map((t) =>
              t.groupId === task.groupId
                ? {
                    ...t,
                    status: 'finalizing',
                    progress: 1,
                    bytesUploaded: t.bytesTotal,
                    bytesTotal: t.bytesTotal,
                    throughputBps: undefined,
                  }
                : t,
            ),
          );

          window.setTimeout(() => {
            if (!isTaskTokenActive(task.groupId, token)) return;
            setUploadTasks((prev) =>
              prev.map((t) => (t.groupId === task.groupId ? { ...t, status: 'done', progress: 1 } : t)),
            );
          }, 450);

          return;
        }

        clearThroughput(task.groupId);
        setUploadTasks((prev) =>
          prev.map((t) =>
            t.groupId === task.groupId
              ? {
                  ...t,
                  status: 'uploading',
                  progress: 0,
                  bytesUploaded: 0,
                  bytesTotal: task.original.size + estimateCoverBytes(task.original),
                  throughputBps: undefined,
                }
              : t,
          ),
        );

        startMockUploadProgress(task.groupId);
      } catch (error) {
        if (!isTaskTokenActive(task.groupId, token)) return;
        md5ControllersRef.current.delete(task.groupId);
        clearThroughput(task.groupId);

        const message = error instanceof Error ? error.message : 'Failed to compute MD5.';
        const canceled = message.toLowerCase().includes('cancel');

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

  const cancelTask = (groupId: string) => {
    stopMockTimer(groupId);
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
        toast.error('Clipboard paste is not supported in this browser.');
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
        toast.message('Clipboard does not contain an image.');
        return;
      }

      beginUploadFlow(files);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to paste from clipboard.';
      toast.error(message);
    }
  };

  const handleUploadConfirm = () => {
    if (pendingFiles.length === 0) {
      toast.error('No files selected.');
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
      };
    });

    setUploadTasks((prev) => [...tasks, ...prev].slice(0, 12));
    setUploadDialogOpen(false);
    setPendingFiles([]);
    setUploadFolderId(null);

    for (const task of tasks) startUploadFlow(task);
  };

  useEffect(() => {
    const timers = taskTimersRef.current;
    const controllers = md5ControllersRef.current;
    const throughputSamples = throughputSamplesRef.current;
    return () => {
      timers.forEach((timer) => window.clearInterval(timer));
      timers.clear();
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      throughputSamples.clear();
    };
  }, []);

  useEffect(() => {
    for (const task of uploadTasks) {
      if (task.status === 'done' || task.status === 'canceled' || task.status === 'error') stopMockTimer(task.groupId);
    }
  }, [uploadTasks]);

  const recentCountLabel = useMemo(() => {
    const active = uploadTasks.filter((t) =>
      ['verifying', 'checking', 'uploading', 'finalizing'].includes(t.status),
    ).length;
    const finished = uploadTasks.length - active;
    if (uploadTasks.length === 0) return 'No uploads yet';
    if (active > 0) return `${active} active · ${finished} recent`;
    return `${finished} recent uploads`;
  }, [uploadTasks]);

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
            <SheetTitle>Uploads</SheetTitle>
            <SheetDescription>{recentCountLabel}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={cancelAll} disabled={!hasActiveTasks}>
              Cancel all
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={retryAllFailed} disabled={!hasFailedTasks}>
              Retry all failed
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearFinished} disabled={!hasFinishedTasks}>
              Clear finished
            </Button>
          </div>

          <ScrollArea className="mt-4 flex-1 pr-4">
            {uploadTasks.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">No uploads in this session.</p>
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
                Retry
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
                Retry
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

function formatTaskStatus(status: UploadTaskStatus): string {
  switch (status) {
    case 'verifying':
      return 'Verifying (MD5)';
    case 'checking':
      return 'Checking duplicates';
    case 'uploading':
      return 'Uploading';
    case 'finalizing':
      return 'Finalizing';
    case 'done':
      return 'Completed';
    case 'error':
      return 'Failed';
    case 'canceled':
      return 'Canceled';
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

async function checkDuplicate(input: { clientId: string; md5?: string; size: number; type: string }): Promise<{
  duplicate: boolean;
  fileEntityId?: string;
}> {
  const response = await fetch('/api/upload/check', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: [
        {
          clientId: input.clientId,
          md5: input.md5,
          size: input.size,
          type: input.type,
        },
      ],
    }),
  });

  type BffResponse<T> = {
    success: boolean;
    data: T | null;
    error?: { displayMessage?: string; message?: string } | null;
    traceId?: string;
  };

  type DuplicateCheckData = {
    results: { clientId: string; duplicate: boolean; fileEntityId?: string }[];
  };

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error('Duplicate check failed.');
  }

  if (!payload || typeof payload !== 'object') return { duplicate: false };

  if (!('success' in payload)) return { duplicate: false };

  const bff = payload as BffResponse<DuplicateCheckData>;

  if (!bff.success) {
    const message = bff.error?.displayMessage || bff.error?.message || 'Duplicate check failed.';
    throw new Error(message);
  }

  const results = bff.data?.results;
  if (!Array.isArray(results)) return { duplicate: false };

  const item = results.find((result) => result.clientId === input.clientId);
  return {
    duplicate: Boolean(item?.duplicate),
    fileEntityId: typeof item?.fileEntityId === 'string' ? item.fileEntityId : undefined,
  };
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
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
        cleanup();
        resolve({
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
          durationMs: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : 0,
        });
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
