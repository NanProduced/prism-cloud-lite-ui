import React, { useState, useMemo } from 'react';
import { Bot, User, RotateCcw, Maximize2, Minimize2, Sparkles, ChevronDown, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
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
import { AIToolInvocation, AISourceList, type AISource, AIPromptInput } from './ai-assistant-ui';

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
    reload, 
    data,
    configs,
    currentProvider,
    switchProvider
  } = useAIAssistant();

  // Extract sources from custom data chunks
  const sources = useMemo(() => {
    if (!data || !Array.isArray(data)) return [] as AISource[];
    return data
      .filter((chunk: any) => chunk && chunk.type === 'source-url')
      .map((chunk: any) => ({
        sourceId: chunk.sourceId,
        url: chunk.url,
        title: chunk.title
      })) as AISource[];
  }, [data]);

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
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  Prism AI Assistant
                  <Badge variant="secondary" className="text-[10px] px-1 h-4">Beta</Badge>
                </CardTitle>
                
                {/* Model Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors outline-none group">
                      <Cpu className="h-3 w-3" />
                      <span className="capitalize">{currentProvider?.provider === 'local-vllm' ? 'Local Engine' : currentProvider?.provider || 'Select Model'}</span>
                      <ChevronDown className="h-2 w-2 opacity-50 group-hover:opacity-100" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select AI Engine</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {configs.map((config) => (
                      <DropdownMenuItem 
                        key={config.provider}
                        onClick={() => switchProvider(config.provider)}
                        className="flex items-center justify-between py-2 cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-medium capitalize">
                            {config.provider === 'local-vllm' ? 'Prism Local' : config.provider}
                          </span>
                          <span className="text-[9px] text-muted-foreground">{config.model}</span>
                        </div>
                        {config.isDefault && <CheckIcon className="h-3.5 w-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                    {configs.length === 0 && (
                      <DropdownMenuItem className="text-[10px] text-muted-foreground italic py-4 justify-center">
                        No BYOK configured
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
                  key={m.id}
                  className={cn(
                    "flex items-start gap-3",
                    m.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className={cn(
                    "h-8 w-8 border",
                    m.role === 'user' ? "bg-background" : "bg-primary"
                  )}>
                    {m.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    )}
                  </Avatar>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl p-3 text-sm shadow-sm",
                    m.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted/50 border text-foreground rounded-tl-none"
                  )}>
                    {m.content && (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Render tool calls */}
                    {m.toolInvocations && m.toolInvocations.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {m.toolInvocations.map((toolInvocation: any) => (
                          <AIToolInvocation 
                            key={toolInvocation.toolCallId} 
                            toolInvocation={toolInvocation} 
                          />
                        ))}
                      </div>
                    )}

                    {/* Render sources for the last assistant message */}
                    {m.role === 'assistant' && index === messages.length - 1 && sources.length > 0 && (
                      <AISourceList sources={sources} />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && !messages.some((m: any) => m.role === 'assistant' && !m.content && m.toolInvocations) && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 bg-primary animate-pulse">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </Avatar>
                  <div className="bg-muted/50 border rounded-2xl rounded-tl-none p-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <CardFooter className="p-4 border-t bg-muted/10">
            <AIPromptInput 
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </CardFooter>
          <div className="px-4 pb-2 text-center">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI may provide inaccurate info. Check important details.
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
