"use client";

import { Check, ChevronDown, ChevronUp, Loader2, Save, Phone, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/registry/new-york/ui/button";
import { Badge } from "@/registry/new-york/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/new-york/ui/card";
import { Field, FieldContent, FieldError, FieldLabel } from "@/registry/new-york/ui/field";
import { InputGroup, InputGroupInput } from "@/registry/new-york/ui/input-group";
import { Separator } from "@/registry/new-york/ui/separator";
import { ALL_AVATARS, getAvatarById } from "@/lib/avatars";

export interface ProfileData {
  name: string;
  email: string;
  avatarPreset: string;
  phone?: string;
}

export interface SettingsProfileProps {
  profile?: ProfileData;
  onSave?: (data: ProfileData) => Promise<void>;
  onBindPhoneRequest?: (phone: string) => Promise<void>;
  onBindPhoneConfirm?: (phone: string, code: string) => Promise<void>;
  className?: string;
}

export default function SettingsProfile({
  profile,
  onSave,
  onBindPhoneRequest,
  onBindPhoneConfirm,
  className,
}: SettingsProfileProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProfileData>({
    name: profile?.name || "",
    email: profile?.email || "",
    avatarPreset: profile?.avatarPreset || ALL_AVATARS[0]?.id || "m-1",
    phone: profile?.phone || "",
  });

  const [isBindingMode, setIsBindingMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isConfirmingOtp, setIsConfirmingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!formData.phone) {
      setErrors({ phone: "Phone number is required" });
      return;
    }
    setErrors({});
    setIsSendingOtp(true);
    try {
      await onBindPhoneRequest?.(formData.phone);
      setOtpSent(true);
      setCountdown(60);
    } catch (error) {
      setErrors({ phone: error instanceof Error ? error.message : "Failed to send OTP" });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleConfirmBind = async () => {
    if (!otpCode) {
      setErrors({ otp: "Verification code is required" });
      return;
    }
    setErrors({});
    setIsConfirmingOtp(true);
    try {
      if (formData.phone) {
        await onBindPhoneConfirm?.(formData.phone, otpCode);
        setIsBindingMode(false);
        setOtpSent(false);
        setOtpCode("");
      }
    } catch (error) {
      setErrors({ otp: error instanceof Error ? error.message : "Failed to confirm" });
    } finally {
      setIsConfirmingOtp(false);
    }
  };

  const handleSave = async () => {
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: "Display name is required" });
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(formData);
    } catch (error) {
      setErrors({
        _general: error instanceof Error ? error.message : "Failed to save",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAvatar = getAvatarById(formData.avatarPreset) || ALL_AVATARS[0];

  return (
    <Card className={cn("w-full shadow-xs", className)}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <CardTitle className="wrap-break-word">Profile</CardTitle>
            <CardDescription className="wrap-break-word">
              Choose a preset avatar and manage your display name.
            </CardDescription>
          </div>
          {onSave && (
            <Button
              aria-busy={isSaving}
              className="w-full sm:w-auto"
              data-loading={isSaving}
              disabled={isSaving}
              onClick={handleSave}
              type="button"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span className="whitespace-nowrap">Saving…</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span className="whitespace-nowrap">Save</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {errors._general && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-destructive text-sm">{errors._general}</p>
            </div>
          )}

          <Field>
            <FieldLabel>Avatar</FieldLabel>
            <FieldContent>
              <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-4">
                  <div
                    aria-label="Selected avatar"
                    className="flex size-14 items-center justify-center overflow-hidden rounded-full border bg-background shadow-sm"
                  >
                    {selectedAvatar ? (
                      <img
                        alt="Current avatar"
                        className="size-full object-cover"
                        src={selectedAvatar.url}
                      />
                    ) : (
                      <div className="size-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Profile Picture
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click "Change" to pick a new one.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                >
                  {showAvatarPicker ? (
                    <>
                      <ChevronUp className="size-4" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4" />
                      <span>Change</span>
                    </>
                  )}
                </Button>
              </div>

              {showAvatarPicker && (
                <div className="mt-4 rounded-lg border bg-card p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                    {ALL_AVATARS.map((avatar) => {
                      const selected = formData.avatarPreset === avatar.id;
                      return (
                        <button
                          aria-label="Select avatar"
                          className={cn(
                            "group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-background p-1 transition-all hover:scale-105 hover:shadow-md",
                            selected && "border-primary ring-2 ring-ring/50"
                          )}
                          key={avatar.id}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              avatarPreset: avatar.id,
                            }))
                          }
                          type="button"
                        >
                          <img
                            alt=""
                            className="size-full rounded-md object-cover"
                            src={avatar.url}
                          />
                          {selected && (
                            <span className="absolute right-1 top-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Check className="size-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </FieldContent>
          </Field>

          <Separator />

          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="display-name">
                Display name <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    autoComplete="nickname"
                    id="display-name"
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Your display name"
                    value={formData.name}
                  />
                </InputGroup>
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupInput
                    disabled
                    id="email"
                    placeholder="your.email@example.com"
                    type="email"
                    value={formData.email}
                  />
                </InputGroup>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <FieldContent>
                {profile?.phone ? (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Phone className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{profile.phone}</p>
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <ShieldCheck className="size-3" />
                        <span>Verified & Bound</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                      Active
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!isBindingMode ? (
                      <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed p-4">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Phone className="size-5 opacity-50" />
                          <p className="text-sm">No phone number linked to this account.</p>
                        </div>
                        <Button
                          onClick={() => setIsBindingMode(true)}
                          size="sm"
                          variant="outline"
                        >
                          Link Phone
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-lg border bg-card p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Link Phone Number</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground"
                            onClick={() => {
                              setIsBindingMode(false);
                              setOtpSent(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>

                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <InputGroup>
                              <InputGroupInput
                                id="phone-input"
                                placeholder="Phone number (e.g. 13800138000)"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                disabled={otpSent}
                              />
                              {!otpSent && (
                                <Button
                                  variant="secondary"
                                  className="rounded-l-none border-l-0"
                                  onClick={handleSendOtp}
                                  disabled={isSendingOtp || !formData.phone}
                                >
                                  {isSendingOtp ? <Loader2 className="size-3 animate-spin" /> : "Send Code"}
                                </Button>
                              )}
                            </InputGroup>
                            {errors.phone && <FieldError>{errors.phone}</FieldError>}
                          </div>

                          {otpSent && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground">Verification Code</label>
                                <button
                                  className="text-xs text-primary hover:underline disabled:opacity-50"
                                  disabled={countdown > 0 || isSendingOtp}
                                  onClick={handleSendOtp}
                                >
                                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                                </button>
                              </div>
                              <InputGroup>
                                <InputGroupInput
                                  placeholder="6-digit code"
                                  value={otpCode}
                                  onChange={(e) => setOtpCode(e.target.value)}
                                />
                              </InputGroup>
                              {errors.otp && <FieldError>{errors.otp}</FieldError>}
                              <Button
                                className="w-full"
                                onClick={handleConfirmBind}
                                disabled={isConfirmingOtp || otpCode.length < 4}
                              >
                                {isConfirmingOtp ? (
                                  <>
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                    Confirming...
                                  </>
                                ) : (
                                  "Verify & Link"
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </FieldContent>
            </Field>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

