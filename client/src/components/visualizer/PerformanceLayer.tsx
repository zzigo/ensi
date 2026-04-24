import React, { useEffect, useRef } from 'react';
import { useMixerStore } from '../../stores/useMixerStore';
import { useUIStore } from '../../stores/useUIStore';
import { useBufferStore } from '../../stores/useBufferStore';
import { AudioEngine } from '../../services/AudioEngine';

interface PerformanceLayerProps {
  stream: MediaStream | null;
}

export const PerformanceLayer: React.FC<PerformanceLayerProps> = ({ stream }) => {
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mixCanvasRef = useRef<HTMLCanvasElement>(null);
  const { videoChannels } = useMixerStore();
  const { hudVisible } = useUIStore();
  const { buffers } = useBufferStore();

  // Make video accessible globally for the looper engine to record
  useEffect(() => {
    if (liveVideoRef.current) {
      (window as any).__ENSI_LIVE_VIDEO__ = liveVideoRef.current;
    }
  }, []);

  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Main Performance Render Loop
  useEffect(() => {
    let frameId: number;
    const canvas = mixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const audioEngine = AudioEngine.getInstance();

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Render looper buffers (b1-b4)
      buffers.forEach((buffer, i) => {
        if (!buffer.play.active || !buffer.ready) return;

        let frame: ImageBitmap | null = null;
        const channelKey = `b${i + 1}`;
        const channelState = videoChannels[channelKey] || { mix: 1 };

        if (buffer.play.engine === 'hq' && buffer.frames.length > 0) {
          const elapsed = (audioEngine.ctx!.currentTime - buffer.play.startCtxTime) * buffer.play.rate;
          let t = buffer.play.direction === 1
            ? (buffer.play.startOffsetSec + elapsed)
            : (buffer.play.startOffsetSec - elapsed);

          if (buffer.play.loop) {
            t = ((t % buffer.duration) + buffer.duration) % buffer.duration;
          }

          const frameIndex = Math.max(0, Math.min(buffer.frames.length - 1, Math.floor(t * buffer.fps)));
          frame = buffer.frames[frameIndex];
        }

        if (frame) {
          ctx.globalAlpha = channelState.mix;
          ctx.drawImage(frame, 0, 0, w, h);
        }
      });

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, [buffers, videoChannels]);

  // Apply CSS filters from mixer store to the live video
  const vin = videoChannels['vin'] || { mix: 0.5, hue: 0, contrast: 1, brightness: 1, saturation: 1, blur: 0 };
  const vout = videoChannels['vout'] || { mix: 1, hue: 0, contrast: 1, brightness: 1, saturation: 1, blur: 0 };

  const filter = `
    hue-rotate(${vin.hue + vout.hue}deg) 
    contrast(${vin.contrast * vout.contrast}) 
    brightness(${vin.brightness * vout.brightness}) 
    saturate(${vin.saturation * vout.saturation}) 
    blur(${vin.blur + vout.blur}px)
  `;

  return (
    <div className="performance-layer" style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 0 }}>
      {/* Live Background */}
      <video
        ref={liveVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: vin.mix,
          filter,
          transform: 'scaleX(-1)', // Mirror by default
        }}
      />

      {/* Looper Mix Canvas */}
      <canvas
        ref={mixCanvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: vout.mix,
        }}
      />
      
      {!hudVisible && (
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>
          PERFORMANCE LIVE
        </div>
      )}
    </div>
  );
};
