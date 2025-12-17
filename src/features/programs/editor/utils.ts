import type { EditorSelection } from './types';
import type { VsnItem, VsnRegion } from '../vsn/types';

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export function vsnBgColorToCss(color: string): string {
  if (typeof color !== 'string') return '#000000';
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) return trimmed;
  if (!trimmed.startsWith('0x') || trimmed.length !== 10) return '#000000';

  const aa = parseInt(trimmed.slice(2, 4), 16);
  const rr = parseInt(trimmed.slice(4, 6), 16);
  const gg = parseInt(trimmed.slice(6, 8), 16);
  const bb = parseInt(trimmed.slice(8, 10), 16);
  if (![aa, rr, gg, bb].every((n) => Number.isFinite(n))) return '#000000';

  const alpha = Math.max(0, Math.min(1, aa / 255));
  if (alpha >= 0.999) {
    return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
  }
  return `rgba(${rr}, ${gg}, ${bb}, ${alpha.toFixed(3)})`;
}

export function cssHexToVsnBgColor(hex: string): string {
  if (typeof hex !== 'string') return '0xFF000000';
  const normalized = hex.trim().replace(/^#/, '');
  if (normalized.length === 6) return `0xFF${normalized.toUpperCase()}`;
  if (normalized.length === 8) return `0x${normalized.toUpperCase()}`;
  return '0xFF000000';
}

export function selectionFromVsnPath(path: string): Partial<EditorSelection> | null {
  if (typeof path !== 'string') return null;
  const pageMatch = /Pages\\.Page\\[(\\d+)]/.exec(path);
  if (!pageMatch) return null;
  const pageIndex = Number(pageMatch[1]);
  const regionMatch = /Regions\\.Region\\[(\\d+)]/.exec(path);
  const itemMatch = /Items\\.Item\\[(\\d+)]/.exec(path);

  return {
    pageIndex,
    regionIndex: regionMatch ? Number(regionMatch[1]) : null,
    itemIndex: itemMatch ? Number(itemMatch[1]) : null,
  };
}

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export type RegionMode = 'normal' | 'sync' | 'ticker';

export const REGION_EDITOR_NAME_KEY = '__EditorName';

export function getRegionMode(region: VsnRegion | null | undefined): RegionMode {
  const name = (region?.Name ?? '').trim();
  if (name === 'sync_program') return 'sync';
  if (name === 'singleline_scroll') return 'ticker';
  return 'normal';
}

export function getRegionDisplayName(region: VsnRegion, regionIndex?: number): string {
  const editorName = getEditorRegionName(region);
  const mode = getRegionMode(region);
  if (mode === 'sync') return editorName ?? 'Sync window';
  if (mode === 'ticker') return editorName ?? 'Ticker';
  const raw = (region.Name ?? '').trim();
  if (raw) return raw;
  if (typeof regionIndex === 'number') return `Region ${regionIndex + 1}`;
  return 'Region';
}

export function getEditorRegionName(region: VsnRegion): string | null {
  const raw = (region as unknown as Record<string, unknown>)[REGION_EDITOR_NAME_KEY];
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed : null;
}

export function canRegionAcceptItemType(mode: RegionMode, itemType: string): boolean {
  if (mode === 'sync') return itemType === '2' || itemType === '3' || itemType === '6';
  if (mode === 'ticker') return itemType === '2' || itemType === '5';
  return true;
}

export function regionHasOnlyAllowedItemTypes(region: VsnRegion, mode: RegionMode): boolean {
  if (mode === 'normal') return true;
  const items = region.Items?.Item;
  if (!Array.isArray(items)) return true;
  return items.every((item) => canRegionAcceptItemType(mode, (item as VsnItem).Type));
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}
