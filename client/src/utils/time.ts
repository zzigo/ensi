export function formatTimecode(sec: number): string {
  if (!isFinite(sec)) return "00:00:00";
  const absoluteSec = Math.abs(sec);
  const h = Math.floor(absoluteSec / 3600);
  const m = Math.floor((absoluteSec % 3600) / 60);
  const s = Math.floor(absoluteSec % 60);
  const ms = Math.floor((absoluteSec % 1) * 100);
  
  const hStr = h.toString().padStart(2, '0');
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');
  const msStr = ms.toString().padStart(2, '0');
  
  return `${sec < 0 ? '-' : ''}${hStr}:${mStr}:${sStr}.${msStr}`;
}
