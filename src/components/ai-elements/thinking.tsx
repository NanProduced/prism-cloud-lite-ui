import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Thinking({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4 animate-pulse text-primary/70" />
        助手正在生成…
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full rounded-full bg-primary/10" />
        <div className="h-2 w-[85%] rounded-full bg-primary/10" />
        <div className="h-2 w-[70%] rounded-full bg-primary/10" />
      </div>
    </div>
  );
}

