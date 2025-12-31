import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Calendar, CalendarDays, Clock, Loader2, Plus, RefreshCw, Send, Trash2, Unlink2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

import {
  deleteSchedule,
  getScheduleBindings,
  getScheduleDetails,
  pushScheduleToDevices,
  unbindDeviceFromSchedule,
  updateSchedule,
} from '@/services/scheduleApi';
import {
  formatWeekdaySelection,
  formatTimeRange,
  formatDateRange,
  weekdayBooleanToIndices,
} from '@/lib/schedule/weekdayUtils';
import { COMMAND_TYPE_CONFIG, DEFAULT_COMMAND_TYPE_INFO } from '@/lib/schedule/commandConfig';
import type {
  ScheduleBindingDeviceResp,
  ScheduleCommandRuleResp,
  ScheduleContentsRuleResp,
  UpsertScheduleCommandRuleReq,
  UpsertScheduleContentsRuleReq,
} from '@/types/schedule';
import { parseScheduleCommandPayloadToUpsert } from './schedulePayload';
import { ScheduleBindDevicesDialog } from './ScheduleBindDevicesDialog';
import { ScheduleContentsRuleSheet } from './ScheduleContentsRuleSheet';
import { ScheduleCommandRuleSheet } from './ScheduleCommandRuleSheet';
import { ScheduleVisualizer } from '@/components/schedule/ScheduleVisualizer';
import { ScheduleOnboarding } from '@/components/schedule/ScheduleOnboarding';

function getBffDisplayError(res: { error?: { displayMessage?: string; message?: string } } | null | undefined): string {
  return res?.error?.displayMessage || res?.error?.message || 'Request failed';
}

interface RuleSummaryParts {
  time?: string;
  date?: string;
  weekday?: string;
}

function summarizeLimits(rule: ScheduleContentsRuleResp): RuleSummaryParts {
  const parts: RuleSummaryParts = {};

  // Time formatting
  if (rule.ifLimitTime && rule.limitTime) {
    const timeSlots = Array.isArray(rule.limitTime) ? rule.limitTime : [rule.limitTime];
    const formatted = timeSlots
      .map((slot: { start?: string; end?: string }) => formatTimeRange(slot.start, slot.end))
      .filter((s: string) => s !== '—');
    if (formatted.length > 0) {
      parts.time = formatted.length > 1 ? formatted.join(' | ') : formatted[0];
    }
  }

  // Date formatting
  if (rule.ifLimitDate && rule.limitDate) {
    const dateObj = rule.limitDate as { start?: string; end?: string };
    const formatted = formatDateRange(dateObj.start, dateObj.end);
    if (formatted !== '—') {
      parts.date = formatted;
    }
  }

  // Weekday formatting
  if (rule.ifLimitWeekday && rule.limitWeekday) {
    const indices = weekdayBooleanToIndices(rule.limitWeekday as boolean[]);
    if (indices.length > 0) {
      parts.weekday = formatWeekdaySelection(indices);
    }
  }

  return parts;
}

function renderConstraintBadges(parts: RuleSummaryParts): React.ReactNode {
  const badges: React.ReactNode[] = [];

  if (parts.time) {
    badges.push(
      <span key="time" className="inline-flex items-center gap-1 rounded-md bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
        <Clock className="h-3 w-3 opacity-60" /> {parts.time}
      </span>
    );
  }

  if (parts.weekday) {
    badges.push(
      <span key="weekday" className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        <Calendar className="h-3 w-3 opacity-60" /> {parts.weekday}
      </span>
    );
  }

  if (parts.date) {
    badges.push(
      <span key="date" className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        <CalendarDays className="h-3 w-3 opacity-60" /> {parts.date}
      </span>
    );
  }

  if (badges.length === 0) {
    return <span className="text-xs text-muted-foreground">No constraints (always active)</span>;
  }

  return <div className="flex flex-wrap items-center gap-1.5">{badges}</div>;
}


function formatCommandOpTimes(opTimes: string[] | undefined): string {
  if (!opTimes || opTimes.length === 0) return '—';
  return opTimes.map((t) => t.slice(0, 5)).join(', ');
}

