import React from 'react';
import { WIDGET_REGISTRY } from '../WidgetRegistry';
import type { WidgetType } from '../types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface WidgetLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType, defaultLayout: { w: number, h: number }) => void;
  existingWidgetTypes: WidgetType[];
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  isOpen,
  onClose,
  onAddWidget,
  existingWidgetTypes,
}) => {
  const categories = ['Business', 'Insight', 'Utility'] as const;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Widget Library</SheetTitle>
          <SheetDescription>
            Add functional cards to your dashboard to customize your workflow.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          <div className="space-y-8">
            {categories.map(category => (
              <div key={category} className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {Object.values(WIDGET_REGISTRY)
                    .filter(w => w.category === category)
                    .map(widget => (
                      <div 
                        key={widget.type}
                        className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            {widget.icon}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{widget.title}</div>
                            <div className="text-xs text-muted-foreground">{widget.description}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            onAddWidget(widget.type, widget.defaultLayout);
                            onClose();
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
