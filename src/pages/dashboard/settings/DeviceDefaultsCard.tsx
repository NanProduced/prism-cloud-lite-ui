import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, Timer, BellRing, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export type DeviceDefaults = {
  defaultTimezoneMode: 'inherit' | 'fixed';
  defaultTimezone: string;
  offlineAlertMinutes: number;
  toastOnDeviceOffline: boolean;
  autoReceiveLatestProgramVersion: boolean;
};

export function DeviceDefaultsCard({
  value,
  onSave,
  className,
}: {
  value?: DeviceDefaults;
  onSave?: (next: DeviceDefaults) => Promise<void>;
  className?: string;
}) {
  const { t } = useTranslation();
  
  const defaultValue = useMemo<DeviceDefaults>(() => ({
    defaultTimezoneMode: 'inherit',
    defaultTimezone: 'Asia/Shanghai',
    offlineAlertMinutes: 30,
    toastOnDeviceOffline: true,
    autoReceiveLatestProgramVersion: false,
  }), []);

  const [draft, setDraft] = useState<DeviceDefaults>(value ?? defaultValue);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(draft);
    } finally {
      setIsSaving(false);
    }
  };

  const timezones = [
    { label: 'Shanghai (UTC+8)', value: 'Asia/Shanghai' },
    { label: 'Universal (UTC+0)', value: 'UTC' },
    { label: 'New York (UTC-5)', value: 'America/New_York' },
    { label: 'London (UTC+0)', value: 'Europe/London' },
    { label: 'Tokyo (UTC+9)', value: 'Asia/Tokyo' },
  ];

  return (
    <Card className={cn('w-full shadow-sm', className)}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <CardTitle className="wrap-break-word">{t('settings.deviceDefaults.title')}</CardTitle>
            <CardDescription className="wrap-break-word">
              {t('settings.deviceDefaults.subtitle')}
            </CardDescription>
          </div>
          {onSave && (
            <Button
              aria-busy={isSaving}
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={() => void handleSave()}
              type="button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.actions.refresh')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.actions.save')}
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-base">{t('settings.deviceDefaults.timezone.title')}</h3>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="tz-mode-inherit">
                          {t('settings.deviceDefaults.timezone.inherit')}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.deviceDefaults.timezone.inheritDesc')}
                        </p>
                      </div>
                      <Switch
                        checked={draft.defaultTimezoneMode === 'inherit'}
                        id="tz-mode-inherit"
                        onCheckedChange={(checked) =>
                          setDraft((prev) => ({
                            ...prev,
                            defaultTimezoneMode: checked ? 'inherit' : 'fixed',
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="tz-mode-fixed">
                          {t('settings.deviceDefaults.timezone.fixed')}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.deviceDefaults.timezone.fixedDesc')}
                        </p>
                      </div>
                      <Switch
                        checked={draft.defaultTimezoneMode === 'fixed'}
                        id="tz-mode-fixed"
                        onCheckedChange={(checked) =>
                          setDraft((prev) => ({
                            ...prev,
                            defaultTimezoneMode: checked ? 'fixed' : 'inherit',
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {draft.defaultTimezoneMode === 'fixed' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="default-timezone">
                      {t('settings.deviceDefaults.timezone.select')}
                    </label>
                    <Select
                        onValueChange={(next) =>
                        setDraft((prev) => ({ ...prev, defaultTimezone: next }))
                        }
                        value={draft.defaultTimezone}
                    >
                        <SelectTrigger className="w-full" id="default-timezone">
                        <SelectValue placeholder={t('settings.deviceDefaults.timezone.selectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                        {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {t('settings.deviceDefaults.timezone.selectDesc')}
                    </p>
                  </div>
                )}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-base">{t('settings.deviceDefaults.alerts.title')}</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="offline-alert-minutes">
                    {t('settings.deviceDefaults.alerts.threshold')}
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Timer className="h-5 w-5" />
                  </div>
                  <input
                    id="offline-alert-minutes"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const next = Number.parseInt(e.target.value || '0', 10);
                      setDraft((prev) => ({
                        ...prev,
                        offlineAlertMinutes: Number.isFinite(next) ? Math.max(0, next) : prev.offlineAlertMinutes,
                      }));
                    }}
                    placeholder="30"
                    type="number"
                    value={String(draft.offlineAlertMinutes)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                    {t('settings.deviceDefaults.alerts.thresholdDesc')}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <BellRing className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="toast-device-offline">
                      {t('settings.deviceDefaults.alerts.toast')}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.deviceDefaults.alerts.toastDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={draft.toastOnDeviceOffline}
                  id="toast-device-offline"
                  onCheckedChange={(checked) =>
                    setDraft((prev) => ({ ...prev, toastOnDeviceOffline: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-base">{t('settings.deviceDefaults.delivery.title')}</h3>

            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="auto-receive-latest">
                      {t('settings.deviceDefaults.delivery.autoReceive')}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.deviceDefaults.delivery.autoReceiveDesc')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={draft.autoReceiveLatestProgramVersion}
                  id="auto-receive-latest"
                  onCheckedChange={(checked) =>
                    setDraft((prev) => ({
                      ...prev,
                      autoReceiveLatestProgramVersion: checked,
                    }))
                  }
                />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}