function getCommandValueDescription(parsed: UpsertScheduleCommandRuleReq | null): string | null {
  if (!parsed) return null;
  const body = parsed.operation.body as Record<string, unknown>;
  switch (parsed.operation.type) {
    case 'BRIGHTNESS':
      return `${Math.round(((body.brightness as number) ?? 0) / 255 * 100)}%`;
    case 'VOLUME':
      return `${Math.round(((body.musicvolume as number) ?? 0) / 15 * 100)}%`;
    case 'POWER':
      return (body.command as string) || 'wakeup';
    case 'INPUT_MODE':
      return ((body.inputmode as string) || 'hdmi').toUpperCase();
    case 'COLOR_TEMP':
      return `${(body.colortemp as number) || 6500}K`;
    default:
      return null;
  }
}

function summarizeCommandLimits(parsed: UpsertScheduleCommandRuleReq | null): RuleSummaryParts {
  if (!parsed) return {};
  const parts: RuleSummaryParts = {};

  if (parsed.ifLimitDate && parsed.limitDate) {
    const dateObj = parsed.limitDate as { start?: string; end?: string };
    const formatted = formatDateRange(dateObj.start, dateObj.end);
    if (formatted !== '—') {
      parts.date = formatted;
    }
  }

  if (parsed.ifLimitWeekday && parsed.limitWeekday) {
    const indices = weekdayBooleanToIndices(parsed.limitWeekday as boolean[]);
    if (indices.length > 0) {
      parts.weekday = formatWeekdaySelection(indices);
    }
  }

  return parts;
}

function toUpsertContentsRule(rule: ScheduleContentsRuleResp): UpsertScheduleContentsRuleReq {
  return {
    id: rule.id,
    type: rule.type,
    priority: rule.priority,
    releaseProgramId: rule.releaseProgramId,
    ifLimitTime: Boolean(rule.ifLimitTime),
    limitTime: rule.ifLimitTime ? rule.limitTime : null,
    ifLimitDate: Boolean(rule.ifLimitDate),
    limitDate: rule.ifLimitDate ? rule.limitDate : null,
    ifLimitWeekday: Boolean(rule.ifLimitWeekday),
    limitWeekday: rule.ifLimitWeekday ? rule.limitWeekday : null,
  };
}

function parseCommandRules(
  rules: ScheduleCommandRuleResp[]
): { upserts: UpsertScheduleCommandRuleReq[]; unparseable: ScheduleCommandRuleResp[] } {
  const upserts: UpsertScheduleCommandRuleReq[] = [];
  const unparseable: ScheduleCommandRuleResp[] = [];
  for (const r of rules) {
    const parsed = parseScheduleCommandPayloadToUpsert(r.payload);
    if (!parsed) {
      unparseable.push(r);
      continue;
    }
    upserts.push({ ...parsed, id: r.id });
  }
  return { upserts, unparseable };
}

