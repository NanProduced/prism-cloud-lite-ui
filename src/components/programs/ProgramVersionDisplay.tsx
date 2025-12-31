import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { parseVsnFilename } from '@/lib/vsn';

interface ProgramVersionDisplayProps {
  name?: string;
  version?: number;
  variant?: 'default' | 'overlay' | 'compact';
  className?: string;
}

export const ProgramVersionDisplay = ({ 
  name, 
  version, 
  variant = 'default',
  className 
}: ProgramVersionDisplayProps) => {
  const parsed = useMemo(() => parseVsnFilename(name), [name]);
  if (!parsed && !name) return <span className="opacity-50">—</span>;

  const displayName = parsed?.programName || parsed?.titleSnapshot || parsed?.fileName || name;
  const displayVersion = version ?? parsed?.version;

  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <span className={cn(
        "truncate",
        variant === 'overlay' ? "text-base font-bold text-white" : 
        variant === 'compact' ? "text-xs font-semibold text-foreground/90" :
        "text-sm font-semibold text-foreground"
      )}>
        {displayName}
      </span>
      {displayVersion != null && (
        <Badge 
          variant="secondary" 
          className={cn(
            "px-1.5 text-[9px] font-black border-none shrink-0",
            variant === 'overlay' 
              ? "bg-white/20 text-white backdrop-blur-sm h-4.5" 
              : variant === 'compact'
              ? "bg-primary/5 text-primary/70 h-4 scale-90 origin-left"
              : "bg-primary/10 text-primary h-4.5"
          )}
        >
          v{displayVersion}
        </Badge>
      )}
    </div>
  );
};
