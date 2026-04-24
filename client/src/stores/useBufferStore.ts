import { create } from 'zustand';
import { EnsiBuffer, RecordingState } from '../types/buffer';
import { BUFFER_COUNT } from '../constants';

interface BufferStore {
  buffers: EnsiBuffer[];
  recording: RecordingState;
  
  // Actions
  updateBuffer: (index: number, patch: Partial<EnsiBuffer>) => void;
  updateBufferPlay: (index: number, patch: Partial<EnsiBuffer['play']>) => void;
  setRecording: (patch: Partial<RecordingState>) => void;
  resetBuffer: (index: number) => void;
}

const createInitialBuffer = (index: number): EnsiBuffer => ({
  index,
  version: 0,
  blob: null,
  url: '',
  videoEl: null,
  mediaNode: null,
  audioBuffer: null,
  reversedAudioBuffer: null,
  frames: [],
  fps: 24,
  duration: 0,
  fastReady: false,
  hqReady: false,
  ready: false,
  processing: false,
  play: {
    active: false,
    source: null,
    engine: 'none',
    direction: 1,
    rate: 1,
    startCtxTime: 0,
    startOffsetSec: 0,
    loop: true
  }
});

export const useBufferStore = create<BufferStore>((set) => ({
  buffers: Array.from({ length: BUFFER_COUNT }, (_, i) => createInitialBuffer(i)),
  recording: {
    recorder: null,
    bufferIndex: -1
  },

  updateBuffer: (index, patch) => set((state) => {
    const nextBuffers = [...state.buffers];
    nextBuffers[index] = { ...nextBuffers[index], ...patch };
    return { buffers: nextBuffers };
  }),

  updateBufferPlay: (index, patch) => set((state) => {
    const nextBuffers = [...state.buffers];
    nextBuffers[index] = {
      ...nextBuffers[index],
      play: { ...nextBuffers[index].play, ...patch }
    };
    return { buffers: nextBuffers };
  }),

  setRecording: (patch) => set((state) => ({
    recording: { ...state.recording, ...patch }
  })),

  resetBuffer: (index) => set((state) => {
    const nextBuffers = [...state.buffers];
    nextBuffers[index] = createInitialBuffer(index);
    return { buffers: nextBuffers };
  })
}));
