import { Sun, Volume2, Power, Plug, Thermometer, Trash2, Info, type LucideIcon } from 'lucide-react';

export interface CommandTypeInfo {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const COMMAND_TYPE_CONFIG: Record<string, CommandTypeInfo> = {
  BRIGHTNESS: {
    icon: Sun,
    label: 'Brightness',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
  },
  VOLUME: {
    icon: Volume2,
    label: 'Volume',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  },
  POWER: {
    icon: Power,
    label: 'Power',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  },
  INPUT_MODE: {
    icon: Plug,
    label: 'Input',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
  },
  COLOR_TEMP: {
    icon: Thermometer,
    label: 'Color Temp',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
  },
  CLEAR_CACHE: {
    icon: Trash2,
    label: 'Clear Cache',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  },
};

export const DEFAULT_COMMAND_TYPE_INFO: CommandTypeInfo = {
  icon: Info,
  label: 'Unknown',
  color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
};

export function getCommandTypeInfo(type: string | undefined): CommandTypeInfo {
  return COMMAND_TYPE_CONFIG[type || ''] || DEFAULT_COMMAND_TYPE_INFO;
}
