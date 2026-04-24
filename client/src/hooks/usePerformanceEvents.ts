import { useEffect } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { LooperEngine } from '../services/LooperEngine';
import { TransportEngine } from '../services/TransportEngine';
import { AudioEngine } from '../services/AudioEngine';

const RECORD_KEYS = ['q', 'w', 'e', 'r'];
const PLAY_FWD_KEYS = ['a', 's', 'd', 'f'];
const PLAY_REV_KEYS = ['z', 'x', 'c', 'v'];

export const usePerformanceEvents = (stream: MediaStream | null) => {
  const { hudVisible, setHudVisible } = useUIStore();
  const looper = LooperEngine.getInstance();
  const transport = TransportEngine.getInstance();
  const audio = AudioEngine.getInstance();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
      
      if (isInput) return;

      // Ensure AudioContext is resumed on first interaction
      if (audio.ctx?.state === 'suspended') {
        await audio.ctx.resume();
      }

      // Toggle HUD with 'H'
      if (key === 'h') {
        e.preventDefault();
        setHudVisible(!hudVisible);
        return;
      }

      // Toggle Transport with Space
      if (e.code === 'Space') {
        e.preventDefault();
        transport.toggle();
        return;
      }

      // Rewind to Zero with '0'
      if (key === '0') {
        e.preventDefault();
        transport.setPosition(0);
        return;
      }

      // Reset all buffers with 'O'
      if (key === 'o') {
        e.preventDefault();
        looper.resetAll();
        return;
      }

      const getRate = () => {
        if (e.shiftKey) return 2.0;
        if (e.ctrlKey) return 0.5;
        return 1.0;
      };

      // Record buffers with Q, W, E, R
      const recordIndex = RECORD_KEYS.indexOf(key);
      if (recordIndex !== -1) {
        e.preventDefault();
        await looper.toggleRecording(recordIndex, stream);
        return;
      }

      // Play Forward with A, S, D, F
      const fwdIndex = PLAY_FWD_KEYS.indexOf(key);
      if (fwdIndex !== -1) {
        e.preventDefault();
        looper.togglePlayback(fwdIndex, 1, getRate());
        return;
      }

      // Play Reverse with Z, X, C, V
      const revIndex = PLAY_REV_KEYS.indexOf(key);
      if (revIndex !== -1) {
        e.preventDefault();
        looper.togglePlayback(revIndex, -1, getRate());
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hudVisible, setHudVisible, stream]);
};
