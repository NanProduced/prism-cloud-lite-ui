import { useEffect, useState, useMemo, type ComponentType } from "react";
import { useQuery } from '@tanstack/react-query';
import { getDevices } from '@/services/deviceApi';
import { useAuthStore } from '@/store/authStore';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Activity,
  AlertCircle,
  HardDrive,
  Layers,
  MonitorPlay,
  MoreVertical,
  PlayCircle,
  Upload,
  Wifi,
  Zap,
  History,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const storageData = [
  { name: "Media", value: 1.2, color: "#6366f1" },
  { name: "Programs", value: 0.15, color: "#ec4899" },
  { name: "Snapshots", value: 0.05, color: "#eab308" },
  { name: "Free", value: 0.6, color: "#e2e8f0" },
];

const onlineTrendData = [
  { time: "Mon", online: 14, offline: 2 },
  { time: "Tue", online: 15, offline: 1 },
  { time: "Wed", online: 16, offline: 0 },
  { time: "Thu", online: 15, offline: 1 },
  { time: "Fri", online: 12, offline: 4 },
  { time: "Sat", online: 14, offline: 2 },
  { time: "Sun", online: 15, offline: 1 },
];

const playbackData = [
  { name: "Summer Sale", value: 45 },
  { name: "Lobby Loop", value: 30 },
  { name: "Menu Board", value: 15 },
  { name: "Emergency", value: 10 },
];

const pendingTasks = [
  { id: 1, title: "Transcoding 'Promo_4K.mp4'", progress: 45, type: "task" as const },
  { id: 2, title: "Publishing to 'Store Group A'", progress: 80, type: "task" as const },
  { id: 3, title: "Device 'Screen 04' went offline", time: "2m ago", type: "alert" as const },
];

const recentAlerts = [
  { id: 1, device: "Lobby Screen", type: "Offline", time: "10m ago", severity: "high" },
  { id: 2, device: "Hallway B", type: "Temp High", time: "2h ago", severity: "medium" },
  { id: 3, device: "Store Front", type: "Sync Failed", time: "1d ago", severity: "low" },
];

const offlineDevices = [
  { id: 1, name: "West Entrance", lastSeen: "2h ago" },
  { id: 2, name: "Cafeteria Menu", lastSeen: "15m ago" },
  { id: 3, name: "Meeting Room 1", lastSeen: "5m ago" },
];

const publishedPrograms = [
  { name: "Summer Campaign", version: "v1.2", devices: 12, status: "live" },
  { name: "Daily Notices", version: "v2.0", devices: 4, status: "draft_changes" },
  { name: "Emergency Override", version: "v1.0", devices: 0, status: "inactive" },
];

