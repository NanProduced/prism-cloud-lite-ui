import type { DeviceActionBase, ScheduleCommandActionType, UpsertScheduleCommandRuleReq } from '@/types/schedule';

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === 'string' ? v : null;
}

function readNumber(obj: Record<string, unknown>, key: string): number | null {
  const v = obj[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function normalizeTimeToHms(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const parts = s.split(':').map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const sec = parts.length === 3 ? Number(parts[2]) : 0;
  if (![h, m, sec].every((n) => Number.isInteger(n) && n >= 0)) return null;
  if (h > 23 || m > 59 || sec > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function inferActionType(authorUrl: string): ScheduleCommandActionType | null {
  const normalized = authorUrl.trim().toLowerCase();
  if (normalized === 'api/brightness') return 'BRIGHTNESS';
  if (normalized === 'api/volume') return 'VOLUME';
  if (normalized === 'api/colortemp') return 'COLOR_TEMP';
  if (normalized === 'api/inputmode') return 'INPUT_MODE';
  if (normalized === 'api/clrresunused') return 'CLEAR_CACHE';
  if (normalized === 'api/action') return 'POWER';
  return null;
}

export function parseScheduleCommandPayloadToUpsert(payload: unknown): UpsertScheduleCommandRuleReq | null {
  const root = asObject(payload);
  if (!root) return null;

  const operationObj = asObject(root.operation);
  if (!operationObj) return null;

  const authorUrl = readString(operationObj, 'author_url');
  if (!authorUrl) return null;

  const type = inferActionType(authorUrl);
  if (!type) return null;

  const rawContent = readString(operationObj, 'content') ?? '{}';
  let parsedBody: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(rawContent);
    const parsedObj = asObject(parsed);
    if (parsedObj) parsedBody = parsedObj;
  } catch {
    parsedBody = {};
  }

  const opTimesRaw = Array.isArray(root.op_time) ? root.op_time : [];
  const opTime = opTimesRaw
    .map((t) => (typeof t === 'string' ? normalizeTimeToHms(t) : null))
    .filter((v): v is string => Boolean(v));

  if (opTime.length === 0) return null;

  const ifLimitDate = Boolean(root.if_limit_date);
  const limitDate = ifLimitDate ? (root.limit_date ?? null) : null;

  const ifLimitWeekday = Boolean(root.if_limit_weekday);
  const limitWeekday = ifLimitWeekday ? (root.limit_weekday ?? null) : null;

  const operation: DeviceActionBase = { type, body: parsedBody };

  // POWER needs command (sleep/wakeup/reboot).
  if (type === 'POWER') {
    const cmd = typeof parsedBody.command === 'string' ? parsedBody.command : null;
    if (!cmd) {
      // Fallback by schedule 'name' if present
      const name = readString(root, 'name')?.toLowerCase() ?? '';
      if (name.includes('sleep')) operation.body = { command: 'sleep' };
      else if (name.includes('wakeup')) operation.body = { command: 'wakeup' };
      else if (name.includes('reboot')) operation.body = { command: 'reboot' };
    }
  }

  // For value-based actions, allow reading numeric value from optional payload.content.value as a fallback.
  if (type === 'BRIGHTNESS' && operation.body && operation.body.brightness == null) {
    const contentObj = asObject(root.content);
    const value = contentObj ? readNumber(contentObj, 'value') : null;
    if (value != null) operation.body = { ...operation.body, brightness: value };
  }
  if (type === 'VOLUME' && operation.body && operation.body.musicvolume == null && operation.body.volume == null) {
    const contentObj = asObject(root.content);
    const value = contentObj ? readNumber(contentObj, 'value') : null;
    if (value != null) operation.body = { ...operation.body, musicvolume: value };
  }
  if (type === 'COLOR_TEMP' && operation.body && operation.body.colortemp == null) {
    const contentObj = asObject(root.content);
    const value = contentObj ? readNumber(contentObj, 'value') : null;
    if (value != null) operation.body = { ...operation.body, colortemp: value };
  }

  return {
    operation,
    opTime,
    ifLimitDate: ifLimitDate || undefined,
    limitDate: ifLimitDate ? (limitDate as any) : undefined,
    ifLimitWeekday: ifLimitWeekday || undefined,
    limitWeekday: ifLimitWeekday ? (limitWeekday as any) : undefined,
  };
}

