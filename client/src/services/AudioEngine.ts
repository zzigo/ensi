import { REVERB_TIME_MS, MIX_WET } from '../constants';
import { clamp } from '../utils/math';

export class AudioEngine {
  private static instance: AudioEngine;
  public ctx: AudioContext | null = null;
  
  // Nodes
  private outputGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetSend: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private wetGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;

  // Channels
  private channels: Record<string, {
    input: GainNode;
    eqLow: BiquadFilterNode;
    eqMid: BiquadFilterNode;
    eqHigh: BiquadFilterNode;
    gain: GainNode;
    panner: StereoPannerNode | null;
    postPan: GainNode;
    send: GainNode;
  }> = {};

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async init() {
    if (this.ctx) return;
    
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Core Graph
    this.outputGain = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();
    this.wetSend = this.ctx.createGain();
    this.convolver = this.ctx.createConvolver();
    this.wetGain = this.ctx.createGain();
    this.masterGain = this.ctx.createGain();
    this.limiter = this.ctx.createDynamicsCompressor();

    // Reverb Setup
    this.convolver.buffer = this.createImpulseResponse(REVERB_TIME_MS, 2.4);
    this.dryGain.gain.value = 1 - MIX_WET;
    this.wetGain.gain.value = MIX_WET;

    // Connect Reverb
    this.dryGain.connect(this.outputGain);
    this.wetSend.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.outputGain);

    // Master Chain
    this.outputGain.connect(this.limiter);
    this.limiter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Initialize default channels
    this.initChannel('mic');
    this.initChannel('elec');
    this.initChannel('metronome');
  }

  private initChannel(id: string) {
    if (!this.ctx || this.channels[id]) return;

    const input = this.ctx.createGain();
    const eqLow = this.ctx.createBiquadFilter();
    const eqMid = this.ctx.createBiquadFilter();
    const eqHigh = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const postPan = this.ctx.createGain();
    const send = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    // Filter Config
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 120;
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 4500;

    // Connections
    input.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(gain);

    if (panner) {
      gain.connect(panner);
      panner.connect(postPan);
    } else {
      gain.connect(postPan);
    }

    postPan.connect(this.dryGain!);
    postPan.connect(send);
    send.connect(this.wetSend!);

    this.channels[id] = { input, eqLow, eqMid, eqHigh, gain, panner, postPan, send };
  }

  private createImpulseResponse(durationMs: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.max(1, Math.floor((ctx.sampleRate * durationMs) / 1000));
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = 1 - (i / length);
        data[i] = (Math.random() * 2 - 1) * Math.pow(t, decay);
      }
    }
    return impulse;
  }

  public setChannelVolume(id: string, value: number) {
    const channel = this.channels[id];
    if (channel && this.ctx) {
      channel.gain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  public setChannelPan(id: string, value: number) {
    const channel = this.channels[id];
    if (channel?.panner && this.ctx) {
      channel.panner.pan.setTargetAtTime(clamp(value, -1, 1), this.ctx.currentTime, 0.02);
    }
  }

  public setMasterVolume(value: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  public stopBufferSource(source: AudioBufferSourceNode | null) {
    if (!source) return;
    try {
      source.stop(0);
      source.disconnect();
    } catch (e) {
      // already stopped or disconnected
    }
  }

  public createBufferSource(buffer: AudioBuffer, rate: number, loop: boolean): AudioBufferSourceNode | null {
    if (!this.ctx) return null;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.loop = loop;
    
    // Connect to the 'elec' input channel by default for loopers
    const elec = this.channels['elec'];
    if (elec) {
      source.connect(elec.input);
    }
    
    return source;
  }

  public getChannelFilters(id: string) {
    const channel = this.channels[id];
    return channel ? { low: channel.eqLow, mid: channel.eqMid, high: channel.eqHigh } : null;
  }

  public getChannelInput(id: string): GainNode | null {
    return this.channels[id]?.input || null;
  }
}
