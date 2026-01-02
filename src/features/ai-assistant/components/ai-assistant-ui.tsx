import React from 'react';
import { ExternalLink, CheckCircle2, CircleDashed, AlertCircle, Info, Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Types for AI SDK tool invocations
export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  result?: any;
  state: 'call' | 'result';
}

export function AIToolInvocation({ toolInvocation }: { toolInvocation: ToolInvocation }) {
  const isCompleted = toolInvocation.state === 'result';
  const hasError = isCompleted && toolInvocation.result?.error;
  
  return (
    <div className="my-2">
      <Badge 
        variant="outline" 
        className={cn(
          "flex items-center gap-2 py-1.5 px-3 font-medium transition-all",
          isCompleted ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-blue-500/10 text-blue-600 border-blue-200 animate-pulse",
          hasError && "bg-red-500/10 text-red-600 border-red-200"
        )}
      >
        {isCompleted ? (
          hasError ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <CircleDashed className="h-3.5 w-3.5 animate-spin" />
        )}
        <span className="text-xs">
          {toolInvocation.toolName} 
          {isCompleted ? (hasError ? ' Failed' : ' Completed') : ' Running...'}
        </span>
      </Badge>
    </div>
  );
}

export interface AISource {
  sourceId: string;
  url: string;
  title: string;
}

export function AISourceList({ sources }: { sources: AISource[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-muted-foreground/10">
      <div className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <Info className="h-3 w-3" />
        Reference Materials
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <HoverCard key={source.sourceId}>
            <HoverCardTrigger asChild>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs py-1 px-2 rounded-md bg-muted hover:bg-muted-foreground/10 transition-colors border border-transparent hover:border-muted-foreground/20"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{source.title}</span>
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between space-x-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{source.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    Source ID: {source.sourceId}
                  </p>
                  <div className="flex items-center pt-2">
                    <span className="text-[10px] text-muted-foreground underline">
                      {source.url}
                    </span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    </div>
  );
}

export function AIPromptInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Ask Prism AI..."
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder?: string;
}) {
  return (
    <form onSubmit={onSubmit} className="relative flex w-full items-center gap-2 group">
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground" type="button">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files (Coming soon)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pl-11 pr-12 h-12 bg-background border border-muted-foreground/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all outline-none disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Button 
            type="submit" 
            size="icon" 
            className="h-8 w-8 rounded-lg shadow-md transition-transform active:scale-95" 
            disabled={isLoading || !value?.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}

