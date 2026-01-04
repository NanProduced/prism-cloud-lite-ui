"use client";

import {
  Activity,
  AlertTriangle,
  Check,
  Clock,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  MapPin,
  Monitor,
  Shield,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/new-york/ui/alert-dialog";
import { Badge } from "@/registry/new-york/ui/badge";
import { Button } from "@/registry/new-york/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/new-york/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/new-york/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/registry/new-york/ui/field";
import {
  InputGroup,
  InputGroupInput,
} from "@/registry/new-york/ui/input-group";
import { Separator } from "@/registry/new-york/ui/separator";
import { resolveIpLocation } from "@/lib/maptiler";

export interface SecuritySession {
  id: string;
  device: string;
  browser?: string;
  os?: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date;
  current: boolean;
}

export interface SecurityEvent {
  id: string;
  type: "login" | "password_change" | "2fa_enabled" | "2fa_disabled" | "logout";
  description: string;
  ipAddress: string;
  location: string;
  timestamp: Date;
  status: "success" | "failed" | "suspicious";
}

export interface SettingsSecurityProps {
  twoFactorEnabled?: boolean;
  sessions?: SecuritySession[];
  securityHistory?: SecurityEvent[];
  onPasswordChange?: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  onEnable2FA?: () => Promise<void>;
  onDisable2FA?: () => Promise<void>;
  onRevokeSession?: (sessionId: string) => Promise<void>;
  onRevokeAllSessions?: () => Promise<void>;
  onGenerateBackupCodes?: () => Promise<string[]>;
  className?: string;
}

import { useTranslation } from "react-i18next";

export interface SecuritySession {
  id: string;
  device: string;
  browser?: string;
  os?: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date;
  current: boolean;
}

export interface SecurityEvent {
  id: string;
  type: "login" | "password_change" | "2fa_enabled" | "2fa_disabled" | "logout";
  description: string;
  ipAddress: string;
  location: string;
  timestamp: Date;
  status: "success" | "failed" | "suspicious";
}

export interface SettingsSecurityProps {
  twoFactorEnabled?: boolean;
  sessions?: SecuritySession[];
  securityHistory?: SecurityEvent[];
  onPasswordChange?: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  onEnable2FA?: () => Promise<void>;
  onDisable2FA?: () => Promise<void>;
  onRevokeSession?: (sessionId: string) => Promise<void>;
  onRevokeAllSessions?: () => Promise<void>;
  onGenerateBackupCodes?: () => Promise<string[]>;
  className?: string;
}

function IpLocationDisplay({ ip, fallback }: { ip: string; fallback: string }) {
  const { t } = useTranslation();
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useState(() => {
    if (!ip || ip.includes(':') || ip === '127.0.0.1') return;
    setLoading(true);
    resolveIpLocation(ip).then(loc => {
      if (loc) setLocation(loc);
    }).finally(() => setLoading(false));
  });

  if (loading) return <span className="animate-pulse">{t('settings.security.locating')}</span>;
  return <span>{location || fallback}</span>;
}

export default function SettingsSecurity({
  twoFactorEnabled = false,
  sessions = [],
  securityHistory = [],
  onPasswordChange,
  onEnable2FA,
  onDisable2FA,
  onRevokeSession,
  onRevokeAllSessions,
  onGenerateBackupCodes,
  className,
}: SettingsSecurityProps) {
  const { t } = useTranslation();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [backupCodesDialogOpen, setBackupCodesDialogOpen] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat(t('auth.common.language') === 'zh' ? 'zh-CN' : 'en-US', {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  
  function formatRelativeTime(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    if (minutes < 1) return t('ai.justNow');
    if (minutes < 60) return `${minutes}${t('common.units.minute')}${t('common.units.ago')}`;
    if (hours < 24) return `${hours}${t('common.units.hour')}${t('common.units.ago')}`;
    if (days < 7) return `${days}${t('common.units.day')}${t('common.units.ago')}`;
    return formatDate(date);
  }

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handlePasswordChange = async () => {
    setErrors({});

    if (!passwordData.current.trim()) {
      setErrors({ current: t('auth.register.allFieldsRequired') });
      return;
    }

    if (!passwordData.new.trim()) {
      setErrors({ new: t('auth.register.allFieldsRequired') });
      return;
    }

    if (passwordData.new.length < 8) {
      setErrors({ new: t('settings.security.dialog.passwordLengthHint') });
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setErrors({ confirm: t('auth.register.passwordsDoNotMatch') });
      return;
    }

    setIsChangingPassword(true);
    try {
      await onPasswordChange?.(passwordData.current, passwordData.new);
      setPasswordData({ current: "", new: "", confirm: "" });
      setPasswordDialogOpen(false);
    } catch (error) {
      setErrors({
        _general:
          error instanceof Error ? error.message : t('settings.security.dialog.error'),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    try {
      const codes = await onGenerateBackupCodes?.();
      if (codes) {
        setBackupCodes(codes);
        setBackupCodesDialogOpen(true);
      }
    } catch (error) {
      setErrors({
        backupCodes:
          error instanceof Error
            ? error.message
            : t('common.errors.unknown'),
      });
    }
  };

  const getEventIcon = (type: SecurityEvent["type"]) => {
    switch (type) {
      case "login":
        return Lock;
      case "password_change":
        return Key;
      case "2fa_enabled":
      case "2fa_disabled":
        return Shield;
      default:
        return Clock;
    }
  };

  const getStatusBadge = (status: SecurityEvent["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge className="text-xs" variant="default">
            {t('message.status.SUCCESS')}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="text-xs" variant="destructive">
            {t('message.status.FAILED')}
          </Badge>
        );
      case "suspicious":
        return (
          <Badge
            className="flex items-center gap-1 text-xs"
            variant="destructive"
          >
            <AlertTriangle className="size-3" />
            <span>{t('logs.command.statusUi.PROBLEMS')}</span>
          </Badge>
        );
    }
  };

  return (
    <Card className={cn("w-full shadow-xs", className)}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <CardTitle className="wrap-break-word">{t('settings.security.title')}</CardTitle>
            <CardDescription className="wrap-break-word">
              {t('settings.security.subtitle')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Password & 2FA */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Password Change */}
            <div className="flex flex-col gap-4 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Key className="size-4" />
                </div>
                <FieldLabel className="mb-0">{t('settings.security.passwordTitle')}</FieldLabel>
              </div>
              <Dialog
                onOpenChange={setPasswordDialogOpen}
                open={passwordDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full" type="button" variant="outline">
                    {t('settings.security.changePassword')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('settings.security.dialog.title')}</DialogTitle>
                    <DialogDescription>
                      {t('settings.security.dialog.desc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    {errors._general && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                        <p className="text-destructive text-sm">
                          {errors._general}
                        </p>
                      </div>
                    )}

                    <Field>
                      <FieldLabel htmlFor="current-password">
                        {t('settings.security.dialog.currentPassword')}{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <InputGroup>
                          <InputGroupInput
                            id="current-password"
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                current: e.target.value,
                              }))
                            }
                            type="password"
                            value={passwordData.current}
                          />
                        </InputGroup>
                        {errors.current && (
                          <FieldError>{errors.current}</FieldError>
                        )}
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="new-password">
                        {t('settings.security.dialog.newPassword')} <span className="text-destructive">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <InputGroup>
                          <InputGroupInput
                            id="new-password"
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                new: e.target.value,
                              }))
                            }
                            type="password"
                            value={passwordData.new}
                          />
                        </InputGroup>
                        {errors.new && <FieldError>{errors.new}</FieldError>}
                        <FieldDescription>
                          {t('settings.security.dialog.passwordLengthHint')}
                        </FieldDescription>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="confirm-password">
                        {t('settings.security.dialog.confirmPassword')}{" "}
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <FieldContent>
                        <InputGroup>
                          <InputGroupInput
                            id="confirm-password"
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                confirm: e.target.value,
                              }))
                            }
                            type="password"
                            value={passwordData.confirm}
                          />
                        </InputGroup>
                        {errors.confirm && (
                          <FieldError>{errors.confirm}</FieldError>
                        )}
                      </FieldContent>
                    </Field>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setPasswordDialogOpen(false)}
                      type="button"
                      variant="outline"
                    >
                      {t('common.actions.cancel')}
                    </Button>
                    <Button
                      disabled={isChangingPassword}
                      onClick={handlePasswordChange}
                      type="button"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          {t('settings.security.dialog.changing')}
                        </>
                      ) : (
                        t('settings.security.changePassword')
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Two-Factor Authentication */}
            <div className="group relative flex flex-col gap-4 rounded-lg border p-4 bg-muted/20">
              <div className="absolute right-4 top-4">
                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border-none shadow-none">{t('settings.security.twoFactorBadge')}</Badge>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Shield className="size-4" />
                </div>
                <FieldLabel className="mb-0">
                  {t('settings.security.twoFactorTitle')}
                </FieldLabel>
              </div>
              <div className="flex flex-col gap-3 opacity-50">
                {twoFactorEnabled ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge
                        className="flex items-center gap-1 text-xs"
                        variant="default"
                      >
                        <Check className="size-3" />
                        <span>Enabled</span>
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        className="w-full"
                        disabled
                        onClick={handleGenerateBackupCodes}
                        type="button"
                        variant="outline"
                      >
                        {t('settings.security.viewBackupCodes')}
                      </Button>
                      <Button
                        className="w-full"
                        disabled
                        type="button"
                        variant="destructive"
                      >
                        {t('settings.security.disable2FA')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    className="w-full"
                    disabled
                    onClick={onEnable2FA}
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="size-4" />
                      <span>{t('settings.security.enable2FA')}</span>
                    </div>
                  </Button>
                )}
              </div>
              <div className="absolute inset-0 bg-background/5 rounded-lg cursor-not-allowed z-10" title="2FA is currently under development" />
            </div>
          </div>

          <Separator />

          {/* Active Sessions */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="size-5 text-muted-foreground" />
                <h3 className="font-semibold text-base">{t('settings.security.sessionsTitle')}</h3>
              </div>
              {sessions.length > 1 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full sm:w-auto"
                      type="button"
                      variant="outline"
                    >
                      {t('settings.security.revokeAll')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('settings.security.revokeAllTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settings.security.revokeAllDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={onRevokeAllSessions}>
                        {t('settings.security.revokeAll')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t('settings.security.noSessions')}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {sessions.map((session) => (
                  <div
                    className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-start"
                    key={session.id}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted mt-1">
                        {session.device.includes("Mobile") || session.os?.includes("Android") || session.os?.includes("iOS") ? (
                          <Smartphone className="size-5" />
                        ) : (
                          <Monitor className="size-5" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm">
                            {session.device} {session.browser && `• ${session.browser}`}
                          </span>
                          {session.current && (
                            <Badge className="text-[10px] h-4 px-1.5 bg-green-500 hover:bg-green-600 text-white border-none" variant="default">
                              {t('settings.security.currentSession')}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3 opacity-70" />
                            <span>{session.ipAddress} (<IpLocationDisplay ip={session.ipAddress} fallback={session.location} />)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3 opacity-70" />
                            <span>{t('settings.security.firstSeen')}: {formatDate(session.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Activity className="size-3 opacity-70" />
                            <span>{t('settings.security.lastActive')}: {formatRelativeTime(session.lastActive)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Shield className="size-3 opacity-70" />
                            <span>{t('settings.security.expires')}: {formatDate(session.expiresAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {!session.current && (
                      <Button
                        className="w-full sm:w-auto h-8 px-3 text-xs gap-1.5"
                        disabled={isRevoking === session.id}
                        onClick={() => {
                          setIsRevoking(session.id);
                          onRevokeSession?.(session.id).finally(() =>
                            setIsRevoking(null)
                          );
                        }}
                        type="button"
                        variant="outline"
                      >
                        {isRevoking === session.id ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            {t('settings.security.revoking')}
                          </>
                        ) : (
                          <>
                            <Trash2 className="size-3" />
                            {t('settings.security.revoke')}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Security History */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">{t('settings.security.historyTitle')}</h3>
            </div>

            {securityHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {t('settings.security.noHistory')}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {securityHistory.map((event) => {
                  const Icon = getEventIcon(event.type);
                  return (
                    <div
                      className="flex items-start gap-3 rounded-lg border p-4"
                      key={event.id}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">
                            {event.description}
                          </span>
                          {getStatusBadge(event.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            <IpLocationDisplay ip={event.ipAddress} fallback={event.location} />
                          </span>
                          <span>•</span>
                          <span>{event.ipAddress}</span>
                          <span>•</span>
                          <span>{formatDate(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Backup Codes Dialog */}
      <Dialog
        onOpenChange={setBackupCodesDialogOpen}
        open={backupCodesDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.security.backupCodes.title')}</DialogTitle>
            <DialogDescription>
              {t('settings.security.backupCodes.desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-4">
              {backupCodes.map((code, index) => (
                <code className="font-medium font-mono text-sm" key={index}>
                  {showBackupCodes ? code : "•".repeat(8)}
                </code>
              ))}
            </div>
            <Button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              type="button"
              variant="outline"
            >
              {showBackupCodes ? (
                <div className="flex items-center gap-2">
                  <EyeOff className="size-4" />
                  <span>{t('settings.security.backupCodes.hide')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Eye className="size-4" />
                  <span>{t('settings.security.backupCodes.show')}</span>
                </div>
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setBackupCodesDialogOpen(false)}
              type="button"
            >
              {t('logs.common.done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
