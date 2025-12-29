import { create } from 'zustand';

interface BreadcrumbState {
  overrides: Record<string, string>;
  setOverride: (path: string, label: string) => void;
  removeOverride: (path: string) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  overrides: {},
  setOverride: (path, label) => set((state) => ({
    overrides: { ...state.overrides, [path]: label }
  })),
  removeOverride: (path) => set((state) => {
    const next = { ...state.overrides };
    delete next[path];
    return { overrides: next };
  }),
}));
