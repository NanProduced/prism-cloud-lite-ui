import type { EditorSelection } from './types';

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

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

