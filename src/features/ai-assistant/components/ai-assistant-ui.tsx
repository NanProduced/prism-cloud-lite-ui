import React from 'react';
import { ExternalLink, CheckCircle2, CircleDashed, AlertCircle, Info, Send, Paperclip, Sparkles, Monitor, Activity, Clock, Box, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

import { Skeleton } from "@/components/ui/skeleton";

export function Thinking() {
  return (
    <div className="flex flex-col gap-3 py-1.5 min-w-[240px]">
      <div className="flex items-center gap-2 text-[11px] text-primary/70 font-bold uppercase tracking-wider">
        <Sparkles className="h-3 w-3 animate-pulse" />
        助手正在思考
      </div>
      
      <div className="space-y-2.5">
        <div className="relative overflow-hidden">
          <Skeleton className="h-2.5 w-full bg-primary/5 rounded-full" />
          <motion.div
            className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
            }}
          />
        </div>
        <div className="relative overflow-hidden">
          <Skeleton className="h-2.5 w-[90%] bg-primary/5 rounded-full" />
          <motion.div
            className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
              delay: 0.1,
            }}
          />
        </div>
        <div className="relative overflow-hidden">
          <Skeleton className="h-2.5 w-[75%] bg-primary/5 rounded-full" />
          <motion.div
            className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 mt-1">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          className="h-1.5 w-1.5 rounded-full bg-primary/40"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          className="h-1.5 w-1.5 rounded-full bg-primary/40"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          className="h-1.5 w-1.5 rounded-full bg-primary/40"
        />
      </div>
    </div>
  );
}

// Types for AI SDK tool invocations (AI SDK 5.0 / v4+ standardized)
export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: any;
  result?: any;
  state: 'call' | 'result';
}

