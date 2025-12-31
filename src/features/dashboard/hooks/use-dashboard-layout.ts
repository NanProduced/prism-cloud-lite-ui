import { useState, useEffect, useCallback } from 'react';
import type { DashboardLayoutV1, WidgetConfig, WidgetType } from '../types';
import { DASHBOARD_STORAGE_KEY, DEFAULT_LAYOUT } from '../constants';
import { useAuthStore } from '@/store/authStore';

export const useDashboardLayout = () => {
  const { user } = useAuthStore();
  const userId = user?.publicId || 'guest';
  const storageKey = `${DASHBOARD_STORAGE_KEY}.${userId}`;

  const [layout, setLayout] = useState<DashboardLayoutV1>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_LAYOUT;
      }
    }
    return DEFAULT_LAYOUT;
  });

  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(layout));
  }, [layout, storageKey]);

  const updateWidgetLayout = useCallback((newLayouts: any[]) => {
    setLayout(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      widgets: prev.widgets.map(w => {
        const matching = newLayouts.find(l => l.i === w.id);
        if (matching) {
          return { ...w, layout: matching };
        }
        return w;
      }),
    }));
  }, []);

  const addWidget = useCallback((type: WidgetType, defaultLayout: { w: number, h: number }) => {
    const id = `${type}-${Date.now()}`;
    const newWidget: WidgetConfig = {
      id,
      type,
      layout: { i: id, x: 0, y: Infinity, w: defaultLayout.w, h: defaultLayout.h },
    };
    setLayout(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      widgets: [...prev.widgets, newWidget],
    }));
  }, []);

  const removeWidget = useCallback((id: string) => {
    setLayout(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      widgets: prev.widgets.filter(w => w.id !== id || w.pinned),
    }));
  }, []);

  const resetLayout = useCallback((template?: DashboardLayoutV1) => {
    setLayout(template || DEFAULT_LAYOUT);
  }, []);

  return {
    layout,
    isEditMode,
    setIsEditMode,
    updateWidgetLayout,
    addWidget,
    removeWidget,
    resetLayout,
  };
};
