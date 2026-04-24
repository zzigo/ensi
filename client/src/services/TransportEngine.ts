import { AudioEngine } from './AudioEngine';
import { useTransportStore } from '../stores/useTransportStore';
import type { TransportSyncPatch } from '../types/sync';
import { SyncService } from './SyncService';

export class TransportEngine {
  private static instance: TransportEngine;
  private audioEngine: AudioEngine;
  private schedulerTimer: number | null = null;

  private constructor() {
    this.audioEngine = AudioEngine.getInstance();
  }

  public static getInstance(): TransportEngine {
    if (!TransportEngine.instance) {
      TransportEngine.instance = new TransportEngine();
    }
    return TransportEngine.instance;
  }

  public play(skipBroadcast = false) {
    const { positionSec } = useTransportStore.getState();
    const ctx = this.audioEngine.ctx;
    if (!ctx) return;

    const startCtxTime = ctx.currentTime + 0.05;
    useTransportStore.getState().syncTransport(startCtxTime, positionSec);
    useTransportStore.getState().setPlaying(true);

    this.startScheduler();

    if (!skipBroadcast) {
      this.broadcast({ playing: true, positionSec });
    }
  }

  public stop(skipBroadcast = false) {
    useTransportStore.getState().setPlaying(false);
    this.stopScheduler();

    if (!skipBroadcast) {
      this.broadcast({ playing: false });
    }
  }

  private startScheduler() {
    if (this.schedulerTimer) return;
    
    const tick = () => {
      const { playing, anchorCtxTime, anchorPosSec } = useTransportStore.getState();
      if (!playing) return;

      const ctx = this.audioEngine.ctx;
      if (ctx) {
        const elapsed = Math.max(0, ctx.currentTime - anchorCtxTime);
        const currentPos = anchorPosSec + elapsed;
        useTransportStore.getState().setPositionSec(currentPos);
      }
      
      this.schedulerTimer = requestAnimationFrame(tick);
    };
    
    this.schedulerTimer = requestAnimationFrame(tick);
  }

  private stopScheduler() {
    if (this.schedulerTimer) {
      cancelAnimationFrame(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  public toggle() {
    const { playing } = useTransportStore.getState();
    if (playing) this.stop();
    else this.play();
  }

  public setPosition(sec: number, skipBroadcast = false) {
    const { playing } = useTransportStore.getState();
    const ctx = this.audioEngine.ctx;
    if (playing && ctx) {
      useTransportStore.getState().syncTransport(ctx.currentTime, sec);
    }
    useTransportStore.getState().setPositionSec(sec);

    if (!skipBroadcast) {
      this.broadcast({ positionSec: sec });
    }
  }

  public setBpm(bpm: number, skipBroadcast = false) {
    useTransportStore.getState().setBpm(bpm);
    if (!skipBroadcast) {
      this.broadcast({ bpm });
    }
  }

  private broadcast(patch: TransportSyncPatch) {
    SyncService.getInstance().broadcastTransport(patch);
  }
}
