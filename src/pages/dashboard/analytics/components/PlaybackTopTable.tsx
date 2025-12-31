import { PlayCircle, Award, ChevronRight, Layers, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface TopPlaybackItem {
  id: string;
  name: string;
  playCount: number;
  playSeconds: number;
  version?: string;
}

interface PlaybackTopTableProps {
  data: TopPlaybackItem[];
  type: 'program' | 'media';
  selectedId?: string;
  onSelect: (item: TopPlaybackItem) => void;
  className?: string;
}

export function PlaybackTopTable({
  data,
  type,
  selectedId,
  onSelect,
  className,
}: PlaybackTopTableProps) {
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const maxPlays = Math.max(...data.map(d => d.playCount), 1);

  return (
    <ScrollArea className={cn("w-full h-full", className)}>
      <Table>
        <TableHeader className="bg-muted/50 sticky top-0 z-10">
          <TableRow>
            <TableHead className="w-[300px] text-[10px] font-bold tracking-widest">
              {type === 'program' ? 'Program' : 'Asset'}
            </TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest text-right">Plays</TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const isSelected = item.id === selectedId;
            const progress = (item.playCount / maxPlays) * 100;

            return (
              <TableRow 
                key={item.id}
                className={cn(
                  "cursor-pointer group transition-colors",
                  isSelected ? "bg-primary/[0.03] hover:bg-primary/[0.05]" : "hover:bg-muted/40"
                )}
                onClick={() => onSelect(item)}
              >
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className={cn(
                        "p-2 rounded-xl transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        {type === 'program' ? <Layers className="h-4 w-4" /> : <Film className="h-4 w-4" />}
                      </div>
                      {index < 3 && (
                        <div className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white shadow-sm ring-1 ring-background">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold truncate", isSelected && "text-primary")}>
                          {item.name || 'Untitled'}
                        </span>
                        {item.version && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-bold opacity-60">
                            V{item.version}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progress} className="h-1 flex-1 opacity-20" />
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-[11px] font-bold tabular-nums">{item.playCount.toLocaleString()}</span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                   <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground/80 tabular-nums">
                        {formatDuration(item.playSeconds)}
                      </span>
                      {isSelected && <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                   </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}