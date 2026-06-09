import { create } from 'zustand';

interface ConsoleState {
  logs: string[];
  hasNewLogs: boolean;
  autoScroll: boolean;

  setLogs: (logs: string[] | ((prev: string[]) => string[])) => void;
  setHasNewLogs: (hasNew: boolean) => void;
  setAutoScroll: (auto: boolean) => void;
  clearLogs: () => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  logs: [],
  hasNewLogs: false,
  autoScroll: true,

  setLogs: (updater) => set((state) => ({
    logs: typeof updater === 'function' ? updater(state.logs) : updater
  })),
  setHasNewLogs: (hasNew) => set({ hasNewLogs: hasNew }),
  setAutoScroll: (auto) => set({ autoScroll: auto }),
  clearLogs: () => set({ logs: [], hasNewLogs: false }),
}));
