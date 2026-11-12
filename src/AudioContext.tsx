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
  loadLastSession,
  loadLibrary,
  newId,
  playableUri,
  saveLastSession,
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
  /** Playback speed, 1 = normal. */
  rate: number;
  setRate: (rate: number) => void;
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

function showOnLockScreen(player: AudioPlayer, track: Track) {
  try {
    player.setActiveForLockScreen(
      true,
      { title: track.title, artist: 'Echoes' },
      {
        showSeekBackward: true,
        showSeekForward: true,
        // Same 5-second jumps as the buttons in the app.
        seekBackwardIntervalSeconds: 5,
        seekForwardIntervalSeconds: 5,
      },
    );
  } catch {
    // Lock screen controls aren't available in every environment (e.g. Expo Go).
  }
}

const LOAD_ERROR ='Das Audio konnte nicht geladen werden. Prüfe deine Internetverbindung oder den QR-Code.';

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
  const [rate, setRate] = useState(1);
  const pendingSeek = useRef<number | null>(null);

  // Play even when the silent switch is on, and keep playing in the background / lock screen.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  // Load the found echoes, then reopen the last echo where the player left off (paused).
  useEffect(() => {
    Promise.all([loadLibrary(), loadLastSession()]).then(([tracks, last]) => {
      setLibrary(tracks);
      const track = last && tracks.find((t) => t.id === last.id);
      if (last) setRate(last.rate);
      if (track && last) {
        pendingSeek.current = last.position > 1 ? last.position : null;
        const uri = playableUri(track);
        if (uri) {
          player.replace({ uri });
          setCurrent(track);
          showOnLockScreen(player, track);
        }
      }
      setLoaded(true);
    });
  }, [player]);

  // Jump to the remembered position once the reopened echo has loaded.
  useEffect(() => {
    if (status.isLoaded && pendingSeek.current !== null) {
      player.seekTo(pendingSeek.current);
      pendingSeek.current = null;
    }
  }, [status.isLoaded, player]);

  // Remember the echo, position (every few seconds and on pause) and speed.
  const savedBucket = Math.floor((status.currentTime || 0) / 5);
  useEffect(() => {
    if (!loaded) return;
    if (!current) {
      saveLastSession(null);
      return;
    }
    if (pendingSeek.current !== null) return; // not restored yet - keep the old position
    saveLastSession({ id: current.id, position: player.currentTime || 0, rate });
  }, [loaded, current, savedBucket, status.playing, rate, player]);

  // Apply the chosen speed whenever audio is playing (also after play from the lock screen).
  useEffect(() => {
    if (status.playing && Math.abs((status.playbackRate || 1) - rate) > 0.01) {
      player.setPlaybackRate(rate, 'high');
    }
  }, [status.playing, status.playbackRate, rate, player]);

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
      pendingSeek.current = null;
      player.replace({ uri });
      player.play();
      setCurrent(track);
      showOnLockScreen(player, track);
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
      rate,
      setRate,
      play,
      retry,
      togglePlay,
      seek,
      openLink,
      removeTrack,
    }),
    [player, status, current, library, loadError, downloading, rate, play, retry, togglePlay, seek, openLink, removeTrack],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
