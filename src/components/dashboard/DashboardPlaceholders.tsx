import { type ComponentType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FilePlus,
  Upload,
  MonitorPlay,
  MapPin,
  BarChart3,
  Radio,
  CalendarClock,
  MessageSquare,
} from "lucide-react";

interface PlaceholderProps {
  title: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  action?: string;
}

function PlaceholderState({ title, desc, icon: Icon, action }: PlaceholderProps) {
  return (
    <Card className="h-full border-dashed">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{desc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex h-40 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground max-w-sm">{desc}</p>
        {action && (
          <Button size="sm" className="px-6">
            {action}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export const MediaPlaceholder = () => (
  <PlaceholderState title="Media Library" desc="Manage your images and videos here." icon={Upload} action="Upload Media" />
);

export const ProgramsPlaceholder = () => (
  <PlaceholderState title="Programs" desc="Create and schedule signage content." icon={FilePlus} action="Create Program" />
);

export const DevicesPlaceholder = () => (
  <PlaceholderState title="Device Management" desc="Monitor and control your screen fleet." icon={MonitorPlay} action="Add Device" />
);

export const MapPlaceholder = () => (
  <PlaceholderState title="Device Map" desc="Geographic view of your devices." icon={MapPin} />
);

export const AnalyticsPlaceholder = () => (
  <PlaceholderState title="Analytics" desc="Detailed reports on playback and engagement." icon={BarChart3} />
);

export const MonitoringPlaceholder = () => (
  <PlaceholderState title="System Monitoring" desc="Real-time health status of hardware." icon={Radio} />
);

export const SchedulePlaceholder = () => (
  <PlaceholderState title="Schedule" desc="Plan when playlists run across your fleet." icon={CalendarClock} action="Create schedule" />
);

export const MessagesPlaceholder = () => (
  <PlaceholderState title="Message Center" desc="Centralize alerts and user communications." icon={MessageSquare} />
);
