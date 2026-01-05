import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useBlocker } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, Code2, Copy, Layers, ListChecks, Play, Redo2, Save, Send, SlidersHorizontal, Trash2, TriangleAlert, Undo2, RefreshCw } from 'lucide-react';
import { toast } from '@/store/notificationStore';
import { toPng } from 'html-to-image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { 
  getProgramDetails, 
  ensureDraft as ensureDraftApi, 
  saveProgramDraft, 
  renameProgram as renameProgramApi,
  deleteProgram as deleteProgramApi,
  deleteProgramDraft as deleteProgramDraftApi,
  updateProgram as updateProgramApi
} from '@/services/programApi';
import type { ProgramDetailResp, ProgramDraftResp, UpdateProgramReq } from '@/types/program';
import { getErrorMessage } from '@/services/authApi';
import { ProgramPublishDialog } from '@/features/programs/publishing/ProgramPublishDialog';
import { getProgramDraftSavePolicy } from '@/features/programs/storage/draftPolicyDb';

import { resolveMaterialId } from '@/features/programs/storage/materialId';
import { createBlankVsnDocument, createItemFromMedia, createScrollTextItem, createTextItem } from '@/features/programs/vsn/defaults';
import type { VsnDocument } from '@/features/programs/vsn/types';
import { sanitizeVsnForPersist } from '@/features/programs/vsn/sanitize';
import { validateVsnDocument } from '@/features/programs/vsn/validator';
import type { MediaAssetNode } from '@/types/media-library';

import { type EditorSelection, type EditorMaterial } from '@/features/programs/editor/types';
import {
  getPages,
  getRegions,
  addPage,
  deletePage,
  addRegion,
  duplicateRegion,
  deleteRegion,
  addItem,
  deleteItem,
  moveItemToRegion,
  patchPage,
  patchRegion,
  patchRegionRect,
  patchItem,
  resizeProgramCanvas,
  normalizeVsnForEditor,
} from '@/features/programs/editor/vsnOps';
import { clampInt, getRegionMode, canRegionAcceptItemType } from '@/features/programs/editor/utils';
import { getDevices } from '@/services/deviceApi';
import { getMediaAssets } from '@/services/mediaApi';

import { EditorLeftPanel } from '@/features/programs/editor/components/EditorLeftPanel';
import { StagePreview } from '@/features/programs/editor/components/StagePreview';
import { AdvancedTimeline } from '@/features/programs/editor/components/AdvancedTimeline';
import { InspectorPanel } from '@/features/programs/editor/components/InspectorPanel';
import { ProblemsPanel } from '@/features/programs/editor/components/ProblemsPanel';
import { VsnJsonPanel } from '@/features/programs/editor/components/VsnJsonPanel';
import { ProgramPreviewDialog } from '@/features/programs/editor/components/ProgramPreviewDialog';

type DraftPromptIntent = { type: 'switch'; nextBaseVersion: number | null } | { type: 'navigate' };

