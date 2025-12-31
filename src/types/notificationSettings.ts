import type { MessageKind, MessageStatus } from '@/types/message';

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:mm
  end: string; // HH:mm
}

export interface ToastNotificationSettings {
  enabled: boolean;
  triggerOnCreated: boolean;
  triggerOnUpdated: boolean;
  kinds: MessageKind[];
  statuses: MessageStatus[];
  types: string[]; // empty => allow all types
  quietHours: QuietHours;
  cooldownSeconds: number;
}

export interface NotificationSettingsV2 {
  version: 2;
  toast: ToastNotificationSettings;
}

export interface MessageTypeOption {
  type: string;
  label: string;
  description: string;
}

export const MESSAGE_TYPE_OPTIONS: MessageTypeOption[] = [
  {
    type: 'device.command.finished',
    label: 'Device command result',
    description: 'A device command finished (success/failure/timeout).',
  },
  {
    type: 'device.command.batch.finished',
    label: 'Batch device command result',
    description: 'A batch command completed with success/failed/expired counts.',
  },
  {
    type: 'program.publish.online.finished',
    label: 'Program publish (online devices finished)',
    description: 'Online devices finished downloading (some targets may still be offline).',
  },
  {
    type: 'program.publish.finished',
    label: 'Program publish finished',
    description: 'All target devices finished downloading the published program.',
  },
  {
    type: 'media.transcode',
    label: 'Media transcode',
    description: 'Media transcode task progress/result updates.',
  },
];

export const defaultNotificationSettings: NotificationSettingsV2 = {
  version: 2,
  toast: {
    enabled: false,
    triggerOnCreated: true,
    triggerOnUpdated: true,
    kinds: ['NOTIFICATION', 'TASK'],
    statuses: ['SUCCESS', 'FAILED'],
    types: [],
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    cooldownSeconds: 5,
  },
};

export function isNotificationSettingsV2(value: unknown): value is NotificationSettingsV2 {
  if (!value || typeof value !== 'object') return false;
  const v = value as any;
  if (v.version !== 2) return false;
  if (!v.toast || typeof v.toast !== 'object') return false;
  if (typeof v.toast.enabled !== 'boolean') return false;
  if (typeof v.toast.triggerOnCreated !== 'boolean') return false;
  if (typeof v.toast.triggerOnUpdated !== 'boolean') return false;
  if (!Array.isArray(v.toast.kinds)) return false;
  if (!Array.isArray(v.toast.statuses)) return false;
  if (!Array.isArray(v.toast.types)) return false;
  if (!v.toast.quietHours || typeof v.toast.quietHours !== 'object') return false;
  if (typeof v.toast.quietHours.enabled !== 'boolean') return false;
  if (typeof v.toast.quietHours.start !== 'string') return false;
  if (typeof v.toast.quietHours.end !== 'string') return false;
  if (typeof v.toast.cooldownSeconds !== 'number') return false;
  return true;
}
