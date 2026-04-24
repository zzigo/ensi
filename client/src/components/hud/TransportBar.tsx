import React from 'react';
import { useTransportStore } from '../../stores/useTransportStore';
import { TransportEngine } from '../../services/TransportEngine';
import { formatTimecode } from '../../utils/time';

export const TransportBar: React.FC = () => {
  const { playing, positionSec, bpm, numerator, denominator } = useTransportStore();
  const transport = TransportEngine.getInstance();

  return (
    <div className="transport-bar" style={{
      height: '40px',
      background: 'rgba(5, 7, 11, 0.95)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '20px',
      color: '#d8e1ea',
      zIndex: 110
    }}>
      {/* Play/Stop Button */}
      <button 
        onClick={() => transport.toggle()}
        style={{
          background: playing ? 'rgba(255, 77, 77, 0.15)' : 'rgba(140, 245, 168, 0.15)',
          border: `1px solid ${playing ? '#ff4d4d' : '#8cf5a8'}`,
          color: playing ? '#ff8f8f' : '#8cf5a8',
          padding: '4px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          minWidth: '60px'
        }}
      >
        {playing ? 'STOP' : 'PLAY'}
      </button>

      {/* Timecode */}
      <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: '16px', fontWeight: 500, minWidth: '120px' }}>
        {formatTimecode(positionSec)}
      </div>

      {/* BPM and Meter */}
      <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#9eb6cc' }}>
        <div>
          BPM: <span style={{ color: '#89d0ff' }}>{bpm.toFixed(1)}</span>
        </div>
        <div>
          METER: <span style={{ color: '#89d0ff' }}>{numerator}/{denominator}</span>
        </div>
      </div>
    </div>
  );
};
