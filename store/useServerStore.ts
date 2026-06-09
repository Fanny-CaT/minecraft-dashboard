import { create } from 'zustand';
import { StatusData } from '@/lib/types';
import { fetchWithAuth } from '@/lib/apiClient';

interface ServerState {
  statusData: StatusData | null;
  cpuHistory: number[];
  ramHistory: number[];
  tpsHistory: number[];
  uptimeStart: number | null;
  uptimeDisplay: string;
  lastUpdate: string;
  statusError: boolean;
  actionLoading: string | null;

  setStatusData: (data: StatusData | null) => void;
  setUptimeStart: (start: number | null) => void;
  setUptimeDisplay: (display: string) => void;
  setActionLoading: (action: string | null) => void;
  
  fetchStatus: () => Promise<void>;
}

export const useServerStore = create<ServerState>((set, get) => ({
  statusData: null,
  cpuHistory: [],
  ramHistory: [],
  tpsHistory: [],
  uptimeStart: null,
  uptimeDisplay: "–",
  lastUpdate: "–",
  statusError: false,
  actionLoading: null,

  setStatusData: (data) => set({ statusData: data }),
  setUptimeStart: (start) => set({ uptimeStart: start }),
  setUptimeDisplay: (display) => set({ uptimeDisplay: display }),
  setActionLoading: (action) => set({ actionLoading: action }),

  fetchStatus: async () => {
    try {
      const res = await fetchWithAuth("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StatusData = await res.json();

      const cpuPct = Math.min(data.cpu, 100);
      const ramPct = data.maxMemory > 0 ? (data.memory / data.maxMemory) * 100 : 0;
      const tpsVal = data.tps ?? 20;

      set((state) => {
        const running = data.running;
        const start = running && !state.uptimeStart ? Date.now() : (!running ? null : state.uptimeStart);
        
        return {
          statusData: data,
          statusError: false,
          lastUpdate: new Date().toLocaleTimeString(),
          cpuHistory: [...state.cpuHistory.slice(-119), cpuPct],
          ramHistory: [...state.ramHistory.slice(-119), ramPct],
          tpsHistory: [...state.tpsHistory.slice(-119), tpsVal],
          uptimeStart: start
        };
      });
    } catch {
      set((state) => ({
        statusError: true,
        statusData: state.statusData ? { ...state.statusData, status: "offline", running: false } : null
      }));
    }
  }
}));
