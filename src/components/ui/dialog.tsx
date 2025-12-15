import React, { type ReactNode, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export interface DialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

export function Dialog({ children, open: controlledOpen, onOpenChange }: { children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setUncontrolledOpen(value);
    }
  };

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogTrigger must be used within Dialog");

  if (asChild && React.isValidElement(children)) {
    const element = children as React.ReactElement<{ onClick?: React.MouseEventHandler }>;
    return React.cloneElement(element, {
      onClick: (event) => {
        element.props.onClick?.(event);
        context.setOpen(true);
      },
    });
  }

  return (
    <button onClick={() => context.setOpen(true)} className="cursor-pointer">
      {children}
    </button>
  );
}

export function DialogContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogContent must be used within Dialog");

  if (!context.open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={() => context.setOpen(false)} />
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-[51] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background shadow-lg",
          className,
        )}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

export function DialogHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-2 mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;
}

export function DialogDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-gray-400 ${className}`}>{children}</p>;
}
