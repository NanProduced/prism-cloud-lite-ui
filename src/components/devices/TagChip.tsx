import type { Tag } from '@/types/device';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTagPresetClassName, hexToRgba, isHexColor, resolveTagIcon } from './tagging';

interface TagChipProps {
  tag: Tag;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
}

export function TagChip({ tag, className, textClassName, iconClassName }: TagChipProps) {
  const presetClassName = getTagPresetClassName(tag.color);
  const isCustomHex = isHexColor(tag.color);
  const Icon = resolveTagIcon(tag.icon);

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border px-2 py-0.5 text-xs font-medium',
        presetClassName ?? 'border-border bg-transparent',
        className,
      )}
      style={
        isCustomHex
          ? {
              borderColor: tag.color,
              color: tag.color,
              backgroundColor: hexToRgba(tag.color, 0.12),
            }
          : undefined
      }
    >
      {Icon && <Icon className={cn('h-3 w-3', iconClassName)} />}
      <span className={cn('truncate', textClassName)}>{tag.name}</span>
    </Badge>
  );
}