export default function ScheduleDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { scheduleId = '' } = useParams();

  const [activeTab, setActiveTab] = useState<'overview' | 'programs' | 'commands'>('overview');

  const [bindOpen, setBindOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [contentsDialogOpen, setContentsDialogOpen] = useState(false);
  const [editingContentsRule, setEditingContentsRule] = useState<ScheduleContentsRuleResp | null>(null);

  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [editingCommandRule, setEditingCommandRule] = useState<UpsertScheduleCommandRuleReq | null>(null);

  const scheduleQuery = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => getScheduleDetails(scheduleId),
    enabled: Boolean(scheduleId),
  });

  const bindingsQuery = useQuery({
    queryKey: ['schedule-bindings', scheduleId],
    queryFn: () => getScheduleBindings(scheduleId),
    enabled: Boolean(scheduleId),
  });

  const schedule = scheduleQuery.data?.data;
  const bindings = bindingsQuery.data?.data || [];

  const contentsUpserts = useMemo(() => (schedule?.contentsRules || []).map(toUpsertContentsRule), [schedule?.contentsRules]);
  const contentsPriorities = useMemo(() => contentsUpserts.map((r) => r.priority), [contentsUpserts]);

  const { upserts: commandUpserts, unparseable: unparseableCommandRules } = useMemo(
    () => parseCommandRules(schedule?.commandRules || []),
    [schedule?.commandRules]
  );

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateSchedule(scheduleId, data),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule updated');
    },
    onError: () => toast.error('Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSchedule(scheduleId),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted');
      navigate('/dashboard/schedule');
    },
    onError: () => toast.error('Delete failed'),
  });

  const unbindMutation = useMutation({
    mutationFn: (deviceId: number) => unbindDeviceFromSchedule(scheduleId, deviceId),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedule-bindings', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Device unbound');
    },
    onError: () => toast.error('Unbind failed'),
  });

  const pushMutation = useMutation({
    mutationFn: () => pushScheduleToDevices(scheduleId, null),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res));
        return;
      }
      toast.success('Push queued', { description: `Accepted: ${res.data?.accepted ?? 0}/${res.data?.totalTargets ?? 0}` });
      setPushOpen(true);
    },
    onError: () => toast.error('Push failed'),
  });

  const [metaName, setMetaName] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaEnabled, setMetaEnabled] = useState(true);

  const pushResult = pushMutation.data?.data;

  function openMetaDialog() {
    if (!schedule) return;
    setMetaName(schedule.name || '');
    setMetaDescription(schedule.description || '');
    setMetaEnabled(Boolean(schedule.enabled));
    setMetaOpen(true);
  }

  function saveMeta() {
    updateMutation.mutate({
      name: metaName.trim() || 'Untitled Schedule',
      description: metaDescription.trim() || null,
      enabled: metaEnabled,
    });
    setMetaOpen(false);
  }

  function saveContentsRule(req: UpsertScheduleContentsRuleReq) {
    const next = [...contentsUpserts];
    if (req.id) {
      const idx = next.findIndex((r) => r.id === req.id);
      if (idx >= 0) next[idx] = req;
      else next.push(req);
    } else {
      next.push(req);
    }
    updateMutation.mutate({ contentsRules: next });
    setContentsDialogOpen(false);
    setEditingContentsRule(null);
  }

  function deleteContentsRule(ruleId: number) {
    const next = contentsUpserts.filter((r) => r.id !== ruleId);
    updateMutation.mutate({ contentsRules: next });
  }

  function saveCommandRule(req: UpsertScheduleCommandRuleReq) {
    if (unparseableCommandRules.length > 0) {
      toast.error('This schedule contains unparseable command rules; editing is disabled to avoid data loss.');
      return;
    }
    const next = [...commandUpserts];
    if (req.id) {
      const idx = next.findIndex((r) => r.id === req.id);
      if (idx >= 0) next[idx] = req;
      else next.push(req);
    } else {
      next.push(req);
    }
    updateMutation.mutate({ commandRules: next });
    setCommandDialogOpen(false);
    setEditingCommandRule(null);
  }

  function deleteCommandRule(ruleId: number) {
    if (unparseableCommandRules.length > 0) return;
    const next = commandUpserts.filter((r) => r.id !== ruleId);
    updateMutation.mutate({ commandRules: next });
  }

  const isLoading = scheduleQuery.isLoading;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" className="gap-2" onClick={() => navigate('/dashboard/schedule')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openMetaDialog}
                className="text-xl font-bold tracking-tight truncate hover:text-primary transition-colors cursor-pointer"
                title="Click to edit"
              >
                {schedule?.name || 'Schedule'}
              </button>
              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                P:{schedule?.contentsRules?.length ?? 0}
              </span>
              <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                C:{schedule?.commandRules?.length ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Updated {schedule?.updatedAt ? new Date(schedule.updatedAt).toLocaleString() : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2 pr-2 border-r">
            <Switch checked={Boolean(schedule?.enabled)} onCheckedChange={(next) => updateMutation.mutate({ enabled: next })} disabled={!schedule} />
            <span className="text-sm font-medium">{schedule?.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => scheduleQuery.refetch()} title="Refresh">
            <RefreshCw className={cn('h-4 w-4', scheduleQuery.isFetching ? 'animate-spin' : '')} />
          </Button>
          <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmOpen(true)} disabled={!schedule} title="Delete schedule">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => pushMutation.mutate()}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                disabled={!schedule || pushMutation.isPending || (schedule?.boundDeviceIds?.length ?? 0) === 0}
              >
                {pushMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Push
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-semibold">Notify devices to fetch updates</p>
              <p className="text-xs text-muted-foreground mt-1">
                Push sends a command to all bound devices to download the latest schedule configuration.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">

          {/* Visualizer or Onboarding */}
          {(schedule?.contentsRules?.length || 0) === 0 && (schedule?.commandRules?.length || 0) === 0 ? (
            <ScheduleOnboarding variant="empty-schedule" />
          ) : (
            <ScheduleVisualizer rules={schedule?.contentsRules || []} commandRules={schedule?.commandRules || []} />
          )}

          <Card className="border-0 ring-1 ring-foreground/5 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">Bindings</CardTitle>
                <CardDescription className="text-xs">A device can bind to at most one schedule.</CardDescription>
              </div>
              <Button onClick={() => setBindOpen(true)} disabled={!schedule} className="gap-2">
                <Plus className="h-4 w-4" /> Bind Devices
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 py-14 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading...
                </div>
              ) : bindings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm font-semibold">No devices bound</p>
                  <p className="text-xs mt-1">Bind devices to make this schedule take effect.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {bindings.map((b: ScheduleBindingDeviceResp) => (
                    <div key={b.deviceId} className="flex items-center justify-between px-6 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{b.deviceName || `Device ${b.deviceId}`}</p>
                        <p className="text-xs text-muted-foreground">
                          #{b.deviceId} · bound {new Date(b.boundAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate(`/dashboard/devices/${b.deviceId}`, { state: { returnTo: location.pathname } })}>
                          Open device
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-destructive hover:text-destructive gap-2"
                          onClick={() => unbindMutation.mutate(b.deviceId)}
                        >
                          <Unlink2 className="h-4 w-4" /> Unbind
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card className="border-0 ring-1 ring-foreground/5 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">Program rules</CardTitle>
                <CardDescription className="text-xs">Schedule contents rules (rotation/spot).</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingContentsRule(null);
                  setContentsDialogOpen(true);
                }}
                disabled={!schedule}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add rule
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {(schedule?.contentsRules?.length || 0) === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm font-semibold">No program rules</p>
                  <p className="text-xs mt-1">Add rules to make devices play published programs by time/date/weekday.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {(schedule?.contentsRules || [])
                    .slice()
                    .sort((a, b) => a.priority - b.priority)
                    .map((r) => (
                      <div key={r.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                              r.type === 'spot' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            )}>
                              {r.type === 'spot' ? 'Spot' : 'Rotation'}
                            </span>
                            <span className="text-xs text-muted-foreground">Priority {r.priority}</span>
                            {r.releaseVersion != null && (
                              <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">v{r.releaseVersion}</span>
                            )}
                          </div>
                          <p className="text-sm font-medium mt-1 truncate">
                            {r.deviceTitleSnapshot || 'Untitled Program'}
                          </p>
                          <div className="mt-1.5">
                            {renderConstraintBadges(summarizeLimits(r))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingContentsRule(r);
                              setContentsDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteContentsRule(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands" className="space-y-4">
          <Card className="border-0 ring-1 ring-foreground/5 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">Command rules</CardTitle>
                <CardDescription className="text-xs">Generated device protocol payload is stored by backend.</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingCommandRule(null);
                  setCommandDialogOpen(true);
                }}
                disabled={!schedule || unparseableCommandRules.length > 0}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add rule
              </Button>
            </CardHeader>
            {unparseableCommandRules.length > 0 && (
              <div className="mx-4 mt-4 rounded-lg border border-yellow-200/60 bg-yellow-50/50 dark:bg-yellow-900/10 p-3 text-xs text-yellow-900 dark:text-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Some command rules are not editable</p>
                    <p className="mt-1 text-yellow-800 dark:text-yellow-300">
                      UI cannot reconstruct operation+opTime from payload. Command editing is disabled until those rules are removed.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <CardContent className="p-0">
              {(schedule?.commandRules?.length || 0) === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm font-semibold">No command rules</p>
                  <p className="text-xs mt-1">Add actions like brightness/volume/sleep at specified times.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {schedule?.commandRules?.map((r) => {
                    const parsed = parseScheduleCommandPayloadToUpsert(r.payload);
                    const editable = Boolean(parsed) && unparseableCommandRules.length === 0;
                    const typeInfo = COMMAND_TYPE_CONFIG[parsed?.operation.type || ''] || DEFAULT_COMMAND_TYPE_INFO;
                    const IconComponent = typeInfo.icon;
                    const valueDesc = getCommandValueDescription(parsed);
                    const cmdConstraints = summarizeCommandLimits(parsed);
                    return (
                      <div key={r.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', typeInfo.color)}>
                              <IconComponent className="h-3 w-3" /> {typeInfo.label}
                            </span>
                            {valueDesc && (
                              <span className="text-sm font-semibold text-foreground">{valueDesc}</span>
                            )}
                            {!editable && (
                              <span className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded">
                                read-only
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                              <Clock className="h-3 w-3 opacity-60" /> {formatCommandOpTimes(parsed?.opTime)}
                            </span>
                            {cmdConstraints.weekday && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                <Calendar className="h-3 w-3 opacity-60" /> {cmdConstraints.weekday}
                              </span>
                            )}
                            {cmdConstraints.date && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                                <CalendarDays className="h-3 w-3 opacity-60" /> {cmdConstraints.date}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (!parsed) return;
                              setEditingCommandRule({ ...parsed, id: r.id });
                              setCommandDialogOpen(true);
                            }}
                            disabled={!parsed || unparseableCommandRules.length > 0}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteCommandRule(r.id)}
                            disabled={unparseableCommandRules.length > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {schedule && schedule.boundDeviceIds.length > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">!</span>
              )}
              Delete schedule?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {schedule && schedule.boundDeviceIds.length > 0 ? (
                  <>
                    <p className="text-destructive font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> This schedule has {schedule.boundDeviceIds.length} bound device{schedule.boundDeviceIds.length > 1 ? 's' : ''}.
                    </p>
                    <p>
                      Deleting it will require you to manually unbind all devices and push updates again. This may cause content playback interruptions.
                    </p>
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                      <p className="font-medium text-destructive">Recommended action:</p>
                      <p className="mt-1 text-muted-foreground">First unbind devices from this schedule, then delete it to avoid disruption.</p>
                    </div>
                  </>
                ) : (
                  <p>This schedule has no bound devices and can be safely deleted.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {schedule && schedule.boundDeviceIds.length > 0 ? 'Delete anyway' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScheduleBindDevicesDialog open={bindOpen} onOpenChange={setBindOpen} scheduleId={scheduleId} alreadyBoundDeviceIds={schedule?.boundDeviceIds || []} />

      <ScheduleContentsRuleSheet
        open={contentsDialogOpen}
        onOpenChange={(open) => {
          setContentsDialogOpen(open);
          if (!open) setEditingContentsRule(null);
        }}
        initialRule={editingContentsRule}
        existingPriorities={contentsPriorities}
        existingRules={schedule?.contentsRules || []}
        onSave={saveContentsRule}
      />

      <ScheduleCommandRuleSheet
        open={commandDialogOpen}
        onOpenChange={(open) => {
          setCommandDialogOpen(open);
          if (!open) setEditingCommandRule(null);
        }}
        initialRule={editingCommandRule}
        onSave={saveCommandRule}
      />

      <Dialog open={metaOpen} onOpenChange={setMetaOpen}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Edit schedule</DialogTitle>
            <DialogDescription>Update schedule metadata. Rules are managed in Programs / Commands tabs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Name</label>
              <Input value={metaName} onChange={(e) => setMetaName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Description</label>
              <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-semibold">Enabled</p>
                <p className="text-xs text-muted-foreground">Disabled schedules do not take effect on devices.</p>
              </div>
              <Switch checked={metaEnabled} onCheckedChange={setMetaEnabled} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMetaOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveMeta}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pushOpen} onOpenChange={setPushOpen}>
        <DialogContent className="max-w-[760px]">
          <DialogHeader>
            <DialogTitle>Push result</DialogTitle>
            <DialogDescription>Devices will fetch the latest schedule after confirming the command.</DialogDescription>
          </DialogHeader>
          {pushResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Accepted</span>
                <span className="font-semibold">
                  {pushResult.accepted}/{pushResult.totalTargets}
                </span>
              </div>
              <div className="max-h-[360px] overflow-auto rounded border">
                <div className="divide-y">
                  {pushResult.results.map((r) => (
                    <div key={r.deviceId} className="px-4 py-3 text-sm flex items-center justify-between">
                      <span className="font-mono text-xs">#{r.deviceId}</span>
                      <span className={cn('text-xs', r.accepted ? 'text-emerald-600' : 'text-rose-600')}>
                        {r.accepted ? 'accepted' : r.errorMessage || 'rejected'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No push result</div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setPushOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
