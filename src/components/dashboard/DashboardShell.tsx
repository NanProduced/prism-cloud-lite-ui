import { type ComponentType, type PropsWithChildren, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  ChevronDown,
  FileText,
  Image,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Monitor,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
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
          { label: "All Messages", href: "/dashboard/messages" },
          { label: "Alerts", href: "/dashboard/messages?tab=alerts" },
          { label: "Tasks", href: "/dashboard/messages?tab=tasks" },
        ],
      },
      {
        label: "Logs",
        icon: FileText,
        href: "/dashboard/logs",
        children: [
          { label: "Operation Logs", href: "/dashboard/logs" },
          { label: "Device Logs", href: "/dashboard/logs?tab=device" },
          { label: "Terminal Logs", href: "/dashboard/logs?tab=terminal" },
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

  const toggleExpanded = (label: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(label)) {
      newSet.delete(label);
    } else {
      newSet.add(label);
    }
    setExpandedItems(newSet);
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
                  // 占位：后续支持自定义 workspace
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
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Workspace</p>
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
                            <NavLink to={item.href}>
                              {({ isActive }) => (
                                <SidebarMenuButton
                                  asChild
                                  isActive={isActive}
                                  tooltip={item.label}
                                  className="rounded-lg text-sm"
                                >
                                  <div
                                    className="flex w-full items-center justify-between"
                                    onClick={(e) => {
                                      if (item.children && item.children.length > 0) {
                                        e.preventDefault();
                                        toggleExpanded(item.label);
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
                                  </div>
                                </SidebarMenuButton>
                              )}
                            </NavLink>
                          </SidebarMenuItem>

                          {/* Collapsible Children */}
                          {item.children && item.children.length > 0 && expandedItems.has(item.label) && (
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <NavLink to={child.href}>
                                    {({ isActive }) => (
                                      <SidebarMenuSubButton isActive={isActive}>
                                        {child.label}
                                      </SidebarMenuSubButton>
                                    )}
                                  </NavLink>
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
          <StoragePanel />
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
                      <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
                      <AvatarFallback>PC</AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col text-left text-sm font-semibold leading-tight sm:flex">
                      Prism Admin
                      <span className="text-xs font-normal text-muted-foreground">admin@prismcloud.dev</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] bg-gray-50/50 p-4 sm:p-6">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function StoragePanel() {
  // Mock 数据 - 未来可从 API 获取
  const usedSpace = 1.2; // GB
  const totalSpace = 2;  // GB
  const percentage = (usedSpace / totalSpace) * 100;
  const isWarning = percentage > 85;

  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      {/* 标题 + 订阅等级 */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">存储空间</h4>
        <Badge variant="outline" className="text-xs">Lite</Badge>
      </div>

      {/* 进度条 */}
      <Progress value={percentage} className="h-2 mb-2" />

      {/* 数据显示 */}
      <p
        className={cn(
          "text-xs mb-3",
          isWarning ? "text-amber-600 font-medium" : "text-muted-foreground"
        )}
      >
        {usedSpace.toFixed(1)}GB / {totalSpace}GB 已用 ({percentage.toFixed(0)}%)
      </p>

      {/* 升级按钮 */}
      <Button className="w-full h-9 text-xs rounded-lg">
        升级获得更多空间
      </Button>
    </div>
  );
}

function NotificationPopover() {
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const unreadCount = notifications.length - readIds.size;
  const hasUnread = unreadCount > 0;

  const toggleRead = (id: number) => {
    const newSet = new Set(readIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setReadIds(newSet);
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
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
          {hasUnread && (
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
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="mt-2 text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-center">
              <p className="text-xs text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((item) => (
                <div key={item.id}>
                  <div
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50",
                      readIds.has(item.id) && "opacity-60"
                    )}
                    onClick={() => toggleRead(item.id)}
                  >
                    <div className="mt-1 flex h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            getToneColor(item.tone)
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {item.desc}
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

function getToneColor(tone: string) {
  switch (tone) {
    case "success":
      return "text-emerald-300";
    case "error":
      return "text-rose-300";
    case "warning":
      return "text-amber-300";
    default:
      return "text-slate-200";
  }
}

