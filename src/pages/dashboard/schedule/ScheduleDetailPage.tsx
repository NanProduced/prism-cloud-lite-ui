import { useMemo, useState, useEffect } from 'react';
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
  getScheduleDetails,
  pushScheduleToDevices,
  unbindDeviceFromSchedule,
  updateSchedule,
} from '@/services/scheduleApi';
import { getDevicesByIds } from '@/services/deviceApi';
import {
  getPrograms,
  getProgramDetails,
  getProgramsByIds,
} from '@/services/programApi';
import { getErrorMessage } from '@/services/authApi';
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
import { useBreadcrumbStore } from '@/store/breadcrumbStore';
import type { BffResponse } from '@/types/auth';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { useTranslation } from 'react-i18next';

function getBffDisplayError(res: BffResponse<any> | null | undefined, t: any): string {
  return res?.error?.displayMessage || res?.error?.message || t('common.errors.unknown');
}

interface RuleSummaryParts {
  time?: string;
  date?: string;
  weekday?: string;
}

function summarizeLimits(rule: ScheduleContentsRuleResp, t: any): RuleSummaryParts {
  const parts: RuleSummaryParts = {};

  // Time formatting
  if (rule.ifLimitTime && rule.limitTime) {
    const timeSlots = Array.isArray(rule.limitTime) ? rule.limitTime : [rule.limitTime];
    const formatted = (timeSlots as any[])
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
      parts.weekday = formatWeekdaySelection(indices, t);
    }
  }

  return parts;
}

