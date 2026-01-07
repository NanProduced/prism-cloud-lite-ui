import React, { useState, useMemo } from 'react';
import { User, RotateCcw, Maximize2, Minimize2, Sparkles, ChevronDown, Cpu, Check } from 'lucide-react';
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
    suggestions
  } = useAIAssistant();

  // Helper to extract text content (Enhanced for AI SDK 6 Protocol)
  const getMessageContent = (message: any): string => {
    if (typeof message.content === 'string' && message.content.length > 0) {
      return message.content;
    }
    // Handle message parts (v3 Specification)
    if (Array.isArray(message.parts)) {
      return message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }
    // Fallback for some legacy/internal stream states
    if (typeof message.text === 'string') return message.text;
    
    return '';
  };

  // Extract sources from message data
  const sources = useMemo(() => {
    const allSources: AISource[] = [];
    messages.forEach((m: any) => {
      if (m.data && Array.isArray(m.data)) {
        m.data.forEach((item: any) => {
          if (item.type === 'source' && item.source) {
            allSources.push({
              sourceId: item.source.id || item.source.sourceId || '',
              url: item.source.url || '',
              title: item.source.title || ''
            });
          }
        });
      }
    });
    return allSources;
  }, [messages]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={cn(
          "fixed bottom-20 right-6 z-50 flex flex-col shadow-2xl transition-all duration-300",
          isExpanded ? "w-[800px] h-[700px]" : "w-[400px] h-[600px]"
        )}
      >
        <Card className="flex-1 flex flex-col overflow-hidden border-primary/10 bg-background/95 backdrop-blur-md">
          <CardHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border shadow-sm ring-2 ring-primary/5">
                <AvatarImage src="/images/ai-assistant.jpg" alt="AI" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  AI
                </AvatarFallback>
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
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((m: any, index: number) => (
                <div
                  key={m.id || index}
                  className={cn(
                    "flex items-start gap-3",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className={cn(
                    "h-8 w-8 shrink-0 border",
                    m.role === 'user' ? "bg-background" : "bg-muted shadow-sm"
                  )}>
                    {m.role === 'user' ? (
                      <>
                        {userAvatar ? (
                          <AvatarImage src={userAvatar} alt={user?.displayName || 'User'} />
                        ) : null}
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src="/images/ai-assistant.jpg" alt="AI" />
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">AI</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl p-3 text-sm shadow-sm",
                    m.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted/50 border text-foreground rounded-tl-none"
                  )}>
                    {(() => {
                      const content = getMessageContent(m);
                      const toolInvocations = m.toolInvocations || [];
                      // Reasoning data may be in m.reasoning or in parts
                      const reasoning = m.reasoning || (m.parts?.find((p: any) => p.type === 'reasoning')?.reasoning);
                      
                      const hasContent = content.length > 0;
                      const hasToolInvocations = toolInvocations.length > 0;
                      const hasReasoning = !!reasoning;
                      const isLastMessage = index === messages.length - 1;

                      // Only show Thinking if truly nothing has arrived yet
                      if (m.role === 'assistant' && !hasContent && !hasToolInvocations && !hasReasoning && isLoading && isLastMessage) {
                        return <Thinking />;
                      }

                      return (
                        <>
                          {hasReasoning && (
                            <div className="mb-3 p-2 bg-primary/5 rounded border border-primary/10 border-dashed">
                               <details open>
                                  <summary className="cursor-pointer select-none text-[10px] font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> 深度思考过程
                                  </summary>
                                  <div className="mt-2 text-xs text-muted-foreground/80 italic whitespace-pre-wrap leading-relaxed border-l-2 border-primary/20 pl-3">
                                    {reasoning}
                                  </div>
                               </details>
                            </div>
                          )}

                          {hasContent && (
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                              </ReactMarkdown>
                              {isLoading && isLastMessage && !hasToolInvocations && (
                                <span className="inline-block w-1.5 h-4 ml-1 bg-primary/50 animate-pulse align-middle" />
                              )}
                            </div>
                          )}

                          {hasToolInvocations && (
                            <div className="mt-2 space-y-1">
                              {toolInvocations.map((toolInvocation: any) => (
                                <AIToolInvocation
                                  key={toolInvocation.toolCallId}
                                  toolInvocation={toolInvocation}
                                  addToolOutput={addToolOutput}
                                  disabled={!isLastMessage}
                                />
                              ))}
                            </div>
                          )}

                          {/* Debug View for developers if empty */}
                          {!hasContent && !hasReasoning && !hasToolInvocations && m.role === 'assistant' && !isLoading && (
                            <div className="text-[10px] text-red-500/50 italic p-2 border border-dashed rounded bg-red-50/10">
                              [Debug] 收到空消息体，请检查日志
                            </div>
                          )}

                          {m.role === 'assistant' && isLastMessage && sources.length > 0 && (
                            <AISourceList sources={sources} />
                          )}

                          {/* Suggestion Chips - Only show for the very first welcome message if no user messages yet */}
                          {m.id === 'init-1' && messages.length === 1 && suggestions.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                              {suggestions.map((item: any) => (
                                <button
                                  key={item.label}
                                  onClick={() => append(item.prompt)}
                                  className="text-[11px] px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/30 text-primary transition-all active:scale-95"
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
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
