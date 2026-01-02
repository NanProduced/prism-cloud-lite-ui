import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useTranslation } from "react-i18next";
import {
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Monitor,
  Layers,
  Image,
  ExternalLink,
  Eye,
  Inbox,
  Activity,
  ChevronsUpDown,
  Copy,
  Zap,
  AlertCircle,
  Mail,
  Loader2,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  getMessages,
  markAsRead,
  markSingleAsRead,
  getUnreadCount,
  getMessageDetail
} from "@/services/messageApi";
import { retryTranscodeTask } from "@/services/mediaApi";
import { getExportDownloadUrl, deleteExport } from "@/services/exportApi";
import { useMessageStore } from "@/store/messageStore";
import type { MessageDetail, MessageListItem, MessageKind, MessageStatus } from "@/types/message";
import { cn } from "@/lib/utils";
import { toast } from "@/store/notificationStore";
import { useTimeFormatter } from "@/hooks/use-time-formatter";
import { renderMessage } from "@/lib/message-renderer";
import { DateRangePicker } from "@/components/shared/DateRangePicker";

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchInitialData, sseConnected } = useMessageStore();
  const { formatDateTime, timeZone } = useTimeFormatter();
  const { t } = useTranslation();

  // Tab mapping for sidebar compatibility
  const tabParam = searchParams.get('tab');
  const activeTab = useMemo(() => {
    if (tabParam === 'notifications') return 'NOTIFICATION';
    if (tabParam === 'tasks') return 'TASK';
    return 'all';
  }, [tabParam]);

  // Filters
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    return {
      from: subDays(now, 7).toISOString(),
      to: now.toISOString(),
    };
  });
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [timeZone]);

  const stateMessageId = (location.state as any)?.openMessageId as string | undefined;
  const urlMessageId = searchParams.get('messageId') || undefined;

  useEffect(() => {
    if (!stateMessageId) return;
    setSelectedMessageId(stateMessageId);
    navigate(location.pathname + location.search, { replace: true, state: {} });
  }, [stateMessageId, navigate, location.pathname, location.search]);

  useEffect(() => {
    if (!urlMessageId) return;
    setSelectedMessageId(urlMessageId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('messageId');
      return next;
    }, { replace: true });
  }, [urlMessageId, setSearchParams]);

  // --- Queries ---

  const { data: messagesData, isLoading, isFetching } = useQuery({
    queryKey: ['messages', activeTab, readFilter, statusFilter, searchKeyword, dateRange, page],
    queryFn: () => getMessages({
      kind: activeTab === 'all' ? undefined : activeTab,
      read: readFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      keyword: searchKeyword,
      from: dateRange.from,
      to: dateRange.to.includes('T') ? dateRange.to : dateRange.to + 'T23:59:59',
      page,
      size: pageSize
    }),
  });

  const { data: unreadRes } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: getUnreadCount,
  });

  const { data: detailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: ['messages', 'detail', selectedMessageId],
    queryFn: () => getMessageDetail(selectedMessageId!),
    enabled: !!selectedMessageId,
  });

  // --- SSE Integration ---
  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    };

    window.addEventListener('prism.message.created', handleUpdate);
    window.addEventListener('prism.message.updated', handleUpdate);

    return () => {
      window.removeEventListener('prism.message.created', handleUpdate);
      window.removeEventListener('prism.message.updated', handleUpdate);
    };
  }, [queryClient]);

  // --- Mutations ---

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      fetchInitialData(); // Update global store
    }
  });

  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) => markSingleAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      fetchInitialData();
    }
  });

  const retryTranscodeMutation = useMutation({
    mutationFn: ({ taskId, assetId, presetId, targetFolderId, options }: { taskId: string, assetId: string, presetId: string, targetFolderId?: string | null, options?: any }) =>
      retryTranscodeTask(taskId, { assetId, presetId, targetFolderId, options }),
    onSuccess: (res) => {
      if (res.success && res.data) {
        toast.success('Retrying transcoding task');
        setSelectedMessageId(res.data.messageId);
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      } else {
        toast.error(res.error?.displayMessage || 'Failed to retry task');
      }
    }
  });

  // --- Handlers ---

  const handleTabChange = (nextTab: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (nextTab === 'all') next.delete('tab');
      else next.set('tab', nextTab);
      return next;
    });
    setPage(0);
  };

  const handleMarkAllRead = () => {
    const unreadIds = messagesData?.data?.items
      .filter(m => !m.readAt)
      .map(m => m.id) || [];

    if (unreadIds.length > 0) {
      markReadMutation.mutate(unreadIds);
      toast.success("Marked current page as read");
    }
  };

  const setQuickRange = (days: number) => {
    const now = new Date();
    setDateRange({
      from: subDays(now, days).toISOString(),
      to: now.toISOString(),
    });
    setPage(0);
  };

  // Helper to determine if a range is active (approximate due to time drift)
  const isQuickRangeActive = (days: number) => {
    const fromTime = new Date(dateRange.from).getTime();
    const toTime = new Date(dateRange.to).getTime();
    const diffDays = (toTime - fromTime) / (24 * 3600 * 1000);
    return diffDays > days - 0.1 && diffDays < days + 0.1;
  };

  const handleMessageClick = (message: MessageListItem) => {
    if (!message.readAt) {
      markSingleReadMutation.mutate(message.id);
    }
    setSelectedMessageId(message.id);
  };

  const getStatusIcon = (kind: MessageKind, status?: MessageStatus) => {
    if (kind === 'TASK') {
      switch (status) {
        case 'SUCCESS': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        case 'FAILED': return <AlertCircle className="h-4 w-4 text-rose-500" />;
        case 'RUNNING': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
        default: return <Clock className="h-4 w-4 text-muted-foreground" />;
      }
    }
    return <Bell className="h-4 w-4 text-primary/60" />;
  };

  const messages = messagesData?.data?.items || [];
  const total = messagesData?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-6 p-6 h-full animate-in fade-in duration-500 overflow-hidden">
      {/* TOPBAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center bg-muted/30 p-1 rounded-2xl border shadow-sm w-fit">
          <button
            type="button"
            className={cn(
              'rounded-xl px-8 py-2 text-[11px] font-bold tracking-widest transition-all flex items-center gap-2',
              activeTab === 'all' ? 'bg-background text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('all')}
          >
            <Inbox className="h-4 w-4" />
            Inbox
          </button>
          <button
            type="button"
            className={cn(
              'rounded-xl px-8 py-2 text-[11px] font-bold tracking-widest transition-all flex items-center gap-2',
              activeTab === 'NOTIFICATION' ? 'bg-background text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('notifications')}
          >
            <Bell className="h-4 w-4" />
            Notifications
          </button>
          <button
            type="button"
            className={cn(
              'rounded-xl px-8 py-2 text-[11px] font-bold tracking-widest transition-all flex items-center gap-2',
              activeTab === 'TASK' ? 'bg-background text-primary shadow-sm ring-1 ring-black/5' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('tasks')}
          >
            <Zap className="h-4 w-4" />
            Tasks
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/30 rounded-2xl p-1 border shadow-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setQuickRange(1)}
              className={cn(
                "h-8 px-4 text-[10px] font-black rounded-xl transition-all",
                isQuickRangeActive(1) && "bg-background text-primary shadow-sm"
              )}
            >24H</Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setQuickRange(7)}
              className={cn(
                "h-8 px-4 text-[10px] font-black rounded-xl transition-all",
                isQuickRangeActive(7) && "bg-background text-primary shadow-sm"
              )}
            >7D</Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setQuickRange(30)}
              className={cn(
                "h-8 px-4 text-[10px] font-black rounded-xl transition-all",
                isQuickRangeActive(30) && "bg-background text-primary shadow-sm"
              )}
            >30D</Button>
          </div>
          <Button variant="outline" size="sm" className="h-10 rounded-2xl font-bold text-[11px] tracking-widest px-6 border-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all" onClick={handleMarkAllRead} disabled={unreadRes?.data?.count === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark read
          </Button>
          <Button variant="outline" size="icon" className="rounded-2xl h-10 w-10 border-2 hover:bg-primary hover:text-white transition-all shadow-sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['messages'] })}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex items-center gap-4 flex-wrap bg-card/50 backdrop-blur-md p-4 px-6 shadow-xl shadow-black/5 border-2 rounded-[2rem]">
        <div className="flex items-center gap-2">
          <DateRangePicker 
            value={dateRange}
            onChange={(val) => { setDateRange(val); setPage(0); }}
            label="Message period"
            className="!h-11"
          />
        </div>

        <Separator orientation="vertical" className="h-10 mx-2" />

        <div className="flex items-center gap-4 bg-muted/40 px-5 py-2 rounded-2xl border-2 border-transparent hover:border-primary/20 hover:bg-muted/60 transition-all min-w-[150px]">
          <Filter className="h-5 w-5 text-primary/60 shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-black tracking-widest text-primary/40 uppercase leading-none mb-1.5">Read status</span>
            <Select value={readFilter} onValueChange={(v) => { setReadFilter(v as any); setPage(0); }}>
              <SelectTrigger className="h-5 border-none bg-transparent font-bold text-[13px] p-0 focus:ring-0 shadow-none">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all" className="font-bold">All Messages</SelectItem>
                <SelectItem value="unread" className="font-medium text-rose-600">Unread Only</SelectItem>
                <SelectItem value="read" className="font-medium">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator orientation="vertical" className="h-10 mx-2" />

        <div className="flex items-center gap-4 bg-muted/40 px-5 py-2 rounded-2xl border-2 border-transparent hover:border-primary/20 hover:bg-muted/60 transition-all min-w-[150px]">
          <Activity className="h-5 w-5 text-primary/60 shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-black tracking-widest text-primary/40 uppercase leading-none mb-1.5">Status</span>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="h-5 border-none bg-transparent font-bold text-[13px] p-0 focus:ring-0 shadow-none">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all" className="font-bold">All Status</SelectItem>
                <SelectItem value="PENDING" className="font-medium">Pending</SelectItem>
                <SelectItem value="RUNNING" className="font-medium text-blue-600">Running</SelectItem>
                <SelectItem value="SUCCESS" className="font-medium text-emerald-600">Success</SelectItem>
                <SelectItem value="FAILED" className="font-medium text-rose-600">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator orientation="vertical" className="h-10 mx-2" />

        <div className="flex items-center gap-4 bg-muted/30 px-5 py-2 rounded-2xl border-2 border-muted/20 flex-1 max-w-md focus-within:bg-background focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/5 transition-all">
          <Search className="h-5 w-5 text-primary/30 shrink-0" />
          <Input
            placeholder="Search messages..."
            className="h-6 border-none bg-transparent font-bold text-[13px] p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setPage(0); }}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
            {unreadRes?.data && unreadRes.data.count > 0 && (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none rounded-xl h-6 px-3 text-[11px] font-black tabular-nums shadow-lg shadow-rose-500/20 animate-in zoom-in duration-300">
                {unreadRes.data.count} unread
              </Badge>
            )}
        </div>
      </div>

      {/* CONTENT */}
      <Card className="flex-1 flex flex-col min-h-0 border rounded-[2rem] bg-card shadow-sm overflow-hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full p-24 space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground/50">Syncing messages…</p>
              </div>
            ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-24 text-center">
              <div className="h-20 w-20 bg-muted/50 rounded-3xl flex items-center justify-center mb-6 border border-dashed">
                <Mail className="h-8 w-8 text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">Your inbox is clear</h3>
              <p className="text-sm text-muted-foreground max-w-[280px] mt-2 leading-relaxed">
                Stay tuned! We'll notify you here about system updates, device events, and task completions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onSelect={handleMessageClick}
                  onMarkRead={(id) => markSingleReadMutation.mutate(id)}
                  getStatusIcon={getStatusIcon}
                  formatDateTime={formatDateTime}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t bg-muted/5 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-bold tracking-wide">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} messages 
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg shadow-sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="bg-background border rounded-lg px-3 h-8 flex items-center text-[10px] font-black shadow-inner">
                {page + 1} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg shadow-sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* DETAIL DIALOG */}
      <Dialog open={!!selectedMessageId} onOpenChange={(open) => !open && setSelectedMessageId(null)}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] p-0 border-none shadow-2xl">
          {isDetailLoading && (
            <div className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">{t('message.ui.loading')}</span>
            </div>
          )}

          {detailRes && !detailRes.success && (
            <div className="p-10">
              <p className="text-base font-semibold">{t('message.ui.loadFailedTitle')}</p>
              <p className="text-sm text-muted-foreground mt-2">{detailRes.error?.displayMessage || t('message.ui.loadFailedHint')}</p>
              <div className="mt-6 flex justify-end">
                <Button className="rounded-xl font-semibold" onClick={() => setSelectedMessageId(null)}>
                  {t('message.ui.close')}
                </Button>
              </div>
            </div>
          )}

          {detailRes?.success && detailRes.data && (
            <div className="flex flex-col">
              <div className="bg-primary/5 p-8 border-b relative">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner",
                    detailRes.data.kind === 'TASK' ? "bg-blue-500/10 text-blue-600" : "bg-primary/10 text-primary"
                  )}>
                    {getStatusIcon(detailRes.data.kind, detailRes.data.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-2 text-[8px] font-semibold tracking-wide bg-background/50">
                      {t(`message.kind.${detailRes.data.kind}`)}
                    </Badge>
                    <DialogTitle className="text-xl font-bold tracking-tight">
                      {renderMessage(detailRes.data).title}
                    </DialogTitle>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold tracking-tight">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(detailRes.data.createdAt)}
                      </div>
                      {detailRes.data.status && (
                        <Badge className={cn(
                          "h-5 text-[9px] px-2 font-semibold border-none",
                          detailRes.data.status === 'SUCCESS' ? "bg-emerald-500 text-white" :
                          detailRes.data.status === 'FAILED' ? "bg-rose-500 text-white" :
                          "bg-blue-500 text-white animate-pulse"
                        )}>
                          {t(`message.status.${detailRes.data.status}`)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">{t('message.ui.summary')}</p>
                  <p className="text-sm leading-relaxed text-foreground font-medium">
                    {renderMessage(detailRes.data).summary}
                  </p>
                </div>

                {detailRes.data.type === 'media.transcode' && (
                  <TranscodeTaskDetails
                    message={detailRes.data}
                    sseConnected={sseConnected}
                    onOpenMediaLibrary={() => navigate('/dashboard/media')}
                    onRetry={(args) => retryTranscodeMutation.mutate(args)}
                    isRetrying={retryTranscodeMutation.isPending}
                  />
                )}

                {detailRes.data.type?.startsWith('export.') && (
                  <ExportTaskDetails
                    message={detailRes.data}
                  />
                )}

                {/* Related Resources Grid */}
                {(() => {
                  const payload = detailRes.data.payload || {};
                  const assetId = payload.output?.assetId || payload.source?.assetId;
                  const assetTitle = payload.source?.title || payload.output?.title;

                  const showAssetCard = detailRes.data.type !== 'media.transcode' && !!assetId;
                  const showDeviceCard = !!detailRes.data.deviceName;
                  const showProgramCard = !!detailRes.data.programName;

                  if (!showDeviceCard && !showProgramCard && !showAssetCard) return null;

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      {showDeviceCard && (
                        <div className="p-4 rounded-2xl bg-muted/30 border shadow-sm flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                               <Monitor className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-semibold text-muted-foreground tracking-wide leading-none mb-1">Device</span>
                              <span className="text-xs font-bold truncate max-w-[150px]">
                                {detailRes.data.deviceName}
                              </span>
                            </div>
                          </div>
                          {detailRes.data.deviceId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => navigate(`/dashboard/devices/${detailRes.data.deviceId}`)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                      {showProgramCard && (
                        <div className="p-4 rounded-2xl bg-muted/30 border shadow-sm flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                               <Layers className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-semibold text-muted-foreground tracking-wide leading-none mb-1">Program</span>
                              <span className="text-xs font-bold truncate max-w-[150px]">
                                {detailRes.data.programName}
                              </span>
                            </div>
                          </div>
                          {detailRes.data.programId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => navigate(`/dashboard/programs/${detailRes.data.programId}`)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                      {showAssetCard && (
                        <div className="p-4 rounded-2xl bg-muted/30 border shadow-sm flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-600">
                               <Image className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-semibold text-muted-foreground tracking-wide leading-none mb-1">Media asset</span>
                              <span className="text-xs font-bold truncate max-w-[150px]">
                                {assetTitle || 'Media Resource'}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate(`/dashboard/media`)}>
                             <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Debug: internal fields & raw payload */}
                <Collapsible open={debugOpen} onOpenChange={setDebugOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full rounded-xl justify-between">
                      <span className="text-xs font-semibold">{t('message.ui.debugTitle')}</span>
                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-muted/20 rounded-2xl p-6 border">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-semibold text-muted-foreground tracking-wide">{t('message.ui.fields.id')}</span>
                        <span className="text-sm font-semibold font-mono break-all">{detailRes.data.id}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-semibold text-muted-foreground tracking-wide">{t('message.ui.fields.type')}</span>
                        <span className="text-sm font-semibold font-mono break-all">{detailRes.data.type}</span>
                      </div>
                      {detailRes.data.operationId && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-semibold text-muted-foreground tracking-wide">{t('message.ui.fields.operationId')}</span>
                          <span className="text-sm font-semibold font-mono break-all">{detailRes.data.operationId}</span>
                        </div>
                      )}
                      {detailRes.data.taskId && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-semibold text-muted-foreground tracking-wide">{t('message.ui.fields.taskId')}</span>
                          <span className="text-sm font-semibold font-mono break-all">{detailRes.data.taskId}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">{t('message.ui.payload')}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] font-bold gap-1.5"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(detailRes.data.payload ?? {}, null, 2));
                            toast.success(t('logs.common.copied'));
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          {t('message.ui.copyPayload')}
                        </Button>
                      </div>
                      <div className="bg-slate-950 rounded-2xl p-6 overflow-hidden border border-slate-800 shadow-xl group relative">
                        <pre className="text-xs text-emerald-400 font-mono overflow-auto max-h-[400px] custom-scrollbar leading-relaxed">
                          {JSON.stringify(detailRes.data.payload ?? {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex justify-end gap-3 pt-4">
                  <Button className="rounded-xl font-semibold tracking-wide text-xs px-8 h-10" onClick={() => setSelectedMessageId(null)}>
                    {t('message.ui.dismiss')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExportTaskDetails({ message }: { message: MessageDetail }) {
  const { t } = useTranslation();
  const payload = message.payload || {};
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async () => {
    const exportId = message.payload?.exportId;
    if (!exportId) return;
    setIsDownloading(true);
    try {
      const res = await getExportDownloadUrl(exportId);
      if (res.success && res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        toast.error(res.error?.displayMessage || 'Failed to get download URL');
      }
    } catch (e) {
      toast.error('Failed to download');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    const exportId = message.payload?.exportId;
    if (!exportId) return;
    setIsDeleting(true);
    try {
      const res = await deleteExport(exportId);
      if (res.success) {
        toast.success('File deleted and quota released');
        // The message status will be updated via SSE (payload.stage=DELETED)
      } else {
        toast.error(res.error?.displayMessage || 'Failed to delete file');
      }
    } catch (e) {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const stageLabelMap: Record<string, string> = {
    PENDING: 'Queued',
    QUERYING: 'Querying data',
    UPLOADING: 'Uploading result',
    SUCCESS: 'Available',
    FAILED: 'Failed',
    DELETED: 'Deleted'
  };

  const stage = String(payload.stage || '');
  const stageLabel = stageLabelMap[stage] || stage || 'Working';

  return (
    <div className="rounded-2xl border bg-muted/10 p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight">Export Task Details</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="secondary" className="h-5 text-[9px] font-black tracking-widest px-2 bg-background border shadow-sm">
              {payload.format || 'CSV'}
            </Badge>
            {payload.rowCount !== undefined && (
              <span className="text-[10px] text-muted-foreground font-bold tabular-nums">
                {payload.rowCount.toLocaleString()} rows
              </span>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'h-6 px-3 text-[10px] font-bold tracking-wide rounded-full',
            stage === 'FAILED'
              ? 'border-rose-200 text-rose-700 bg-rose-50'
              : stage === 'SUCCESS'
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                : stage === 'DELETED'
                  ? 'border-muted text-muted-foreground bg-muted/20'
                  : 'border-blue-200 text-blue-700 bg-blue-50 animate-pulse'
          )}
        >
          {stageLabel}
        </Badge>
      </div>

      {stage === 'FAILED' && payload.error?.displayMessage && (
        <div className="rounded-xl border border-rose-200/60 bg-rose-50/60 p-4 text-xs text-rose-700 font-medium leading-relaxed">
          {payload.error.displayMessage}
        </div>
      )}

      {stage === 'SUCCESS' && (
        <div className="flex items-center gap-3 pt-2">
          <Button 
            className="flex-1 rounded-xl h-12 bg-zinc-900 text-white hover:bg-zinc-800 font-bold shadow-xl flex items-center justify-center gap-2"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download File
          </Button>
          <Button 
            variant="ghost"
            className="rounded-xl h-12 px-6 font-bold text-rose-600 hover:bg-rose-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
          </Button>
        </div>
      )}

      {stage === 'DELETED' && (
        <p className="text-[11px] text-muted-foreground/60 italic text-center py-2">
          File has been removed to free up storage space.
        </p>
      )}
    </div>
  );
}

function TranscodeTaskDetails({
  message,
  sseConnected,
  onOpenMediaLibrary,
  onRetry,
  isRetrying,
}: {
  message: MessageDetail;
  sseConnected: boolean;
  onOpenMediaLibrary: () => void;
  onRetry: (args: { taskId: string; assetId: string; presetId: string; targetFolderId?: string | null; options?: any }) => void;
  isRetrying: boolean;
}) {
  const payload = message.payload || {};

  const stageLabelMap: Record<string, string> = {
    PENDING: 'Queued',
    DOWNLOADING: 'Preparing source',
    TRANSCODING: 'Transcoding',
    UPLOADING: 'Uploading output',
    FINALIZING: 'Saving to library',
    FAILED: 'Failed',
  };

  const presetLabelMap: Record<string, string> = {
    mp4_1080p_h264: 'Ultra HD',
    mp4_720p_h264: 'Balanced',
    mp4_480p_h264: 'Mobile',
    mp4_360p_h264: 'Low',
    mp4_h264: 'Native',
  };

  const stageLabel = stageLabelMap[String(payload.stage || '')] || (payload.stage ? String(payload.stage) : 'Working');

  const sourceTitle =
    typeof payload.source?.title === 'string' && payload.source.title.trim().length > 0 ? payload.source.title.trim() : undefined;

  const presetLabel =
    (typeof payload.preset?.label === 'string' && payload.preset.label.trim().length > 0
      ? payload.preset.label.trim()
      : undefined) ??
    (payload.preset?.presetId ? presetLabelMap[String(payload.preset.presetId)] : undefined);

  const percent = typeof payload.progress?.percent === 'number' ? Math.max(0, Math.min(1, payload.progress.percent)) : undefined;
  const percentText = percent === undefined ? undefined : `${Math.round(percent * 100)}%`;

  const hasOutput = !!payload.output?.assetId;
  const errorMessage =
    typeof payload.error?.message === 'string' && payload.error.message.trim().length > 0 ? payload.error.message.trim() : undefined;

  const canRetry =
    message.status === 'FAILED' &&
    !!(payload.taskId || message.taskId) &&
    typeof payload.source?.assetId === 'string' &&
    payload.source.assetId.length > 0 &&
    typeof payload.preset?.presetId === 'string' &&
    payload.preset.presetId.length > 0;

  return (
    <div className="rounded-2xl border bg-muted/10 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">Transcoding task</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {sourceTitle ? <span className="font-medium text-foreground/90">{sourceTitle}</span> : 'Media file'}
            {presetLabel ? <span className="text-muted-foreground"> · {presetLabel}</span> : null}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            'h-6 px-2 text-[10px] font-semibold',
            message.status === 'FAILED'
              ? 'border-rose-200 text-rose-700 bg-rose-50'
              : message.status === 'SUCCESS'
                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                : 'border-blue-200 text-blue-700 bg-blue-50'
          )}
        >
          {stageLabel}
        </Badge>
      </div>

      {percent !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">{percentText}</span>
          </div>
          <Progress value={percent * 100} className="h-2 bg-muted" />
        </div>
      )}

      {!sseConnected && (message.status === 'PENDING' || message.status === 'RUNNING') && (
        <p className="text-xs text-muted-foreground">Live updates unavailable; refreshing periodically.</p>
      )}

      {message.status === 'FAILED' && errorMessage && (
        <div className="rounded-xl border border-rose-200/60 bg-rose-50/60 p-4 text-sm text-rose-700 leading-relaxed">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {message.status === 'SUCCESS' && hasOutput && (
          <Button variant="outline" className="rounded-xl font-semibold" onClick={onOpenMediaLibrary}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open media library
          </Button>
        )}

        {canRetry && (
          <Button
            variant="outline"
            className="rounded-xl font-semibold border-rose-200 text-rose-700 hover:bg-rose-50"
            disabled={isRetrying}
            onClick={() => {
              onRetry({
                taskId: String(payload.taskId || message.taskId),
                assetId: String(payload.source.assetId),
                presetId: String(payload.preset.presetId),
                targetFolderId: payload.targetFolderId ?? undefined,
                options: payload.options,
              });
            }}
          >
            {isRetrying ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

function MessageItem({
  message,
  onSelect,
  onMarkRead,
  getStatusIcon,
  formatDateTime,
  navigate
}: {
  message: MessageListItem;
  onSelect: (m: MessageListItem) => void;
  onMarkRead: (id: string) => void;
  getStatusIcon: (kind: MessageKind, status?: MessageStatus) => React.ReactNode;
  formatDateTime: (d: string) => string;
  navigate: (path: string) => void;
}) {
  const { title, summary } = renderMessage(message);

  return (
    <div 
      className={cn(
        "group flex items-start gap-4 p-5 transition-all hover:bg-muted/30 cursor-pointer relative border-l-4 border-l-transparent",
        !message.readAt && "bg-primary/[0.02] border-l-primary"
      )}
      onClick={() => onSelect(message)}
    >
      <div className={cn(
        "mt-1 p-2 rounded-xl shrink-0 border shadow-sm transition-transform group-hover:scale-105",
        message.readAt ? "bg-muted/50 text-muted-foreground/60" : "bg-primary/5 text-primary"
      )}>
        {getStatusIcon(message.kind, message.status)}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className={cn(
              "text-sm font-bold truncate",
              !message.readAt ? "text-foreground" : "text-muted-foreground/70"
            )}>
              {title}
            </h4>
            {!message.readAt && (
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shadow-sm" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground/60 font-bold tabular-nums whitespace-nowrap">
            {formatDateTime(message.createdAt)}
          </span>
        </div>
        
        <p className={cn(
          "text-xs leading-relaxed line-clamp-1 font-medium",
          message.readAt ? "text-muted-foreground/50" : "text-muted-foreground/80"
        )}>
          {summary}
        </p>

        <div className="flex items-center gap-2 pt-1">
          {message.deviceName && (
            <Badge variant="outline" className="h-4 text-[8px] font-semibold tracking-tight bg-muted/20 border-none flex gap-1 items-center">
              <Monitor className="h-2 w-2" /> {message.deviceName}
            </Badge>
          )}
          {message.programName && (
            <Badge variant="outline" className="h-4 text-[8px] font-semibold tracking-tight bg-muted/20 border-none flex gap-1 items-center">
              <Layers className="h-2 w-2" /> {message.programName}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4 self-center">
        {!message.readAt && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors" onClick={(e) => { e.stopPropagation(); onMarkRead(message.id); }}>
            <CheckCheck className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
