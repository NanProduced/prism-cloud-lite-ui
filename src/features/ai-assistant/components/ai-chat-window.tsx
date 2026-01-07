import React, { useState, useMemo } from 'react';
import { User, RotateCcw, Maximize2, Minimize2, Sparkles, ChevronDown, Cpu } from 'lucide-react';
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
    sendMessage,
    configs,
    currentProvider,
    switchProvider
  } = useAIAssistant();

  // Handle action from tool buttons (sending tokens) - AI SDK 5.0+ uses sendMessage
  const handleToolAction = (text: string) => {
    sendMessage({ text });
  };

  // Helper to extract text content from message parts (AI SDK 5.0+ format)
  const getMessageContent = (message: any): string => {
    // Support both old format (content) and new format (parts)
    if (message.content) {
      return message.content;
    }
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }
    return '';
  };

  // Helper to extract tool invocations from message parts
  const getToolInvocations = (message: any): any[] => {
    // Support both old format (toolInvocations) and new format (parts with tool-invocation type)
    if (message.toolInvocations && Array.isArray(message.toolInvocations)) {
      return message.toolInvocations;
    }
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts
        .filter((part: any) => part.type === 'tool-invocation')
        .map((part: any) => part.toolInvocation);
    }
    return [];
  };

  // Extract sources from message parts (AI SDK 5.0+ format)
  const sources = useMemo(() => {
    const allSources: AISource[] = [];
    messages.forEach((m: any) => {
      if (m.parts && Array.isArray(m.parts)) {
        m.parts.forEach((part: any) => {
          if (part.type === 'source' && part.source) {
            allSources.push({
              sourceId: part.source.id || part.source.sourceId || '',
              url: part.source.url || '',
              title: part.source.title || ''
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
                
                {/* Model Selector Dropdown */}
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
                        {config.isDefault && <CheckIcon className="h-3.5 w-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                    {configs.length === 0 && (
                      <DropdownMenuItem className="text-[10px] text-muted-foreground italic py-4 justify-center">
                        未配置自定义模型
                      </DropdownMenuItem>
                    )}
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
                      const toolInvocations = getToolInvocations(m);
                      const hasContent = content.length > 0;
                      const hasToolInvocations = toolInvocations.length > 0;

                      // Show thinking state for assistant messages that are still loading
                      if (m.role === 'assistant' && !hasContent && !hasToolInvocations && isLoading) {
                        return <Thinking />;
                      }

                      return (
                        <>
                          {(m as any).reasoning && (
                            <div className="mb-3 p-2 bg-primary/5 rounded border border-primary/10 border-dashed">
                               <details open>
                                  <summary className="cursor-pointer select-none text-[10px] font-bold text-primary/60 uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" /> 深度思考过程
                                  </summary>
                                  <div className="mt-2 text-xs text-muted-foreground/80 italic whitespace-pre-wrap leading-relaxed border-l-2 border-primary/20 pl-3">
                                    {(m as any).reasoning}
                                  </div>
                               </details>
                            </div>
                          )}

                          {hasContent && (
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                              </ReactMarkdown>
                              {isLoading && index === messages.length - 1 && (
                                <span className="inline-block w-1.5 h-4 ml-1 bg-primary/50 animate-pulse align-middle" />
                              )}
                            </div>
                          )}

                          {/* Render tool calls */}
                          {hasToolInvocations && (
                            <div className="mt-2 space-y-1">
                              {toolInvocations.map((toolInvocation: any) => (
                                <AIToolInvocation
                                  key={toolInvocation.toolCallId}
                                  toolInvocation={toolInvocation}
                                  onAction={handleToolAction}
                                />
                              ))}
                            </div>
                          )}

                          {/* Render sources for the last assistant message */}
                          {m.role === 'assistant' && index === messages.length - 1 && sources.length > 0 && (
                            <AISourceList sources={sources} />
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
          <div className="px-4 pb-3 text-center">
            <p className="text-[10px] text-muted-foreground/60 flex items-center justify-center gap-1.5">
              <Sparkles className="h-2.5 w-2.5 text-primary/40" />
              AI 助手可能会生成不准确的信息，请核实重要细节。
            </p>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
