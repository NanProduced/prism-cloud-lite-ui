import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn("mx-auto max-w-7xl px-6 sm:px-8 lg:px-12", className)}
      {...props}
    >
      {children}
    </div>
  );
};
