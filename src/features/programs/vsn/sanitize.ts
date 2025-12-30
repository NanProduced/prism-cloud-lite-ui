import type { VsnDocument } from './types';

function stripNullsDeep(value: unknown): unknown {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const next = value.map(stripNullsDeep).filter((v) => v !== undefined);
    return next;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(obj)) {
      const cleaned = stripNullsDeep(raw);
      if (cleaned === undefined) continue;
      out[key] = cleaned;
    }
    return out;
  }
  return value;
}

export function sanitizeVsnForPersist(doc: VsnDocument): VsnDocument {
  return stripNullsDeep(doc) as VsnDocument;
}

