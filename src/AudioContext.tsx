import {
  AudioPlayer,
  AudioStatus,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { isAllowedUrl } from './config';
import {
  deleteTrackFile,
  downloadTrack,
  isOffline,
  loadLibrary,
  newId,
  playableUri,
  saveLibrary,
  titleFromUrl,
  Track,
} from './library';

/** How long an MP3 may take to start loading before we show an error. */
const LOAD_TIMEOUT_MS = 20000;

export type OpenResult = 'ok' | 'blocked';

type AudioCtx = {
  player: AudioPlayer;
  status: AudioStatus;
  current: Track | null;
  library: Track[];
  /** German error message when the current MP3 could not be loaded. */
  loadError: string | null;
  /** Ids of tracks that are being saved for offline use right now. */
  downloading: Record<string, boolean>;
  play: (track: Track) => void;
  retry: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  /** Adds a scanned or typed link to the found echoes and plays it. */
  openLink: (url: string) => OpenResult;
  removeTrack: (track: Track) => void;
};

const Ctx = createContext<AudioCtx | null>(null);

export function useAudio(): AudioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudio must be used inside <AudioProvider>');
  return ctx;
}

const LOAD_ERROR = 'Das Audio konnte nicht geladen werden. Prüfe deine Internetverbindung oder den QR-Code.';

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [current, setCurrent] = useState<Track | null>(null);
  const [library, setLibrary] = useState<Track[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [timedOut, setTimedOut] = useState(false);
  // Changes on every (re)load so the timeout below restarts even for the same track.
  const [loadToken, setLoadToken] = useState(0);
  const libraryRef = useRef<Track[]>([]);

  // Play even when the silent switch is on, and keep playing in the background / lock screen.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadLibrary().then((tracks) => {
      setLibrary(tracks);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    libraryRef.current = library;
    if (loaded) saveLibrary(library).catch(() => {});
  }, [library, loaded]);

  // When a track finishes, rewind it so the play button starts it again.
  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
      player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  // If the MP3 hasn't loaded after a while, treat it as failed.
  useEffect(() => {
    if (!current || status.isLoaded) return;
    const timer = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [current, status.isLoaded, loadToken]);

  const loadError = current && (status.error || (timedOut && !status.isLoaded)) ? LOAD_ERROR : null;

  const load = useCallback(
    (track: Track) => {
      const uri = playableUri(track);
      if (!uri) return;
      setTimedOut(false);
      setLoadToken((n) => n + 1);
      player.replace({ uri });
      player.play();
      setCurrent(track);
      try {
        player.setActiveForLockScreen(
          true,
          { title: track.title, artist: 'Echoes' },
          { showSeekBackward: true, showSeekForward: true },
        );
      } catch {
        // Lock screen controls aren't available in every environment (e.g. Expo Go).
      }
    },
    [player],
  );

  const play = useCallback(
    (track: Track) => {
      if (current?.id === track.id && status.isLoaded && !status.error) player.play();
      else load(track);
    },
    [player, current, status.isLoaded, status.error, load],
  );

  const retry = useCallback(() => {
    if (current) load(current);
  }, [current, load]);

  const togglePlay = useCallback(() => {
    if (!current) return;
    if (status.playing) player.pause();
    else player.play();
  }, [player, status.playing, current]);

  const seek = useCallback(
    (seconds: number) => {
      const max = status.duration || 0;
      player.seekTo(Math.max(0, max ? Math.min(seconds, max - 0.25) : seconds));
    },
    [player, status.duration],
  );

  /** Saves the MP3 on the device in the background; failures are silent (it still streams). */
  const saveOffline = useCallback(async (track: Track) => {
    if (!track.url || isOffline(track)) return;
    setDownloading((d) => ({ ...d, [track.id]: true }));
    try {
      const updated = await downloadTrack(track);
      if (libraryRef.current.some((t) => t.id === track.id)) {
        setLibrary((prev) => prev.map((t) => (t.id === track.id ? { ...t, fileName: updated.fileName } : t)));
      } else {
        deleteTrackFile(updated); // deleted while downloading
      }
    } catch {
      // No connection or not a downloadable file - the echo still plays online.
    } finally {
      setDownloading((d) => {
        const { [track.id]: _, ...rest } = d;
        return rest;
      });
    }
  }, []);

  const openLink = useCallback(
    (url: string): OpenResult => {
      if (!isAllowedUrl(url)) return 'blocked';
      let track = libraryRef.current.find((t) => t.url === url);
      if (!track) {
        track = { id: newId(), title: titleFromUrl(url), url, addedAt: Date.now() };
        const added = track;
        setLibrary((prev) => [added, ...prev]);
      }
      // Don't restart an echo that is already playing.
      if (!(current?.id === track.id && status.playing)) play(track);
      if (!track.fileName) saveOffline(track);
      return 'ok';
    },
    [current, status.playing, play, saveOffline],
  );

  const removeTrack = useCallback(
    (track: Track) => {
      if (current?.id === track.id) {
        player.pause();
        try {
          player.clearLockScreenControls();
        } catch {}
        setCurrent(null);
      }
      deleteTrackFile(track);
      setLibrary((prev) => prev.filter((t) => t.id !== track.id));
    },
    [current, player],
  );

  const value = useMemo(
    () => ({
      player,
      status,
      current,
      library,
      loadError,
      downloading,
      play,
      retry,
      togglePlay,
      seek,
      openLink,
      removeTrack,
    }),
    [player, status, current, library, loadError, downloading, play, retry, togglePlay, seek, openLink, removeTrack],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
