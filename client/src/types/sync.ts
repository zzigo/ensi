export interface PeerState {
  userName: string;
  cursor?: { line: number; ch: number; panelId: string } | null;
  lastActive: number;
}

export type TransportSyncPatch = {
  playing?: boolean;
  positionSec?: number;
  bpm?: number;
};

export type SyncMessage =
  | { type: 'IDENTITY'; userName: string }
  | { type: 'CURSOR_MOVE'; userName: string; panelId: string; cursor: { line: number; ch: number } }
  | { type: 'TEXT_CHANGE'; userName: string; panelId: string; text: string }
  | ({ type: 'TRANSPORT_SYNC'; userName: string } & TransportSyncPatch)
  | { type: 'PEER_DISCONNECT'; userName: string };

