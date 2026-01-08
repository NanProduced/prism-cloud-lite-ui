import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ConversationContextValue = {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  autoScrollRef: React.MutableRefObject<boolean>;
  isAtBottom: boolean;
  setIsAtBottom: (value: boolean) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
};

const ConversationContext = createContext<ConversationContextValue | null>(null);

function useConversationContext() {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error('Conversation components must be used within <Conversation>.');
  return ctx;
}

export function Conversation({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  const value = useMemo(
    () => ({ viewportRef, bottomRef, autoScrollRef, isAtBottom, setIsAtBottom, scrollToBottom }),
    [isAtBottom, scrollToBottom],
  );

  return (
    <ConversationContext.Provider value={value}>
      <div className={cn('relative flex min-h-0 flex-1', className)}>{children}</div>
    </ConversationContext.Provider>
  );
}

export function ConversationContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { viewportRef, bottomRef, autoScrollRef, setIsAtBottom } = useConversationContext();

  const updateAtBottom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const distanceToBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const atBottom = distanceToBottom < 48;
    autoScrollRef.current = atBottom;
    setIsAtBottom(atBottom);
  }, [viewportRef, autoScrollRef, setIsAtBottom]);

  useEffect(() => {
    updateAtBottom();
  }, [updateAtBottom]);

  return (
    <div
      ref={viewportRef}
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4',
        className,
      )}
      onScroll={updateAtBottom}
    >
      {children}
      <div ref={bottomRef} className="h-px w-full" />
    </div>
  );
}

export function ConversationEmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center gap-3 text-center', className)}>
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      <div className="space-y-1">
        <div className="text-sm font-semibold">{title}</div>
        {description ? <div className="text-xs text-muted-foreground">{description}</div> : null}
      </div>
    </div>
  );
}

export function ConversationScrollButton({ className }: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useConversationContext();

  if (isAtBottom) return null;

  return (
    <div className={cn('absolute bottom-16 right-4', className)}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-9 rounded-full px-3 shadow-lg"
        onClick={() => scrollToBottom('smooth')}
        title="回到底部"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ConversationAutoScroll({ watch }: { watch: unknown }) {
  const { autoScrollRef, scrollToBottom } = useConversationContext();

  useEffect(() => {
    if (!autoScrollRef.current) return;
    scrollToBottom('auto');
  }, [watch, autoScrollRef, scrollToBottom]);

  return null;
}
