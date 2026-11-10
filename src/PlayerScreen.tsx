import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAudio } from './AudioContext';
import { colors, formatTime } from './theme';

export default function PlayerScreen({ onScan }: { onScan: () => void }) {
  const { current, status, togglePlay, skip, seek } = useAudio();

  if (!current) {
    return (
      <View style={styles.center}>
        <Ionicons name="musical-notes" size={64} color={colors.muted} />
        <Text style={styles.title}>Nothing playing</Text>
        <Text style={styles.muted}>Scan a QR code or open an MP3 file to start listening.</Text>
        <Pressable style={styles.primary} onPress={onScan}>
          <Ionicons name="qr-code" size={18} color="#fff" />
          <Text style={styles.primaryText}>Scan a code</Text>
        </Pressable>
      </View>
    );
  }

  const loading = !status.isLoaded || status.isBuffering;

  return (
    <View style={styles.center}>
      <View style={styles.inner}>
        <View style={styles.art}>
          <Ionicons name="musical-note" size={96} color={colors.accent} />
        </View>
        <Text style={styles.trackTitle} numberOfLines={2}>
          {current.title}
        </Text>
        <Text style={styles.muted} numberOfLines={1}>
          {current.fileName ? 'On this device' : current.url}
        </Text>

        <SeekBar position={status.currentTime} duration={status.duration} onSeek={seek} />

        <View style={styles.controls}>
          <Pressable onPress={() => skip(-15)} style={styles.small} accessibilityLabel="Back 15 seconds">
            <Ionicons name="play-back" size={30} color={colors.text} />
            <Text style={styles.skipLabel}>15</Text>
          </Pressable>
          <Pressable
            onPress={togglePlay}
            style={({ pressed }) => [styles.big, pressed && { transform: [{ scale: 0.96 }] }]}
            accessibilityLabel={status.playing ? 'Pause' : 'Play'}
          >
            {loading && status.playing ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Ionicons name={status.playing ? 'pause' : 'play'} size={40} color="#fff" style={!status.playing && { marginLeft: 4 }} />
            )}
          </Pressable>
          <Pressable onPress={() => skip(15)} style={styles.small} accessibilityLabel="Forward 15 seconds">
            <Ionicons name="play-forward" size={30} color={colors.text} />
            <Text style={styles.skipLabel}>15</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SeekBar({ position, duration, onSeek }: { position: number; duration: number; onSeek: (s: number) => void }) {
  const width = useRef(1);
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = dragging ?? position;
  const pct = duration > 0 ? Math.min(1, Math.max(0, shown / duration)) : 0;

  const toSeconds = (e: GestureResponderEvent) =>
    Math.min(1, Math.max(0, e.nativeEvent.locationX / width.current)) * duration;

  return (
    <View style={styles.seekWrap}>
      <View
        style={styles.seekTouch}
        onLayout={(e) => (width.current = e.nativeEvent.layout.width || 1)}
        onStartShouldSetResponder={() => duration > 0}
        onMoveShouldSetResponder={() => duration > 0}
        onResponderGrant={(e) => setDragging(toSeconds(e))}
        onResponderMove={(e) => setDragging(toSeconds(e))}
        onResponderRelease={(e) => {
          onSeek(toSeconds(e));
          setDragging(null);
        }}
        onResponderTerminate={() => setDragging(null)}
      >
        <View style={styles.track} pointerEvents="none">
          <View style={[styles.fillBar, { width: `${pct * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: `${pct * 100}%` }]} pointerEvents="none" />
      </View>
      <View style={styles.times}>
        <Text style={styles.time}>{formatTime(shown)}</Text>
        <Text style={styles.time}>{duration > 0 ? `-${formatTime(duration - shown)}` : '--:--'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  inner: { width: '100%', maxWidth: 520, alignItems: 'center', gap: 10 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 14, textAlign: 'center', maxWidth: '100%' },
  primary: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 8,
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  art: {
    width: '70%',
    maxWidth: 340,
    aspectRatio: 1,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  trackTitle: { color: colors.text, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  seekWrap: { width: '100%', marginTop: 20 },
  seekTouch: { height: 32, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.cardAlt, overflow: 'hidden' },
  fillBar: { height: '100%', backgroundColor: colors.accent },
  thumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    backgroundColor: '#fff',
  },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: colors.muted, fontSize: 13, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 36, marginTop: 20 },
  small: { alignItems: 'center', justifyContent: 'center', width: 60, height: 60 },
  skipLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  big: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
