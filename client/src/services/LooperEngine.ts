import { AudioEngine } from './AudioEngine';
import { useBufferStore } from '../stores/useBufferStore';

export class LooperEngine {
  private static instance: LooperEngine;
  private audioEngine: AudioEngine;

  private constructor() {
    this.audioEngine = AudioEngine.getInstance();
  }

  public static getInstance(): LooperEngine {
    if (!LooperEngine.instance) {
      LooperEngine.instance = new LooperEngine();
    }
    return LooperEngine.instance;
  }

  public async toggleRecording(index: number, mediaStream: MediaStream | null) {
    const { recording } = useBufferStore.getState();
    if (recording.recorder && recording.bufferIndex === index) {
      this.stopRecording();
    } else {
      if (!mediaStream) return;
      await this.startRecording(index, mediaStream);
    }
  }

  public async startRecording(index: number, mediaStream: MediaStream) {
    const bufferStore = useBufferStore.getState();
    if (bufferStore.recording.recorder) return;

    this.stopBuffer(index);
    const targetBuffer = bufferStore.buffers[index];
    const nextVersion = targetBuffer.version + 1;
    
    bufferStore.updateBuffer(index, { version: nextVersion, processing: true, ready: false });

    const recorder = new MediaRecorder(mediaStream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      bufferStore.setRecording({ recorder: null, bufferIndex: -1 });
      await this.finalizeRecording(index, chunks, recorder.mimeType, nextVersion);
    };

    recorder.start(100);
    bufferStore.setRecording({ recorder, bufferIndex: index });
  }

  public stopRecording() {
    const { recorder } = useBufferStore.getState().recording;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
  }

  private async finalizeRecording(index: number, chunks: Blob[], mimeType: string, version: number) {
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const bufferStore = useBufferStore.getState();

    // 1. Fast path: mark as ready for media playback
    bufferStore.updateBuffer(index, { url, fastReady: true, ready: true });

    // 2. HQ path: Extract frames and decode audio
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.audioEngine.ctx!.decodeAudioData(arrayBuffer);
      const reversedAudioBuffer = this.reverseAudioBuffer(audioBuffer);
      
      const { frames, duration } = await this.extractFrames(blob, audioBuffer.duration, 24);

      if (bufferStore.buffers[index].version === version) {
        bufferStore.updateBuffer(index, {
          audioBuffer,
          reversedAudioBuffer,
          frames,
          duration,
          hqReady: true,
          processing: false
        });
      }
    } catch (e) {
      console.error(`HQ processing failed for buffer ${index + 1}:`, e);
      bufferStore.updateBuffer(index, { processing: false });
    }
  }

  private async extractFrames(blob: Blob, duration: number, fps: number): Promise<{ frames: ImageBitmap[], duration: number }> {
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    
    await new Promise((r) => video.onloadedmetadata = r);
    
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 360;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    
    const frameCount = Math.max(1, Math.floor(duration * fps));
    const frames: ImageBitmap[] = [];

    for (let i = 0; i < frameCount; i++) {
      video.currentTime = Math.min(duration - 0.001, i / fps);
      await new Promise((r) => video.onseeked = r);
      ctx.drawImage(video, 0, 0, width, height);
      frames.push(await createImageBitmap(canvas));
    }

    URL.revokeObjectURL(url);
    return { frames, duration };
  }

  private reverseAudioBuffer(buffer: AudioBuffer): AudioBuffer {
    const reversed = this.audioEngine.ctx!.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const chan = buffer.getChannelData(i);
      const revChan = reversed.getChannelData(i);
      for (let j = 0; j < buffer.length; j++) {
        revChan[j] = chan[buffer.length - 1 - j];
      }
    }
    return reversed;
  }

  public playBuffer(index: number, direction: number = 1, rate: number = 1) {
    const b = useBufferStore.getState().buffers[index];
    if (!b.ready) return;

    this.stopBuffer(index);

    if (b.hqReady && b.audioBuffer) {
      const source = this.audioEngine.createBufferSource(
        direction === 1 ? b.audioBuffer : b.reversedAudioBuffer!,
        rate,
        b.play.loop
      );
      if (source) {
        source.start(0);
        useBufferStore.getState().updateBufferPlay(index, {
          active: true,
          source,
          engine: 'hq',
          direction,
          rate,
          startCtxTime: this.audioEngine.ctx?.currentTime || 0,
          startOffsetSec: direction === 1 ? 0 : b.duration
        });
      }
    } else {
      useBufferStore.getState().updateBufferPlay(index, {
        active: true,
        engine: 'media',
        direction: 1,
        rate
      });
    }
  }

  public stopBuffer(index: number) {
    const b = useBufferStore.getState().buffers[index];
    if (b.play.source) {
      this.audioEngine.stopBufferSource(b.play.source);
    }
    useBufferStore.getState().updateBufferPlay(index, {
      active: false,
      source: null,
      engine: 'none'
    });
  }

  public togglePlayback(index: number, direction: number = 1, rate: number = 1) {
    const b = useBufferStore.getState().buffers[index];
    if (b.play.active && b.play.direction === direction && Math.abs(b.play.rate - rate) < 0.01) {
      this.stopBuffer(index);
    } else {
      this.playBuffer(index, direction, rate);
    }
  }

  public resetAll() {
    useBufferStore.getState().buffers.forEach((_, i) => this.stopBuffer(i));
    for (let i = 0; i < 4; i++) useBufferStore.getState().resetBuffer(i);
  }
}
