import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardLayoutV1, WidgetConfig, WidgetType } from '../types';
import { DASHBOARD_STORAGE_KEY, DEFAULT_LAYOUT } from '../constants';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { updateUserSettings } from '@/services/userApi';

export const useDashboardLayout = () => {
  const { user } = useAuthStore();
  const { preferences, fetchSettings } = useSettingsStore();
  const userId = user?.publicId || 'guest';
  const storageKey = `${DASHBOARD_STORAGE_KEY}.${userId}`;

  const [layout, setLayout] = useState<DashboardLayoutV1>(DEFAULT_LAYOUT);
  const initialized = useRef(false);

  // Load initial layout from store/settings or localStorage
  useEffect(() => {
    const loadLayout = async () => {
      // 1. Try backend settings (via store)
      await fetchSettings();
      const settings = useSettingsStore.getState();
      const backendLayout = settings.preferences ? (settings as any).ui?.dashboard?.layout : null;
      
      if (backendLayout) {
        setLayout(backendLayout);
      } else {
        // 2. Fallback to localStorage
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            setLayout(JSON.parse(saved));
          } catch (e) {
            setLayout(DEFAULT_LAYOUT);
          }
        }
      }
      initialized.current = true;
    };
    loadLayout();
  }, [userId, storageKey, fetchSettings]);

  // Sync layout to backend and localStorage on change
  useEffect(() => {
    if (!initialized.current) return;
    
    localStorage.setItem(storageKey, JSON.stringify(layout));
    
    const syncToBackend = async () => {
      try {
        await updateUserSettings({
          ui: {
            dashboard: { layout }
          }
        });
      } catch (e) {
        console.error('Failed to sync dashboard layout to backend', e);
      }
    };

    const timer = setTimeout(syncToBackend, 2000); // Debounce
    return () => clearTimeout(timer);
  }, [layout, storageKey]);

  const [isEditMode, setIsEditMode] = useState(false);

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
    setLayout(prev => {
      // Prevent duplicate widget types
      if (prev.widgets.some(w => w.type === type)) {
        return prev;
      }

      const id = type; // Use type as ID since only one of each is allowed
      const newWidget: WidgetConfig = {
        id,
        type,
        layout: { i: id, x: 0, y: Infinity, w: defaultLayout.w, h: defaultLayout.h },
      };
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        widgets: [...prev.widgets, newWidget],
      };
    });
  }, []);

  const removeWidget = useCallback((id: string) => {
    setLayout(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      widgets: prev.widgets.filter(w => w.id !== id || w.pinned),
    }));
  }, []);

  const updateWidgetSettings = useCallback((id: string, settings: any) => {
    setLayout(prev => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      widgets: prev.widgets.map(w => w.id === id ? { ...w, settings } : w),
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
    updateWidgetSettings,
    resetLayout,
  };
};
