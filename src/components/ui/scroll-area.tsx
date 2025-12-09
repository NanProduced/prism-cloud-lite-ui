import { type ReactNode } from "react";

export function ScrollArea({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`overflow-y-auto ${className}`}
      style={{
        ...style,
        scrollBehavior: "smooth",
      }}
    >
      {children}
    </div>
  );
}
