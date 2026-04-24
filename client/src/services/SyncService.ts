import { useUIStore } from '../stores/useUIStore';
import type { PeerState, SyncMessage, TransportSyncPatch } from '../types/sync';
import { TransportEngine } from './TransportEngine';

export class SyncService {
  private static instance: SyncService;
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private peers = new Map<string, PeerState>();
  private onRemoteTextChange: ((panelId: string, text: string) => void) | null = null;
  private onPeersUpdate: ((peers: PeerState[]) => void) | null = null;

  private constructor() {
    this.connect();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      if (this.reconnectTimer) {
        clearInterval(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.sendIdentity();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SyncMessage;
        this.handleMessage(data);
      } catch (e) {
        console.warn('Failed to parse sync message:', e);
      }
    };

    this.ws.onclose = () => {
      if (!this.reconnectTimer) {
        this.reconnectTimer = window.setInterval(() => this.connect(), 3000);
      }
    };
  }

  private sendIdentity() {
    const { userName } = useUIStore.getState();
    this.send({ type: 'IDENTITY', userName });
  }

  public send(data: SyncMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public setCallbacks(handlers: {
    onRemoteTextChange?: (panelId: string, text: string) => void;
    onPeersUpdate?: (peers: PeerState[]) => void;
  }) {
    if (handlers.onRemoteTextChange) this.onRemoteTextChange = handlers.onRemoteTextChange;
    if (handlers.onPeersUpdate) this.onPeersUpdate = handlers.onPeersUpdate;
  }

  private handleMessage(data: SyncMessage) {
    const { userName: myName, updatePeers } = useUIStore.getState();
    const transport = TransportEngine.getInstance();
    
    if (data.userName === myName) return;

    switch (data.type) {
      case 'IDENTITY':
      case 'CURSOR_MOVE':
        this.peers.set(data.userName, {
          userName: data.userName,
          cursor: data.type === 'CURSOR_MOVE' ? { ...data.cursor, panelId: data.panelId } : null,
          lastActive: Date.now()
        });
        updatePeers(Object.fromEntries(this.peers));
        this.onPeersUpdate?.([...this.peers.values()]);
        break;

      case 'TEXT_CHANGE':
        this.onRemoteTextChange?.(data.panelId, data.text);
        break;

      case 'TRANSPORT_SYNC':
        // Apply remote transport state
        if (data.playing !== undefined) {
            if (data.playing) transport.play(true); // true = skipBroadcast
            else transport.stop(true);
        }
        if (data.positionSec !== undefined) {
            transport.setPosition(data.positionSec, true);
        }
        if (data.bpm !== undefined) {
            transport.setBpm(data.bpm, true);
        }
        break;
      
      case 'PEER_DISCONNECT':
        this.peers.delete(data.userName);
        updatePeers(Object.fromEntries(this.peers));
        this.onPeersUpdate?.([...this.peers.values()]);
        break;
    }
  }

  public broadcastCursor(panelId: string, line: number, ch: number) {
    const { userName } = useUIStore.getState();
    this.send({
      type: 'CURSOR_MOVE',
      userName,
      panelId,
      cursor: { line, ch }
    });
  }

  public broadcastText(panelId: string, text: string) {
    const { userName } = useUIStore.getState();
    this.send({
      type: 'TEXT_CHANGE',
      userName,
      panelId,
      text
    });
  }

  public broadcastTransport(patch: TransportSyncPatch) {
    const { userName } = useUIStore.getState();
    this.send({
      type: 'TRANSPORT_SYNC',
      userName,
      ...patch
    });
  }
}
