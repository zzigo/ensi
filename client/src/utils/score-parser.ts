import { CompiledScore } from '../types/score';
import { clamp } from './math';

export function stripScoreComment(line: string): string {
  const hashIndex = line.indexOf("#");
  const clean = hashIndex >= 0 ? line.slice(0, hashIndex) : line;
  return clean.trim();
}

export function parseScoreNumber(value: any): number {
  const numeric = parseFloat(String(value ?? "").trim());
  return isFinite(numeric) ? numeric : NaN;
}

export function parseScoreInt(value: any): number {
  const raw = String(value ?? "").trim();
  if (!raw) return NaN;
  const match = /^-?\d+/.exec(raw);
  if (!match) return NaN;
  return parseInt(match[0], 10);
}

export function isScoreNumericToken(value: any): boolean {
  return /^-?(?:\d+\.?\d*|\.\d+)(?:[a-zA-Z%]*)$/.test(String(value || "").trim());
}

export function parseScoreBeatLengthToken(value: any): number {
  const token = String(value ?? "").trim();
  if (!token) return NaN;
  const dottedMatch = /^(-?\d+)\.$/.exec(token);
  if (dottedMatch) {
    const base = parseFloat(dottedMatch[1]);
    return isFinite(base) ? base * 1.5 : NaN;
  }
  return parseScoreNumber(token);
}

// ... Additional helper functions from ensi.astro will be ported here as needed ...

export function compileScoreText(rawText: string, currentBpm: number = 60): CompiledScore {
  let baseTempo = clamp(currentBpm, 20, 400);
  const events: any[] = [];
  const immediateCommands: any[] = [];
  const parserWarnings: string[] = [];
  
  // Implementation logic from ensi.astro compileScoreText...
  // (Porting the logic surgically)
  
  return {
    text: rawText,
    displayName: "Untitled",
    events,
    immediateCommands,
    tempoMap: [],
    initialTempo: baseTempo,
    pickupBeats: 0,
    totalBeats: 0,
    totalSec: 0,
    beatToLineMap: [],
    meterPreview: "4/4",
    warnings: parserWarnings
  };
}
