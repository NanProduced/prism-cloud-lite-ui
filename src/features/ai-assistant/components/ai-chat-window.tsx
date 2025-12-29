import React, { useState } from 'react';
import { Bot, Send, User, RotateCcw, Maximize2, Minimize2, Sparkles, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { useAIAssistant } from '../hooks/use-ai-assistant';

interface AIChatWindowProps {
  isOpen: boolean;
}

export function AIChatWindow({ isOpen }: AIChatWindowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, reload } = useAIAssistant() as any;

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
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  Prism AI Assistant
                  <Badge variant="secondary" className="text-[10px] px-1 h-4">Beta</Badge>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">Always active</span>
                </div>
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
              {messages.map((m) => (
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
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                    >
                      {String((m as any).content ?? '')}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // 由于 API 没通，我们可以在这里手动添加消息模拟 UI
                handleSubmit(e);
              }}
              className="flex w-full items-center gap-2"
            >
              <div className="relative flex-1 group">
                <Command className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask Prism AI..."
                  className="pl-9 h-11 bg-background border-muted-foreground/20 focus-visible:ring-primary rounded-xl"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">↵</span>
                  </kbd>
                </div>
              </div>
              <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shadow-lg" disabled={isLoading || !input}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
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
