export interface VideoChannelState {
  mix: number;
  hue: number;
  contrast: number;
  brightness: number;
  saturation: number;
  blur: number;
  mask: string;
  xflip?: boolean;
  yflip?: boolean;
}

export interface AudioChannelState {
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
}

export interface MasterState {
  volume: number;
  reverbWet: number;
  reverbTimeMs: number;
  limiterThreshold: number;
}
