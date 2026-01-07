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

// Types for AI SDK tool invocations (AI SDK 6 standardized)
export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  input: any; 
  result?: any;
  state: 'call' | 'result';
}

export function AIToolInvocation({ 
  toolInvocation,
  addToolOutput,
  disabled = false
}: { 
  toolInvocation: ToolInvocation;
  addToolOutput?: (options: any) => void;
  disabled?: boolean;
}) {
  const isCompleted = toolInvocation.state === 'result' || toolInvocation.result !== undefined;
  const hasError = isCompleted && (toolInvocation.result?.error || toolInvocation.state === 'result' && !toolInvocation.result && toolInvocation.toolName !== 'navigateToPage');
  const { toolCallId, toolName } = toolInvocation;
  
  const renderToolBadge = (label: string, icon?: React.ReactNode) => (
    <Badge 
      variant="outline" 
      className={cn(
        "flex items-center gap-2 py-1.5 px-3 font-medium transition-all shadow-sm rounded-lg border-dashed",
        isCompleted ? "bg-emerald-500/5 text-emerald-600 border-emerald-200/50" : "bg-blue-500/5 text-blue-600 border-blue-200/50 animate-pulse",
        hasError && "bg-red-500/5 text-red-600 border-red-200/50"
      )}
    >
      {isCompleted ? (
        hasError ? <AlertCircle className="h-3.5 w-3.5" /> : (icon || <CheckCircle2 className="h-3.5 w-3.5" />)
      ) : (
        <CircleDashed className="h-3.5 w-3.5 animate-spin" />
      )}
      <span className="text-[10px] uppercase tracking-wider font-bold">
        {label} 
        {isCompleted ? (hasError ? ' 失败' : ' 已就绪') : ' 处理中'}
      </span>
    </Badge>
  );

  // Helper to submit result
  const handleResult = (result: any) => {
    if (addToolOutput && !disabled) {
      addToolOutput({ 
        toolCallId, 
        tool: toolName,
        state: 'output-available',
        output: result 
      });
    }
  };

  // 渲染错误状态
  if (hasError) {
    return (
      <div className="my-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3">
        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold text-red-600 uppercase">工具执行异常</span>
          <span className="text-[10px] text-red-500/80 italic">{toolInvocation.result?.error || '服务器响应格式错误'}</span>
        </div>
      </div>
    );
  }

  // Specialized UI for pickDevice
  if (toolInvocation.toolName === 'pickDevice') {
    if (!isCompleted) {
      const { title, hint, items, includeFleetOption } = toolInvocation.input || {};
      return (
        <div className={cn(
          "my-4 space-y-4 bg-primary/5 p-4 rounded-2xl border border-primary/10 transition-all shadow-inner",
          disabled && "opacity-60 grayscale-[0.5] pointer-events-none"
        )}>
          <div className="space-y-1">
            <p className="text-[11px] font-black flex items-center gap-2 text-primary uppercase tracking-tighter">
              <Monitor className="h-3.5 w-3.5" />
              {title || '选择目标设备'}
            </p>
            {hint && <p className="text-[10px] text-muted-foreground italic">{hint}</p>}
          </div>
          <div className="flex flex-col gap-2">
            {items?.map((item: any) => (
              <Button
                key={item.deviceId}
                variant="outline"
                size="sm"
                className="justify-between h-auto py-3 px-4 bg-background hover:bg-primary/5 hover:border-primary/40 transition-all text-left rounded-xl group"
                onClick={() => handleResult({ deviceId: String(item.deviceId) })}
                disabled={disabled}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold group-hover:text-primary transition-colors">{item.label}</span>
                  {item.lastReportTime && (
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> 最后上报: {item.lastReportTime}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full ring-2 ring-offset-1 ring-offset-background", item.online ? "bg-green-500 ring-green-500/20" : "bg-gray-400 ring-gray-400/20")} />
                  <span className="text-[9px] uppercase font-black text-muted-foreground/50">
                    {item.online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </Button>
            ))}
            {includeFleetOption && (
              <Button
                variant="secondary"
                size="sm"
                className="h-10 font-black bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none rounded-xl uppercase text-[10px] tracking-widest"
                onClick={() => handleResult({ fleet: true })}
                disabled={disabled}
              >
                <Activity className="h-3.5 w-3.5 mr-2" />
                查看全量统计 (Fleet Overall)
              </Button>
            )}
          </div>
        </div>
      );
    } else {
      const result = toolInvocation.result;
      const label = result?.fleet ? '全量概览' : `设备 ID: ${result?.deviceId}`;
      return (
        <div className="my-3 flex items-center gap-2">
          {renderToolBadge('设备选择', <Monitor className="h-3.5 w-3.5" />)}
          <Badge variant="secondary" className="text-[10px] font-mono bg-muted/50 border-none px-2 py-0.5 text-muted-foreground">{label}</Badge>
        </div>
      );
    }
  }

  // Specialized UI for pickCommandLog
  if (toolInvocation.toolName === 'pickCommandLog') {
    if (!isCompleted) {
      const { title, hint, items } = toolInvocation.input || {};
      return (
        <div className={cn(
          "my-4 space-y-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10 transition-all shadow-inner",
          disabled && "opacity-60 grayscale-[0.5] pointer-events-none"
        )}>
          <div className="space-y-1">
            <p className="text-[11px] font-black flex items-center gap-2 text-amber-600 uppercase tracking-tighter">
              <Activity className="h-3.5 w-3.5" />
              {title || '选择指令记录'}
            </p>
            {hint && <p className="text-[10px] text-muted-foreground italic">{hint}</p>}
          </div>
          <div className="flex flex-col gap-2">
            {items?.map((item: any) => (
              <Button
                key={item.commandLogId}
                variant="outline"
                size="sm"
                className="flex-col items-start h-auto py-3 px-4 bg-background hover:bg-amber-500/5 hover:border-amber-500/40 transition-all text-left rounded-xl group"
                onClick={() => handleResult({ commandLogId: String(item.commandLogId) })}
                disabled={disabled}
              >
                <div className="w-full flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold group-hover:text-amber-600 transition-colors">{item.deviceName}</span>
                  <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-black uppercase tracking-tighter bg-background">
                    {item.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-medium">
                  <span className="bg-muted px-1.5 py-0.5 rounded text-amber-600 font-bold">{item.actionType}</span>
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
        <div className="my-3 flex items-center gap-2">
          {renderToolBadge('记录选择', <Activity className="h-3.5 w-3.5" />)}
          <Badge variant="secondary" className="text-[10px] font-mono bg-muted/50 border-none px-2 py-0.5 text-muted-foreground">Log ID: {logId}</Badge>
        </div>
      );
    }
  }

  // Specialized UI for searchCommandLogs (server-executed tool result)
  if (toolInvocation.toolName === 'searchCommandLogs' && isCompleted) {
    const items = toolInvocation.result?.items;
    if (items && items.length > 0) {
      return (
        <div className="my-4 space-y-3 bg-muted/20 p-4 rounded-2xl border border-muted-foreground/10">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-muted-foreground flex items-center gap-2 uppercase">
              <Search className="h-3.5 w-3.5" /> 搜索结果候选
            </p>
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{items.length} 条记录</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {items.map((item: any) => (
              <div
                key={item.commandLogId}
                className="flex items-center justify-between py-2.5 px-3 bg-background/50 rounded-xl border border-muted-foreground/5 hover:border-primary/20 transition-colors"
              >
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] font-bold truncate">{item.deviceName}</span>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-mono">
                    {item.actionType} 路 {item.createdAt}
                  </span>
                </div>
                <Badge variant="outline" className="text-[8px] h-3.5 px-1 opacity-70 font-bold uppercase">{item.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // Specialized UI for navigateToPage (Action type, usually completed immediately)
  if (toolInvocation.toolName === 'navigateToPage' && isCompleted) {
    return (
      <div className="my-2">
        {renderToolBadge('自动跳转成功', <ExternalLink className="h-3.5 w-3.5" />)}
      </div>
    );
  }

  // Default Fallback
  let label = toolInvocation.toolName;
  if (label === 'navigateToPage') label = '页面跳转';
  if (label === 'pickDevice') label = '设备选择';
  if (label === 'pickCommandLog') label = '记录选择';
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