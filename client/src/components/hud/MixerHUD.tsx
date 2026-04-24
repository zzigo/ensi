import React from 'react';
import { useMixerStore } from '../../stores/useMixerStore';
import { useUIStore } from '../../stores/useUIStore';
import { AudioEngine } from '../../services/AudioEngine';

interface FaderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  color?: string;
}

const Fader: React.FC<FaderProps> = ({ label, value, onChange, color = '#89d0ff' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '40px' }}>
    <span style={{ fontSize: '10px', color: '#9eb6cc', fontWeight: 'bold' }}>{label}</span>
    <div style={{ height: '140px', width: '30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', position: 'relative' }}>
      <input 
        type="range" 
        min="0" max="1.5" step="0.01" 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '130px',
          height: '24px',
          position: 'absolute',
          top: '58px',
          left: '-50px',
          transform: 'rotate(-90deg)',
          appearance: 'none',
          background: 'transparent',
          cursor: 'pointer'
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${(value / 1.5) * 100}%`,
        background: color,
        opacity: 0.3,
        pointerEvents: 'none',
        borderRadius: '0 0 3px 3px'
      }} />
    </div>
    <span style={{ fontSize: '10px', color }}>{value.toFixed(2)}</span>
  </div>
);

export const MixerHUD: React.FC = () => {
  const { master, audioChannels, setMaster, setAudioChannel } = useMixerStore();
  const { userName, setUserName } = useUIStore();
  const audioEngine = AudioEngine.getInstance();

  const handleMasterChange = (val: number) => {
    setMaster({ volume: val });
    audioEngine.setMasterVolume(val);
  };

  const handleChannelChange = (id: string, val: number) => {
    setAudioChannel(id, { volume: val });
    audioEngine.setChannelVolume(id, val);
  };

  return (
    <div className="mixer-hud" style={{
      width: '260px',
      height: '100%',
      background: 'rgba(12, 17, 25, 0.98)',
      borderLeft: '1px solid rgba(255,255,255,0.12)',
      padding: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      zIndex: 110,
      position: 'absolute',
      right: 0,
      top: 0
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <h3 style={{ margin: 0, fontSize: '11px', letterSpacing: '0.15em', color: '#9eb6cc', textTransform: 'uppercase' }}>User Identity</h3>
        <input 
          type="text" 
          value={userName} 
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name..."
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#8cf5a8',
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px',
            outline: 'none'
          }}
        />
      </div>

      <h3 style={{ margin: 0, fontSize: '11px', letterSpacing: '0.15em', color: '#9eb6cc', textTransform: 'uppercase' }}>Audio Mixer</h3>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
        <Fader label="MIC" value={audioChannels['mic']?.volume || 0} onChange={(v) => handleChannelChange('mic', v)} color="#7fd7a2" />
        <Fader label="ELEC" value={audioChannels['elec']?.volume || 0} onChange={(v) => handleChannelChange('elec', v)} color="#89d0ff" />
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }} />
        <Fader label="MASTER" value={master.volume} onChange={handleMasterChange} color="#ffb347" />
      </div>

      <div style={{ fontSize: '10px', color: '#555' }}>
        TIPS: USE 'H' TO HIDE HUD
      </div>
    </div>
  );
};
