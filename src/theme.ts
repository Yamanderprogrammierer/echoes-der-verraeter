export const colors = {
  bg: '#0E0F13',
  card: '#1A1C23',
  cardAlt: '#23262F',
  border: '#2E313B',
  text: '#F4F5F7',
  muted: '#9A9FAD',
  accent: '#4F8CFF',
  accentSoft: 'rgba(79,140,255,0.16)',
  danger: '#FF5A5F',
  success: '#3DD68C',
};

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
