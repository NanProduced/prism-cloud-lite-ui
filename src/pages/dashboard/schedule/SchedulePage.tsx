import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, ChevronRight, Plus, RefreshCw, Search, Send, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

import type { ScheduleListResp } from '@/types/schedule';
import { createSchedule, deleteSchedule, getSchedules, pushScheduleToDevices, updateSchedule } from '@/services/scheduleApi';
import { ScheduleOnboarding } from '@/components/schedule/ScheduleOnboarding';
import type { BffResponse } from '@/types/auth';
import { useTimeFormatter } from '@/hooks/use-time-formatter';
import { useTranslation } from 'react-i18next';

function getBffDisplayError(res: BffResponse<any> | null | undefined, t: any): string {
  return res?.error?.displayMessage || res?.error?.message || t('common.errors.unknown');
}

export default function SchedulePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatDateTime } = useTimeFormatter();

  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('New Schedule');
  const [createDescription, setCreateDescription] = useState('');
  const [createEnabled, setCreateEnabled] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleListResp | null>(null);

  const schedulesQuery = useQuery({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });

  const schedules = useMemo(() => {
    const list = schedulesQuery.data?.data || [];
    const q = query.trim().toLowerCase();
    const filtered = q ? list.filter((s) => (s.name || '').toLowerCase().includes(q)) : list;
    return [...filtered].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [query, schedulesQuery.data?.data]);

  const createMutation = useMutation({
    mutationFn: () =>
      createSchedule({
        name: createName.trim() || t('schedules.dialogs.create.untitled'),
        description: createDescription.trim() || null,
        enabled: createEnabled,
        contentsRules: [],
        commandRules: [],
      }),
    onSuccess: (res) => {
      if (!res.success || !res.data) {
        toast.error(getBffDisplayError(res, t));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setCreateOpen(false);
      toast.success(t('schedules.toasts.createSuccess'));
      navigate(`/dashboard/schedule/${res.data.scheduleId}`);
    },
    onError: () => toast.error(t('schedules.toasts.createFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: (input: { scheduleId: string; enabled: boolean }) => updateSchedule(input.scheduleId, { enabled: input.enabled }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res, t));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: () => toast.error(t('schedules.toasts.updateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId: string) => deleteSchedule(scheduleId),
    onSuccess: (res, scheduleId) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res, t));
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success(t('schedules.toasts.deleteSuccess'), {
        description: scheduleId.slice(0, 8),
      });
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    },
    onError: () => toast.error(t('schedules.toasts.deleteFailed')),
  });

  const pushMutation = useMutation({
    mutationFn: (scheduleId: string) => pushScheduleToDevices(scheduleId),
    onSuccess: (res, scheduleId) => {
      if (!res.success) {
        toast.error(getBffDisplayError(res, t));
        return;
      }
      toast.success(t('schedules.toasts.publishSuccess'), {
        description: t('schedules.toasts.publishDesc'),
      });
    },
    onError: () => toast.error(t('schedules.toasts.publishFailed')),
  });

  const isLoading = schedulesQuery.isLoading;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t('schedules.list.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('schedules.list.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('schedules.list.searchPlaceholder')} className="pl-9 w-72" />
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> {t('schedules.list.actions.new')}
          </Button>
          <Button variant="outline" onClick={() => schedulesQuery.refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> {t('common.actions.refresh')}
          </Button>
        </div>
      </div>

      <Card className="border-0 ring-1 ring-foreground/5 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="text-sm font-bold">{t('schedules.list.table.title')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span className="text-sm">{t('programs.list.actions.loading')}</span>
            </div>
          ) : schedules.length === 0 && !query ? (
            <div className="p-6">
              <ScheduleOnboarding variant="empty-list" />
              <div className="mt-6 text-center">
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> {t('schedules.list.actions.createFirst')}
                </Button>
              </div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-sm font-semibold">{t('schedules.list.empty.title')}</p>
              <p className="text-xs mt-1">{t('schedules.list.empty.description')}</p>
            </div>
          ) : (
            <div className="divide-y">
              {schedules.map((s: ScheduleListResp) => (
                <div key={s.scheduleId} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/schedule/${s.scheduleId}`)}
                        className="truncate text-sm font-bold hover:text-primary"
                      >
                        {s.name}
                      </button>
                      <Switch
                        checked={Boolean(s.enabled)}
                        onCheckedChange={(next) => toggleMutation.mutate({ scheduleId: s.scheduleId, enabled: next })}
                      />
                      <span className="text-xs text-muted-foreground">{s.enabled ? t('schedules.list.table.enabled') : t('schedules.list.table.disabled')}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      <span>{t('schedules.list.table.boundDevices')}: {s.boundDevices}</span>
                      <span>{t('schedules.list.table.programs')}: {s.programRules}</span>
                      <span>{t('schedules.list.table.commands')}: {s.commandRules}</span>
                      <span>{t('schedules.list.table.updated')}: {formatDateTime(s.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => pushMutation.mutate(s.scheduleId)}
                      disabled={s.boundDevices === 0 || pushMutation.isPending}
                      title={s.boundDevices === 0 ? t('schedules.list.tooltips.noBoundDevices') : t('schedules.list.tooltips.pushToBound')}
                    >
                      <Send className="h-4 w-4" /> {t('schedules.list.actions.publish')}
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/dashboard/schedule/${s.scheduleId}`)} className="gap-2">
                      {t('schedules.list.actions.open')} <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteTarget(s);
                        setDeleteConfirmOpen(true);
                      }}
                      title={t('schedules.list.actions.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setCreateName(t('schedules.dialogs.create.untitled')); setCreateDescription(''); setCreateEnabled(true); } }}>
        <DialogContent className="max-w-[560px] p-6">
          <DialogHeader>
            <DialogTitle>{t('schedules.dialogs.create.title')}</DialogTitle>
            <DialogDescription>{t('schedules.dialogs.create.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>{t('schedules.dialogs.create.name')}</Label>
              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder={t('schedules.dialogs.create.namePlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('schedules.dialogs.create.description')}</Label>
              <Textarea 
                value={createDescription} 
                onChange={(e) => setCreateDescription(e.target.value)} 
                placeholder={t('schedules.dialogs.create.descriptionPlaceholder')}
                className="resize-none h-24"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base">{t('schedules.dialogs.create.enabled')}</Label>
                <p className="text-xs text-muted-foreground">{t('schedules.dialogs.create.enabledDesc')}</p>
              </div>
              <Switch checked={createEnabled} onCheckedChange={setCreateEnabled} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="gap-2">
              {createMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              {t('common.actions.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteTarget && deleteTarget.boundDevices > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">!</span>
              )}
              {t('schedules.dialogs.delete.title')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {deleteTarget && deleteTarget.boundDevices > 0 ? (
                  <>
                    <p className="text-destructive font-medium flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      {t('schedules.dialogs.delete.hasBound', { count: deleteTarget.boundDevices })}
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
            <AlertDialogCancel
              onClick={() => {
                setDeleteTarget(null);
                setDeleteConfirmOpen(false);
              }}
            >
              {t('common.actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.scheduleId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!deleteTarget || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              {deleteTarget && deleteTarget.boundDevices > 0 ? t('schedules.dialogs.delete.deleteAnyway') : t('common.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
