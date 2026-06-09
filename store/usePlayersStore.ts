import { create } from 'zustand';
import { PlayerEntry } from '@/lib/types';

interface PlayersState {
  players: PlayerEntry[];
  loadingPlayers: boolean;
  playerError: string | null;

  setPlayers: (players: PlayerEntry[]) => void;
  setLoadingPlayers: (loading: boolean) => void;
  setPlayerError: (error: string | null) => void;
}

export const usePlayersStore = create<PlayersState>((set) => ({
  players: [],
  loadingPlayers: false,
  playerError: null,

  setPlayers: (players) => set({ players }),
  setLoadingPlayers: (loading) => set({ loadingPlayers: loading }),
  setPlayerError: (error) => set({ playerError: error }),
}));