function renderConstraintBadges(parts: RuleSummaryParts, t: any): React.ReactNode {
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
    return <span className="text-xs text-muted-foreground">{t('schedules.details.constraints.none')}</span>;
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

function summarizeCommandLimits(parsed: UpsertScheduleCommandRuleReq | null, t: any): RuleSummaryParts {
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
      parts.weekday = formatWeekdaySelection(indices, t);
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { scheduleId = '' } = useParams();
  const { setOverride, removeOverride } = useBreadcrumbStore();
  const { formatDateTime } = useTimeFormatter();

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

  const schedule = scheduleQuery.data?.data;

  const bindingsQuery = useQuery({
    queryKey: ['schedule-bindings', scheduleId, schedule?.boundDeviceIds],
    queryFn: async () => {
      if (!schedule?.boundDeviceIds || schedule.boundDeviceIds.length === 0) return [];
      const res = await getDevicesByIds(schedule.boundDeviceIds);
      return res.data || [];
    },
    enabled: Boolean(scheduleId) && Boolean(schedule?.boundDeviceIds),
  });

  const bindings = bindingsQuery.data || [];

  const programIdsUsed = useMemo(() => {
    const ids = new Set<string>();
    (schedule?.contentsRules || []).forEach(r => {
      if (r.programId) ids.add(r.programId);
    });
    return Array.from(ids);
  }, [schedule?.contentsRules]);

  const programsMapQuery = useQuery({
    queryKey: ['schedule-programs', programIdsUsed],
    queryFn: async () => {
      if (programIdsUsed.length === 0) return {};
      const res = await getProgramsByIds(programIdsUsed);
      const map: Record<string, any> = {};
      (res.data || []).forEach(p => {
        map[p.id] = p;
      });
      return map;
    },
    enabled: programIdsUsed.length > 0,
  });

  const programsMap = programsMapQuery.data || {};

  // Update breadcrumb with schedule name
  useEffect(() => {
    const path = location.pathname.replace(/\/$/, '');
    if (schedule?.name) {
      setOverride(path, schedule.name);
    }
    return () => {
      removeOverride(path);
    };
  }, [schedule?.name, location.pathname, setOverride, removeOverride]);

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
        toast.error(getBffDisplayError(res, t));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success(t('schedules.toasts.publishSuccess'));
    },
    onError: () => toast.error(t('schedules.toasts.updateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSchedule(scheduleId),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res, t));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success(t('schedules.toasts.deleteSuccess'));
      navigate('/dashboard/schedule');
    },
    onError: () => toast.error(t('schedules.toasts.deleteFailed')),
  });

  const unbindMutation = useMutation({
    mutationFn: (deviceId: number) => unbindDeviceFromSchedule(scheduleId, deviceId),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res, t));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedule-bindings', scheduleId] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success(t('deviceDetails.toasts.unpublishSuccess'));
    },
    onError: () => toast.error(getErrorMessage(null) || t('common.errors.unknown')),
  });

  const pushMutation = useMutation({
    mutationFn: () => pushScheduleToDevices(scheduleId, null),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res, t));
        return;
      }
      toast.success(t('schedules.details.toasts.pushQueued'), { description: `${t('schedules.details.pushResult.accepted')}: ${res.data?.accepted ?? 0}/${res.data?.totalTargets ?? 0}` });
      setPushOpen(true);
    },
    onError: () => toast.error(t('schedules.toasts.publishFailed')),
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
      name: metaName.trim() || t('schedules.dialogs.create.untitled'),
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
      toast.error(t('schedules.details.toasts.unparseableEdit'));
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
            <ArrowLeft className="h-4 w-4" /> {t('common.actions.back')}
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
                title={t('common.actions.edit')}
              >
                {schedule?.name || t('schedules.list.title')}
              </button>
              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                P:{schedule?.contentsRules?.length ?? 0}
              </span>
              <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                C:{schedule?.commandRules?.length ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {t('schedules.list.table.updated')} {formatDateTime(schedule?.updatedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2 pr-2 border-r">
            <Switch checked={Boolean(schedule?.enabled)} onCheckedChange={(next) => updateMutation.mutate({ enabled: next })} disabled={!schedule} />
            <span className="text-sm font-medium">{schedule?.enabled ? t('schedules.list.table.enabled') : t('schedules.list.table.disabled')}</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => scheduleQuery.refetch()} title={t('common.actions.refresh')}>
            <RefreshCw className={cn('h-4 w-4', scheduleQuery.isFetching ? 'animate-spin' : '')} />
          </Button>
          <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmOpen(true)} disabled={!schedule} title={t('schedules.list.actions.delete')}>
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
                {t('schedules.list.actions.publish')}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="font-semibold">{t('program.publish.strategy.traffic')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('schedules.details.pushResult.desc')}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('schedules.details.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="programs">{t('schedules.details.tabs.programs')}</TabsTrigger>
          <TabsTrigger value="commands">{t('schedules.details.tabs.commands')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">

          {/* Visualizer or Onboarding */}
          {(schedule?.contentsRules?.length || 0) === 0 && (schedule?.commandRules?.length || 0) === 0 ? (
            <ScheduleOnboarding variant="empty-schedule" />
          ) : (
            <ScheduleVisualizer 
              rules={schedule?.contentsRules || []} 
              commandRules={schedule?.commandRules || []} 
              programsMap={programsMap}
              onTabChange={setActiveTab}
            />
          )}

          <Card className="border-0 ring-1 ring-foreground/5 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">{t('schedules.details.bindings.title')}</CardTitle>
                <CardDescription className="text-xs">{t('schedules.details.bindings.desc')}</CardDescription>
              </div>
              <Button onClick={() => setBindOpen(true)} disabled={!schedule} className="gap-2">
                <Plus className="h-4 w-4" /> {t('schedules.details.bindings.bindDevices')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 py-14 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> {t('programs.list.actions.loading')}
                </div>
              ) : bindings.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm font-semibold">{t('schedules.details.bindings.noDevices')}</p>
                  <p className="text-xs mt-1">{t('schedules.details.bindings.noDevicesDesc')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {bindings.map((d: any) => (
                    <div key={d.deviceId} className="flex items-center justify-between px-6 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "inline-flex h-2 w-2 rounded-full flex-shrink-0",
                            d.onlineStatus === 1 ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                          )} />
                          <p className="text-sm font-semibold truncate">{d.deviceName || `Device ${d.deviceId}`}</p>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                           <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                             {d.networkType || t('common.errors.unknown')}
                           </span>
                           <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                             <RefreshCw className="h-3 w-3 opacity-70" /> {d.brightness}%
                           </span>
                           <span className="text-[11px] text-muted-foreground">
                             {d.model || '—'}
                           </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/devices/${d.deviceId}`, { state: { returnTo: location.pathname } })}>
                          {t('common.actions.open')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive gap-2"
                          onClick={() => unbindMutation.mutate(d.deviceId)}
                        >
                          <Unlink2 className="h-4 w-4" /> {t('schedules.details.bindings.unbind')}
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
                <CardTitle className="text-sm font-bold">{t('schedules.details.programRules.title')}</CardTitle>
                <CardDescription className="text-xs">{t('schedules.details.programRules.desc')}</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingContentsRule(null);
                  setContentsDialogOpen(true);
                }}
                disabled={!schedule}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> {t('schedules.details.programRules.addRule')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {(schedule?.contentsRules?.length || 0) === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm font-semibold">{t('schedules.details.programRules.noRules')}</p>
                  <p className="text-xs mt-1">{t('schedules.details.programRules.noRulesDesc')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {(schedule?.contentsRules || [])
                    .slice()
                    .sort((a, b) => a.priority - b.priority)
                    .map((r) => {
                      const programInfo = r.programId ? programsMap[r.programId] : null;
                      const displayName = programInfo?.name || r.deviceTitleSnapshot || t('schedules.dialogs.create.untitled');
                      
                      return (
                        <div key={r.id} className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center">
                          <div className="flex-shrink-0">
                            {programInfo?.coverUrl ? (
                              <img 
                                src={programInfo.coverUrl} 
                                alt={displayName} 
                                className="h-16 w-24 object-cover rounded-md border bg-muted"
                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/96x64?text=No+Cover')}
                              />
                            ) : (
                              <div className="h-16 w-24 rounded-md border bg-muted flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold">
                                {t('schedules.details.programRules.noCover')}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                                r.type === 'spot' ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              )}>
                                {r.type === 'spot' ? t('schedules.details.programRules.spot') : t('schedules.details.programRules.rotation')}
                              </span>
                              <span className="text-xs text-muted-foreground">{t('schedules.details.programRules.priority')} {r.priority}</span>
                              {r.releaseVersion != null && (
                                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">v{r.releaseVersion}</span>
                              )}
                              {programInfo && (
                                <span className="text-xs text-muted-foreground">
                                  {programInfo.width}x{programInfo.height}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p 
                                className={cn(
                                  "text-sm font-semibold truncate",
                                  r.programId && "hover:text-primary cursor-pointer transition-colors"
                                )}
                                onClick={() => r.programId && navigate(`/dashboard/programs/${r.programId}`)}
                              >
                                {displayName}
                              </p>
                            </div>
                            <div className="mt-1.5">
                              {renderConstraintBadges(summarizeLimits(r, t), t)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingContentsRule(r);
                                setContentsDialogOpen(true);
                              }}
                            >
                              {t('common.actions.edit')}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteContentsRule(r.id)}>
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

        <TabsContent value="commands" className="space-y-4">
          <Card className="border-0 ring-1 ring-foreground/5 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">{t('schedules.details.commandRules.title')}</CardTitle>
                <CardDescription className="text-xs">{t('schedules.details.commandRules.desc')}</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingCommandRule(null);
                  setCommandDialogOpen(true);
                }}
                disabled={!schedule || unparseableCommandRules.length > 0}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> {t('schedules.details.commandRules.addRule')}
              </Button>
            </CardHeader>
            {unparseableCommandRules.length > 0 && (
              <div className="mx-4 mt-4 rounded-lg border border-yellow-200/60 bg-yellow-50/50 dark:bg-yellow-900/10 p-3 text-xs text-yellow-900 dark:text-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">{t('schedules.details.commandRules.unparseableTitle')}</p>
                    <p className="mt-1 text-yellow-800 dark:text-yellow-300">
                      {t('schedules.details.commandRules.unparseableDesc')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <CardContent className="p-0">
              {(schedule?.commandRules?.length || 0) === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm font-semibold">{t('schedules.details.commandRules.noRules')}</p>
                  <p className="text-xs mt-1">{t('schedules.details.commandRules.noRulesDesc')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {schedule?.commandRules?.map((r) => {
                    const parsed = parseScheduleCommandPayloadToUpsert(r.payload);
                    const editable = Boolean(parsed) && unparseableCommandRules.length === 0;
                    const typeInfo = COMMAND_TYPE_CONFIG[parsed?.operation.type || ''] || DEFAULT_COMMAND_TYPE_INFO;
                    const IconComponent = typeInfo.icon;
                    const valueDesc = getCommandValueDescription(parsed);
                    const cmdConstraints = summarizeCommandLimits(parsed, t);
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
                                {t('schedules.details.commandRules.readOnly')}
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
                            {t('common.actions.edit')}
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
              {t('schedules.dialogs.delete.title')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {schedule && schedule.boundDeviceIds.length > 0 ? (
                  <>
                    <p className="text-destructive font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> {t('schedules.dialogs.delete.hasBound', { count: schedule.boundDeviceIds.length })}
                    </p>
                    <p>
                      {t('schedules.dialogs.delete.hasBoundDesc')}
                    </p>
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                      <p className="font-medium text-destructive">{t('schedules.dialogs.delete.recommendation')}</p>
                      <p className="mt-1 text-muted-foreground">{t('schedules.dialogs.delete.recommendationDesc')}</p>
                    </div>
                  </>
                ) : (
                  <p>{t('schedules.dialogs.delete.noBound')}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {schedule && schedule.boundDeviceIds.length > 0 ? t('schedules.dialogs.delete.deleteAnyway') : t('common.actions.delete')}
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
            <DialogTitle>{t('schedules.details.meta.title')}</DialogTitle>
            <DialogDescription>{t('schedules.details.meta.desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">{t('schedules.dialogs.create.name')}</label>
              <Input value={metaName} onChange={(e) => setMetaName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">{t('schedules.dialogs.create.description')}</label>
              <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-semibold">{t('schedules.dialogs.create.enabled')}</p>
                <p className="text-xs text-muted-foreground">{t('schedules.dialogs.create.enabledDesc')}</p>
              </div>
              <Switch checked={metaEnabled} onCheckedChange={setMetaEnabled} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMetaOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button onClick={saveMeta}>{t('common.actions.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pushOpen} onOpenChange={setPushOpen}>
        <DialogContent className="max-w-[760px]">
          <DialogHeader>
            <DialogTitle>{t('schedules.details.pushResult.title')}</DialogTitle>
            <DialogDescription>{t('schedules.details.pushResult.desc')}</DialogDescription>
          </DialogHeader>
          {pushResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('schedules.details.pushResult.accepted')}</span>
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
                        {r.accepted ? t('schedules.details.pushResult.acceptedStatus') : r.errorMessage || t('schedules.details.pushResult.rejectedStatus')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">{t('schedules.details.pushResult.noResult')}</div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setPushOpen(false)}>{t('common.actions.close')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
