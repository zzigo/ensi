import { create } from 'zustand';

interface TransportState {
  playing: boolean;
  bpm: number;
  numerator: number;
  denominator: number;
  positionSec: number;
  anchorCtxTime: number;
  anchorPosSec: number;
  pickupBeats: number;
  
  // Actions
  setPlaying: (playing: boolean) => void;
  setBpm: (bpm: number) => void;
  setTimeSignature: (num: number, den: number) => void;
  setPositionSec: (sec: number) => void;
  setPickupBeats: (beats: number) => void;
  syncTransport: (anchorCtxTime: number, anchorPosSec: number) => void;
}

export const useTransportStore = create<TransportState>((set) => ({
  playing: false,
  bpm: 60,
  numerator: 4,
  denominator: 4,
  positionSec: 0,
  anchorCtxTime: 0,
  anchorPosSec: 0,
  pickupBeats: 0,

  setPlaying: (playing) => set({ playing }),
  setBpm: (bpm) => set({ bpm }),
  setTimeSignature: (numerator, denominator) => set({ numerator, denominator }),
  setPositionSec: (positionSec) => set({ positionSec }),
  setPickupBeats: (pickupBeats) => set({ pickupBeats }),
  syncTransport: (anchorCtxTime, anchorPosSec) => set({ anchorCtxTime, anchorPosSec }),
}));
