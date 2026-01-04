import React, { type ComponentType, type PropsWithChildren, useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  ChevronDown,
  CreditCard,
  Crown,
  FileText,
  HelpCircle,
  Home,
  Image,
  Layers,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Monitor,
  Settings,
  User as UserIcon,
  Power,
  RotateCw,
  Camera,
  Moon,
  Zap,
  ShieldCheck,
  MessageSquareWarning
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn, formatBytes } from "@/lib/utils";
import { PrismIcon } from "@/components/shared/logo";
import { getAvatarById } from "@/lib/avatars";
import { useAuthStore } from "@/store/authStore";
import { useMessageStore } from "@/store/messageStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTimeFormatter } from "@/hooks/use-time-formatter";
import { logout } from "@/services/authApi";
import { getMediaUsage } from "@/services/mediaApi";
import { getUserSubscription, getUserStorageQuota } from "@/services/userApi";
import { markSingleAsRead } from "@/services/messageApi";
import { useQuery } from "@tanstack/react-query";
import { renderMessage } from "@/lib/message-renderer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BreadcrumbNav } from "@/components/dashboard/BreadcrumbNav";
import { CommandSearch } from "@/components/ui/command-search";
import { AIChatBubble, AIChatWindow } from "@/features/ai-assistant";
import { FeedbackDialog } from "@/components/shared/FeedbackDialog";

const BillingPlanSelector = lazy(() => import("@/components/billing/BillingPlanSelector").then(m => ({ default: m.BillingPlanSelector })));

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  children?: Array<{ label: string; href: string }>;
};

type NavGroup = {
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "nav.dashboard", icon: LayoutDashboard, href: "/dashboard/overview" },
      { label: "nav.devices", icon: Monitor, href: "/dashboard/devices" },
    ],
  },
  {
    items: [
      { label: "nav.mediaLibrary", icon: Image, href: "/dashboard/media" },
      {
        label: "nav.programs",
        icon: Layers,
        href: "/dashboard/programs",
        children: [
          { label: "nav.allPrograms", href: "/dashboard/programs" },
          { label: "nav.templates", href: "/dashboard/programs?tab=templates" },
        ],
      },
      { label: "nav.schedule", icon: CalendarClock, href: "/dashboard/schedule" },
    ],
  },
  {
    items: [
      { label: "nav.map", icon: MapIcon, href: "/dashboard/map" },
      { label: "nav.monitoring", icon: Activity, href: "/dashboard/monitoring" },
      { label: "nav.analytics", icon: BarChart3, href: "/dashboard/analytics" },
    ],
  },
  {
    items: [
      {
        label: "nav.messages",
        icon: MessageSquare,
        href: "/dashboard/messages",
        children: [
          { label: "nav.inbox", href: "/dashboard/messages" },
          { label: "nav.notifications", href: "/dashboard/messages?tab=notifications" },
          { label: "nav.tasks", href: "/dashboard/messages?tab=tasks" },
        ],
      },
      {
        label: "nav.logs",
        icon: FileText,
        href: "/dashboard/logs",
        children: [
          { label: "nav.deviceLogs", href: "/dashboard/logs" },
          { label: "nav.terminalLogs", href: "/dashboard/logs?tab=terminal" },
        ],
      },
      { label: "nav.settings", icon: Settings, href: "/dashboard/settings" },
    ],
  },
];

export function DashboardShell({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <DashboardShellContent>{children}</DashboardShellContent>
    </SidebarProvider>
  );
}

