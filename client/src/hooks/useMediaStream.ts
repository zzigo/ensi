import { useEffect, useRef, useState } from 'react';
import { useDeviceStore } from '../stores/useDeviceStore';
import { AudioEngine } from '../services/AudioEngine';

export const useMediaStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { selectedCameraId, selectedMicId, setDevices } = useDeviceStore();
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const refreshDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');
    const microphones = devices.filter(d => d.kind === 'audioinput');
    setDevices(cameras, microphones);
  };

  const buildConstraints = (videoId = '', micId = '') => {
    return {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 60 },
        ...(videoId ? { deviceId: { exact: videoId } } : {})
      },
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        ...(micId ? { deviceId: { exact: micId } } : {})
      }
    };
  };

  const requestStream = async (videoId = '', micId = '') => {
    try {
      const constraints = buildConstraints(videoId, micId);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Cleanup old stream
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      setStream(newStream);
      
      // Connect to AudioEngine
      const audioEngine = AudioEngine.getInstance();
      if (audioEngine.ctx) {
        if (micSourceRef.current) micSourceRef.current.disconnect();
        
        micSourceRef.current = audioEngine.ctx.createMediaStreamSource(newStream);
        const micInput = audioEngine.getChannelInput('mic');
        if (micInput) {
          micSourceRef.current.connect(micInput);
        }
      }

      return newStream;
    } catch (e) {
      console.error('Stream request failed:', e);
      // If specific ID failed, try with default
      if (videoId || micId) {
        return requestStream('', '');
      }
      return null;
    }
  };

  useEffect(() => {
    refreshDevices();
    requestStream(selectedCameraId, selectedMicId);

    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [selectedCameraId, selectedMicId]);

  return stream;
};
