import { create } from 'zustand';
import { VideoChannelState, AudioChannelState, MasterState } from '../types/mixer';

interface MixerState {
  master: MasterState;
  videoChannels: Record<string, VideoChannelState>;
  audioChannels: Record<string, AudioChannelState>;
  
  // Actions
  setMaster: (patch: Partial<MasterState>) => void;
  setVideoChannel: (id: string, patch: Partial<VideoChannelState>) => void;
  setAudioChannel: (id: string, patch: Partial<AudioChannelState>) => void;
}

const initialVideoState = (): VideoChannelState => ({
  mix: 0,
  hue: 0,
  contrast: 1,
  brightness: 1,
  saturation: 1,
  blur: 0,
  mask: 'none'
});

const initialAudioState = (): AudioChannelState => ({
  volume: 0.7,
  pan: 0,
  mute: false,
  solo: false
});

export const useMixerStore = create<MixerState>((set) => ({
  master: {
    volume: 0.8,
    reverbWet: 0.5,
    reverbTimeMs: 4000,
    limiterThreshold: -3
  },
  videoChannels: {
    'b1': initialVideoState(),
    'b2': initialVideoState(),
    'b3': initialVideoState(),
    'b4': initialVideoState(),
    'vin': initialVideoState(),
    'vout': { ...initialVideoState(), mix: 1 }
  },
  audioChannels: {
    'b1': initialAudioState(),
    'b2': initialAudioState(),
    'b3': initialAudioState(),
    'b4': initialAudioState(),
    'ain': initialAudioState(),
  },

  setMaster: (patch) => set((state) => ({
    master: { ...state.master, ...patch }
  })),

  setVideoChannel: (id, patch) => set((state) => ({
    videoChannels: {
      ...state.videoChannels,
      [id]: { ...state.videoChannels[id], ...patch }
    }
  })),

  setAudioChannel: (id, patch) => set((state) => ({
    audioChannels: {
      ...state.audioChannels,
      [id]: { ...state.audioChannels[id], ...patch }
    }
  })),
}));
