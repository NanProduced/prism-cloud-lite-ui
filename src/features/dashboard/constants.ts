import type { DashboardLayoutV1, WidgetType } from "./types";

export const DASHBOARD_STORAGE_KEY = 'prism.dashboard.layout.v1';

export const DEFAULT_LAYOUT: DashboardLayoutV1 = {
  version: 1,
  updatedAt: new Date().toISOString(),
  widgets: [
    {
      id: 'DEVICE_HEALTH',
      type: 'DEVICE_HEALTH',
      pinned: true,
      layout: { i: 'DEVICE_HEALTH', x: 0, y: 0, w: 1, h: 2 },
    },
    {
      id: 'ATTENTION',
      type: 'ATTENTION',
      pinned: true,
      layout: { i: 'ATTENTION', x: 1, y: 0, w: 2, h: 2 },
    },
    {
      id: 'WEATHER',
      type: 'WEATHER',
      layout: { i: 'WEATHER', x: 3, y: 0, w: 1, h: 2 },
    },
    {
      id: 'QUICK_ACTIONS',
      type: 'QUICK_ACTIONS',
      pinned: true,
      layout: { i: 'QUICK_ACTIONS', x: 0, y: 2, w: 1, h: 2 },
    },
    {
      id: 'RECENT_ACTIVITY',
      type: 'RECENT_ACTIVITY',
      pinned: true,
      layout: { i: 'RECENT_ACTIVITY', x: 1, y: 2, w: 2, h: 2 },
    },
    {
      id: 'CALENDAR',
      type: 'CALENDAR',
      layout: { i: 'CALENDAR', x: 3, y: 2, w: 1, h: 2 },
    },
    {
      id: 'PLAYBACK_STATS',
      type: 'PLAYBACK_STATS',
      layout: { i: 'PLAYBACK_STATS', x: 0, y: 4, w: 2, h: 2 },
    },
    {
      id: 'STORAGE_LEDGER',
      type: 'STORAGE_LEDGER',
      layout: { i: 'STORAGE_LEDGER', x: 2, y: 4, w: 1, h: 2 },
    },
    {
      id: 'SUBSCRIPTION',
      type: 'SUBSCRIPTION',
      layout: { i: 'SUBSCRIPTION', x: 3, y: 4, w: 1, h: 2 },
    },
  ],
};

export const OPS_FOCUS_LAYOUT: DashboardLayoutV1 = {
  version: 1,
  updatedAt: new Date().toISOString(),
  widgets: [
    {
      id: 'DEVICE_HEALTH',
      type: 'DEVICE_HEALTH',
      pinned: true,
      layout: { i: 'DEVICE_HEALTH', x: 0, y: 0, w: 2, h: 2 },
    },
    {
      id: 'ATTENTION',
      type: 'ATTENTION',
      pinned: true,
      layout: { i: 'ATTENTION', x: 2, y: 0, w: 2, h: 2 },
    },
    {
      id: 'ONLINE_TREND',
      type: 'ONLINE_TREND',
      layout: { i: 'ONLINE_TREND', x: 0, y: 2, w: 2, h: 2 },
    },
    {
      id: 'RECENT_ACTIVITY',
      type: 'RECENT_ACTIVITY',
      pinned: true,
      layout: { i: 'RECENT_ACTIVITY', x: 2, y: 2, w: 2, h: 2 },
    },
    {
      id: 'STORAGE_LEDGER',
      type: 'STORAGE_LEDGER',
      layout: { i: 'STORAGE_LEDGER', x: 0, y: 4, w: 2, h: 2 },
    },
    {
      id: 'QUICK_ACTIONS',
      type: 'QUICK_ACTIONS',
      pinned: true,
      layout: { i: 'QUICK_ACTIONS', x: 2, y: 4, w: 2, h: 2 },
    },
  ],
};