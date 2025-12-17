import type { VsnDocument, VsnPage, VsnRegion } from './types';

export function createTemplateFromVsn(input: { doc: VsnDocument; keepPageSettings?: boolean }): VsnDocument {
  const next = deepClone(stripEditorFields(input.doc)) as VsnDocument;
  const pages = next.Programs?.Program?.Pages?.Page;
  if (!Array.isArray(pages)) return next;

  for (const page of pages as VsnPage[]) {
    if (!input.keepPageSettings) {
      page.AppointDuration = '10000';
      page.LoopType = '1';
      page.BgFile = null;
    }

    const regions = page.Regions?.Region;
    if (!Array.isArray(regions)) continue;

    for (const region of regions as VsnRegion[]) {
      if (region.Items && Array.isArray(region.Items.Item)) {
        region.Items.Item = [];
      } else {
        region.Items = { Item: [] };
      }
    }
  }

  // Templates are meant to be reused; clear program id-ish fields when present.
  if (next.Programs?.Program) {
    next.Programs.Program.Id = null;
    if (next.Programs.Program.Information) next.Programs.Program.Information.Scale = null;
  }

  return next;
}

export function stripEditorFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripEditorFields);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith('__')) continue;
    out[key] = stripEditorFields(child);
  }
  return out;
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

