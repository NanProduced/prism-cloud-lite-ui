import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Building2,
  CircleCheck,
  FlaskConical,
  Home,
  Info,
  MapPin,
  Megaphone,
  ShieldAlert,
  Store,
  Utensils,
  Wrench,
  Briefcase,
  Trees,
} from 'lucide-react';

export type TagColorPresetKey =
  | 'slate'
  | 'stone'
  | 'emerald'
  | 'sky'
  | 'indigo'
  | 'violet'
  | 'rose'
  | 'amber';

export const TAG_COLOR_PRESETS: Array<{
  key: TagColorPresetKey;
  label: string;
  className: string;
}> = [
  {
    key: 'slate',
    label: 'Slate',
    className:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-700',
  },
  {
    key: 'stone',
    label: 'Stone',
    className:
      'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-900/40 dark:text-stone-200 dark:border-stone-700',
  },
  {
    key: 'emerald',
    label: 'Sage',
    className:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700',
  },
  {
    key: 'sky',
    label: 'Sky',
    className:
      'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700',
  },
  {
    key: 'indigo',
    label: 'Indigo',
    className:
      'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700',
  },
  {
    key: 'violet',
    label: 'Violet',
    className:
      'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700',
  },
  {
    key: 'rose',
    label: 'Rose',
    className:
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700',
  },
  {
    key: 'amber',
    label: 'Amber',
    className:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700',
  },
];

export type TagIconKey =
  | 'MapPin'
  | 'Store'
  | 'Building2'
  | 'Home'
  | 'Megaphone'
  | 'Utensils'
  | 'Info'
  | 'AlertTriangle'
  | 'CircleCheck'
  | 'ShieldAlert'
  | 'FlaskConical'
  | 'Wrench'
  | 'Briefcase'
  | 'Trees';

export const TAG_ICON_OPTIONS: Array<{
  key: TagIconKey;
  label: string;
  Icon: LucideIcon;
}> = [
  { key: 'MapPin', label: 'Location', Icon: MapPin },
  { key: 'Store', label: 'Store', Icon: Store },
  { key: 'Building2', label: 'Building', Icon: Building2 },
  { key: 'Home', label: 'Home', Icon: Home },
  { key: 'Briefcase', label: 'Work', Icon: Briefcase },
  { key: 'Trees', label: 'Outdoor', Icon: Trees },
  { key: 'Megaphone', label: 'Ad', Icon: Megaphone },
  { key: 'Utensils', label: 'Menu', Icon: Utensils },
  { key: 'Info', label: 'Info', Icon: Info },
  { key: 'AlertTriangle', label: 'Alert', Icon: AlertTriangle },
  { key: 'CircleCheck', label: 'Check', Icon: CircleCheck },
  { key: 'ShieldAlert', label: 'Shield', Icon: ShieldAlert },
  { key: 'FlaskConical', label: 'Test', Icon: FlaskConical },
  { key: 'Wrench', label: 'Tool', Icon: Wrench },
];

const TAG_ICON_MAP: Record<TagIconKey, LucideIcon> = TAG_ICON_OPTIONS.reduce(
  (acc, option) => {
    acc[option.key] = option.Icon;
    return acc;
  },
  {} as Record<TagIconKey, LucideIcon>,
);

export function resolveTagIcon(iconName?: string): LucideIcon | null {
  if (!iconName) return null;
  const icon = TAG_ICON_MAP[iconName as TagIconKey];
  return icon ?? null;
}

export function isHexColor(color: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color);
}

export function hexToRgba(hex: string, alpha: number): string {
  if (!isHexColor(hex)) return `rgba(0,0,0,${alpha})`;
  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getTagPresetClassName(color: string): string | null {
  const preset = TAG_COLOR_PRESETS.find((p) => p.key === color);
  return preset?.className ?? null;
}

