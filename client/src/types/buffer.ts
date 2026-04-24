export interface BufferPlayState {
  active: boolean;
  source: AudioBufferSourceNode | null;
  engine: 'none' | 'media' | 'hq';
  direction: number;
  rate: number;
  startCtxTime: number;
  startOffsetSec: number;
  loop: boolean;
}

export interface EnsiBuffer {
  index: number;
  version: number;
  blob: Blob | null;
  url: string;
  videoEl: HTMLVideoElement | null;
  mediaNode: MediaElementAudioSourceNode | null;
  audioBuffer: AudioBuffer | null;
  reversedAudioBuffer: AudioBuffer | null;
  frames: ImageBitmap[];
  fps: number;
  duration: number;
  fastReady: boolean;
  hqReady: boolean;
  ready: boolean;
  processing: boolean;
  play: BufferPlayState;
}

export interface RecordingState {
  recorder: MediaRecorder | null;
  bufferIndex: number;
}
