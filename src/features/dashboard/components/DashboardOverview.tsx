import React, { useState } from 'react';
import { useDashboardLayout } from '../hooks/use-dashboard-layout';
import { DashboardGrid } from './DashboardGrid';
import { WidgetLibrary } from './WidgetLibrary';
import { Button } from '@/components/ui/button';
import { 
  LayoutGrid, 
  Settings2, 
  Save, 
  Plus,
  Monitor
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_LAYOUT, OPS_FOCUS_LAYOUT } from '../constants';

export const DashboardOverview: React.FC = () => {
  const {
    layout,
    isEditMode,
    setIsEditMode,
    updateWidgetLayout,
    addWidget,
    removeWidget,
    resetLayout,
  } = useDashboardLayout();

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-1 min-h-screen">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back. Here is what's happening across your devices today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsLibraryOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Widget
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Templates
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Choose a Layout</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => resetLayout(DEFAULT_LAYOUT)}>
                    Default (Balanced)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => resetLayout(OPS_FOCUS_LAYOUT)}>
                    Ops Focus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setIsEditMode(false)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="h-4 w-4" />
                Finish Editing
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditMode(true)}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Customize
            </Button>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className={isEditMode ? "rounded-2xl border-2 border-dashed border-primary/20 p-4 bg-muted/30" : ""}>
        <DashboardGrid
          widgets={layout.widgets}
          isEditMode={isEditMode}
          onLayoutChange={updateWidgetLayout}
          onRemoveWidget={removeWidget}
        />
      </div>

      <WidgetLibrary
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAddWidget={addWidget}
        existingWidgetTypes={layout.widgets.map(w => w.type)}
      />

      {/* Footer Info */}
      <div className="mt-auto py-8 flex items-center justify-between border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Version 1.0.0</span>
          <span>Last updated: {layout.updatedAt ? new Date(layout.updatedAt).toLocaleString() : 'Never'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Monitor className="h-3 w-3" />
          <span>Prism Cloud Lite</span>
        </div>
      </div>
    </div>
  );
};
