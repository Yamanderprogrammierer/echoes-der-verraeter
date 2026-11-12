import React, { useRef, useState } from 'react';
import { GestureResponderEvent, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, formatTime } from '@/theme';

type Props = { position: number; duration: number; onSeek: (seconds: number) => void };

/** Slider for the current MP3: tap or drag anywhere on it to jump to that point. */
export default function SeekBar({ position, duration, onSeek }: Props) {
  const width = useRef(1);
  const [dragging, setDragging] = useState<number | null>(null);
  const shown = dragging ?? position;
  const pct = duration > 0 ? Math.min(1, Math.max(0, shown / duration)) : 0;
  const ready = duration > 0;

  const toSeconds = (e: GestureResponderEvent) =>
    Math.min(1, Math.max(0, e.nativeEvent.locationX / width.current)) * duration;

  return (
    <View style={styles.wrap}>
      <View
        style={styles.touch}
        onLayout={(e) => (width.current = e.nativeEvent.layout.width || 1)}
        onStartShouldSetResponder={() => ready}
        onMoveShouldSetResponder={() => ready}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => setDragging(toSeconds(e))}
        onResponderMove={(e) => setDragging(toSeconds(e))}
        onResponderRelease={(e) => {
          onSeek(toSeconds(e));
          setDragging(null);
        }}
        onResponderTerminate={() => setDragging(null)}
        accessibilityRole="adjustable"
        accessibilityLabel="Position im Audio"
        accessibilityValue={{ text: `${formatTime(shown)} von ${formatTime(duration)}` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => onSeek(position + (e.nativeEvent.actionName === 'increment' ? 5 : -5))}
      >
        <View style={styles.track} pointerEvents="none">
          <View style={[styles.fill, { width: `${pct * 100}%` }]} />
        </View>
        <View
          style={[styles.thumb, dragging !== null && styles.thumbActive, { left: `${pct * 100}%` }]}
          pointerEvents="none"
        />
      </View>
      <View style={styles.times}>
        <Text style={styles.time}>{formatTime(shown)}</Text>
        <Text style={styles.time}>{ready ? `-${formatTime(duration - shown)}` : '--:--'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  touch: { height: 36, justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: 'rgba(230,248,255,0.95)' },
  thumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    backgroundColor: '#fff',
    boxShadow: `0 0 8px ${colors.glow}`,
  },
  thumbActive: { width: 24, height: 24, borderRadius: 12, marginLeft: -12 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 13, fontVariant: ['tabular-nums'] },
});
