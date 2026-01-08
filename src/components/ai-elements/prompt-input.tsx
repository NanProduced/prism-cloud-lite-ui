import React, { useEffect, useRef } from 'react';
import { Square, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Input({
  onSubmit,
  className,
  children,
}: {
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className={cn('relative', className)}>
      {children}
    </form>
  );
}

export function PromptInputTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  maxHeight = 240,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      className={cn(
        'w-full resize-none rounded-2xl border bg-muted/20 px-4 py-3 pr-24 text-sm outline-none ring-offset-background',
        'focus-visible:ring-2 focus-visible:ring-primary/20',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      style={{ maxHeight }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
        }
      }}
    />
  );
}

export function PromptInputSubmit({
  status,
  disabled,
  onStop,
  className,
}: {
  status: 'ready' | 'streaming' | 'submitted' | 'error';
  disabled?: boolean;
  onStop?: () => void;
  className?: string;
}) {
  const isStreaming = status === 'streaming' || status === 'submitted';

  return (
    <div className={cn('absolute bottom-2 right-2 flex items-center gap-2', className)}>
      {isStreaming && onStop ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onStop}
          title="停止生成"
          aria-label="停止生成"
        >
          <Square className="h-4 w-4" />
        </Button>
      ) : null}
      <Button type="submit" size="icon" className="h-9 w-9 rounded-xl" disabled={disabled || isStreaming} title="发送" aria-label="发送">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
