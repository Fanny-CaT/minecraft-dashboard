import { create } from 'zustand';

interface NetworkState {
  bindIp: string;
  bindPort: string;
  loadingNetwork: boolean;
  savingNetwork: boolean;

  setBindIp: (ip: string) => void;
  setBindPort: (port: string) => void;
  setLoadingNetwork: (loading: boolean) => void;
  setSavingNetwork: (saving: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  bindIp: "0.0.0.0",
  bindPort: "25565",
  loadingNetwork: false,
  savingNetwork: false,

  setBindIp: (ip) => set({ bindIp: ip }),
  setBindPort: (port) => set({ bindPort: port }),
  setLoadingNetwork: (loading) => set({ loadingNetwork: loading }),
  setSavingNetwork: (saving) => set({ savingNetwork: saving }),
}));
