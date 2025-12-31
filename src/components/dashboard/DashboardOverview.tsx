import { useEffect, useState, useMemo, type ComponentType } from "react";
import { useQuery } from '@tanstack/react-query';
import { getDevices } from '@/services/deviceApi';
import { getMediaUsage } from '@/services/mediaApi';
import { getUserQuotaOverview, getUserSubscription } from "@/services/userApi";
import { useAuthStore } from '@/store/authStore';
import { useMessageStore } from '@/store/messageStore';
import { getAvatarById } from "@/lib/avatars";
import { useTimeFormatter } from "@/hooks/use-time-formatter";
import { formatBytes, cn } from "@/lib/utils";
import { type Device, resolveDeviceStatus } from '@/types/device';
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

import { getActiveDeviceCountBuckets, getPlaybackOverview } from '@/services/telemetryApi';

const storageDataMock = [
  { name: "Media", value: 1.2, color: "#6366f1" },
  { name: "Programs", value: 0.15, color: "#ec4899" },
  { name: "Snapshots", value: 0.05, color: "#eab308" },
  { name: "Free", value: 0.6, color: "#e2e8f0" },
];

const publishedProgramsMock = [
  { name: "Summer Campaign", version: "v1.2", devices: 12, status: "live" },
  { name: "Daily Notices", version: "v2.0", devices: 4, status: "draft_changes" },
  { name: "Emergency Override", version: "v1.0", devices: 0, status: "inactive" },
];

