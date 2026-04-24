import React, { useEffect, useRef } from 'react';
import { useTransportStore } from '../../stores/useTransportStore';
import { useScoreStore } from '../../stores/useScoreStore';

export const ScoreVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { positionSec } = useTransportStore();
  const { compiled } = useScoreStore();
  
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !compiled) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const zoomX = 40; // Pixels per second
    const playheadX = w * 0.2; // Keep playhead at 20% width
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw background grid (seconds)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    const startSec = Math.floor(positionSec - playheadX / zoomX);
    const endSec = Math.ceil(positionSec + (w - playheadX) / zoomX);
    
    for (let s = startSec; s <= endSec; s++) {
      const x = playheadX + (s - positionSec) * zoomX;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Draw Score Events
    compiled.events.forEach(event => {
      const x = playheadX + (event.timeSec - positionSec) * zoomX;
      if (x < 0 || x > w) return;

      if (event.kind === 'tempo') {
        ctx.fillStyle = '#89f0a8';
        ctx.fillRect(x - 1, 0, 2, h);
        ctx.font = '9px monospace';
        ctx.fillText(`${event.bpm}bpm`, x + 4, 15);
      } else if (event.kind === 'marker_bar') {
        ctx.strokeStyle = '#ffb347';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw Playhead
    ctx.strokeStyle = '#ff4d4d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, h);
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth * window.devicePixelRatio;
        canvas.height = parent.clientHeight * window.devicePixelRatio;
        canvas.style.width = `${parent.clientWidth}px`;
        canvas.style.height = `${parent.clientHeight}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    let frame: number;
    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
    };
  }, [compiled, positionSec]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
