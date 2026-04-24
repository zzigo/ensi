import { AudioEngine } from './AudioEngine';
import { VoiceEngine } from './VoiceEngine';

export class MetronomeEngine {
  private static instance: MetronomeEngine;
  private audioEngine: AudioEngine;
  private voiceEngine: VoiceEngine;

  private constructor() {
    this.audioEngine = AudioEngine.getInstance();
    this.voiceEngine = VoiceEngine.getInstance();
  }

  public static getInstance(): MetronomeEngine {
    if (!MetronomeEngine.instance) {
      MetronomeEngine.instance = new MetronomeEngine();
    }
    return MetronomeEngine.instance;
  }

  public scheduleClick(atTime: number, accent: 'b' | 's' | 'n' = 'n') {
    const ctx = this.audioEngine.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    
    const isDownbeat = accent === 'b';
    const isSub = accent === 's';
    const dur = isDownbeat ? 0.08 : isSub ? 0.064 : 0.055;
    const peak = isDownbeat ? 0.42 : isSub ? 0.34 : 0.28;
    const freq = isDownbeat ? 1760 : isSub ? 1490 : 1320;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, atTime);

    amp.gain.setValueAtTime(0.0001, atTime);
    amp.gain.linearRampToValueAtTime(peak, atTime + 0.002);
    amp.gain.exponentialRampToValueAtTime(0.0001, atTime + dur);

    osc.connect(amp);
    const metInput = this.audioEngine.getChannelInput('metronome');
    amp.connect(metInput || ctx.destination);
    
    osc.start(atTime);
    osc.stop(atTime + dur + 0.005);
  }

  public async scheduleVoice(atTime: number, count: number) {
    await this.voiceEngine.playSpeech(String(count), atTime);
  }
}
