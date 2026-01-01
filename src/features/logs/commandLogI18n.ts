export type DeviceCommandStatus =
  | 'PUBLISHED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'FAILED';

export type DeviceActionTrackingLevel =
  | 'UPDATE_ONLY'
  | 'ACK_ONLY'
  | 'PROPERTY_MATCH'
  | 'EXPLICIT_RESULT';

export type DeviceCommandUserStatus =
  | DeviceCommandStatus
  | 'DONE' // CONFIRMED for ACK_ONLY/UPDATE_ONLY
  | 'UNKNOWN';

export function normalizeEnum(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

export function toCommandStatus(value: string | null | undefined): DeviceCommandStatus | null {
  const v = normalizeEnum(value);
  if (v === 'PUBLISHED') return 'PUBLISHED';
  if (v === 'CONFIRMED') return 'CONFIRMED';
  if (v === 'COMPLETED') return 'COMPLETED';
  if (v === 'EXPIRED') return 'EXPIRED';
  if (v === 'FAILED') return 'FAILED';
  return null;
}

export function toTrackingLevel(value: string | null | undefined): DeviceActionTrackingLevel | null {
  const v = normalizeEnum(value);
  if (v === 'UPDATE_ONLY') return 'UPDATE_ONLY';
  if (v === 'ACK_ONLY') return 'ACK_ONLY';
  if (v === 'PROPERTY_MATCH') return 'PROPERTY_MATCH';
  if (v === 'EXPLICIT_RESULT') return 'EXPLICIT_RESULT';
  return null;
}

export function deriveUserStatus(args: {
  status?: string | null;
  trackingLevel?: string | null;
  accepted?: boolean | null;
}): DeviceCommandUserStatus {
  const status = toCommandStatus(args.status);
  if (args.accepted === false) return 'FAILED';
  if (!status) return 'UNKNOWN';

  if (status === 'FAILED' || status === 'EXPIRED' || status === 'COMPLETED') return status;
  if (status === 'PUBLISHED') return 'PUBLISHED';

  // CONFIRMED
  const tracking = toTrackingLevel(args.trackingLevel);
  if (tracking === 'ACK_ONLY' || tracking === 'UPDATE_ONLY') return 'DONE';
  return 'CONFIRMED';
}

export function getUserStatusTone(
  userStatus: DeviceCommandUserStatus
): 'success' | 'error' | 'warning' | 'muted' {
  if (userStatus === 'COMPLETED' || userStatus === 'DONE') return 'success';
  if (userStatus === 'FAILED' || userStatus === 'EXPIRED') return 'error';
  if (userStatus === 'PUBLISHED' || userStatus === 'CONFIRMED') return 'warning';
  return 'muted';
}

export function getActionTypeLabelKey(actionType: string | null | undefined): string {
  const v = normalizeEnum(actionType);
  const known = new Set([
    'BRIGHTNESS',
    'POWER',
    'COLOR_TEMP',
    'VOLUME',
    'CLEAR_CACHE',
    'INPUT_MODE',
    'TIMEZONE',
    'LOCALE',
    'CONTENT_REPORT_SWITCH',
    'SCREENSHOT',
    'SET_SENSOR_REPORT_TIME',
    'DELETE_DEVICE_VSN',
    'CLEAR_DEVICE_PROGRAM',
  ]);
  return v && known.has(v) ? `logs.command.actionType.${v}` : 'logs.command.actionType.UNKNOWN';
}

export function getTrackingLevelLabelKey(trackingLevel: string | null | undefined): string {
  const v = normalizeEnum(trackingLevel);
  const known = new Set(['UPDATE_ONLY', 'ACK_ONLY', 'PROPERTY_MATCH', 'EXPLICIT_RESULT']);
  return v && known.has(v) ? `logs.command.trackingLevel.${v}` : 'logs.command.trackingLevel.UNKNOWN';
}

export function getStatusLabelKey(userStatus: DeviceCommandUserStatus): string {
  if (userStatus === 'DONE') return 'logs.command.statusUi.DONE';
  if (userStatus === 'UNKNOWN') return 'logs.command.statusUi.UNKNOWN';
  return `logs.command.status.${userStatus}`;
}
