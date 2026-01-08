import React from 'react';
import { cn } from '@/lib/utils';

export function Message({
  from,
  avatar,
  children,
  className,
}: {
  from: 'user' | 'assistant' | 'system' | string;
  avatar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const isUser = from === 'user';
  return (
    <div className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start', className)}>
      {!isUser && avatar ? <div className="mt-0.5 shrink-0">{avatar}</div> : null}
      {children}
    </div>
  );
}

export function MessageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('max-w-[92%] space-y-2', className)}>{children}</div>;
}

export function MessageResponse({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MessageUserBubble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-sm', className)}>
      {children}
    </div>
  );
}

export function MessageActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('flex items-center gap-1.5 text-muted-foreground', className)}>{children}</div>;
}
