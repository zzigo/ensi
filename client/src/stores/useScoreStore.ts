import { create } from 'zustand';
import { ScoreEntry, PanelMetadata, CompiledScore } from '../types/score';

interface ScoreState {
  activePanelId: string;
  panels: Record<string, PanelMetadata>;
  library: ScoreEntry[];
  compiled: CompiledScore | null;
  saving: boolean;
  followPlayhead: boolean;
  
  // Actions
  setActivePanel: (id: string) => void;
  addPanel: (id: string, metadata?: Partial<PanelMetadata>) => void;
  removePanel: (id: string) => void;
  updatePanelText: (id: string, text: string) => void;
  setLibrary: (library: ScoreEntry[]) => void;
  setCompiled: (compiled: CompiledScore | null) => void;
  setSaving: (saving: boolean) => void;
  setFollowPlayhead: (follow: boolean) => void;
}

export const useScoreStore = create<ScoreState>((set) => ({
  activePanelId: 'score-ed',
  panels: {
    'score-ed': {
      id: 'score-ed',
      text: '',
      fileName: '',
      sourceId: '',
      sourceLabel: 'SESSION',
      sourceUrl: '',
      dirty: false
    }
  },
  library: [],
  compiled: null,
  saving: false,
  followPlayhead: false,

  setActivePanel: (activePanelId) => set({ activePanelId }),
  
  addPanel: (id, metadata) => set((state) => ({
    panels: {
      ...state.panels,
      [id]: {
        id,
        text: '',
        fileName: '',
        sourceId: '',
        sourceLabel: 'NEW SCORE',
        sourceUrl: '',
        dirty: false,
        ...metadata
      }
    }
  })),

  removePanel: (id) => set((state) => {
    const { [id]: removed, ...remaining } = state.panels;
    return { panels: remaining };
  }),

  updatePanelText: (id, text) => set((state) => ({
    panels: {
      ...state.panels,
      [id]: { ...state.panels[id], text, dirty: true }
    }
  })),

  setLibrary: (library) => set({ library }),
  setCompiled: (compiled) => set({ compiled }),
  setSaving: (saving) => set({ saving }),
  setFollowPlayhead: (followPlayhead) => set({ followPlayhead }),
}));
