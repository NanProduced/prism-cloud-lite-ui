import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  Zap,
  RefreshCw,
  Monitor,
  Layers,
  Image,
  Terminal,
  ExternalLink,
  Eye,
  Check,
  Mail,
  Inbox,
  Activity,
  Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  getMessages,
  markAsRead,
  markSingleAsRead,
  getUnreadCount,
  getMessageDetail
} from "@/services/messageApi";
import { retryTranscodeTask } from "@/services/mediaApi";
import { useMessageStore } from "@/store/messageStore";
import type { MessageDetail, MessageListItem, MessageKind, MessageStatus } from "@/types/message";
import { cn } from "@/lib/utils";
import { toast } from "@/store/notificationStore";
import { useTimeFormatter } from "@/hooks/use-time-formatter";
import { renderMessage } from "@/lib/message-renderer";

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchInitialData, sseConnected } = useMessageStore();
  const { formatDateTime, timeZone } = useTimeFormatter();

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
      from: formatInTimeZone(subDays(now, 7), timeZone, 'yyyy-MM-dd'),
      to: formatInTimeZone(now, timeZone, 'yyyy-MM-dd'),
    };
  });
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setDateRange({
      from: formatInTimeZone(subDays(now, 7), timeZone, 'yyyy-MM-dd'),
      to: formatInTimeZone(now, timeZone, 'yyyy-MM-dd'),
    });
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

  const fromIso = useMemo(() => {
    try {
      return fromZonedTime(`${dateRange.from} 00:00:00`, timeZone).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }, [dateRange.from, timeZone]);

  const toIso = useMemo(() => {
    try {
      const start = fromZonedTime(`${dateRange.to} 00:00:00`, timeZone);
      return addDays(start, 1).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }, [dateRange.to, timeZone]);

  const { data: messagesData, isLoading, isFetching } = useQuery({
    queryKey: ['messages', activeTab, readFilter, statusFilter, searchKeyword, dateRange, page],
    queryFn: () => getMessages({
      kind: activeTab === 'all' ? undefined : activeTab,
      read: readFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      keyword: searchKeyword,
      from: fromIso,
      to: toIso,
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

  // Fallback polling for task progress when SSE is disconnected (detail page only).
  useEffect(() => {
    if (!selectedMessageId) return;
    if (sseConnected) return;
    const status = detailRes?.data?.status;
    if (status !== 'PENDING' && status !== 'RUNNING') return;

    const intervalId = window.setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'detail', selectedMessageId] });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [selectedMessageId, sseConnected, detailRes?.data?.status, queryClient]);

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

  const handleTabChange = (tab: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'all') next.delete('tab');
      else next.set('tab', tab);
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
      from: formatInTimeZone(subDays(now, days), timeZone, 'yyyy-MM-dd'),
      to: formatInTimeZone(now, timeZone, 'yyyy-MM-dd'),
    });
    setPage(0);
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
    <div className="flex flex-col gap-4 p-0 h-full animate-in fade-in duration-500">
      {/* TOPBAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center bg-muted/40 p-1 rounded-xl border shadow-inner w-fit">
          <button
            type="button"
            className={cn(
              'rounded-lg px-6 py-1.5 text-[10px] font-bold tracking-wide transition-all flex items-center gap-1.5',
              activeTab === 'all' ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('all')}
          >
            <Inbox className="h-3.5 w-3.5" />
            Inbox
          </button>
          <button
            type="button"
            className={cn(
              'rounded-lg px-6 py-1.5 text-[10px] font-bold tracking-wide transition-all flex items-center gap-1.5',
              activeTab === 'NOTIFICATION' ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('notifications')}
          >
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </button>
          <button
            type="button"
            className={cn(
              'rounded-lg px-6 py-1.5 text-[10px] font-bold tracking-wide transition-all flex items-center gap-1.5',
              activeTab === 'TASK' ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.03]' : 'text-muted-foreground/60 hover:text-muted-foreground',
            )}
            onClick={() => handleTabChange('tasks')}
          >
            <Zap className="h-3.5 w-3.5" />
            Tasks
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 rounded-xl p-1 border mr-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setQuickRange(1)}
              className={cn(
                "h-7 px-3 text-[10px] font-bold rounded-lg",
                dateRange.from === formatInTimeZone(subDays(new Date(), 1), timeZone, 'yyyy-MM-dd') && "bg-background shadow-sm"
              )}
            >24H</Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setQuickRange(7)}
              className={cn(
                "h-7 px-3 text-[10px] font-bold rounded-lg",
                dateRange.from === formatInTimeZone(subDays(new Date(), 7), timeZone, 'yyyy-MM-dd') && "bg-background shadow-sm"
              )}
            >7D</Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setQuickRange(30)}
              className={cn(
                "h-7 px-3 text-[10px] font-bold rounded-lg",
                dateRange.from === formatInTimeZone(subDays(new Date(), 30), timeZone, 'yyyy-MM-dd') && "bg-background shadow-sm"
              )}
            >30D</Button>
          </div>
          <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold text-[10px] tracking-wide px-4" onClick={handleMarkAllRead} disabled={unreadRes?.data?.count === 0}>
            <CheckCheck className="mr-2 h-3.5 w-3.5" />
            Mark read
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl h-9 w-9" onClick={() => queryClient.invalidateQueries({ queryKey: ['messages'] })}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="flex items-center gap-4 flex-wrap p-3 px-6 shadow-sm border rounded-2xl bg-card/50">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => { setDateRange(prev => ({ ...prev, from: e.target.value })); setPage(0); }}
              className="h-8 w-32 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0 cursor-pointer"    
            />
            <span className="text-[10px] font-bold opacity-30">to</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => { setDateRange(prev => ({ ...prev, to: e.target.value })); setPage(0); }}
              className="h-8 w-32 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0 cursor-pointer"    
            />
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground/60" />
          <div className="flex flex-col">
            <span className="text-[8px] font-semibold tracking-wide text-muted-foreground/60 leading-none mb-0.5">Read status</span>
            <Select value={readFilter} onValueChange={(v) => setReadFilter(v as any)}>
              <SelectTrigger className="h-6 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none w-24">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground/60" />
          <div className="flex flex-col">
            <span className="text-[8px] font-semibold tracking-wide text-muted-foreground/60 leading-none mb-0.5">Status</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-6 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none w-24">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input
            placeholder="Search messages..."
            className="pl-9 h-9 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0"
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setPage(0); }}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
            {unreadRes?.data && unreadRes.data.count > 0 && (
              <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none rounded-full h-5 px-2 text-[10px] font-black tabular-nums shadow-lg shadow-rose-500/20">
                {unreadRes.data.count} unread
              </Badge>
            )}
        </div>
      </Card>

      {/* CONTENT */}
      <Card className="flex-1 flex flex-col min-h-0 border rounded-2xl bg-card shadow-sm overflow-hidden">
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
              <span className="text-sm font-medium">Loading message…</span>
            </div>
          )}

          {detailRes && !detailRes.success && (
            <div className="p-10">
              <p className="text-base font-semibold">Unable to load this message</p>
              <p className="text-sm text-muted-foreground mt-2">{detailRes.error?.displayMessage || 'Please try again.'}</p>
              <div className="mt-6 flex justify-end">
                <Button className="rounded-xl font-semibold" onClick={() => setSelectedMessageId(null)}>
                  Close
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
                      {detailRes.data.kind === 'TASK' ? 'Task' : 'Notification'}
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
                          {detailRes.data.status === 'SUCCESS'
                            ? 'Success'
                            : detailRes.data.status === 'FAILED'
                              ? 'Failed'
                              : detailRes.data.status === 'RUNNING'
                                ? 'Running'
                                : 'Pending'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">Message summary</p>
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

                {/* Payload Details (Meaningful fields only) */}
                {detailRes.data.type !== 'media.transcode' && detailRes.data.payload && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold tracking-wide text-muted-foreground">Detailed information</p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-muted/20 rounded-2xl p-6 border">
                      {Object.entries(detailRes.data.payload).map(([key, value]) => {
                        // Skip internal IDs and objects (unless simple)
                        if (key.toLowerCase().includes('id') || key.toLowerCase().includes('uuid')) return null;
                        if (typeof value === 'object' && value !== null) return null;
                        if (value === null || value === undefined || value === '') return null;

                        // Format labels
                        const label = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase());

                        return (
                          <div key={key} className="flex flex-col gap-1">
                            <span className="text-[9px] font-semibold text-muted-foreground tracking-wide">{label}</span>
                            <span className="text-sm font-semibold">{String(value)}</span>
                          </div>
                        );
                      })}
                      {/* Special handling for media progress if not caught by loop */}
                      {detailRes.data.payload.progress?.percent !== undefined && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-semibold text-muted-foreground tracking-wide">Progress</span>
                          <span className="text-sm font-semibold">{Math.round(detailRes.data.payload.progress.percent * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button className="rounded-xl font-semibold tracking-wide text-xs px-8 h-10" onClick={() => setSelectedMessageId(null)}>
                    Dismiss
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
