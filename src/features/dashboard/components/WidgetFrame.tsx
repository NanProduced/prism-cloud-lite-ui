import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RefreshCw, X, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WidgetFrameProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isEditMode?: boolean;
  onRemove?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  dragHandleProps?: any;
}

export const WidgetFrame = React.forwardRef<HTMLDivElement, WidgetFrameProps>(
  ({ title, icon, children, className, isEditMode, onRemove, onRefresh, isLoading, dragHandleProps }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "h-full w-full overflow-hidden flex flex-col group/widget",
          isEditMode && "ring-2 ring-primary/20",
          className
        )}
      >
        <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            {isEditMode && (
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                <GripHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            {icon && <div className="text-primary">{icon}</div>}
            <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </Button>
            )}
            {isEditMode && onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 min-h-0">
          {children}
        </CardContent>
      </Card>
    );
  }
);

WidgetFrame.displayName = 'WidgetFrame';
