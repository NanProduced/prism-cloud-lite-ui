import { ArrowDown, ArrowUp, Image as ImageIcon, Trash2, Type as TypeIcon, Video as VideoIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { VsnItem } from '@/features/programs/vsn/types';

import type { EditorMaterial } from '../types';

type MaterialIndex = Record<string, EditorMaterial>;

export function RegionTimeline({
  items,
  selectedItemIndex,
  materialIndex,
  showDevFields = false,
  onSelectItem,
  onMoveItem,
  onDeleteItem,
}: {
  items: VsnItem[];
  selectedItemIndex: number | null;
  materialIndex: MaterialIndex;
  showDevFields?: boolean;
  onSelectItem: (index: number) => void;
  onMoveItem: (from: number, to: number) => void;
  onDeleteItem: (index: number) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Playlist</p>
        <p className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? '' : 's'}</p>
      </div>

      <ScrollArea className="flex-1 pr-2">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Add media or text to this region.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <div
                key={`${item.Type}-${index}`}
                className={cn(
                  'group flex items-center gap-2 rounded-lg border bg-background px-3 py-2',
                  selectedItemIndex === index ? 'border-primary/60 bg-accent/30' : 'hover:bg-accent/20',
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelectItem(index)}
                >
                  <div className="flex items-center gap-2">
                    <ItemIcon type={item.Type} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{getItemLabel(item, materialIndex)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.Duration ? `${Math.round(Number(item.Duration) / 1000)}s` : '—'} · {getItemTypeLabel(item.Type, showDevFields)}
                      </p>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onMoveItem(index, index - 1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onMoveItem(index, index + 1)}
                    disabled={index === items.length - 1}
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDeleteItem(index)}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function getItemLabel(item: VsnItem, materialIndex: MaterialIndex): string {
  if (item.Type === '4' || item.Type === '5') return item.Text ?? 'Text';
  const materialId = item.FileSource?.Resource_ID;
  if (materialId && materialIndex[materialId]) return materialIndex[materialId].name;
  return getItemTypeLabel(item.Type, false);
}

function getItemTypeLabel(type: string, showDevFields: boolean): string {
  if (type === '2') return 'Image';
  if (type === '3') return 'Video';
  if (type === '4' || type === '5') return 'Text';
  if (type === '6') return 'GIF';
  return showDevFields ? `Type ${type}` : 'Media';
}

function ItemIcon({ type }: { type: string }) {
  if (type === '3') return <VideoIcon className="h-4 w-4 text-muted-foreground" />;
  if (type === '2' || type === '6') return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
  return <TypeIcon className="h-4 w-4 text-muted-foreground" />;
}
