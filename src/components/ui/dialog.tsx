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

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

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

export type DialogPointerDownOutsideEvent = {
  preventDefault: () => void;
};

export function DialogContent({
  children,
  className = "",
  zIndex = 50,
  onPointerDownOutside,
}: {
  children: ReactNode;
  className?: string;
  zIndex?: number;
  onPointerDownOutside?: (e: DialogPointerDownOutsideEvent) => void;
}) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogContent must be used within Dialog");

  if (!context.open) return null;

  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-black/40" 
        style={{ zIndex: zIndex }} 
        onClick={() => {
          let prevented = false;
          onPointerDownOutside?.({
            preventDefault: () => {
              prevented = true;
            },
          });
          if (!prevented) context.setOpen(false);
        }} 
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background shadow-lg",
          className,
        )}
        style={{ zIndex: zIndex + 1 }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col space-y-2 mb-4 text-left", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold text-left", className)}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground text-left", className)}>{children}</p>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}>
      {children}
    </div>
  );
}
