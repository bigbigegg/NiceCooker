import { create } from 'zustand';

type UIPanel = 'shop' | 'decoration' | 'employee' | 'recipes' | 'inventory' | 'settings' | null;

interface UIState {
  activePanel: UIPanel;
  isEditMode: boolean;
  isLoading: boolean;
  toasts: { id: string; message: string; type: 'info' | 'success' | 'warning' }[];

  setActivePanel: (panel: UIPanel) => void;
  togglePanel: (panel: UIPanel) => void;
  setEditMode: (editing: boolean) => void;
  setLoading: (loading: boolean) => void;
  addToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activePanel: null,
  isEditMode: false,
  isLoading: true,
  toasts: [],

  setActivePanel: (panel) => set({ activePanel: panel }),
  togglePanel: (panel) => set((s) => ({
    activePanel: s.activePanel === panel ? null : panel,
  })),
  setEditMode: (editing) => set({ isEditMode: editing }),
  setLoading: (loading) => set({ isLoading: loading }),
  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now().toString(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),
}));
