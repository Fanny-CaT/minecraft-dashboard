import { create } from 'zustand';
import type { StatusData } from '@/lib/types';

interface AppState {
  statusData: StatusData | null;
  setStatusData: (data: StatusData | null) => void;
  
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  logs: string[];
  setLogs: (logs: string[]) => void;
  
  players: any[];
  setPlayers: (players: any[]) => void;

  // We can add more state here as we migrate from page.tsx
}

export const useStore = create<AppState>((set) => ({
  statusData: null,
  setStatusData: (data) => set({ statusData: data }),
  
  isOnline: false,
  setIsOnline: (online) => set({ isOnline: online }),

  logs: [],
  setLogs: (logs) => set({ logs }),
  
  players: [],
  setPlayers: (players) => set({ players }),
}));