export function DashboardOverview() {
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: bffResponse } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const devices = useMemo(() => bffResponse?.data || [], [bffResponse]);
  const onlineCount = useMemo(() => devices.filter(d => d.onlineStatus === 1).length, [devices]);
  const totalCount = devices.length;
  const onlinePercentage = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1 min-w-[280px] border-l-4 border-l-indigo-500">
          <CardContent className="p-6 flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-indigo-100">
              <AvatarImage src={user?.avatarId ? `/api/v1/assets/${user.avatarId}` : undefined} />
              <AvatarFallback>{user?.displayName?.slice(0, 2).toUpperCase() || '??'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user?.displayName || 'Prism User'}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  Pro Plan
                </Badge>
                <span className="truncate max-w-[150px]">{user?.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex-[2] grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Online Devices"
            value={String(onlineCount)}
            total={`/ ${totalCount}`}
            percentage={onlinePercentage}
            color="bg-emerald-500"
            icon={Wifi}
            onClick={() => navigate("/dashboard/devices")}
          />
          <MetricCard
            title="Published Versions"
            value="8"
            total="/ 10"
            percentage={80}
            color="bg-blue-500"
            icon={Layers}
            onClick={() => navigate("/dashboard/programs")}
          />
          <MetricCard
            title="Storage Used"
            value="1.4"
            total="GB / 2 GB"
            percentage={70}
            color="bg-amber-500"
            icon={HardDrive}
            onClick={() => navigate("/dashboard/media")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-l-4 border-l-amber-300">
          <CardHeader className="py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Pending Tasks & Alerts</CardTitle>
              <Badge variant="secondary" className="ml-2 text-xs">
                3
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/dashboard/monitoring")}>
              View Center
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-xl border border-muted/40 p-3">
                {task.type === "task" ? (
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                )}
                <span className="flex-1 text-sm font-medium">{task.title}</span>
                {task.type === "task" ? (
                  <div className="w-28 flex items-center gap-2">
                    <Progress value={task.progress} className="h-1.5" />
                    <span className="text-xs text-muted-foreground">{task.progress}%</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">{task.time}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Accelerate routine workflows</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <QuickAction
              icon={Upload}
              label="Upload Media"
              helper="Add new creatives"
              onClick={() => navigate("/dashboard/media")}
            />
            <QuickAction
              icon={PlayCircle}
              label="Create Program"
              helper="Design playlists"
              onClick={() => navigate("/dashboard/programs")}
            />
            <QuickAction
              icon={MonitorPlay}
              label="Add Device"
              helper="Provision new screens"
              onClick={() => navigate("/dashboard/devices")}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Device Uptime</CardTitle>
            <CardDescription>Weekly online/offline trend</CardDescription>
          </CardHeader>
          <CardContent className="w-full">
            {isMounted && (
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={onlineTrendData}>
                    <RechartsTooltip cursor={{ stroke: "#94a3b8", strokeDasharray: 4 }} />
                    <Area type="monotone" dataKey="online" stroke="#34d399" fill="#d1fae5" strokeWidth={2} />
                    <Area type="monotone" dataKey="offline" stroke="#f87171" fill="#fee2e2" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Storage Breakdown</CardTitle>
            <CardDescription>Usage across resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full h-48">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={storageData} dataKey="value" innerRadius={50} outerRadius={70}>
                      {storageData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-2">
              {storageData.map((segment) => (
                <div key={segment.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
                    {segment.name}
                  </div>
                  <span className="font-semibold">{segment.value} GB</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Playback Programs</CardTitle>
            <CardDescription>By current schedule hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {playbackData.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.value}% of playtime</div>
                </div>
                <Progress value={item.value} className="h-1.5 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Storage Activity</CardTitle>
            <CardDescription>Recent jobs & automations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StorageActivity
              icon={Upload}
              title="Upload"
              helper="Promo_4K.mp4"
              meta="2.3 GB"
              pill="Media"
            />
            <StorageActivity
              icon={Zap}
              title="Transcode"
              helper="Lobby_loop.mov"
              meta="Running"
              pill="Automation"
            />
            <StorageActivity icon={HardDrive} title="Snapshot" helper="Menu_preview.png" meta="Completed" pill="Backup" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
        <Card className="2xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Published Programs</CardTitle>
            <CardDescription>Version allocation across devices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {publishedPrograms.map((program) => (
              <div key={program.name} className="flex items-center gap-4 rounded-xl border border-muted/60 p-4">
                <div className="flex-1">
                  <div className="font-semibold">{program.name}</div>
                  <p className="text-sm text-muted-foreground">{program.devices} devices</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {program.version}
                </Badge>
                <span className="text-sm text-muted-foreground capitalize">{program.status.replace("_", " ")}</span>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Alerts</CardTitle>
            <CardDescription>Most recent issues by severity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{alert.device}</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {alert.severity}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{alert.type}</span>
                  <span>{alert.time}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Offline Devices</CardTitle>
            <CardDescription>Last seen timestamps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {offlineDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between rounded-xl border border-muted/50 p-3">
                <div>
                  <div className="font-medium">{device.name}</div>
                  <p className="text-xs text-muted-foreground">Last seen {device.lastSeen}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  Ping
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity Log</CardTitle>
            <CardDescription>Latest automations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActivityLogItem icon={History} label="Policy Updated" meta="Admin • 2m ago" />
            <ActivityLogItem icon={FileText} label="Program Published" meta="Storefront Loop" />
            <ActivityLogItem icon={ExternalLink} label="Device Linked" meta="Lobby Screen C" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  total: string;
  percentage: number;
  color: string;
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
}

function MetricCard({ title, value, total, percentage, color, icon: Icon, onClick }: MetricCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{title}</span>
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={onClick}>
            <Icon className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-2xl font-semibold">
          {value} <span className="text-base text-muted-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", color)} />
          <span className="text-xs text-muted-foreground">{percentage}% target</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  helper: string;
  onClick: () => void;
}

function QuickAction({ icon: Icon, label, helper, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-muted/70 px-3 py-2 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50"
    >
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-indigo-500" />
          {label}
        </div>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
      <span className="text-xs font-medium text-indigo-500">Go</span>
    </button>
  );
}

interface StorageActivityProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  helper: string;
  meta: string;
  pill: string;
}

function StorageActivity({ icon: Icon, title, helper, meta, pill }: StorageActivityProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-muted/50 p-3">
      <div className="rounded-xl bg-muted p-2">
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </div>
      <Badge variant="outline" className="text-xs">
        {pill}
      </Badge>
      <span className="text-xs text-muted-foreground">{meta}</span>
    </div>
  );
}

interface ActivityLogItemProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  meta: string;
}

function ActivityLogItem({ icon: Icon, label, meta }: ActivityLogItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-muted/40 p-3">
      <div className="rounded-xl bg-muted p-2">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}
