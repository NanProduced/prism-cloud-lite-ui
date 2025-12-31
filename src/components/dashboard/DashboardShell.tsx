import React, { type ComponentType, type PropsWithChildren, useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
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
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { PrismIcon } from "@/components/shared/logo";
import { getAvatarById } from "@/lib/avatars";
import { useAuthStore } from "@/store/authStore";
import { useMessageStore } from "@/store/messageStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTimeFormatter } from "@/hooks/use-time-formatter";
import { logout } from "@/services/authApi";
import { getMediaUsage } from "@/services/mediaApi";
import { markSingleAsRead } from "@/services/messageApi";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/store/notificationStore";
import { renderMessage } from "@/lib/message-renderer";

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

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BreadcrumbNav } from "@/components/dashboard/BreadcrumbNav";
import { CommandSearch } from "@/components/ui/command-search";
import { AIChatBubble, AIChatWindow } from "@/features/ai-assistant";

const BillingPlanSelector = lazy(() => import("@/components/billing/BillingPlanSelector").then(m => ({ default: m.BillingPlanSelector })));

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/overview" },
      { label: "Devices", icon: Monitor, href: "/dashboard/devices" },
    ],
  },
  {
    items: [
      { label: "Media Library", icon: Image, href: "/dashboard/media" },
      {
        label: "Programs",
        icon: Layers,
        href: "/dashboard/programs",
        children: [
          { label: "All Programs", href: "/dashboard/programs" },
          { label: "Templates", href: "/dashboard/programs?tab=templates" },
        ],
      },
      { label: "Schedule", icon: CalendarClock, href: "/dashboard/schedule" },
    ],
  },
  {
    items: [
      { label: "Map", icon: MapIcon, href: "/dashboard/map" },
      { label: "Monitoring", icon: Activity, href: "/dashboard/monitoring" },
      { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    ],
  },
  {
    items: [
      {
        label: "Messages",
        icon: MessageSquare,
        href: "/dashboard/messages",
        children: [
          { label: "Inbox", href: "/dashboard/messages" },
          { label: "Notifications", href: "/dashboard/messages?tab=notifications" },
          { label: "Tasks", href: "/dashboard/messages?tab=tasks" },
        ],
      },
      {
        label: "Logs",
        icon: FileText,
        href: "/dashboard/logs",
        children: [
          { label: "Device Logs", href: "/dashboard/logs" },
          { label: "Command Logs", href: "/dashboard/logs?tab=terminal" },
        ],
      },
      { label: "Settings", icon: Settings, href: "/dashboard/settings" },
    ],
  },
];

const notifications = [
  { id: 1, title: "Program Published", desc: "Summer Sale pushed to 12 devices", time: "2m ago", tone: "success" },
  { id: 2, title: "Device Offline", desc: "Lobby Screen A connection lost", time: "15m ago", tone: "error" },
  { id: 3, title: "Storage Warning", desc: "Used 85% of 2GB quota", time: "1h ago", tone: "warning" },
];