export default function ProgramEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { programId } = useParams<{ programId: string }>();
  const isMobile = useIsMobile();
  const { formatRelative } = useTimeFormatter();

  const searchParams = new URLSearchParams(location.search);
  const baseFromUrl = searchParams.get('base');
  const hasBaseFromUrl = baseFromUrl != null;
  const initialBaseVersion = baseFromUrl === 'blank' ? 0 : (Number.parseInt(baseFromUrl || '', 10) || 0);

  // --- State ---
  const [baseVersion, setBaseVersion] = useState<number | null>(initialBaseVersion || null);
  const [draft, setDraft] = useState<ProgramDraftResp | null>(null);
  const [vsn, setVsn] = useState<VsnDocument | null>(null);
  const [targetDeviceId, setTargetDeviceId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [past, setPast] = useState<VsnDocument[]>([]);
  const [future, setFuture] = useState<VsnDocument[]>([]);
  const [dirty, setDirty] = useState(false);
  const vsnRevisionRef = useRef(0);
  const autosaveTimerRef = useRef<number | null>(null);
  const [autosavePending, setAutosavePending] = useState(false);
  const stageCaptureContainerRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<EditorSelection>({ pageIndex: 0, regionIndex: null, itemIndex: null });
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [rightTab, setRightTab] = useState<'inspector' | 'problems' | 'json'>('inspector');

  // --- Media Search ---
  const [mediaQuery, setMediaQuery] = useState('');
  const [debouncedMediaQuery, setDebouncedMediaQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedMediaQuery(mediaQuery), 500);
    return () => clearTimeout(timer);
  }, [mediaQuery]);

  // --- Queries ---
  const programQuery = useQuery({
    queryKey: ['programs', programId],
    queryFn: () => getProgramDetails(programId!),
    enabled: !!programId,
  });

  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const mediaNodesQuery = useQuery({
    queryKey: ['media-library', 'assets', debouncedMediaQuery],
    queryFn: () => getMediaAssets({ q: debouncedMediaQuery || undefined, kinds: 'image,video', limit: 100 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const program = programQuery.data?.data;
  const devices = useMemo(() => devicesQuery.data?.data || [], [devicesQuery.data]);
  const materials = useMemo(() => buildEditorMaterials(mediaNodesQuery.data?.data?.items || []), [mediaNodesQuery.data]);
  const materialIndex = useMemo(() => Object.fromEntries(materials.map((m) => [m.materialId, m])) as Record<string, EditorMaterial>, [materials]);

  // Sync targetDeviceId from program data
  useEffect(() => {
    if (program?.targetDeviceId) {
      setTargetDeviceId(program.targetDeviceId);
    }
  }, [program?.targetDeviceId]);

  // --- Load Draft Logic ---
  useEffect(() => {
    if (!programId || !isInitializing || programQuery.isLoading) return;

    const load = async () => {
      try {
        const defaultBase = programQuery.data?.data?.defaultVersion;
        if (!hasBaseFromUrl && baseVersion == null && defaultBase && defaultBase > 0) {
          setBaseVersion(defaultBase);
          return;
        }

        // Reset ephemeral editor state when switching drafts/base versions.
        if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
        setPast([]);
        setFuture([]);
        setDirty(false);
        setAutosavePending(false);
        setSelection({ pageIndex: 0, regionIndex: null, itemIndex: null });
        setCurrentTime(0);
        setIsPlaying(false);

        const res = await ensureDraftApi(programId, baseVersion ?? undefined);
        if (res.data) {
          setDraft(res.data);
          try {
            let parsedVsn = JSON.parse(res.data.vsnJson || '{}') as VsnDocument;
            
            // If VSN is empty or has no pages, initialize it with a blank page using program resolution
            const pages = parsedVsn.Programs?.Program?.Pages?.Page;
            if (!pages || !Array.isArray(pages) || pages.length === 0) {
              const programWidth = programQuery.data?.data?.width || 1920;
              const programHeight = programQuery.data?.data?.height || 1080;
              parsedVsn = createBlankVsnDocument({ width: programWidth, height: programHeight });
            }

            setVsn(normalizeVsnForEditor(parsedVsn));
          } catch (e) {
            toast.error(t('programEditor.toasts.parseFailed'));
          }
        }
      } catch (e) {
        toast.error(t('programEditor.toasts.initFailed'));
        navigate('/dashboard/programs');
      } finally {
        setIsInitializing(false);
      }
    };
    load();
  }, [programId, baseVersion, hasBaseFromUrl, isInitializing, navigate, programQuery.isLoading, programQuery.data]);

  // --- Capture Cover Screenshot ---

  // Wait for a single image to load (with timeout)
  const waitForImageLoad = useCallback((img: HTMLImageElement, timeoutMs = 3000): Promise<boolean> => {
    return new Promise((resolve) => {
      if (img.complete && img.naturalWidth > 0) {
        resolve(true);
        return;
      }
      const timer = setTimeout(() => resolve(false), timeoutMs);
      img.onload = () => { clearTimeout(timer); resolve(true); };
      img.onerror = () => { clearTimeout(timer); resolve(false); };
    });
  }, []);

  // Wait for all images in a container to load
  const waitForAllImages = useCallback(async (container: HTMLElement, timeoutMs = 5000): Promise<void> => {
    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) return;

    await Promise.all(images.map(img => waitForImageLoad(img as HTMLImageElement, timeoutMs)));
    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 100));
  }, [waitForImageLoad]);

  const captureVideoFrameAsDataUrl = useCallback((video: HTMLVideoElement): string | null => {
    try {
      const width = video.videoWidth;
      const height = video.videoHeight;
      // Check if video has valid dimensions and is ready
      if (!width || !height) return null;
      if (video.readyState < 2) return null; // HAVE_CURRENT_DATA or higher

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Failed to capture video frame:', e);
      return null;
    }
  }, []);

  // Generate a placeholder image for failed media
  const generatePlaceholder = useCallback((width: number, height: number, text = 'Media'): string => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(width, 100);
    canvas.height = Math.max(height, 100);
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Dark gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Icon placeholder
    ctx.fillStyle = '#4a4a6a';
    const iconSize = Math.min(canvas.width, canvas.height) * 0.3;
    const iconX = (canvas.width - iconSize) / 2;
    const iconY = (canvas.height - iconSize) / 2 - 10;
    ctx.fillRect(iconX, iconY, iconSize, iconSize * 0.7);

    // Text label
    ctx.fillStyle = '#8a8aa0';
    ctx.font = `${Math.max(12, iconSize * 0.2)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, iconY + iconSize + 20);

    return canvas.toDataURL('image/png');
  }, []);

  const captureCoverStage = useCallback(async (stage: HTMLElement): Promise<string> => {
    const captureOptions = {
      pixelRatio: 1,
      cacheBust: true, // Force re-fetch to avoid stale cache issues
      // Avoid mutating URLs (e.g. presigned S3 URLs); use fetch cache controls instead.
      fetchRequestInit: { cache: 'no-store' as const, credentials: 'include' as const },
    };

    // Wait for existing images in stage to load first
    await waitForAllImages(stage);

    const hasVideo = stage.querySelector('video') != null;
    if (!hasVideo) {
      return toPng(stage, captureOptions);
    }

    const stagingRoot = document.createElement('div');
    stagingRoot.style.position = 'fixed';
    stagingRoot.style.left = '-100000px';
    stagingRoot.style.top = '0';
    stagingRoot.style.width = `${stage.clientWidth}px`;
    stagingRoot.style.height = `${stage.clientHeight}px`;
    stagingRoot.style.pointerEvents = 'none';
    stagingRoot.style.zIndex = '-1';

    const clone = stage.cloneNode(true) as HTMLElement;
    clone.style.width = `${stage.clientWidth}px`;
    clone.style.height = `${stage.clientHeight}px`;

    const originalVideos = Array.from(stage.querySelectorAll('video'));
    const clonedVideos = Array.from(clone.querySelectorAll('video'));

    clonedVideos.forEach((clonedVideo, idx) => {
      const originalVideo = originalVideos[idx] ?? null;
      const poster = (clonedVideo as HTMLVideoElement).poster || originalVideo?.poster || '';
      const frameDataUrl = originalVideo ? captureVideoFrameAsDataUrl(originalVideo) : null;

      // Determine the best available source
      let imgSrc = frameDataUrl || poster;

      // If no valid source, generate placeholder
      if (!imgSrc) {
        const videoWidth = originalVideo?.videoWidth || clonedVideo.clientWidth || 320;
        const videoHeight = originalVideo?.videoHeight || clonedVideo.clientHeight || 180;
        imgSrc = generatePlaceholder(videoWidth, videoHeight, 'Video');
      }

      const img = document.createElement('img');
      img.className = clonedVideo.className;
      img.alt = '';
      img.decoding = 'sync'; // Use sync for immediate rendering
      img.loading = 'eager';
      img.src = imgSrc;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = (clonedVideo as HTMLElement).style.objectFit || 'contain';
      // Only set crossorigin for external URLs to avoid CORS issues with data URLs
      if (!imgSrc.startsWith('data:')) {
        img.setAttribute('crossorigin', 'anonymous');
      }

      clonedVideo.replaceWith(img);
    });

    stagingRoot.appendChild(clone);
    document.body.appendChild(stagingRoot);

    try {
      // Wait for replaced images to load
      await waitForAllImages(stagingRoot);
      return await toPng(clone, captureOptions);
    } finally {
      stagingRoot.remove();
    }
  }, [captureVideoFrameAsDataUrl, waitForAllImages, generatePlaceholder]);

  const captureCover = useCallback(async (): Promise<{ base64: string; contentType: string } | null> => {
    const container = stageCaptureContainerRef.current;
    const stage = container?.querySelector('[data-testid="program-stage"]') as HTMLElement | null;
    if (!stage) return null;

    // Retry mechanism: try up to 3 times with increasing delays
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const dataUrl = await captureCoverStage(stage);

        // Validate the result is not empty/black
        // A valid PNG data URL should be reasonably long (>1KB for any real content)
        if (dataUrl && dataUrl.length > 1000) {
          return { base64: dataUrl, contentType: 'image/png' };
        }

        // If result seems too small, wait and retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      } catch (e) {
        console.warn(`Cover capture attempt ${attempt} failed:`, e);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    return null;
  }, [captureCoverStage]);

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (newVsn: VsnDocument) => {
      const draftId = draft?.draftId ?? draft?.id;
      if (!draftId) throw new Error('Draft not initialized');

      // Capture cover screenshot
      const cover = await captureCover();

      // Ensure program metadata is in sync with VSN resolution
      const w = Number.parseInt(newVsn.Programs?.Program?.Information?.Width ?? '0', 10);
      const h = Number.parseInt(newVsn.Programs?.Program?.Information?.Height ?? '0', 10);
      
      const currentWidth = program?.width;
      const currentHeight = program?.height;

      if (w > 0 && h > 0 && (w !== currentWidth || h !== currentHeight)) {
         await updateProgramApi(programId!, { width: w, height: h });
         // Manually update the cache to prevent stale comparisons in subsequent saves
         queryClient.setQueryData(['programs', programId], (old: any) => {
            if (!old?.data) return old;
            return { ...old, data: { ...old.data, width: w, height: h } };
         });
      }

      return saveProgramDraft(programId!, draftId, {
        vsnJson: JSON.stringify(sanitizeVsnForPersist(newVsn)),
        coverBase64: cover?.base64,
        coverContentType: cover?.contentType,
      });
    },
    onSuccess: (res) => {
      setDirty(false);
      setAutosavePending(false);
      if (res.data) setDraft(res.data);
      queryClient.invalidateQueries({ queryKey: ['programs', programId] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
    onError: (err) => toast.error(`Save failed: ${getErrorMessage(err)}`),
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => renameProgramApi(programId!, name),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['programs', programId] });
       toast.success(t('programs.toasts.renameSuccess'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProgramReq) => updateProgramApi(programId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs', programId] });
    },
    onError: (err) => toast.error(`Update failed: ${getErrorMessage(err)}`),
  });

  // Handle Save
  const handleSaveManually = useCallback(() => {
    if (!vsn || !draft) return;
    saveMutation.mutate(vsn, {
      onSuccess: () => toast.success(t('programEditor.toasts.draftSaved')),
    });
  }, [vsn, draft, saveMutation, t]);

  // Autosave Logic
  useEffect(() => {
    const draftId = draft?.draftId ?? draft?.id;
    if (!dirty || !vsn || !draftId) return;
    
    const policy = getProgramDraftSavePolicy();
    if (policy !== 'always') return;

    const delay = 10000;
    
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    
    setAutosavePending(true);
    autosaveTimerRef.current = window.setTimeout(() => {
      saveMutation.mutate(vsn);
    }, delay);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [vsn, dirty, draft, saveMutation]);

  const pages = useMemo(() => getPages(vsn), [vsn]);
  const regions = useMemo(() => getRegions(vsn, selection.pageIndex), [vsn, selection.pageIndex]);

  const maxPageDurationMs = useMemo(() => {
    const page = pages[selection.pageIndex];
    const pageDur = Number.parseInt(page?.AppointDuration ?? '', 10) || 10000;
    
    let contentMax = 0;
    regions.forEach((r) => {
      const total = r.Items.Item.reduce((sum, item) => sum + (Number(item.Duration) || 0), 0);
      if (total > contentMax) contentMax = total;
    });

    return Math.max(pageDur, contentMax);
  }, [pages, selection.pageIndex, regions]);

  useEffect(() => {
    if (!isPlaying) return;
    let lastTime = performance.now();
    let frame: number;
    const tick = () => {
      const now = performance.now();
      const delta = (now - lastTime) * playbackSpeed;
      lastTime = now;
      setCurrentTime((prev) => {
        const next = prev + delta;
        return next > maxPageDurationMs ? 0 : next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, maxPageDurationMs, playbackSpeed]);

  const togglePlayback = useCallback(() => setIsPlaying((p) => !p), []);

  const saveStatus = useMemo(() => {
    if (saveMutation.isPending) return t('programEditor.header.saveStatus.saving');
    if (dirty) return autosavePending ? t('programEditor.header.saveStatus.autosavePending') : t('programEditor.header.saveStatus.unsaved');
    if (draft?.updatedAt) return t('programEditor.header.saveStatus.savedAt', { time: formatRelative(draft.updatedAt) });
    return t('programEditor.header.saveStatus.saved');
  }, [autosavePending, dirty, draft?.updatedAt, formatRelative, saveMutation.isPending, t]);
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishContext, setPublishContext] = useState<{
    preferredDraftId: string | null;
    initialVersionMode: 'CREATE' | 'EXISTING' | null;
    initialExistingVersion: number | null;
    lockVersionMode: 'CREATE' | 'EXISTING' | null;
    createVsnJson: string | null;
    coverBase64: string | null;
    coverContentType: string | null;
    cleanupDraftId: string | null;
  } | null>(null);
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);
  const [draftPromptIntent, setDraftPromptIntent] = useState<DraftPromptIntent | null>(null);

  const shouldBlockNavigation = useMemo(() => {
    const policy = getProgramDraftSavePolicy();
    if (policy === 'never') return false;
    return dirty || saveMutation.isPending;
  }, [dirty, saveMutation.isPending]);

  const navigationBlocker = useBlocker(shouldBlockNavigation);

  const requestBaseVersionChange = async (next: number | null) => {
    if (next === baseVersion) return;

    const policy = getProgramDraftSavePolicy();
    const hasUnsaved = dirty || saveMutation.isPending;

    if (!hasUnsaved || policy === 'never') {
      setBaseVersion(next);
      setIsInitializing(true); // Re-trigger load
      return;
    }

    if (policy === 'always') {
      try {
        if (vsn && dirty) await saveMutation.mutateAsync(vsn);
        setBaseVersion(next);
        setIsInitializing(true);
      } catch (err) {
        toast.error(`Failed to save draft: ${getErrorMessage(err)}`);
        setDraftPromptIntent({ type: 'switch', nextBaseVersion: next });
        setDraftPromptOpen(true);
      }
      return;
    }

    // policy === 'ask'
    setDraftPromptIntent({ type: 'switch', nextBaseVersion: next });
    setDraftPromptOpen(true);
  };

  useEffect(() => {
    if (navigationBlocker.state !== 'blocked') return;

    const policy = getProgramDraftSavePolicy();

    if (policy === 'always') {
      (async () => {
        try {
          if (vsn && dirty) await saveMutation.mutateAsync(vsn);
          navigationBlocker.proceed?.();
        } catch (err) {
          toast.error(`Failed to save draft: ${getErrorMessage(err)}`);
          setDraftPromptIntent({ type: 'navigate' });
          setDraftPromptOpen(true);
        }
      })();
      return;
    }

    if (policy === 'ask') {
      setDraftPromptIntent({ type: 'navigate' });
      setDraftPromptOpen(true);
    }
  }, [navigationBlocker, dirty, saveMutation, vsn]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const versionOptions = useMemo(() => {
    if (!program) return [];
    return [...program.versions].sort((a, b) => b.version - a.version).map((v) => v.version);
  }, [program]);

  const canvasWidth = useMemo(() => {
    const w = Number.parseInt(vsn?.Programs?.Program?.Information?.Width ?? '', 10);
    return Number.isFinite(w) && w > 0 ? w : program?.width ?? 1920;
  }, [program?.width, vsn]);
  const canvasHeight = useMemo(() => {
    const h = Number.parseInt(vsn?.Programs?.Program?.Information?.Height ?? '', 10);
    return Number.isFinite(h) && h > 0 ? h : program?.height ?? 1080;
  }, [program?.height, vsn]);

  const devtoolsEnabled = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    return new URLSearchParams(location.search).has('devtools');
  }, [location.search]);

  const devValidation = useMemo(
    () => (devtoolsEnabled && vsn ? validateVsnDocument(vsn, 'publish') : { issues: [], isValid: true }),
    [devtoolsEnabled, vsn],
  );
  const errorCount = useMemo(() => devValidation.issues.filter((i) => i.severity === 'error').length, [devValidation.issues]);
  const warningCount = useMemo(() => devValidation.issues.filter((i) => i.severity === 'warning').length, [devValidation.issues]);

  const applyVsn = (next: VsnDocument, options?: { noHistory?: boolean }) => {
    if (vsn && !options?.noHistory) {
      setPast((prev) => [...prev.slice(-49), vsn]);
      setFuture([]);
    }
    vsnRevisionRef.current += 1;
    setVsn(next);
    setDirty(true);
  };

  const vsnRef = useRef(vsn);
  const selectionRef = useRef(selection);
  const applyVsnRef = useRef(applyVsn);
  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});
  const togglePlaybackRef = useRef<() => void>(() => {});

  useEffect(() => { vsnRef.current = vsn; }, [vsn]);
  useEffect(() => { selectionRef.current = selection; }, [selection]);
  useEffect(() => { applyVsnRef.current = applyVsn; }, [applyVsn]);

  const undo = useCallback(() => {
    if (past.length === 0 || !vsn) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [vsn, ...prev]);
    vsnRevisionRef.current += 1;
    setVsn(previous);
    setDirty(true);
  }, [past, vsn]);

  const redo = useCallback(() => {
    if (future.length === 0 || !vsn) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, vsn]);
    vsnRevisionRef.current += 1;
    setVsn(next);
    setDirty(true);
  }, [future, vsn]);

  useEffect(() => { undoRef.current = undo; }, [undo]);
  useEffect(() => { redoRef.current = redo; }, [redo]);
  useEffect(() => { togglePlaybackRef.current = togglePlayback; }, [togglePlayback]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        !!target?.isContentEditable;

      if (e.code === 'Space' && !isEditable) {
        e.preventDefault();
        togglePlaybackRef.current();
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditable) {
        e.preventDefault();
        const currentVsn = vsnRef.current;
        const sel = selectionRef.current;
        if (currentVsn && sel.regionIndex != null) {
          if (sel.itemIndex != null) {
            const next = deleteItem(currentVsn, sel.pageIndex, sel.regionIndex, sel.itemIndex);
            if (next !== currentVsn) {
              applyVsnRef.current(next);
              setSelection((prev) => ({ ...prev, itemIndex: null }));
            }
          } else {
            const next = deleteRegion(currentVsn, sel.pageIndex, sel.regionIndex);
            if (next !== currentVsn) {
              applyVsnRef.current(next);
              setSelection((prev) => ({ ...prev, regionIndex: null, itemIndex: null }));
            }
          }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redoRef.current();
        else undoRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redoRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (programQuery.isLoading || isInitializing) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <RefreshCw className="h-10 w-10 animate-spin text-primary/40" />
        <p className="text-xs font-bold text-muted-foreground/60">{t('programEditor.states.loading')}</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <TriangleAlert className="mx-auto h-12 w-12 text-amber-600" />
          <h2 className="text-xl font-bold">{t('programEditor.states.notFound')}</h2>
          <p className="text-muted-foreground">{t('programEditor.states.notFoundDesc')}</p>
          <Button variant="outline" asChild><Link to="/dashboard/programs"><ArrowLeft className="mr-2 h-4 w-4" /> {t('programs.details.toasts.backToLibrary')}</Link></Button>
        </div>
      </div>
    );
  }

  const handlePublish = async () => {
    if (!draft || !vsn) return;
    if (saveMutation.isPending) {
      toast.info(t('programEditor.toasts.savingWait'));
      return;
    }
    const res = validateVsnDocument(vsn, 'publish');
    if (!res.isValid) {
      toast.error(t('programEditor.toasts.fixErrors', { count: res.issues.filter((i) => i.severity === 'error').length }));
      return;
    }
    if (dirty) {
      try {
        await saveMutation.mutateAsync(vsn);
      } catch (err) {
        return;
      }
    }

    const base = draft.baseVersion ?? 0;
    const hasRelease = (program?.versions?.length || 0) > 0;
    const shouldDeployExisting = hasRelease && !dirty && base > 0;

    const sanitizedVsn = sanitizeVsnForPersist(vsn);
    const cover = shouldDeployExisting ? null : await captureCover();

    setPublishContext({
      preferredDraftId: shouldDeployExisting ? null : (draft?.draftId ?? draft?.id ?? null),
      initialVersionMode: shouldDeployExisting ? 'EXISTING' : 'CREATE',
      initialExistingVersion: shouldDeployExisting ? base : null,
      lockVersionMode: shouldDeployExisting ? 'EXISTING' : 'CREATE',
      createVsnJson: shouldDeployExisting ? null : JSON.stringify(sanitizedVsn),
      coverBase64: cover?.base64 ?? null,
      coverContentType: cover?.contentType ?? null,
      cleanupDraftId: shouldDeployExisting ? null : (draft?.draftId ?? draft?.id ?? null),
    });

    setPublishOpen(true);
  };

  const createRegionForInsert = (input: { name?: string; x: number; y: number; width: number; height: number }) => {
    if (!vsn) return null;
    const width = Math.min(canvasWidth, Math.max(1, Math.round(input.width)));
    const height = Math.min(canvasHeight, Math.max(1, Math.round(input.height)));
    const x = clampInt(Math.round(input.x), 0, Math.max(0, canvasWidth - width));
    const y = clampInt(Math.round(input.y), 0, Math.max(0, canvasHeight - height));
    return addRegion(vsn, selection.pageIndex, {
      name: input.name,
      rect: { X: String(x), Y: String(y), Width: String(width), Height: String(height) }
    });
  };

  const selectedRegion = selection.regionIndex == null ? null : regions[selection.regionIndex] ?? null;
  const canEditSelectedRegion = Boolean(vsn && selectedRegion);

  const handleDuplicateSelectedRegion = () => {
    if (!vsn || selection.regionIndex == null) return;
    const res = duplicateRegion(vsn, selection.pageIndex, selection.regionIndex);
    applyVsn(res.doc);
    setSelection((prev) => ({ ...prev, regionIndex: res.regionIndex, itemIndex: null }));
  };

  const handleDeleteSelectedRegion = () => {
    if (!vsn || selection.regionIndex == null) return;
    const next = deleteRegion(vsn, selection.pageIndex, selection.regionIndex);
    applyVsn(next);
    setSelection((prev) => ({ ...prev, regionIndex: null, itemIndex: null }));
  };

  const findRegionIndexAtPoint = (point: { x: number; y: number }) => {
    let bestIndex: number | null = null;
    let bestLayer = -Infinity;
    regions.forEach((region, index) => {
      const rect = region.Rect;
      const x = Number.parseInt(rect?.X ?? '0', 10) || 0;
      const y = Number.parseInt(rect?.Y ?? '0', 10) || 0;
      const w = Number.parseInt(rect?.Width ?? '0', 10) || 0;
      const h = Number.parseInt(rect?.Height ?? '0', 10) || 0;
      if (point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h) {
        const layer = Number.parseInt(region.Layer ?? '0', 10);
        if (layer >= bestLayer) {
          bestLayer = layer;
          bestIndex = index;
        }
      }
    });
    return bestIndex;
  };

  const leftPanelContent = (
    <EditorLeftPanel
      pages={pages}
      regions={regions}
      materials={materials}
      selection={selection}
      searchQuery={mediaQuery}
      onSearchChange={setMediaQuery}
      onSelectPage={(pageIndex) => setSelection({ pageIndex, regionIndex: null, itemIndex: null })}
      onSelectRegion={(regionIndex) => setSelection((prev) => ({ ...prev, regionIndex, itemIndex: null }))}
      onAddPage={() => {
        if (!vsn) return;
        const res = addPage(vsn, { width: canvasWidth, height: canvasHeight });
        applyVsn(res.doc);
        setSelection({ pageIndex: res.pageIndex, regionIndex: null, itemIndex: null });
      }}
      onDeletePage={() => {
        if (!vsn || pages.length <= 1) return;
        const next = deletePage(vsn, selection.pageIndex);
        applyVsn(next);
        setSelection((prev) => ({ ...prev, pageIndex: 0, regionIndex: null, itemIndex: null }));
      }}
      onAddRegion={() => {
        if (!vsn) return;
        const res = addRegion(vsn, selection.pageIndex, {});
        applyVsn(res.doc);
        setSelection((prev) => ({ ...prev, regionIndex: res.regionIndex, itemIndex: null }));
      }}
      onDeleteRegion={handleDeleteSelectedRegion}
      onAddTextItem={() => {
        if (!vsn) return;
        let doc = vsn;
        let rIdx = selection.regionIndex;
        if (rIdx == null) {
          const res = createRegionForInsert({ name: t('programEditor.panels.items.text'), x: 100, y: 100, width: 400, height: 200 });
          if (!res) return;
          doc = res.doc;
          rIdx = res.regionIndex;
        }
        const res = addItem(doc, selection.pageIndex, rIdx, createTextItem());
        applyVsn(res.doc);
        setSelection((prev) => ({ ...prev, regionIndex: rIdx, itemIndex: res.itemIndex }));
      }}
      onAddMaterialItem={(material) => {
        if (!vsn) return;
        let doc = vsn;
        let rIdx = selection.regionIndex;
        const source = material.source as MediaAssetNode;
        if (rIdx == null) {
          const hasDim = Number.isFinite(material.width) && material.width! > 0 && Number.isFinite(material.height) && material.height! > 0;

          let w = hasDim ? material.width! : Math.round(canvasWidth * 0.5);
          let h = hasDim ? material.height! : Math.round(canvasHeight * 0.5);

          if (hasDim && material.width === canvasWidth && material.height === canvasHeight) {
            w = canvasWidth;
            h = canvasHeight;
          } else {
            const maxW = canvasWidth * 0.8;
            const maxH = canvasHeight * 0.8;
            if (w > maxW || h > maxH) {
              const ratio = w / h;
              if (w / maxW > h / maxH) {
                w = maxW;
                h = w / ratio;
              } else {
                h = maxH;
                w = h * ratio;
              }
            }
          }

          const x = (canvasWidth - w) / 2;
          const y = (canvasHeight - h) / 2;
          const res = createRegionForInsert({ name: material.name, x, y, width: w, height: h });
          if (!res) return;
          doc = res.doc;
          rIdx = res.regionIndex;
        }
        const res = addItem(doc, selection.pageIndex, rIdx, createItemFromMedia(source, { materialId: material.materialId }));
        applyVsn(res.doc);
        setSelection((prev) => ({ ...prev, regionIndex: rIdx, itemIndex: res.itemIndex }));
      }}
    />
  );

  const rightPanelContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      {devtoolsEnabled && (
        <div className="flex items-center gap-2 mb-3">
          <RightTabButton active={rightTab === 'inspector'} onClick={() => setRightTab('inspector')} icon={<SlidersHorizontal className="h-4 w-4" />}>{t('programEditor.panels.inspector.title')}</RightTabButton>
          <RightTabButton active={rightTab === 'problems'} onClick={() => setRightTab('problems')} icon={<ListChecks className="h-4 w-4" />}>{t('programEditor.panels.problems.title')}</RightTabButton>
          <RightTabButton active={rightTab === 'json'} onClick={() => setRightTab('json')} icon={<Code2 className="h-4 w-4" />}>JSON</RightTabButton>
        </div>
      )}
      <div className="min-h-0 flex-1">
        {!devtoolsEnabled || rightTab === 'inspector' ? (
          <InspectorPanel
            doc={vsn}
            selection={selection}
            programName={program.name}
            programWidth={canvasWidth}
            programHeight={canvasHeight}
            targetDeviceId={targetDeviceId}
            devices={devices}
            materialIndex={materialIndex}
            showDevFields={devtoolsEnabled}
            onRenameProgram={(name) => renameMutation.mutate(name)}
            onSetProgramResolution={(res) => {
               if (!vsn) return;
               setTargetDeviceId(res.targetDeviceId);
               applyVsn(resizeProgramCanvas(vsn, res));
               updateMutation.mutate({
                 width: res.width,
                 height: res.height,
                 targetDeviceId: res.targetDeviceId
               });
            }}
            onPatchPage={(pageIndex, patch) => vsn && applyVsn(patchPage(vsn, pageIndex, patch))}
            onPatchRegion={(pIdx, rIdx, patch) => vsn && applyVsn(patchRegion(vsn, pIdx, rIdx, patch))}
            onPatchRegionRect={(pIdx, rIdx, patch) => vsn && applyVsn(patchRegionRect(vsn, pIdx, rIdx, patch))}
            onPatchItem={(pIdx, rIdx, iIdx, patch) => vsn && applyVsn(patchItem(vsn, pIdx, rIdx, iIdx, patch))}
          />
        ) : rightTab === 'problems' ? (
          <ProblemsPanel issues={devValidation.issues} onJumpToSelection={(p) => setSelection({ pageIndex: p.pageIndex ?? 0, regionIndex: p.regionIndex ?? null, itemIndex: p.itemIndex ?? null })} />
        ) : (
          <VsnJsonPanel doc={vsn} />
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div className="flex flex-col gap-3 border-b bg-background/80 px-4 py-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate('/dashboard/programs')} title={t('common.actions.back')}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{program.name}</h1>
            <p className="text-[10px] font-bold text-muted-foreground">
              {canvasWidth}×{canvasHeight} · {baseVersion != null ? `v${baseVersion}` : t('programEditor.header.blank')} · {saveStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={baseVersion === null ? 'blank' : String(baseVersion)} onValueChange={(v) => requestBaseVersionChange(v === 'blank' ? null : Number(v))}>
            <SelectTrigger className="h-9 w-[110px] text-[11px] font-bold bg-muted/20 border-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="blank" className="text-xs font-bold">{t('programEditor.header.blank')}</SelectItem>
              {versionOptions.map(v => <SelectItem key={v} value={String(v)} className="text-xs font-bold">v{v}</SelectItem>)}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button variant="ghost" size="icon" onClick={undo} disabled={past.length === 0} title={t('programEditor.toolbar.undo')}><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0} title={t('programEditor.toolbar.redo')}><Redo2 className="h-4 w-4" /></Button>
          
          <Button variant="outline" size="sm" onClick={handleSaveManually} disabled={saveMutation.isPending || (!dirty && !autosavePending)} className="font-bold text-xs h-9 px-4">{t('programEditor.toolbar.save')}</Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="font-bold text-xs h-9 px-4">{t('programEditor.toolbar.preview')}</Button>
          <Button size="sm" onClick={handlePublish} disabled={saveMutation.isPending} className="font-bold text-xs h-9 px-6 shadow-lg shadow-primary/20">{t('programEditor.toolbar.publish')}</Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className={cn('grid h-full gap-4', isMobile ? 'grid-cols-1' : 'lg:grid-cols-[320px_minmax(0,1fr)_360px]')}>
          {!isMobile && <div className="min-h-0 rounded-2xl border bg-card p-4 overflow-hidden">{leftPanelContent}</div>}
          <div className="min-h-0 grid-cols-1 gap-4 lg:grid lg:grid-rows-[minmax(0,1fr)_260px]">
            <div ref={stageCaptureContainerRef} className="min-h-0 rounded-2xl border bg-card p-4 overflow-hidden">
               <StagePreview
                  doc={vsn} programWidth={canvasWidth} programHeight={canvasHeight} selection={selection}
                  materialIndex={materialIndex} currentTime={currentTime} isPlaying={isPlaying} playbackSpeed={playbackSpeed}
                  onSelectRegion={(rIdx) => setSelection(prev => ({ ...prev, regionIndex: rIdx, itemIndex: null }))}
                 onPatchRegionRect={(pIdx, rIdx, patch) => vsn && applyVsn(patchRegionRect(vsn, pIdx, rIdx, patch))}
                 onDropMaterial={(materialId, point) => {
                    const material = materialIndex[materialId];
                    if (!material) return;
                    
                    const regionIndex = findRegionIndexAtPoint(point);
                    if (regionIndex != null) {
                       // Drop into existing region
                       if (vsn) {
                          const res = addItem(vsn, selection.pageIndex, regionIndex, createItemFromMedia(material.source as MediaAssetNode, { materialId }));
                          applyVsn(res.doc);
                          setSelection({ pageIndex: selection.pageIndex, regionIndex, itemIndex: res.itemIndex });
                       }
                    } else {
                       // Create new region for drop - try to respect material dimensions
                       let w = material.width || 640;
                       let h = material.height || 360;
                       
                       // If material is too large for canvas, scale it down to fit 50% of canvas
                       const maxW = canvasWidth * 0.8;
                       const maxH = canvasHeight * 0.8;
                       if (w > maxW || h > maxH) {
                         const ratio = w / h;
                         if (w / maxW > h / maxH) {
                           w = maxW;
                           h = w / ratio;
                         } else {
                           h = maxH;
                           w = h * ratio;
                         }
                       }

                       const res = createRegionForInsert({ 
                          name: material.name, 
                          x: point.x - w / 2, 
                          y: point.y - h / 2, 
                          width: w, 
                          height: h 
                       });
                       if (res && res.doc) {
                          const itemRes = addItem(res.doc, selection.pageIndex, res.regionIndex, createItemFromMedia(material.source as MediaAssetNode, { materialId }));
                          applyVsn(itemRes.doc);
                          setSelection({ pageIndex: selection.pageIndex, regionIndex: res.regionIndex, itemIndex: itemRes.itemIndex });
                       }
                    }
                 }}
                 onCreateRegionRect={(pIdx, rect) => {
                    const res = createRegionForInsert({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
                    if (res) {
                       applyVsn(res.doc);
                       setSelection({ pageIndex: pIdx, regionIndex: res.regionIndex, itemIndex: null });
                    }
                 }}
               />
            </div>
            <div className="min-h-0 overflow-hidden rounded-2xl border bg-zinc-950">
                 <AdvancedTimeline
                 regions={regions} selection={selection} materialIndex={materialIndex}
                 currentTime={currentTime} isPlaying={isPlaying} playbackSpeed={playbackSpeed}
                 onCurrentTimeChange={setCurrentTime} onPlaybackSpeedChange={setPlaybackSpeed}
                 onSelectItem={(rIdx, iIdx) => {
                   setSelection((prev) => ({ ...prev, regionIndex: rIdx, itemIndex: iIdx }));
                   const region = regions[rIdx];
                   const items = region?.Items?.Item ?? [];
                   if (Array.isArray(items) && iIdx >= 0 && iIdx < items.length) {
                     const start = items.slice(0, iIdx).reduce((sum, it) => sum + (Number(it.Duration) || 0), 0);
                     setCurrentTime(start);
                   }
                 }}
                 onSelectRegion={(rIdx) => setSelection(prev => ({ ...prev, regionIndex: rIdx, itemIndex: null }))}
                 onPatchItem={(rIdx, iIdx, patch) => vsn && applyVsn(patchItem(vsn, selection.pageIndex, rIdx, iIdx, patch))}
                 onDeleteItem={(rIdx, iIdx) => {
                    if (!vsn) return;
                    const next = deleteItem(vsn, selection.pageIndex, rIdx, iIdx);
                    applyVsn(next);
                    setSelection(prev => ({ ...prev, itemIndex: null }));
                 }}
                 onMoveItem={(fromR, fromI, toR, toI) => {
                    if (!vsn) return;
                    const next = moveItemToRegion(vsn, selection.pageIndex, fromR, fromI, toR, toI);
                    applyVsn(next);
                    setSelection({ pageIndex: selection.pageIndex, regionIndex: toR, itemIndex: toI });
                 }}
               />
            </div>
          </div>
          {!isMobile && <div className="flex min-h-0 flex-col rounded-2xl border bg-card p-4 overflow-hidden">{rightPanelContent}</div>}
        </div>
      </div>

      <ProgramPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} doc={vsn} materialIndex={materialIndex} startPageIndex={selection.pageIndex} />
      <ProgramPublishDialog
        open={publishOpen}
        onOpenChange={(next) => {
          setPublishOpen(next);
          if (!next) setPublishContext(null);
        }}
        program={{
          ...program,
          width: canvasWidth,
          height: canvasHeight
        } as any} 
        deployments={program.deployments || []}
        preferredDraftId={publishContext?.preferredDraftId ?? null}
        initialVersionMode={publishContext?.initialVersionMode ?? null}
        initialExistingVersion={publishContext?.initialExistingVersion ?? null}
        lockVersionMode={publishContext?.lockVersionMode ?? null}
        createVsnJson={publishContext?.createVsnJson ?? null}
        coverBase64={publishContext?.coverBase64 ?? null}
        coverContentType={publishContext?.coverContentType ?? null}
        cleanupDraftId={publishContext?.cleanupDraftId ?? null}
        onAfterPublish={() => queryClient.invalidateQueries({ queryKey: ['programs', programId] })}
      />

      <Dialog open={draftPromptOpen} onOpenChange={setDraftPromptOpen}>
        <DialogContent className="max-w-[500px] p-8">
          <TriangleAlert className="h-10 w-10 text-amber-600 mb-6" />
          <DialogHeader>
            <DialogTitle>{t('programEditor.dialogs.unsaved.title')}</DialogTitle>
            <DialogDescription>{t('programEditor.dialogs.unsaved.desc')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => { setDraftPromptOpen(false); if (draftPromptIntent?.type === 'navigate') navigationBlocker.reset?.(); }}>{t('common.actions.cancel')}</Button>
            <Button variant="destructive" onClick={() => {
              setDraftPromptOpen(false);
              if (draftPromptIntent?.type === 'switch') { setBaseVersion(draftPromptIntent.nextBaseVersion); setIsInitializing(true); }
              else navigationBlocker.proceed?.();
            }}>{t('programEditor.dialogs.unsaved.discard')}</Button>
            <Button onClick={async () => {
               try {
                 if (vsn) await saveMutation.mutateAsync(vsn);
               } catch (err) {
                 return;
               }
               setDraftPromptOpen(false);
               if (draftPromptIntent?.type === 'switch') { setBaseVersion(draftPromptIntent.nextBaseVersion); setIsInitializing(true); }
               else navigationBlocker.proceed?.();
            }}>{t('programEditor.dialogs.unsaved.saveAndContinue')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RightTabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold transition-all",
      active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
    )}>
      {icon} {children}
    </button>
  );
}

function buildEditorMaterials(nodes: unknown[]): EditorMaterial[] {
  const assets = (nodes as { type: string }[]).filter(n => n?.type?.toLowerCase() === 'asset') as MediaAssetNode[];
  return assets.filter(a => {
    const kind = a.assetKind?.toLowerCase();
    return kind === 'image' || kind === 'video';
  }).map(asset => ({
    assetId: asset.id,
    materialId: resolveMaterialId(asset.id),
    source: asset,
    name: asset.name,
    kind: asset.assetKind?.toLowerCase() as 'image' | 'video',
    extension: asset.extension,
    coverUrl: asset.coverUrl,
    assetUrl: asset.assetUrl,
    width: asset.width,
    height: asset.height,
    durationMs: asset.durationMs,
  }));
}
