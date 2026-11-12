export const colors = {
  bg: '#000000',
  surface: 'rgba(255,255,255,0.04)',
  surfaceStrong: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.14)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.55)',
  glow: 'rgba(110,215,255,0.75)',
  glowSoft: 'rgba(110,215,255,0.35)',
  ring: 'rgba(205,205,210,0.75)',
  danger: '#FF6B6B',
  success: '#3DD68C',
};

export const fonts = {
  medium: 'Quicksand_500Medium',
  semibold: 'Quicksand_600SemiBold',
  bold: 'Quicksand_700Bold',
};

/** Soft cyan halo used around active controls. */
export const glowShadow = `0 0 10px 1px ${colors.glowSoft}, 0 0 3px 0 ${colors.glow}`;

/** Black screen that fades to a very dark blue at the bottom. */
export const backdrop = {
  backgroundImage: 'linear-gradient(180deg, #000000 0%, #000000 55%, #0a0f1a 100%)',
};

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export const BLOCKED_MESSAGE = 'Dieser QR-Code gehört nicht zu Echoes.';

/** Pulls the first http(s) link out of scanned or typed text. */
export function extractUrl(data: string): string | null {
  const match = data.trim().match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : null;
}
