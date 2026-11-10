import {
  AudioPlayer,
  AudioStatus,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import {
  deleteTrackFile,
  downloadTrack,
  loadLibrary,
  newId,
  playableUri,
  saveLibrary,
  titleFromUrl,
  Track,
} from './library';

type AudioCtx = {
  player: AudioPlayer;
  status: AudioStatus;
  current: Track | null;
  library: Track[];
  play: (track: Track) => void;
  togglePlay: () => void;
  skip: (seconds: number) => void;
  seek: (seconds: number) => void;
  addUrl: (url: string, title?: string) => Track;
  addTracks: (tracks: Track[]) => void;
  removeTrack: (track: Track) => void;
  renameTrack: (track: Track, title: string) => void;
  saveOffline: (track: Track) => Promise<void>;
  downloading: Record<string, boolean>;
};

const Ctx = createContext<AudioCtx | null>(null);

export function useAudio(): AudioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudio must be used inside <AudioProvider>');
  return ctx;
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [current, setCurrent] = useState<Track | null>(null);
  const [library, setLibrary] = useState<Track[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

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
    if (loaded) saveLibrary(library).catch(() => {});
  }, [library, loaded]);

  // When a track finishes, rewind it so the play button starts it again.
  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
      player.seekTo(0);
    }
  }, [status.didJustFinish, player]);

  const play = useCallback(
    (track: Track) => {
      const uri = playableUri(track);
      if (!uri) {
        Alert.alert('Cannot play', 'This track has no file or link.');
        return;
      }
      if (current?.id === track.id && status.isLoaded) {
        player.play();
        return;
      }
      player.replace({ uri });
      player.play();
      setCurrent(track);
      try {
        player.setActiveForLockScreen(
          true,
          { title: track.title, artist: 'QR Audio' },
          { showSeekBackward: true, showSeekForward: true },
        );
      } catch {
        // Lock screen controls aren't available in every environment (e.g. Expo Go).
      }
    },
    [player, current, status.isLoaded],
  );

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

  const skip = useCallback(
    (delta: number) => seek((status.currentTime || 0) + delta),
    [seek, status.currentTime],
  );

  const addUrl = useCallback(
    (url: string, title?: string): Track => {
      const existing = library.find((t) => t.url === url);
      if (existing) return existing;
      const track: Track = { id: newId(), title: title || titleFromUrl(url), url, addedAt: Date.now() };
      setLibrary((prev) => [track, ...prev]);
      return track;
    },
    [library],
  );

  const addTracks = useCallback((tracks: Track[]) => {
    setLibrary((prev) => [...tracks, ...prev]);
  }, []);

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

  const renameTrack = useCallback((track: Track, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setLibrary((prev) => prev.map((t) => (t.id === track.id ? { ...t, title: clean } : t)));
    setCurrent((c) => (c?.id === track.id ? { ...c, title: clean } : c));
  }, []);

  const saveOffline = useCallback(async (track: Track) => {
    setDownloading((d) => ({ ...d, [track.id]: true }));
    try {
      const updated = await downloadTrack(track);
      setLibrary((prev) => prev.map((t) => (t.id === track.id ? updated : t)));
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : String(e));
    } finally {
      setDownloading((d) => {
        const { [track.id]: _, ...rest } = d;
        return rest;
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      player,
      status,
      current,
      library,
      play,
      togglePlay,
      skip,
      seek,
      addUrl,
      addTracks,
      removeTrack,
      renameTrack,
      saveOffline,
      downloading,
    }),
    [player, status, current, library, play, togglePlay, skip, seek, addUrl, addTracks, removeTrack, renameTrack, saveOffline, downloading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
