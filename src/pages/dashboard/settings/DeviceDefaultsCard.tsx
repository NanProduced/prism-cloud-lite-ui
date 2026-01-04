import { Switch } from '@/registry/new-york/ui/switch';
import { useTranslation } from 'react-i18next';

export type DeviceDefaults = {
// ...
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
// ...
  return (
    <Card className={cn('w-full shadow-xs', className)}>
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
              data-loading={isSaving}
              disabled={isSaving}
              onClick={() => void handleSave()}
              type="button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('common.actions.saving')}
                </>
              ) : (
                <>
                  <Save className="size-4" />
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

            <Field>
              <FieldLabel>{t('settings.deviceDefaults.timezone.label')}</FieldLabel>
              <FieldContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <FieldLabel className="mb-0" htmlFor="tz-mode-inherit">
                          {t('settings.deviceDefaults.timezone.inherit')}
                        </FieldLabel>
                        <FieldDescription className="text-xs">
                          {t('settings.deviceDefaults.timezone.inheritDesc')}
                        </FieldDescription>
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

                  <div className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <FieldLabel className="mb-0" htmlFor="tz-mode-fixed">
                          {t('settings.deviceDefaults.timezone.fixed')}
                        </FieldLabel>
                        <FieldDescription className="text-xs">
                          {t('settings.deviceDefaults.timezone.fixedDesc')}
                        </FieldDescription>
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
              </FieldContent>
            </Field>

            {draft.defaultTimezoneMode === 'fixed' && (
              <Field>
                <FieldLabel htmlFor="default-timezone">{t('settings.deviceDefaults.timezone.select')}</FieldLabel>
                <FieldContent>
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
                </FieldContent>
                <FieldDescription>
                  {t('settings.deviceDefaults.timezone.selectDesc')}
                </FieldDescription>
              </Field>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-base">{t('settings.deviceDefaults.alerts.title')}</h3>

            <Field>
              <FieldLabel htmlFor="offline-alert-minutes">
                {t('settings.deviceDefaults.alerts.threshold')}
              </FieldLabel>
              <FieldContent>
                <InputGroup>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Timer className="size-4" />
                  </div>
                  <InputGroupInput
                    id="offline-alert-minutes"
                    inputMode="numeric"
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
                </InputGroup>
              </FieldContent>
              <FieldDescription>
                {t('settings.deviceDefaults.alerts.thresholdDesc')}
              </FieldDescription>
            </Field>

            <Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <BellRing className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel className="mb-0" htmlFor="toast-device-offline">
                      {t('settings.deviceDefaults.alerts.toast')}
                    </FieldLabel>
                    <FieldDescription className="text-xs">
                      {t('settings.deviceDefaults.alerts.toastDesc')}
                    </FieldDescription>
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
            </Field>
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-base">{t('settings.deviceDefaults.delivery.title')}</h3>

            <Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Smartphone className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel className="mb-0" htmlFor="auto-receive-latest">
                      {t('settings.deviceDefaults.delivery.autoReceive')}
                    </FieldLabel>
                    <FieldDescription className="text-xs">
                      {t('settings.deviceDefaults.delivery.autoReceiveDesc')}
                    </FieldDescription>
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
            </Field>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

