import React, { type ComponentType, type PropsWithChildren, useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  ShieldCheck
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

export function DashboardShell({ children }: PropsWithChildren) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isBillingOpen, setBillingOpen } = useSettingsStore();
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
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r bg-sidebar">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-auto flex-col items-start gap-3 rounded-lg border bg-sidebar-accent/50 px-4 py-4 text-left hover:bg-sidebar-accent transition-colors cursor-pointer"
                tooltip="Workspace"
              >
                <div className="flex items-center gap-3 w-full">
                  <PrismIcon size={28} variant="gradient" className="flex-shrink-0" />
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
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {NAV_GROUPS.map((group, groupIndex) => (
                <div key={groupIndex}>
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
            tier={currentTierLabel} 
            navigate={navigate} 
            usage={storageQuota ?? undefined}
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
                  <Button variant="outline" className={cn(
                    "flex items-center gap-3 rounded-lg px-2 h-9 transition-all duration-500",
                    currentTierRaw === 'PRO' && "border-amber-200 bg-amber-50/30 hover:bg-amber-50/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
                    currentTierRaw === 'ULTRA' && "border-violet-200 bg-violet-50/30 hover:bg-violet-50/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
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
  const isUnlimited = usage?.quotaBytes === -1;
  const usedSpaceGB = (usage?.usedBytes || 0) / (1024 * 1024 * 1024);
  const totalSpaceGB = (isUnlimited ? 0 : (usage?.quotaBytes || 2 * 1024 * 1024 * 1024)) / (1024 * 1024 * 1024);
  
  const percentage = isUnlimited ? 0 : Math.min(100, (usedSpaceGB / totalSpaceGB) * 100);
  const isWarning = !isUnlimited && percentage > 85;

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground/80">Cloud Storage</h4>
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
        {isUnlimited && <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">Unlimited</span>}
      </div>

      {tier === "Free" && (
        <Button 
          className="w-full h-8 text-[11px] font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
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