function DashboardShellContent({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isBillingOpen, setBillingOpen, isFeedbackOpen, setFeedbackOpen } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const { data: subscriptionRes } = useQuery({
    queryKey: ['user', 'subscription'],
    queryFn: getUserSubscription,
    enabled: !!user,
  });

  const { data: storageRes } = useQuery({
    queryKey: ['user', 'quota', 'storage'],
    queryFn: getUserStorageQuota,
    enabled: !!user,
  });

  const currentTierRaw = (subscriptionRes?.data?.tier || user?.subscriptionTier || "FREE").toUpperCase();
  const tierMap: Record<string, string> = {
    'FREE': 'Free',
    'PRO': 'Pro',
    'ULTRA': 'Ultra'
  };
  const currentTierLabel = tierMap[currentTierRaw] || currentTierRaw;
  
  const storageQuota = storageRes?.data;

  const selectedAvatar = useMemo(() => 
    getAvatarById(user?.avatarId || 'm-1'), 
    [user?.avatarId]
  );

  const toggleExpanded = (label: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(label)) {
      newSet.delete(label);
    } else {
      newSet.add(label);
    }
    setExpandedItems(newSet);
  };

  const isNavActive = (href: string): boolean => {
    return location.pathname === href;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r bg-sidebar">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(
                  "h-auto flex-col items-start gap-3 rounded-lg border bg-sidebar-accent/50 px-4 py-4 text-left hover:bg-sidebar-accent transition-all cursor-pointer",
                  isCollapsed && "items-center px-0 py-4 border-transparent bg-transparent"
                )}
                tooltip={t('shell.workspace')}
              >
                <div className={cn("flex items-center gap-3 w-full", isCollapsed && "justify-center gap-0")}>
                  <PrismIcon size={isCollapsed ? 24 : 28} variant="gradient" className="flex-shrink-0 transition-transform duration-300" />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-base font-bold text-sidebar-foreground">Prism Cloud</span>
                        {currentTierRaw === 'PRO' ? (
                          <Badge className="text-[10px] font-bold px-1.5 py-0 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-white border-none shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">PRO</Badge>
                        ) : currentTierRaw === 'ULTRA' ? (
                          <Badge className="text-[10px] font-bold px-1.5 py-0 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white border-none shadow-[0_0_15px_rgba(139,92,246,0.3)]">ULTRA</Badge>
                        ) : (
                          <Badge className="text-sm font-bold px-1.5 py-0.5 bg-primary text-white">Lite</Badge>
                        )}
                      </div>
                      <p className="text-[10px] tracking-[0.2em] text-muted-foreground mt-1 uppercase font-medium">
                        {currentTierRaw === 'FREE' ? 'Workspace' : `${currentTierRaw} Instance`}
                      </p>
                    </div>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {NAV_GROUPS.map((group, groupIndex) => (
            <SidebarGroup key={groupIndex} className={cn("py-2", isCollapsed && "px-2")}>
              {groupIndex > 0 && !isCollapsed && <div className="mb-4 border-t border-sidebar-border mx-2" />}
              <SidebarMenu>
                {group.items.map((item) => (
                  <div key={item.href}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isNavActive(item.href)}
                        tooltip={t(item.label)}
                        className="rounded-lg text-sm"
                        onClick={(e) => {
                          if (item.children && item.children.length > 0) {
                            if (isCollapsed) {
                              navigate(item.href);
                            } else {
                              e.preventDefault();
                              toggleExpanded(item.label);
                            }
                          } else {
                            navigate(item.href);
                          }
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{t(item.label)}</span>
                            {item.children && item.children.length > 0 && (
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  expandedItems.has(item.label) && "rotate-180"
                                )}
                              />
                            )}
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {item.children && item.children.length > 0 && expandedItems.has(item.label) && !isCollapsed && (
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              isActive={isNavActive(child.href)}
                              onClick={() => navigate(child.href)}
                            >
                              {t(child.label)}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </div>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          {!isCollapsed && (
            <StoragePanel 
              tier={currentTierLabel} 
              navigate={navigate} 
              usage={storageQuota ?? undefined}
              onUpgrade={() => setBillingOpen(true)}
            />
          )}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <BreadcrumbNav />
            </div>

            <div className="flex items-center gap-3">
              <CommandSearch />
              <ThemeToggle />
              <NotificationPopover />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={cn(
                    "flex items-center gap-3 rounded-lg px-2 h-9 transition-all duration-500",
                    currentTierRaw === 'PRO' && "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]",
                    currentTierRaw === 'ULTRA' && "border-fuchsia-500/20 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                  )}>
                    <div className="relative">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={selectedAvatar?.url} alt="User avatar" />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                          {user?.displayName?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'PC'}
                        </AvatarFallback>
                      </Avatar>
                      {(currentTierRaw === 'PRO' || currentTierRaw === 'ULTRA') && (
                        <div className={cn(
                          "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                          currentTierRaw === 'PRO' ? "bg-amber-500" : "bg-violet-500"
                        )} />
                      )}
                    </div>
                    <div className="hidden flex-col text-left text-sm font-semibold leading-tight sm:flex">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[120px]">{user?.displayName || 'Prism User'}</span>
                        {currentTierRaw === 'PRO' && <Crown className="h-3 w-3 text-amber-500 fill-amber-500" />}
                      </div>
                      <span className="text-[10px] font-normal text-muted-foreground truncate max-w-[120px]">
                        {user?.email || 'admin@prismcloud.dev'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings?tab=profile")}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>{t('shell.profile')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t('nav.settings')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings?tab=billing")}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>{t('shell.billing')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/")}>
                    <Home className="mr-2 h-4 w-4" />
                    <span>{t("nav.home")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open("https://docs.prismcloud.dev", "_blank")}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>{t('shell.documentation')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
                    <MessageSquareWarning className="mr-2 h-4 w-4" />
                    <span>{t('feedback.ui.title')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:bg-destructive/10 focus:text-red-600" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('shell.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] bg-background px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </SidebarInset>

      <div className="fixed bottom-24 right-8 z-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300"
            onClick={() => setFeedbackOpen(true)}
            title={t('feedback.ui.title')}
          >
            <MessageSquareWarning className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      <AIChatWindow isOpen={isChatOpen} />
      <AIChatBubble isOpen={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} />
      <Suspense fallback={null}>
        <BillingPlanSelector open={isBillingOpen} onOpenChange={setBillingOpen} />
      </Suspense>
      <FeedbackDialog open={isFeedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}

function StoragePanel({ 
  tier = "Free", 
  navigate, 
  onUpgrade,
  usage
}: { 
  tier?: string; 
  navigate: (path: string) => void; 
  onUpgrade: () => void;
  usage?: { usedBytes: number; quotaBytes: number }
}) {
  const { t } = useTranslation();
  const isUnlimited = usage?.quotaBytes === -1;
  const usedSpaceGB = (usage?.usedBytes || 0) / (1024 * 1024 * 1024);
  const totalSpaceGB = (isUnlimited ? 0 : (usage?.quotaBytes || 2 * 1024 * 1024 * 1024)) / (1024 * 1024 * 1024);
  
  const percentage = isUnlimited ? 0 : Math.min(100, (usedSpaceGB / totalSpaceGB) * 100);
  const isWarning = !isUnlimited && percentage > 85;

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground/80">{t('shell.storage.title')}</h4>
        <Badge variant="outline" className="text-[10px] font-bold h-5 bg-background shadow-sm border-primary/20 text-primary">{tier}</Badge>
      </div>

      <Progress value={percentage} className="h-1.5 mb-2" />

      <div className="flex items-center justify-between mb-3">
        <p
          className={cn(
            "text-[11px]",
            isWarning ? "text-amber-600 font-bold" : "text-muted-foreground font-medium"
          )}
        >
          {usedSpaceGB.toFixed(2)}GB / {isUnlimited ? '∞' : `${totalSpaceGB.toFixed(0)}GB`}
        </p>
        {isUnlimited && <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">{t('shell.storage.unlimited')}</span>}
      </div>

      {tier === "Free" && (
        <Button 
          className="w-full h-8 text-[11px] font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
          onClick={onUpgrade}
        >
          {t('shell.storage.upgrade')}
        </Button>
      )}
    </div>
  );
}

function NotificationPopover() {
  const { t } = useTranslation();
  const { unreadCount, recentMessages, markLocalAsRead } = useMessageStore();
  const navigate = useNavigate();
  const { formatRelative } = useTimeFormatter();

  const handleToggleRead = async (id: string, isRead: boolean) => {
    if (!isRead) {
      markLocalAsRead(id);
      try {
        await markSingleAsRead(id);
      } catch (e) {
        console.error("Failed to mark message as read", e);
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg"
          title={t('shell.notifications.title')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 inline-flex h-2 w-2 rounded-full bg-rose-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-lg p-0">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">{t('shell.notifications.title')}</h4>
              <p className="text-xs text-muted-foreground">{t('shell.notifications.subtitle')}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate("/dashboard/messages")}
            >
              {t('shell.notifications.viewAll')}
            </Button>
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {t('shell.notifications.unread', { count: unreadCount })}
            </Badge>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {recentMessages.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-center p-4">
              <p className="text-xs text-muted-foreground">{t('shell.notifications.empty')}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {recentMessages.map((item) => (
                <div key={item.id}>
                  <div
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50",
                      item.readAt && "opacity-60"
                    )}
                    onClick={() => handleToggleRead(item.id, !!item.readAt)}
                  >
                    <div className={cn(
                      "mt-1.5 flex h-2 w-2 flex-shrink-0 rounded-full",
                      item.readAt ? "bg-muted-foreground/30" : "bg-primary"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-xs font-semibold truncate",
                            !item.readAt && getToneColorByStatus(item.status)
                          )}
                        >
                          {renderMessage(item).title}
                        </span>
                        <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                          {formatRelative(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {renderMessage(item).summary}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function getToneColorByStatus(status?: string) {

  switch (status) {

    case "SUCCESS":

      return "text-success";

    case "FAILED":

      return "text-destructive";

    case "RUNNING":

      return "text-blue-500 animate-pulse";

    default:

      return "text-foreground";

  }

}
