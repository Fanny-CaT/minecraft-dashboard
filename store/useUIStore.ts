import { create } from 'zustand';
import { Tab, Toast } from '@/lib/types';

interface UIState {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  
  toasts: Toast[];
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
  
  powerMenuOpen: boolean;
  setPowerMenuOpen: (open: boolean) => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "status",
  setActiveTab: (tab) => set({ activeTab: tab }),

  toasts: [],
  addToast: (msg, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, type, msg }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  powerMenuOpen: false,
  setPowerMenuOpen: (open) => set({ powerMenuOpen: open }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