export function DashboardShell({ children }: PropsWithChildren) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isBillingOpen, setBillingOpen } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  const { data: usageData } = useQuery({
    queryKey: ['media', 'usage'],
    queryFn: getMediaUsage,
    enabled: !!user,
  });

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
    // 触发后端登出流程 (OIDC RP-Initiated Logout)
    // 注意：不要在此处调用 clearAuth()，否则会触发 ProtectedLayout 的即时重定向，
    // 干扰 window.location.assign('/logout') 的整页跳转流程。
    // 状态清理将在重定向回来的 LoginPage 中完成。
    logout();
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r bg-sidebar">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-auto flex-col items-start gap-3 rounded-lg border bg-sidebar-accent/50 px-4 py-4 text-left hover:bg-sidebar-accent transition-colors cursor-pointer"
                tooltip="Workspace"
                onClick={() => {
                  // TODO: Support custom workspace configuration in the future
                  console.log("Workspace settings clicked");
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  <PrismIcon size={28} variant="gradient" className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-base font-bold">Prism Cloud</span>
                      <Badge className="text-sm font-bold px-1.5 py-0.5 bg-primary text-white">Lite</Badge>
                    </div>
                    <p className="text-[10px] tracking-[0.2em] text-muted-foreground mt-1">Workspace</p>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {/* Navigation Groups with Separators */}
              {NAV_GROUPS.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Separator between groups (skip first group) */}
                  {groupIndex > 0 && <div className="my-2 border-t border-sidebar-border" />}

                  <SidebarGroup className="py-2">
                    <SidebarMenu>
                      {group.items.map((item) => (
                        <div key={item.href}>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              isActive={isNavActive(item.href)}
                              tooltip={item.label}
                              className="rounded-lg text-sm"
                              onClick={(e) => {
                                if (item.children && item.children.length > 0) {
                                  e.preventDefault();
                                  toggleExpanded(item.label);
                                } else {
                                  navigate(item.href);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.badge && (
                                  <SidebarMenuBadge>
                                    {item.badge}
                                  </SidebarMenuBadge>
                                )}
                                {item.children && item.children.length > 0 && (
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 transition-transform",
                                      expandedItems.has(item.label) && "rotate-180"
                                    )}
                                  />
                                )}
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>

                          {/* Collapsible Children */}
                          {item.children && item.children.length > 0 && expandedItems.has(item.label) && (
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    isActive={isNavActive(child.href)}
                                    onClick={() => navigate(child.href)}
                                  >
                                    {child.label}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </div>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <StoragePanel 
            tier={user?.subscriptionTier} 
            navigate={navigate} 
            usage={usageData?.data ?? undefined}
            onUpgrade={() => setBillingOpen(true)}
          />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="border-b bg-card px-4 py-3 shadow-sm sm:px-6">
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
                  <Button variant="outline" className="flex items-center gap-3 rounded-lg px-2 h-9">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={selectedAvatar?.url} alt="User avatar" />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                        {user?.displayName?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'PC'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col text-left text-sm font-semibold leading-tight sm:flex">
                      <span className="truncate max-w-[120px]">{user?.displayName || 'Prism Admin'}</span>
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
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings?tab=billing")}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.open("https://docs.prismcloud.dev", "_blank")}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Documentation</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-600" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] bg-gray-50/50 px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </SidebarInset>

      <AIChatWindow isOpen={isChatOpen} />
      <AIChatBubble isOpen={isChatOpen} onClick={() => setIsChatOpen(!isChatOpen)} />
      <Suspense fallback={null}>
        <BillingPlanSelector open={isBillingOpen} onOpenChange={setBillingOpen} />
      </Suspense>
    </SidebarProvider>
  );
}

function StoragePanel({ 
  tier = "Lite", 
  navigate, 
  onUpgrade,
  usage
}: { 
  tier?: string; 
  navigate: (path: string) => void; 
  onUpgrade: () => void;
  usage?: { usedBytes: number; quotaBytes: number }
}) {
  const usedSpaceGB = (usage?.usedBytes || 0) / (1024 * 1024 * 1024);
  const totalSpaceGB = (usage?.quotaBytes || 2 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024);
  
  const percentage = Math.min(100, (usedSpaceGB / totalSpaceGB) * 100);
  const isWarning = percentage > 85;

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      {/* Title + Subscription Level */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Cloud Storage</h4>
        <Badge variant="outline" className="text-[10px] uppercase h-5">{tier || "Lite"}</Badge>
      </div>

      {/* Progress Bar */}
      <Progress value={percentage} className="h-1.5 mb-2" />

      {/* Data Display */}
      <p
        className={cn(
          "text-[11px] mb-3",
          isWarning ? "text-amber-600 font-bold" : "text-muted-foreground font-medium"
        )}
      >
        {usedSpaceGB.toFixed(2)}GB / {totalSpaceGB.toFixed(0)}GB used
      </p>

      {/* Upgrade Button */}
      {tier !== "Pro" && (
        <Button 
          className="w-full h-8 text-[11px] font-bold rounded-lg shadow-sm"
          onClick={onUpgrade}
        >
          Upgrade Plan
        </Button>
      )}
    </div>
  );
}

function NotificationPopover() {
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
          title="Notifications"
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
              <h4 className="text-sm font-semibold">Notifications</h4>
              <p className="text-xs text-muted-foreground">Latest system events</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate("/dashboard/messages")}
            >
              View all
            </Button>
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {recentMessages.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-center p-4">
              <p className="text-xs text-muted-foreground">No notifications yet</p>
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
      return "text-emerald-600";
    case "FAILED":
      return "text-rose-600";
    case "RUNNING":
      return "text-blue-600 animate-pulse";
    default:
      return "text-foreground";
  }
}

