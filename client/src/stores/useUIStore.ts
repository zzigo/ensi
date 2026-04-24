import { create } from 'zustand';
import type { PeerState } from '../types/sync';

type DockPosition = 'right' | 'left' | 'bottom' | 'detached';
type EditorTab = 'editor' | 'visualizer';

interface UIState {
  dockPosition: DockPosition;
  editorTab: EditorTab;
  hudVisible: boolean;
  performanceHudVisible: boolean;
  oscMapVisible: boolean;
  userName: string;
  peers: Record<string, PeerState>;
  
  // Actions
  setDockPosition: (pos: DockPosition) => void;
  setEditorTab: (tab: EditorTab) => void;
  setHudVisible: (visible: boolean) => void;
  setPerformanceHudVisible: (visible: boolean) => void;
  setOscMapVisible: (visible: boolean) => void;
  setUserName: (name: string) => void;
  updatePeers: (peers: Record<string, PeerState>) => void;
}

export const useUIStore = create<UIState>((set) => ({
  dockPosition: 'right',
  editorTab: 'editor',
  hudVisible: true,
  performanceHudVisible: false,
  oscMapVisible: false,
  userName: localStorage.getItem('ensi_user_name') || `User-${Math.floor(Math.random() * 1000)}`,
  peers: {},

  setDockPosition: (dockPosition) => set({ dockPosition }),
  setEditorTab: (editorTab) => set({ editorTab }),
  setHudVisible: (hudVisible) => set({ hudVisible }),
  setPerformanceHudVisible: (performanceHudVisible) => set({ performanceHudVisible }),
  setOscMapVisible: (oscMapVisible) => set({ oscMapVisible }),
  setUserName: (userName) => {
    localStorage.setItem('ensi_user_name', userName);
    set({ userName });
  },
  updatePeers: (peers) => set({ peers }),
}));
