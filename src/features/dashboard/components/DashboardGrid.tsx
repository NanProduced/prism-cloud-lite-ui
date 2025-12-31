import React, { useMemo } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import type { WidgetConfig } from '../types';
import { WIDGET_REGISTRY } from '../WidgetRegistry';
import { WidgetFrame } from './WidgetFrame';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardGridProps {
  widgets: WidgetConfig[];
  isEditMode: boolean;
  onLayoutChange: (layout: any[]) => void;
  onRemoveWidget: (id: string) => void;
  onUpdateWidgetSettings: (id: string, settings: any) => void;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  isEditMode,
  onLayoutChange,
  onRemoveWidget,
  onUpdateWidgetSettings,
}) => {
  const { width, containerRef, mounted } = useContainerWidth();

  const layouts = useMemo(() => ({
    lg: widgets.map(w => w.layout),
  }), [widgets]);

  return (
    <div ref={containerRef} className="w-full">
      {mounted && (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          width={width}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 4, md: 4, sm: 2, xs: 1, xxs: 1 }}
          rowHeight={120}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          onLayoutChange={(_: any, allLayouts: any) => onLayoutChange(allLayouts.lg)}
          draggableHandle=".cursor-grab"
          margin={[16, 16]}
        >
          {widgets.map((widget) => {
            const definition = WIDGET_REGISTRY[widget.type];
            if (!definition) return null;

            const WidgetComponent = definition.component;

            return (
              <div key={widget.id}>
                <WidgetFrame
                  title={definition.title}
                  icon={definition.icon}
                  isEditMode={isEditMode}
                  onRemove={widget.pinned ? undefined : () => onRemoveWidget(widget.id)}
                  dragHandleProps={{ className: 'cursor-grab' }}
                >
                  <WidgetComponent 
                    settings={widget.settings} 
                    onUpdateSettings={(s: any) => onUpdateWidgetSettings(widget.id, s)}
                  />
                </WidgetFrame>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  );
};