export function AIToolInvocation({ 
  toolInvocation,
  addToolResult,
  disabled = false
}: { 
  toolInvocation: ToolInvocation;
  addToolResult?: (options: any) => void;
  disabled?: boolean;
}) {
  const isCompleted = toolInvocation.state === 'result' || toolInvocation.result !== undefined;
  const hasError = isCompleted && toolInvocation.result?.error;
  const { toolCallId, toolName } = toolInvocation;
  
  const renderToolBadge = (label: string) => (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-2 py-1.5 px-3 font-medium transition-all shadow-sm",
        isCompleted ? "bg-emerald-500/5 text-emerald-600 border-emerald-200/50" : "bg-blue-500/5 text-blue-600 border-blue-200/50 animate-pulse",
        hasError && "bg-red-500/5 text-red-600 border-red-200/50",
        disabled && !isCompleted && "opacity-50 grayscale"
      )}
    >
      {isCompleted ? (
        hasError ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <CircleDashed className="h-3.5 w-3.5 animate-spin" />
      )}
      <span className="text-xs">
        {label} 
        {isCompleted ? (hasError ? ' 失败' : ' 已完成') : ' 正在处理...'}
      </span>
    </Badge>
  );

  // Helper to submit result
  const handleResult = (result: any) => {
    if (addToolResult && !disabled) {
      addToolResult({ 
        toolCallId, 
        tool: toolName,
        output: result 
      });
    }
  };

  // Specialized UI for pickDevice
  if (toolInvocation.toolName === 'pickDevice') {
    if (!isCompleted) {
      const { title, hint, items, includeFleetOption } = toolInvocation.args;
      return (
        <div className={cn(
          "my-3 space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/10 transition-opacity",
          disabled && "opacity-60 grayscale-[0.5] pointer-events-none"
        )}>
          <div className="space-y-1">
            <p className="text-xs font-bold flex items-center gap-2 text-primary">
              <Monitor className="h-3.5 w-3.5" />
              {title || '选择设备'}
            </p>
            {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
          </div>
          <div className="flex flex-col gap-2">
            {items?.map((item: any) => (
              <Button
                key={item.deviceId}
                variant="outline"
                size="sm"
                className="justify-between h-auto py-2.5 px-3 bg-background hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
                onClick={() => handleResult({ deviceId: String(item.deviceId) })}
                disabled={disabled}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold">{item.label}</span>
                  {item.lastReportTime && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {item.lastReportTime}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", item.online ? "bg-green-500" : "bg-gray-400")} />
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/70">
                    {item.online ? '在线' : '离线'}
                  </span>
                </div>
              </Button>
            ))}
            {includeFleetOption && (
              <Button
                variant="secondary"
                size="sm"
                className="h-9 font-bold bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none"
                onClick={() => handleResult({ fleet: true })}
                disabled={disabled}
              >
                <Activity className="h-3.5 w-3.5 mr-2" />
                查看整体概览
              </Button>
            )}
          </div>
        </div>
      );
    } else {
      // Display result summary
      const result = toolInvocation.result;
      const deviceId = result?.deviceId;
      const isFleet = result?.fleet;
      
      return (
        <div className="my-2 flex items-center gap-2">
          {renderToolBadge('设备选择')}
          <span className="text-[10px] text-muted-foreground font-medium italic">
            已选择: {isFleet ? '整体概览' : `设备 ID ${deviceId}`}
          </span>
        </div>
      );
    }
  }

  // Specialized UI for pickCommandLog
  if (toolInvocation.toolName === 'pickCommandLog') {
    if (!isCompleted) {
      const { title, hint, items } = toolInvocation.args;
      return (
        <div className={cn(
          "my-3 space-y-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 transition-opacity",
          disabled && "opacity-60 grayscale-[0.5] pointer-events-none"
        )}>
          <div className="space-y-1">
            <p className="text-xs font-bold flex items-center gap-2 text-amber-600">
              <Activity className="h-3.5 w-3.5" />
              {title || '选择指令日志'}
            </p>
            {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
          </div>
          <div className="flex flex-col gap-2">
            {items?.map((item: any) => (
              <Button
                key={item.commandLogId}
                variant="outline"
                size="sm"
                className="flex-col items-start h-auto py-2.5 px-3 bg-background hover:bg-amber-500/5 hover:border-amber-500/30 transition-all text-left"
                onClick={() => handleResult({ commandLogId: String(item.commandLogId) })}
                disabled={disabled}
              >
                <div className="w-full flex justify-between items-center mb-1">
                  <span className="text-xs font-bold">{item.deviceName}</span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase tracking-tighter">
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="bg-muted px-1 rounded font-mono text-primary/70">{item.actionType}</span>
                  <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {item.createdAt}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      );
    } else {
      const logId = toolInvocation.result?.commandLogId;
      return (
        <div className="my-2 flex items-center gap-2">
          {renderToolBadge('记录选择')}
          <span className="text-[10px] text-muted-foreground font-medium italic">
            已选择日志 ID: {logId}
          </span>
        </div>
      );
    }
  }

  // Specialized UI for searchCommandLogs (server-executed tool result)
  if (toolInvocation.toolName === 'searchCommandLogs' && isCompleted) {
    const items = toolInvocation.result?.items;
    if (items && items.length > 0) {
      return (
        <div className="my-3 space-y-2">
          {renderToolBadge('搜索指令日志')}
          <div className="flex flex-col gap-2 pl-4 border-l-2 border-primary/20 mt-2">
            <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 mb-1">
              <Search className="h-3 w-3" />
              搜索结果候选：
            </p>
            {items.map((item: any) => (
              <div
                key={item.commandLogId}
                className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg border border-transparent"
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-medium truncate">{item.deviceName} - {item.actionType}</span>
                  <span className="text-[9px] text-muted-foreground">{item.createdAt}</span>
                </div>
                <Badge variant="outline" className="text-[8px] h-3.5 px-1 opacity-70">{item.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // Default Fallback
  let label = toolInvocation.toolName;
  if (label === 'navigateToPage') label = '页面跳转';
  if (label === 'pickDevice') label = '选择设备';
  if (label === 'pickCommandLog') label = '选择记录';
  if (label === 'searchCommandLogs') label = '搜索日志';

  return (
    <div className="my-2">
      {renderToolBadge(label)}
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
        <Info className="h-3 w-3 text-primary/60" />
        参考资料
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <HoverCard key={source.sourceId} openDelay={200}>
            <HoverCardTrigger asChild>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{source.title}</span>
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-3 shadow-xl">
              <div className="flex flex-col gap-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold leading-none text-primary">{source.title}</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    ID: {source.sourceId}
                  </p>
                </div>
                <div className="text-[11px] text-muted-foreground break-all bg-muted/30 p-1.5 rounded border border-dashed">
                  {source.url}
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
  placeholder = "问问 Prism AI..."
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
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
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors" type="button">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">上传附件（即将推出）</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pl-11 pr-12 h-12 bg-muted/30 border border-muted-foreground/10 focus:border-primary/30 focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm transition-all outline-none disabled:opacity-50 placeholder:text-muted-foreground/50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e);
            }
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button 
            type="submit" 
            size="icon" 
            className={cn(
              "h-8 w-8 rounded-xl shadow-lg transition-all active:scale-90",
              isLoading ? "bg-muted text-muted-foreground shadow-none" : "bg-primary hover:bg-primary/90"
            )}
            disabled={isLoading || !value?.trim()}
          >
            <Send className={cn("h-4 w-4", !isLoading && "animate-in slide-in-from-left-1 duration-300")} />
          </Button>
        </div>
      </div>
    </form>
  );
}
