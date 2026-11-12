import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

export type Track = {
  id: string;
  title: string;
  /** Remote URL (from a QR code or typed in). */
  url?: string;
  /** File name inside the app's audio folder, once the MP3 has been saved for offline use. */
  fileName?: string;
  addedAt: number;
};

const STORAGE_KEY = 'qr-audio/library/v1';

// The absolute path of the Documents folder can change between app updates on iOS,
// so we store only the file name and work out the full path each time we need it.
function audioDir(): Directory {
  const dir = new Directory(Paths.document, 'audio');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function playableUri(track: Track): string | null {
  if (track.fileName) {
    const f = new File(audioDir(), track.fileName);
    if (f.exists) return f.uri;
  }
  return track.url ?? null;
}

export function isOffline(track: Track): boolean {
  return !!track.fileName && new File(audioDir(), track.fileName).exists;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function titleFromUrl(url: string): string {
  try {
    const path = url.split(/[?#]/)[0];
    const last = decodeURIComponent(path.split('/').filter(Boolean).pop() ?? '');
    const name = last.replace(/\.(mp3|m4a|aac|wav)$/i, '').replace(/[_-]+/g, ' ').trim();
    return name || new URL(url).hostname;
  } catch {
    return 'Audio';
  }
}

function safeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 80) || 'audio.mp3';
  return `${Date.now()}-${cleaned}`;
}

export async function loadLibrary(): Promise<Track[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Track[]) : [];
  } catch {
    return [];
  }
}

export async function saveLibrary(tracks: Track[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
}

export type LastSession = { id: string; position: number; rate: number };
const LAST_KEY = 'echoes/last-session/v1';

/** The echo that was open when the app was last used, where it stopped, and the speed. */
export async function loadLastSession(): Promise<LastSession | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<LastSession>;
    if (typeof s.id !== 'string') return null;
    return { id: s.id, position: Number(s.position) || 0, rate: Number(s.rate) || 1 };
  } catch {
    return null;
  }
}

export function saveLastSession(session: LastSession | null): void {
  const op = session ? AsyncStorage.setItem(LAST_KEY, JSON.stringify(session)) : AsyncStorage.removeItem(LAST_KEY);
  op.catch(() => {});
}

/** Downloads a remote track into the app so it also plays without a connection. */
export async function downloadTrack(track: Track): Promise<Track> {
  if (!track.url) return track;
  const fileName = safeFileName(`${track.title}.mp3`);
  await File.downloadFileAsync(track.url, new File(audioDir(), fileName));
  return { ...track, fileName };
}

export function deleteTrackFile(track: Track): void {
  if (!track.fileName) return;
  try {
    const f = new File(audioDir(), track.fileName);
    if (f.exists) f.delete();
  } catch {
    // ignore - the file is already gone
  }
}
