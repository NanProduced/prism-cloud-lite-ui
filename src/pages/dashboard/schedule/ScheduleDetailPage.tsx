import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CalendarDays, Edit3, Loader2, Plus, RefreshCw, Send, Trash2, Unlink2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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

function getBffDisplayError(res: { error?: { displayMessage?: string; message?: string } } | null | undefined): string {
  return res?.error?.displayMessage || res?.error?.message || 'Request failed';
}

function summarizeLimits(rule: Pick<ScheduleContentsRuleResp, 'ifLimitTime' | 'ifLimitDate' | 'ifLimitWeekday'>): string {
  const parts: string[] = [];
  if (rule.ifLimitTime) parts.push('time');
  if (rule.ifLimitDate) parts.push('date');
  if (rule.ifLimitWeekday) parts.push('weekday');
  return parts.length ? parts.join(', ') : '—';
}

function toUpsertContentsRule(rule: ScheduleContentsRuleResp): UpsertScheduleContentsRuleReq {
  return {
    id: rule.id,
    type: rule.type,
    priority: rule.priority,
    releaseProgramId: rule.releaseProgramId,
    ifLimitTime: rule.ifLimitTime || undefined,
    limitTime: rule.ifLimitTime ? (rule.limitTime as any) : undefined,
    ifLimitDate: rule.ifLimitDate || undefined,
    limitDate: rule.ifLimitDate ? (rule.limitDate as any) : undefined,
    ifLimitWeekday: rule.ifLimitWeekday || undefined,
    limitWeekday: rule.ifLimitWeekday ? (rule.limitWeekday as any) : undefined,
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" className="gap-2" onClick={() => navigate('/dashboard/schedule')}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate">{schedule?.name || 'Schedule'}</h1>
              <p className="text-xs text-muted-foreground truncate">
                {scheduleId.slice(0, 8)} · Updated {schedule?.updatedAt ? new Date(schedule.updatedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => scheduleQuery.refetch()} className="gap-2">
              <RefreshCw className={cn('h-4 w-4', scheduleQuery.isFetching ? 'animate-spin' : '')} /> Refresh
            </Button>
            <Button variant="outline" onClick={openMetaDialog} className="gap-2" disabled={!schedule}>
              <Edit3 className="h-4 w-4" /> Edit
            </Button>
            <Button onClick={() => pushMutation.mutate()} className="gap-2" disabled={!schedule || pushMutation.isPending}>
              {pushMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Push Updates
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={Boolean(schedule?.enabled)} onCheckedChange={(next) => updateMutation.mutate({ enabled: next })} disabled={!schedule} />
          <span className="text-sm font-semibold">{schedule?.enabled ? 'Enabled' : 'Disabled'}</span>
          <span className="text-xs text-muted-foreground">
            Changes affect all bound devices; push updates to trigger devices to fetch the latest schedule.
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          
          {/* Visualizer */}
          <ScheduleVisualizer rules={schedule?.contentsRules || []} commandRules={schedule?.commandRules || []} />

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
                        <Button variant="outline" onClick={() => navigate(`/dashboard/devices/${b.deviceId}`)}>
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-0 ring-1 ring-foreground/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Rules Summary</CardTitle>
                <CardDescription className="text-xs">What will be generated into schedules JSON.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Program rules</span>
                  <span className="font-semibold">{schedule?.contentsRules?.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Command rules</span>
                  <span className="font-semibold">{schedule?.commandRules?.length ?? 0}</span>
                </div>
                {unparseableCommandRules.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-yellow-200/60 bg-yellow-50/50 p-3 text-xs text-yellow-900">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <div>
                        <p className="font-semibold">Some command rules are not editable</p>
                        <p className="mt-1 text-yellow-800">
                          UI cannot reconstruct operation+opTime from payload. To prevent data loss, command editing is disabled until those rules are removed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
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
                            <span className="text-sm font-semibold">{r.type}</span>
                            <span className="text-xs text-muted-foreground">priority {r.priority}</span>
                            <span className="text-xs text-muted-foreground font-mono">releaseProgramId={r.releaseProgramId}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {r.deviceTitleSnapshot || r.programId || '—'} · limits: {summarizeLimits(r)}
                          </p>
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
                    return (
                      <div key={r.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold">{parsed?.operation.type || 'UNKNOWN'}</span>
                            <span className="text-xs text-muted-foreground">rule #{r.id}</span>
                            <span className={cn('text-xs', editable ? 'text-emerald-600' : 'text-yellow-700')}>
                              {editable ? 'editable' : 'read-only'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            opTime: {parsed?.opTime?.join(', ') || '—'} · payload stored in backend
                          </p>
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

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-semibold text-destructive">Danger zone</p>
          <p className="text-xs text-muted-foreground">Delete schedule and its rules (bindings must be removed first in backend).</p>
        </div>
        <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)} disabled={!schedule} className="gap-2">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete schedule rules. Bound devices will stop receiving this schedule after you unbind and push updates.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Delete
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
