import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  Trash2, 
  CheckCheck,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertCircle,
  Zap,
  RefreshCcw
} from "lucide-react";

import { Button } from "@/registry/new-york/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/registry/new-york/ui/card";
import { Input } from "@/registry/new-york/ui/input";
import { Badge } from "@/registry/new-york/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/registry/new-york/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  getMessages, 
  markAsRead, 
  markSingleAsRead,
  getUnreadCount
} from "@/services/messageApi";
import { useMessageStore } from "@/store/messageStore";
import type { MessageListItem, MessageKind, MessageStatus } from "@/types/message";
import { cn } from "@/lib/utils";
import { toast } from "@/store/notificationStore";

export default function MessagesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { fetchInitialData } = useMessageStore();
  
  const [activeTab, setActiveTab] = useState<'all' | 'NOTIFICATION' | 'TASK'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // --- Queries ---

  const { data: messagesData, isLoading, isFetching } = useQuery({
    queryKey: ['messages', activeTab, readFilter, searchKeyword, page],
    queryFn: () => getMessages({
      kind: activeTab === 'all' ? undefined : activeTab,
      read: readFilter,
      keyword: searchKeyword,
      page,
      size: pageSize
    }),
  });

  const { data: unreadData } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: getUnreadCount,
  });

  // --- Mutations ---

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      fetchInitialData(); // Update bell
    }
  });

  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) => markSingleAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      fetchInitialData(); // Update bell
    }
  });

  // --- Handlers ---

  const handleMarkAllRead = () => {
    const unreadIds = messagesData?.data?.items
      .filter(m => !m.readAt)
      .map(m => m.id) || [];
    
    if (unreadIds.length > 0) {
      markReadMutation.mutate(unreadIds);
      toast.success("Marked all as read");
    }
  };

  const getStatusIcon = (kind: MessageKind, status?: MessageStatus) => {
    if (kind === 'TASK') {
      switch (status) {
        case 'SUCCESS': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        case 'FAILED': return <AlertCircle className="h-4 w-4 text-rose-500" />;
        case 'RUNNING': return <RefreshCcw className="h-4 w-4 text-blue-500 animate-spin" />;
        default: return <Clock className="h-4 w-4 text-muted-foreground" />;
      }
    }
    return <Info className="h-4 w-4 text-blue-400" />;
  };

  const messages = messagesData?.data?.items || [];
  const total = messagesData?.data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message Center</h1>
          <p className="text-muted-foreground">Stay updated with your system notifications and tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadData?.data?.count === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
          <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['messages'] })}>
            <RefreshCcw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-card">
        <CardHeader className="pb-3 border-b px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => { setActiveTab(v as any); setPage(0); }} 
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-3 w-[300px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="NOTIFICATION">Alerts</TabsTrigger>
                <TabsTrigger value="TASK">Tasks</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search messages..." 
                  className="pl-9 bg-muted/30 border-none"
                  value={searchKeyword}
                  onChange={(e) => { setSearchKeyword(e.target.value); setPage(0); }}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setReadFilter('all')}>
                    <span className={cn("flex-1", readFilter === 'all' && "font-bold text-primary")}>All Messages</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReadFilter('unread')}>
                    <span className={cn("flex-1", readFilter === 'unread' && "font-bold text-primary")}>Unread Only</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setReadFilter('read')}>
                    <span className={cn("flex-1", readFilter === 'read' && "font-bold text-primary")}>Read Only</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
              <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Loading your messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground opacity-20" />
              </div>
              <h3 className="text-lg font-semibold">No messages found</h3>
              <p className="text-sm text-muted-foreground max-w-[250px] mt-1">
                We'll notify you here when there are updates to your system.
              </p>
            </div>
          ) : (
            <div className="divide-y border-t">
              {messages.map((message) => (
                <MessageItem 
                  key={message.id} 
                  message={message} 
                  onMarkRead={(id) => markSingleReadMutation.mutate(id)}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          )}
        </CardContent>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} messages
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs font-bold px-3">
                {page + 1} / {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function MessageItem({ 
  message, 
  onMarkRead,
  getStatusIcon
}: { 
  message: MessageListItem;
  onMarkRead: (id: string) => void;
  getStatusIcon: (kind: MessageKind, status?: MessageStatus) => React.ReactNode;
}) {
  return (
    <div className={cn(
      "group flex items-start gap-4 p-5 transition-all hover:bg-muted/30 relative",
      !message.readAt && "bg-primary/5 border-l-2 border-l-primary"
    )}>
      <div className={cn(
        "mt-1 p-2 rounded-xl shrink-0",
        message.readAt ? "bg-muted" : "bg-primary/10"
      )}>
        {getStatusIcon(message.kind, message.status)}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className={cn(
            "text-sm font-semibold truncate",
            !message.readAt ? "text-foreground" : "text-muted-foreground"
          )}>
            {message.title}
          </h4>
          {!message.readAt && <Badge className="h-4 px-1.5 text-[8px] bg-primary uppercase">New</Badge>}
        </div>
        <p className={cn(
          "text-xs leading-relaxed line-clamp-2",
          message.readAt ? "text-muted-foreground/60" : "text-muted-foreground"
        )}>
          {message.summary}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
            <Clock className="h-3 w-3" />
            {formatDate(message.createdAt)}
          </div>
          {message.kind === 'TASK' && message.status && (
            <Badge variant="outline" className={cn(
              "h-4 text-[9px] px-1.5 border-none",
              message.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" : 
              message.status === 'FAILED' ? "bg-rose-50 text-rose-600" :
              "bg-blue-50 text-blue-600"
            )}>
              {message.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!message.readAt && (
              <DropdownMenuItem onClick={() => onMarkRead(message.id)}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark as read
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-rose-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
