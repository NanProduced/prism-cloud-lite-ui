import React from 'react';
import type { WidgetDefinition, WidgetType } from './types';
import { 
  Activity, 
  AlertCircle, 
  Zap, 
  History, 
  LineChart, 
  PieChart, 
  HardDrive, 
  Shield, 
  Cloud, 
  Calendar, 
  StickyNote,
  Monitor
} from 'lucide-react';

import { DeviceHealthWidget } from './widgets/DeviceHealthWidget';
import { AttentionWidget } from './widgets/AttentionWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { PlaybackOverviewWidget } from './widgets/PlaybackOverviewWidget';
import { OnlineTrendWidget } from './widgets/OnlineTrendWidget';
import { StorageLedgerWidget } from './widgets/StorageLedgerWidget';
import { SubscriptionWidget } from './widgets/SubscriptionWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { MemoWidget } from './widgets/MemoWidget';
import { PinnedDevicesWidget } from './widgets/PinnedDevicesWidget';

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  DEVICE_HEALTH: {
    type: 'DEVICE_HEALTH',
    title: 'dashboard.widgets.deviceHealth.title',
    description: 'dashboard.widgets.deviceHealth.description',
    icon: <Activity className="h-4 w-4" />,
    component: DeviceHealthWidget,
    defaultLayout: { w: 1, h: 2 },
    isPinned: true,
    category: 'Business',
  },
  ATTENTION: {
    type: 'ATTENTION',
    title: 'dashboard.widgets.attention.title',
    description: 'dashboard.widgets.attention.description',
    icon: <AlertCircle className="h-4 w-4" />,
    component: AttentionWidget,
    defaultLayout: { w: 2, h: 2 },
    isPinned: true,
    category: 'Business',
  },
  QUICK_ACTIONS: {
    type: 'QUICK_ACTIONS',
    title: 'dashboard.widgets.quickActions.title',
    description: 'dashboard.widgets.quickActions.description',
    icon: <Zap className="h-4 w-4" />,
    component: QuickActionsWidget,
    defaultLayout: { w: 1, h: 2 },
    isPinned: true,
    category: 'Business',
  },
  RECENT_ACTIVITY: {
    type: 'RECENT_ACTIVITY',
    title: 'dashboard.widgets.recentActivity.title',
    description: 'dashboard.widgets.recentActivity.description',
    icon: <History className="h-4 w-4" />,
    component: RecentActivityWidget,
    defaultLayout: { w: 2, h: 2 },
    isPinned: true,
    category: 'Business',
  },
  PLAYBACK_STATS: {
    type: 'PLAYBACK_STATS',
    title: 'dashboard.widgets.playbackStats.title',
    description: 'dashboard.widgets.playbackStats.description',
    icon: <LineChart className="h-4 w-4" />,
    component: PlaybackOverviewWidget,
    defaultLayout: { w: 2, h: 2 },
    category: 'Insight',
  },
  ONLINE_TREND: {
    type: 'ONLINE_TREND',
    title: 'dashboard.widgets.onlineTrend.title',
    description: 'dashboard.widgets.onlineTrend.description',
    icon: <LineChart className="h-4 w-4" />,
    component: OnlineTrendWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Insight',
  },
  STORAGE_LEDGER: {
    type: 'STORAGE_LEDGER',
    title: 'dashboard.widgets.storage.title',
    description: 'dashboard.widgets.storage.description',
    icon: <HardDrive className="h-4 w-4" />,
    component: StorageLedgerWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Insight',
  },
  SUBSCRIPTION: {
    type: 'SUBSCRIPTION',
    title: 'dashboard.widgets.subscription.title',
    description: 'dashboard.widgets.subscription.description',
    icon: <Shield className="h-4 w-4" />,
    component: SubscriptionWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Insight',
  },
  PINNED_DEVICES: {
    type: 'PINNED_DEVICES',
    title: 'dashboard.widgets.pinnedDevices.title',
    description: 'dashboard.widgets.pinnedDevices.description',
    icon: <Monitor className="h-4 w-4" />,
    component: PinnedDevicesWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Insight',
  },
  WEATHER: {
    type: 'WEATHER',
    title: 'dashboard.widgets.weather.title',
    description: 'dashboard.widgets.weather.description',
    icon: <Cloud className="h-4 w-4" />,
    component: WeatherWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Utility',
  },
  CALENDAR: {
    type: 'CALENDAR',
    title: 'dashboard.widgets.calendar.title',
    description: 'dashboard.widgets.calendar.description',
    icon: <Calendar className="h-4 w-4" />,
    component: CalendarWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Utility',
  },
  MEMO: {
    type: 'MEMO',
    title: 'dashboard.widgets.memo.title',
    description: 'dashboard.widgets.memo.description',
    icon: <StickyNote className="h-4 w-4" />,
    component: MemoWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Utility',
  },
};
