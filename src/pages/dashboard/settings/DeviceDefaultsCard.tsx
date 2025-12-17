import { useMemo, useState } from 'react';
import { BellRing, Loader2, Save, Smartphone, Timer } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york/ui/card';
import { Field, FieldContent, FieldDescription, FieldLabel } from '@/registry/new-york/ui/field';
import { InputGroup, InputGroupInput } from '@/registry/new-york/ui/input-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york/ui/select';
import { Separator } from '@/registry/new-york/ui/separator';
import { Switch } from '@/registry/new-york/ui/switch';

export type DeviceDefaults = {
  defaultTimezoneMode: 'inherit' | 'fixed';
  defaultTimezone: string;
  offlineAlertMinutes: number;
  autoReceiveLatestProgramVersion: boolean;
  toastOnDeviceOffline: boolean;
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
  const defaultValue = useMemo<DeviceDefaults>(() => ({
    defaultTimezoneMode: 'inherit',
    defaultTimezone: 'UTC',
    offlineAlertMinutes: 30,
    autoReceiveLatestProgramVersion: false,
    toastOnDeviceOffline: true,
  }), []);

  const [draft, setDraft] = useState<DeviceDefaults>(value ?? defaultValue);
  const [isSaving, setIsSaving] = useState(false);

  const timezones = useMemo(
    () => [
      { value: 'UTC', label: 'UTC' },
      { value: 'Asia/Shanghai', label: 'Asia/Shanghai' },
      { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
      { value: 'Europe/London', label: 'Europe/London' },
      { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
    ],
    [],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(draft);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={cn('w-full shadow-xs', className)}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <CardTitle className="wrap-break-word">Device Defaults</CardTitle>
            <CardDescription className="wrap-break-word">
              Defaults applied when you onboard new devices.
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
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-base">Timezone</h3>

            <Field>
              <FieldLabel>Default timezone for new devices</FieldLabel>
              <FieldContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <FieldLabel className="mb-0" htmlFor="tz-mode-inherit">
                          Inherit from my profile
                        </FieldLabel>
                        <FieldDescription className="text-xs">
                          Use your account timezone by default.
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
                          Use a fixed timezone
                        </FieldLabel>
                        <FieldDescription className="text-xs">
                          Override device timezone on creation.
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
                <FieldLabel htmlFor="default-timezone">Default timezone</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(next) =>
                      setDraft((prev) => ({ ...prev, defaultTimezone: next }))
                    }
                    value={draft.defaultTimezone}
                  >
                    <SelectTrigger className="w-full" id="default-timezone">
                      <SelectValue placeholder="Select timezone" />
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
                  Only used for newly created devices (existing devices are not changed).
                </FieldDescription>
              </Field>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-base">Alerts</h3>

            <Field>
              <FieldLabel htmlFor="offline-alert-minutes">
                Offline alert threshold (minutes)
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
                Device is considered offline if it stops reporting for this duration.
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
                      Toast when device goes offline
                    </FieldLabel>
                    <FieldDescription className="text-xs">
                      Show an in-app toast for offline events.
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
            <h3 className="font-semibold text-base">Delivery</h3>

            <Field>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Smartphone className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel className="mb-0" htmlFor="auto-receive-latest">
                      Auto receive latest program version
                    </FieldLabel>
                    <FieldDescription className="text-xs">
                      Lite defaults to off. Enable only if you want auto-updates.
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

