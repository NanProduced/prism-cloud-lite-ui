import { type ComponentType } from "react";
import {
  AnalyticsPlaceholder,
  DevicesPlaceholder,
  MapPlaceholder,
  MediaPlaceholder,
  MonitoringPlaceholder,
  ProgramsPlaceholder,
  SchedulePlaceholder,
  MessagesPlaceholder,
} from "@/components/dashboard/DashboardPlaceholders";

const createPage = (Component: ComponentType) => () => (
  <div className="py-4">
    <Component />
  </div>
);

export const MediaPage = createPage(MediaPlaceholder);
export const ProgramsPage = createPage(ProgramsPlaceholder);
export const DevicesPage = createPage(DevicesPlaceholder);
export const MapPage = createPage(MapPlaceholder);
export const AnalyticsPage = createPage(AnalyticsPlaceholder);
export const MonitoringPage = createPage(MonitoringPlaceholder);
export const SchedulePage = createPage(SchedulePlaceholder);
export const MessagesPage = createPage(MessagesPlaceholder);

export const SettingsPage = () => (
  <div className="rounded-2xl border border-dashed bg-white p-6">
    <h2 className="text-lg font-semibold">Settings</h2>
    <p className="mt-2 text-sm text-muted-foreground">
      Placeholder for account and tenant preferences. Customize this section with real forms once APIs are ready.
    </p>
  </div>
);

export const LogsPage = () => (
  <div className="rounded-2xl border border-dashed bg-white p-6">
    <h2 className="text-lg font-semibold">Logs</h2>
    <p className="mt-2 text-sm text-muted-foreground">Future real-time log streaming and filters will appear here.</p>
  </div>
);
