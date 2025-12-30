import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Film } from 'lucide-react';
import { ProgramTab } from './ProgramTab';
import { MediaTab } from './MediaTab';
import type { PlaybackBucket } from '@/services/telemetryApi';
import { cn } from '@/lib/utils';

interface PlaybackTabProps {
  from: string;
  to: string;
  tz: string;
  bucket: PlaybackBucket;
  className?: string;
}

export function PlaybackTab({ from, to, tz, bucket, className }: PlaybackTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'program' | 'media'>('program');

  return (
    <div className={cn('space-y-4', className)}>
      <Tabs
        value={activeSubTab}
        onValueChange={(v) => setActiveSubTab(v as 'program' | 'media')}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/40 p-1 rounded-lg border shadow-inner h-8">
            <TabsTrigger
              value="program"
              className="rounded-md px-4 text-[9px] font-bold uppercase tracking-wider data-[state=active]:bg-background gap-1.5 h-6"
            >
              <Layers className="h-3 w-3" />
              Programs
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="rounded-md px-4 text-[9px] font-bold uppercase tracking-wider data-[state=active]:bg-background gap-1.5 h-6"
            >
              <Film className="h-3 w-3" />
              Media Assets
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="program" className="mt-0 outline-none">
          <ProgramTab from={from} to={to} tz={tz} bucket={bucket} />
        </TabsContent>

        <TabsContent value="media" className="mt-0 outline-none">
          <MediaTab from={from} to={to} tz={tz} bucket={bucket} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
