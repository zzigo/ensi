export interface ScoreEntry {
  id: string;
  fileName: string;
  label: string;
  url: string;
}

export interface PanelMetadata {
  id: string;
  text: string;
  fileName: string;
  sourceId: string;
  sourceLabel: string;
  sourceUrl: string;
  dirty: boolean;
}

export interface CompiledScore {
  text: string;
  displayName: string;
  events: any[]; // We'll refine this later
  immediateCommands: any[];
  tempoMap: any[];
  initialTempo: number;
  pickupBeats: number;
  totalBeats: number;
  totalSec: number;
  beatToLineMap: any[];
  meterPreview: string;
  warnings: string[];
}
