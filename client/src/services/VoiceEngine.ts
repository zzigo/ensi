import meSpeak from 'mespeak';
// @ts-ignore
import meSpeakConfig from 'mespeak/src/mespeak_config.json';
// @ts-ignore
import meSpeakVoiceEs from 'mespeak/voices/es.json';
import { AudioEngine } from './AudioEngine';

export class VoiceEngine {
  private static instance: VoiceEngine;
  private ready = false;
  private loading = false;
  private cache = new Map<string, AudioBuffer>();

  private constructor() {}

  public static getInstance(): VoiceEngine {
    if (!VoiceEngine.instance) {
      VoiceEngine.instance = new VoiceEngine();
    }
    return VoiceEngine.instance;
  }

  public async ensureReady() {
    if (this.ready) return true;
    if (this.loading) return false;

    this.loading = true;
    try {
      meSpeak.loadConfig(meSpeakConfig);
      meSpeak.loadVoice(meSpeakVoiceEs);
      this.ready = true;
    } catch (e) {
      console.error('meSpeak init failed:', e);
    } finally {
      this.loading = false;
    }
    return this.ready;
  }

  public async speakToBuffer(text: string): Promise<AudioBuffer | null> {
    if (!await this.ensureReady()) return null;
    
    const audioEngine = AudioEngine.getInstance();
    if (!audioEngine.ctx) return null;

    if (this.cache.has(text)) return this.cache.get(text)!;

    try {
      const wav = meSpeak.speak(text, { rawdata: 'arraybuffer' }) as ArrayBuffer;
      if (!wav) return null;

      const buffer = await audioEngine.ctx.decodeAudioData(wav);
      this.cache.set(text, buffer);
      return buffer;
    } catch (e) {
      console.error('Speech synthesis failed:', e);
      return null;
    }
  }

  public async playSpeech(text: string, atTime: number) {
    const buffer = await this.speakToBuffer(text);
    const audioEngine = AudioEngine.getInstance();
    
    if (buffer && audioEngine.ctx) {
      const source = audioEngine.ctx.createBufferSource();
      source.buffer = buffer;
      const metInput = audioEngine.getChannelInput('metronome');
      source.connect(metInput || audioEngine.ctx.destination);
      source.start(atTime);
    }
  }
}
