import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, RotateCcw, Maximize2, Minimize2, Sparkles, ChevronDown, Cpu, Check, MessageSquare, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { useAIAssistant } from '../hooks/use-ai-assistant';
import { AIToolInvocation, AISourceList, type AISource, AIPromptInput, Thinking } from './ai-assistant-ui';
import { useAuthStore } from '@/store/authStore';
import { getAvatarById } from '@/lib/avatars';

interface AIChatWindowProps {
  isOpen: boolean;
}

export function AIChatWindow({ isOpen }: AIChatWindowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const userAvatar = useMemo(() => {
    if (!user?.avatarId) return null;
    return getAvatarById(user.avatarId)?.url;
  }, [user?.avatarId]);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    append,
    addToolOutput,
    configs,
    currentProvider,
    switchProvider,
    suggestions,
    error
  } = useAIAssistant();

  // 动态生成的欢迎语文本 (非消息)
  const welcomeText = useMemo(() => {
    const hour = new Date().getHours();
    let greeting = "你好";
    if (hour < 9) greeting = "早上好";
    else if (hour < 12) greeting = "上午好";
    else if (hour < 14) greeting = "中午好";
    else if (hour < 18) greeting = "下午好";
    else greeting = "晚上好";
    const userName = user?.displayName || user?.publicId || "";
    return `${greeting}${userName ? `, ${userName}` : ""}！我是 Prism Cloud AI 助手。`;
  }, [user?.displayName, user?.publicId]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages.length, isLoading]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={cn(
          "fixed bottom-20 right-6 z-50 flex flex-col shadow-2xl transition-all duration-300",
          isExpanded ? "w-[800px] h-[700px]" : "w-[440px] h-[640px]"
        )}
      >
        <Card className="flex-1 flex flex-col overflow-hidden border-primary/10 bg-background/95 backdrop-blur-md">
          <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border shadow-sm ring-2 ring-primary/5">
                <AvatarImage src="/images/ai-assistant.jpg" alt="AI" />
                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground/90">
                  Prism AI 助手
                  <Badge variant="secondary" className="text-[10px] px-1.5 h-4 bg-primary/10 text-primary border-none font-medium">Beta</Badge>
                </CardTitle>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors outline-none group">
                      <Cpu className="h-3 w-3" />
                      <span className="capitalize">{currentProvider?.provider === 'local-vllm' ? '本地引擎' : currentProvider?.provider || '选择模型'}</span>
                      <ChevronDown className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 shadow-xl border-primary/5">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5">选择 AI 引擎</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {configs.map((config: any) => (
                      <DropdownMenuItem 
                        key={config.provider}
                        onClick={() => switchProvider(config.provider)}
                        className="flex items-center justify-between py-2 px-3 cursor-pointer focus:bg-primary/5"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold capitalize">
                            {config.provider === 'local-vllm' ? 'Prism 本地' : config.provider}
                          </span>
                          <span className="text-[9px] text-muted-foreground line-clamp-1">{config.model}</span>
                        </div>
                        {config.isDefault && <Check className="h-3.5 w-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={() => reload()}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-8 pb-4">
              {/* Welcome Card (仅在无消息时显示) */}
              {messages.length === 0 && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 mb-6">
                    <div className="flex items-center gap-2 mb-3 text-primary">
                      <Sparkles className="h-5 w-5" />
                      <h3 className="font-bold text-sm">欢迎使用 Prism AI</h3>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                      {welcomeText} 我可以帮你快速导航、查看设备状态或解答疑问。
                    </p>
                    
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                         <MessageSquare className="h-3 w-3" /> 试试这样问我
                       </div>
                       <div className="flex flex-wrap gap-2">
                        {suggestions.map((item: any) => (
                          <button
                            key={item.label}
                            onClick={() => append(item.prompt)}
                            className="text-[11px] px-3 py-2 rounded-xl bg-background hover:bg-primary/5 border border-muted-foreground/10 hover:border-primary/30 text-foreground/80 hover:text-primary transition-all active:scale-95 shadow-sm"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      
                      <details className="group border-t border-primary/5 pt-3">
                        <summary className="list-none cursor-pointer flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                          <Info className="h-3 3" /> 更多功能示例
                          <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="mt-2 text-[11px] text-muted-foreground/80 grid grid-cols-2 gap-x-4 gap-y-1.5 pl-1 py-1">
                          <span>鈥?搜索离线超过 24h 的设备</span>
                          <span>鈥?对比上周和本周的带宽占用</span>
                          <span>鈥?解释排期冲突的解决办法</span>
                          <span>鈥?查询名为 "Colorlight" 的设备</span>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              )}

              {/* 消息列表 - 带有分组逻辑 */}
              {messages.map((m: any, index: number) => {
                const isLastMessage = index === messages.length - 1;
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const isFirstInGroup = !prevMessage || prevMessage.role !== m.role;
                
                return (
                  <div
                    key={m.id || index}
                    className={cn(
                      "flex items-start gap-3",
                      m.role === 'user' ? "flex-row-reverse" : "flex-row",
                      !isFirstInGroup && "mt-[-24px]" // 连续消息紧凑排列
                    )}
                  >
                    {/* 头像显示逻辑 */}
                    <div className="w-8 flex-shrink-0">
                      {isFirstInGroup && (
                        <Avatar className={cn(
                          "h-8 w-8 border",
                          m.role === 'user' ? "bg-background" : "bg-muted shadow-sm"
                        )}>
                          {m.role === 'user' ? (
                            <>
                              {userAvatar ? (
                                <AvatarImage src={userAvatar} alt={user?.displayName || 'User'} />
                              ) : null}
                              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage src="/images/ai-assistant.jpg" alt="AI" />
                              <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">AI</AvatarFallback>
                            </>
                          )}
                        </Avatar>
                      )}
                    </div>

                    <div className={cn(
                      "max-w-[70%] rounded-2xl p-4 text-sm shadow-sm leading-relaxed",
                      m.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-muted/50 border text-foreground rounded-tl-none"
                    )}>
                      {(() => {
                        const parts = m.parts || [];
                        
                        // 初始等待态展示
                        if (m.role === 'assistant' && parts.length === 0 && isLoading && isLastMessage) {
                          return <Thinking />;
                        }

                        return parts.map((part: any, partIndex: number) => {
                          if (part.type === 'text') {
                            return (
                              <div key={partIndex} className="prose prose-sm dark:prose-invert max-w-none break-words space-y-2 prose-p:first:mt-0 prose-p:last:mb-0">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {part.text}
                                </ReactMarkdown>
                                {isLoading && isLastMessage && partIndex === parts.length - 1 && (
                                  <span className="inline-block w-1.5 h-4 ml-1 bg-primary/50 animate-pulse align-middle" />
                                )}
                              </div>
                            );
                          } else if (part.type === 'reasoning') {
                            return (
                              <div key={partIndex} className="mb-4">
                                <details className="group bg-primary/5 rounded-xl border border-primary/10 overflow-hidden">
                                  <summary className="list-none cursor-pointer p-2.5 flex items-center justify-between text-[11px] font-bold text-primary/70 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                                      {part.state === 'done' ? '思考完成' : '深度思考中...'}
                                    </div>
                                    <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                                  </summary>
                                  <div className="p-3 pt-0 text-xs text-muted-foreground/80 italic whitespace-pre-wrap leading-loose border-l-2 border-primary/20 ml-2.5 mb-2">
                                    {part.reasoning || (part as any).text}
                                  </div>
                                </details>
                              </div>
                            );
                          } else if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                            return (
                              <AIToolInvocation
                                key={part.toolCallId || partIndex}
                                toolInvocation={{
                                  toolCallId: part.toolCallId,
                                  toolName: (part as any).toolName || part.type.replace('tool-', ''),
                                  input: part.input,
                                  result: part.result || (part as any).output,
                                  state: (part.state === 'output-available' || part.result) ? 'result' : 'call'
                                }}
                                addToolOutput={addToolOutput}
                                disabled={!isLastMessage}
                              />
                            );
                          }
                          return null;
                        });
                      })()}
                    </div>
                  </div>
                );
              })}

              {error && (
                <div className="flex items-start gap-3 mt-4 animate-in slide-in-from-bottom-2">
                  <div className="w-8 flex-shrink-0">
                    <Avatar className="h-8 w-8 border bg-red-50/50 shadow-sm">
                       <AvatarFallback className="bg-red-100 text-red-600 text-[10px]"><AlertCircle className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="max-w-[70%] bg-red-50/50 border border-red-200/60 text-red-800 rounded-2xl rounded-tl-none p-4 text-sm shadow-sm leading-relaxed">
                     <div className="flex items-center gap-2 font-bold mb-2 text-red-700">
                       <AlertCircle className="h-4 w-4" />
                       <span>遇到了一点问题</span>
                     </div>
                     <p className="text-xs opacity-90 mb-3 font-mono bg-red-100/50 p-2 rounded">{error.message || "未知错误"}</p>
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => reload()} 
                        className="bg-white hover:bg-red-50 text-red-700 border-red-200 h-8 text-xs font-bold"
                     >
                       <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> 重试
                     </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <CardFooter className="p-4 border-t bg-muted/5">
            <AIPromptInput 
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}