import React from 'react';
import { MIDI_MAPPINGS } from '../../services/MidiService';

interface MappingEntry {
  id: string;
  label: string;
  syntax: string;
  osc: string;
  midi?: string;
  group: string;
}

const MAPPINGS: MappingEntry[] = [
  // UI Group
  { id: 'ui_hud_toggle', label: 'HUD Toggle', syntax: '-', osc: '/ensi/shortcut/ui/hud_toggle', group: 'UI' },
  { id: 'score_editor_toggle', label: 'Score Editor', syntax: '-', osc: '/ensi/shortcut/score/editor_toggle', group: 'UI' },
  
  // Transport Group
  { id: 'transport_play_toggle', label: 'Play Toggle', syntax: '-', osc: '/ensi/shortcut/transport/play_toggle', midi: `CC ${MIDI_MAPPINGS.TRANSPORT_TOGGLE}`, group: 'Transport' },
  { id: 'transport_bpm', label: 'BPM Change', syntax: 't [bpm]', osc: '/ensi/control/time/bpm', group: 'Transport' },
  
  // Buffer Group
  { id: 'buffer_1_record', label: 'B1 Record', syntax: '1 b', osc: '/ensi/shortcut/buffer/1/record_toggle', midi: `CC ${MIDI_MAPPINGS.BUFFER_1_REC}`, group: 'Buffers' },
  { id: 'buffer_1_play', label: 'B1 Play', syntax: '.1 vplay 1', osc: '/ensi/shortcut/buffer/1/play_forward_1x', midi: 'Note 60', group: 'Buffers' },
  
  // Audio Group
  { id: 'aud_mic_level', label: 'Mic Volume', syntax: 'ain [0-1.5]', osc: '/ensi/control/audio/mic/level', midi: `CC ${MIDI_MAPPINGS.MIC_VOLUME}`, group: 'Audio' },
  { id: 'aud_elec_level', label: 'Elec Volume', syntax: 'elec [0-1.5]', osc: '/ensi/control/audio/elec/level', midi: `CC ${MIDI_MAPPINGS.ELEC_VOLUME}`, group: 'Audio' },
  { id: 'aud_master_level', label: 'Master Volume', syntax: 'aout [0-1.5]', osc: '/ensi/control/audio/master/level', midi: `CC ${MIDI_MAPPINGS.MASTER_VOLUME}`, group: 'Audio' },
];

export const MappingPanel: React.FC = () => {
  return (
    <div className="mapping-panel" style={{ 
      height: '100%', 
      background: '#1e1e1e', 
      color: '#d4d4d4', 
      padding: '20px',
      overflowY: 'auto',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#8cf5a8', fontSize: '18px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        ENSI MAPPING COMMANDS
      </h2>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #333' }}>
            <th style={{ padding: '10px' }}>LABEL</th>
            <th style={{ padding: '10px' }}>ENSI SYNTAX</th>
            <th style={{ padding: '10px' }}>OSC ADDRESS</th>
            <th style={{ padding: '10px' }}>MIDI CC/NOTE</th>
          </tr>
        </thead>
        <tbody>
          {MAPPINGS.map((m) => (
            <tr key={m.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
              <td style={{ padding: '8px', color: '#9cdcfe' }}>{m.label}</td>
              <td style={{ padding: '8px', color: '#ce9178' }}>{m.syntax}</td>
              <td style={{ padding: '8px', color: '#b5cea8' }}>{m.osc}</td>
              <td style={{ padding: '8px', color: '#d7ba7d' }}>{m.midi || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '40px', padding: '15px', background: 'rgba(140, 245, 168, 0.05)', borderRadius: '4px', border: '1px solid rgba(140, 245, 168, 0.1)' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#8cf5a8' }}>HOW TO USE</h4>
        <p style={{ fontSize: '12px', margin: 0, lineHeight: '1.6' }}>
          • <strong>Score Editor:</strong> Type the syntax directly into a score tab and press Cmd+Enter to execute/save.<br/>
          • <strong>OSC:</strong> Send float values to the addresses shown (port 9000).<br/>
          • <strong>MIDI CC:</strong> Use your MIDI controller to send CC values (0-127).<br/>
          • <strong>MIDI Pads:</strong> Middle C (60) and up triggers buffer toggles.
        </p>
      </div>
    </div>
  );
};