export function DashboardOverview() {
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { formatRelative } = useTimeFormatter();
  const { recentMessages } = useMessageStore();

  const { data: bffResponse } = useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevices(),
  });

  const { data: usageRes } = useQuery({
    queryKey: ['media', 'usage'],
    queryFn: getMediaUsage,
  });

  const { data: quotaRes } = useQuery({
    queryKey: ['user', 'quota', 'overview'],
    queryFn: getUserQuotaOverview,
  });

  const { data: subscriptionRes } = useQuery({
    queryKey: ['user', 'subscription'],
    queryFn: getUserSubscription,
  });

  const { data: trendRes } = useQuery({
    queryKey: ['telemetry', 'active-device-count'],
    queryFn: () => getActiveDeviceCountBuckets({
      from: new Date(Date.now() - 7 * 86400000).toISOString(),
      to: new Date().toISOString(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      bucket: 'DAY'
    }),
  });

  const { data: playbackRes } = useQuery({
    queryKey: ['telemetry', 'playback-overview'],
    queryFn: () => getPlaybackOverview({
      from: new Date(Date.now() - 30 * 86400000).toISOString(),
      to: new Date().toISOString(),
      top: 5
    }),
  });

  const devices = useMemo(() => bffResponse?.data || [], [bffResponse]);
  const onlineCount = useMemo(() => devices.filter(d => resolveDeviceStatus(d) === 'online').length, [devices]);
  const totalCount = devices.length;
  const onlinePercentage = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;

  const usage = usageRes?.data;
  const storageUsedLabel = usage ? formatBytes(usage.usedBytes) : '0 Bytes';
  const storageQuotaLabel = usage ? (usage.quotaBytes === -1 ? '∞' : formatBytes(usage.quotaBytes)) : '2 GB';
  const storagePercentage = usage ? (usage.quotaBytes === -1 ? 0 : Math.round((usage.usedBytes / usage.quotaBytes) * 100)) : 0;

  const programsQuota = useMemo(() => {
    const metric = quotaRes?.data?.metrics?.find(m => m.resource === 'programs');
    return {
      used: metric?.used || 0,
      limit: metric?.limit || 20,
      percent: metric?.percent || 0
    };
  }, [quotaRes]);

  const onlineTrendData = useMemo(() => {
    if (!Array.isArray(trendRes?.data)) return [];
    return trendRes.data.map((item: any) => ({
      time: item?.bucket ? String(item.bucket).slice(5, 10) : 'N/A', // MM-DD
      online: item?.activeCount || 0,
      offline: Math.max(0, totalCount - (item?.activeCount || 0))
    }));
  }, [trendRes, totalCount]);

  const playbackData = useMemo(() => {
    if (!Array.isArray(playbackRes?.data?.topPrograms)) return [];
    const total = playbackRes.data.totalSeconds || 1;
    return playbackRes.data.topPrograms.map(p => ({
      name: p.name,
      value: Math.round(((p.playSeconds || 0) / total) * 100)
    }));
  }, [playbackRes]);

  const selectedAvatar = useMemo(() => 
    getAvatarById(user?.avatarId || 'm-1'), 
    [user?.avatarId]
  );

  const currentTierRaw = (subscriptionRes?.data?.tier || user?.subscriptionTier || "FREE").toUpperCase();
  const tierMap: Record<string, string> = {
    'FREE': 'Free',
    'PRO': 'Pro',
    'ULTRA': 'Ultra'
  };
  const currentTierLabel = tierMap[currentTierRaw] || currentTierRaw;

  const pendingTasksList = useMemo(() => {
    const tasks = recentMessages.filter(m => m.kind === 'TASK' && m.status === 'RUNNING').slice(0, 2);
    const alerts = recentMessages.filter(m => m.kind === 'NOTIFICATION' && !m.readAt).slice(0, 1);
    
    return [
      ...tasks.map(t => ({ id: t.id, title: t.title, progress: 50, type: 'task' as const })),
      ...alerts.map(a => ({ id: a.id, title: a.title, time: formatRelative(a.createdAt), type: 'alert' as const }))
    ];
  }, [recentMessages, formatRelative]);

  const recentAlertsList = useMemo(() => 
    recentMessages.filter(m => m.kind === 'NOTIFICATION').slice(0, 3).map(m => ({
      id: m.id,
      device: m.title,
      type: "Alert",
      time: formatRelative(m.createdAt),
      severity: m.status === 'FAILED' ? 'high' : 'medium'
    })),
    [recentMessages, formatRelative]
  );

    const offlineDevicesList = useMemo(() =>
      devices.filter(d => resolveDeviceStatus(d) === 'offline').slice(0, 3).map(d => ({
        id: d.id,
        name: d.deviceName,
        lastSeen: formatRelative(d.lastReportTime)
      })),
      [devices, formatRelative]
    );
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
              <AvatarImage src={selectedAvatar?.url} />
              <AvatarFallback>{user?.displayName?.slice(0, 2).toUpperCase() || '??'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user?.displayName || 'Prism User'}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 capitalize">
                  {currentTierLabel} Plan
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
            title="Total Programs"
            value={String(programsQuota.used)}
            total={`/ ${programsQuota.limit === -1 ? '∞' : programsQuota.limit}`}
            percentage={programsQuota.percent}
            color="bg-blue-500"
            icon={Layers}
            onClick={() => navigate("/dashboard/programs")}
          />
          <MetricCard
            title="Storage Used"
            value={storageUsedLabel.split(' ')[0]}
            total={`${storageUsedLabel.split(' ')[1]} / ${storageQuotaLabel}`}
            percentage={storagePercentage}
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
                {pendingTasksList.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/dashboard/monitoring")}>
              View Center
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasksList.map((task) => (
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
            {pendingTasksList.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-foreground opacity-50">No pending tasks or alerts.</div>
            )}
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
                    <Pie data={storageDataMock} dataKey="value" innerRadius={50} outerRadius={70}>
                      {storageDataMock.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-2">
              {storageDataMock.map((segment) => (
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
            {publishedProgramsMock.map((program) => (
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
            {recentAlertsList.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-muted/50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium truncate max-w-[180px]">{alert.device}</span>
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
            {recentAlertsList.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground opacity-50">No recent alerts.</div>
            )}
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
            {offlineDevicesList.map((device) => (
              <div key={device.id} className="flex items-center justify-between rounded-xl border border-muted/50 p-3">
                <div>
                  <div className="font-medium">{device.name}</div>
                  <p className="text-xs text-muted-foreground">Last seen {device.lastSeen}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate(`/dashboard/devices/${device.id}`)}>
                  Ping
                </Button>
              </div>
            ))}
            {offlineDevicesList.length === 0 && (
              <div className="py-10 text-center text-xs text-muted-foreground opacity-50">All devices are online.</div>
            )}
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
