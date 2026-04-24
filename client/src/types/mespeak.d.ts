declare module 'mespeak' {
  interface SpeakOptions {
    rawdata?: 'arraybuffer' | string;
    [key: string]: unknown;
  }

  const meSpeak: {
    loadConfig(config: unknown): void;
    loadVoice(voice: unknown): void;
    speak(text: string, options?: SpeakOptions): ArrayBuffer | string | boolean;
  };

  export default meSpeak;
}

declare module 'mespeak/src/mespeak_config.json' {
  const value: unknown;
  export default value;
}

declare module 'mespeak/voices/es.json' {
  const value: unknown;
  export default value;
}

