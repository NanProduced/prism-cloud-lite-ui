export type WidgetType =
  | 'DEVICE_HEALTH'
  | 'ATTENTION'
  | 'QUICK_ACTIONS'
  | 'RECENT_ACTIVITY'
  | 'PLAYBACK_STATS'
  | 'ONLINE_TREND'
  | 'STORAGE_LEDGER'
  | 'SUBSCRIPTION'
  | 'PINNED_DEVICES'
  | 'WEATHER'
  | 'CALENDAR'
  | 'MEMO';

export interface WidgetLayout {
  i: string; // Widget ID (usually same as type or uuid)
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  layout: WidgetLayout;
  settings?: Record<string, any>;
  pinned?: boolean;
}

export interface DashboardLayoutV1 {
  version: 1;
  updatedAt: string;
  widgets: WidgetConfig[];
}

export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  description: string;
  icon: any;
  component: React.ComponentType<any>;
  defaultLayout: { w: number; h: number };
  isPinned?: boolean;
  category: 'Business' | 'Insight' | 'Utility';
}
