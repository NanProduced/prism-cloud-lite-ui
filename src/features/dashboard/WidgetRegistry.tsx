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
    title: 'Device Health',
    description: 'Summary of online/offline devices',
    icon: <Activity className="h-4 w-4" />,
    component: DeviceHealthWidget,
    defaultLayout: { w: 1, h: 2 },
    isPinned: true,
    category: 'Business',
  },
  ATTENTION: {
    type: 'ATTENTION',
    title: 'Attention',
    description: 'Aggregated pending tasks and failed commands',
    icon: <AlertCircle className="h-4 w-4" />,
    component: AttentionWidget,
    defaultLayout: { w: 2, h: 2 },
    isPinned: true,
    category: 'Business',
  },
  QUICK_ACTIONS: {
    type: 'QUICK_ACTIONS',
    title: 'Quick Actions',
    description: 'Shortcuts to common tasks',
    icon: <Zap className="h-4 w-4" />,
    component: QuickActionsWidget,
    defaultLayout: { w: 1, h: 2 },
    isPinned: true,
    category: 'Business',
  },
  RECENT_ACTIVITY: {
    type: 'RECENT_ACTIVITY',
    title: 'Recent Activity',
    description: 'Timeline of command logs and messages',
    icon: <History className="h-4 w-4" />,
    component: RecentActivityWidget,
    defaultLayout: { w: 2, h: 2 },
    isPinned: true,
    category: 'Business',
  },
  PLAYBACK_STATS: {
    type: 'PLAYBACK_STATS',
    title: 'Playback Stats',
    description: 'Top programs and media performance',
    icon: <LineChart className="h-4 w-4" />,
    component: PlaybackOverviewWidget,
    defaultLayout: { w: 2, h: 2 },
    category: 'Insight',
  },
  ONLINE_TREND: {
    type: 'ONLINE_TREND',
    title: 'Online Trend',
    description: 'Device uptime trend over time',
    icon: <LineChart className="h-4 w-4" />,
    component: OnlineTrendWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Insight',
  },
  STORAGE_LEDGER: {
    type: 'STORAGE_LEDGER',
    title: 'Storage Ledger',
    description: 'Detailed breakdown of space usage',
    icon: <HardDrive className="h-4 w-4" />,
    component: StorageLedgerWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Insight',
  },
  SUBSCRIPTION: {
    type: 'SUBSCRIPTION',
    title: 'Subscription',
    description: 'User plan and quota status',
    icon: <Shield className="h-4 w-4" />,
    component: SubscriptionWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Insight',
  },
  PINNED_DEVICES: {
    type: 'PINNED_DEVICES',
    title: 'Pinned Devices',
    description: 'Live status of selected screens',
    icon: <Monitor className="h-4 w-4" />,
    component: PinnedDevicesWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Insight',
  },
  WEATHER: {
    type: 'WEATHER',
    title: 'Weather',
    description: 'Local weather conditions',
    icon: <Cloud className="h-4 w-4" />,
    component: WeatherWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Utility',
  },
  CALENDAR: {
    type: 'CALENDAR',
    title: 'Calendar',
    description: 'Local date and calendar view',
    icon: <Calendar className="h-4 w-4" />,
    component: CalendarWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Utility',
  },
  MEMO: {
    type: 'MEMO',
    title: 'Sticky Note',
    description: 'Personal memo for quick notes',
    icon: <StickyNote className="h-4 w-4" />,
    component: MemoWidget,
    defaultLayout: { w: 1, h: 2 },
    category: 'Utility',
  },
};
