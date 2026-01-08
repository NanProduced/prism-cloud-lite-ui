import React, { useMemo, useState } from 'react';
import { RotateCcw, Maximize2, Minimize2, Cpu, Check, MessageSquare, AlertCircle, Sparkles, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { useAIAssistant } from '../hooks/use-ai-assistant';
import { Conversation, ConversationAutoScroll, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageActions, MessageContent, MessageResponse, MessageUserBubble } from '@/components/ai-elements/message';
import { Input, PromptInputSubmit, PromptInputTextarea } from '@/components/ai-elements/prompt-input';
import { Thinking } from '@/components/ai-elements/thinking';
import { AIMessageParts } from './ai-message-parts';

interface AIChatWindowProps {
  isOpen: boolean;
}

export function AIChatWindow({ isOpen }: AIChatWindowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    clearConversation,
    regenerateLast,
    append,
    addToolOutput,
    status,
    configs,
    currentProvider,
    switchProvider,
    suggestions,
    stop,
    error
  } = useAIAssistant();

  const confirmClearConversation = useMemo(() => {
    return () => {
      if (messages.length === 0) return;
      const ok = window.confirm('确认清空对话？此操作不可撤销。');
      if (ok) clearConversation();
    };
  }, [messages.length, clearConversation]);

  const copyAssistantMessage = (message: any) => {
    try {
      const text = (message?.parts || [])
        .filter((p: any) => p?.type === 'text')
        .map((p: any) => p.text)
        .join('\n')
        .trim();
      if (text) {
        navigator.clipboard.writeText(text);
      }
    } catch {
      // ignore
    }
  };

  const showLoadingPlaceholder =
    isLoading && (messages.length === 0 || (messages[messages.length - 1] as any)?.role === 'user');

  const assistantAvatar = (
    <Avatar className="h-7 w-7 border shadow-sm ring-1 ring-primary/5">
      <AvatarImage src="/images/ai-assistant.jpg" alt="AI" />
      <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">AI</AvatarFallback>
    </Avatar>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={false}
        animate={isOpen ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.98 }}
        className={cn(
          "fixed bottom-20 right-6 z-50 flex flex-col shadow-2xl transition-all duration-300",
          isExpanded ? "w-[800px] h-[700px]" : "w-[440px] h-[640px]",
          !isOpen && "pointer-events-none"
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
                onClick={() => regenerateLast()}
                title="重新生成上一条"
                disabled={messages.length === 0 || isLoading}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={confirmClearConversation}
                title="清空对话"
                disabled={messages.length === 0 || isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="px-4 py-4">
              {messages.length === 0 ? (
                <div className="h-full">
                  <Message from="assistant" avatar={assistantAvatar}>
                    <MessageContent>
                      <MessageResponse>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <div className="text-sm font-semibold">你好，我是 Prism AI 助手</div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            我可以帮你排查设备离线/指令未生效、定位发布失败原因，并快速跳转到相关页面。
                          </div>
                          <div className="pt-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Sparkles className="h-4 w-4" /> 试试这样问我
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {suggestions.map((item: any) => (
                                <button
                                  key={item.label}
                                  type="button"
                                  onClick={() => append(item.prompt)}
                                  className="rounded-full border bg-background px-3 py-1.5 text-xs hover:border-primary/30 hover:text-primary"
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </MessageResponse>
                    </MessageContent>
                  </Message>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m: any, index: number) => {
                    const isLast = index === messages.length - 1;
                    const userText = (m.parts || []).filter((p: any) => p.type === 'text').map((p: any) => p.text).join('');
                    const isAssistant = m.role === 'assistant';

                    return (
                      <Message from={m.role} key={m.id || index} avatar={m.role === 'assistant' ? assistantAvatar : undefined}>
                        <MessageContent>
                          {m.role === 'user' ? (
                            <MessageUserBubble>{userText}</MessageUserBubble>
                          ) : (
                            <>
                              <MessageResponse>
                                {isLoading && isLast && (m.parts || []).length === 0 ? (
                                  <Thinking />
                                ) : (
                                  <AIMessageParts
                                    parts={m.parts || []}
                                    addToolOutput={addToolOutput}
                                    isLatestAssistantMessage={isAssistant && isLast}
                                  />
                                )}
                              </MessageResponse>
                              {isAssistant ? (
                                <MessageActions className="justify-end pl-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => copyAssistantMessage(m)}
                                  >
                                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                                    复制
                                  </Button>
                                  {isLast ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2"
                                      onClick={() => regenerateLast()}
                                      disabled={isLoading}
                                    >
                                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                      重新生成
                                    </Button>
                                  ) : null}
                                </MessageActions>
                              ) : null}
                            </>
                          )}
                        </MessageContent>
                      </Message>
                    );
                  })}

                  {showLoadingPlaceholder ? (
                    <Message from="assistant" avatar={assistantAvatar}>
                      <MessageContent>
                        <MessageResponse>
                          <Thinking />
                        </MessageResponse>
                      </MessageContent>
                    </Message>
                  ) : null}

                  {error ? (
                    <div className="rounded-2xl border border-red-200/70 bg-red-50/50 p-4 text-sm text-red-800">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        连接异常
                      </div>
                      <div className="mt-2 text-xs text-red-700/90">{error.message || '未知错误'}</div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8" onClick={() => regenerateLast()}>
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          重试生成
                        </Button>
                        <Button variant="secondary" size="sm" className="h-8" onClick={confirmClearConversation}>
                          清空对话
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <ConversationAutoScroll watch={`${messages.length}:${status}`} />
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <CardFooter className="p-4 border-t bg-muted/5">
            <Input onSubmit={handleSubmit} className="w-full">
              <PromptInputTextarea
                value={input}
                onChange={(e) => handleInputChange(e)}
                placeholder="问问 Prism AI…"
                disabled={false}
              />
              <PromptInputSubmit
                status={status}
                disabled={!input.trim()}
                onStop={() => {
                  stop();
                }}
              />
            </Input>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
