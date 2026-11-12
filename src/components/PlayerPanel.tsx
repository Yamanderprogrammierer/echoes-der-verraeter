import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAudio } from '@/AudioContext';
import SeekBar from '@/components/SeekBar';
import { colors, fonts, glowShadow } from '@/theme';

/** Shown after a QR code was scanned: title, slider, play/pause and 5-second skip buttons. */
export default function PlayerPanel() {
  const { current, status, togglePlay, seek, loadError, retry, rate, setRate } = useAudio();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  if (!current) return null;

  const loading = status.playing && (!status.isLoaded || status.isBuffering);

  if (loadError) {
    return (
      <View style={[styles.panel, styles.errorPanel]}>
        <Text style={styles.title} numberOfLines={1}>
          {current.title}
        </Text>
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
        <Pressable
          onPress={retry}
          style={({ pressed }) => [styles.retry, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
        >
          <Ionicons name="refresh" size={18} color={colors.text} />
          <Text style={styles.retryText}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }

  const canSkip = status.isLoaded && status.duration > 0;
  const skip = (delta: number) => seek((status.currentTime || 0) + delta);

  const controls = (
    <View style={styles.controls}>
      <SkipButton icon="rewind-5" label="5 Sekunden zurück" disabled={!canSkip} onPress={() => skip(-SKIP_SECONDS)} />
      <Pressable
        onPress={togglePlay}
        style={({ pressed }) => [styles.play, pressed && { transform: [{ scale: 0.94 }] }]}
        accessibilityLabel={status.playing ? 'Pause' : 'Abspielen'}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={24}
            color={colors.text}
            style={!status.playing && { marginLeft: 3 }}
          />
        )}
      </Pressable>
      <SkipButton icon="fast-forward-5" label="5 Sekunden vor" disabled={!canSkip} onPress={() => skip(SKIP_SECONDS)} />
    </View>
  );

  const slider = <SeekBar position={status.currentTime} duration={status.duration} onSeek={seek} />;

  const nextRate = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length] ?? 1;

  return (
    <View style={styles.panel}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, styles.titleFlex]} numberOfLines={1}>
          {current.title}
        </Text>
        <Pressable
          onPress={() => setRate(nextRate)}
          hitSlop={8}
          style={({ pressed }) => [styles.speed, rate !== 1 && styles.speedActive, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={`Geschwindigkeit ${speedLabel(rate)}, tippen für ${speedLabel(nextRate)}`}
        >
          <Text style={styles.speedText}>{speedLabel(rate)}</Text>
        </Pressable>
      </View>
      {landscape ? (
        // Little height in landscape: buttons and slider share one row.
        <View style={styles.row}>
          {controls}
          <View style={{ flex: 1 }}>{slider}</View>
        </View>
      ) : (
        <>
          {slider}
          {controls}
        </>
      )}
    </View>
  );
}

const SKIP_SECONDS = 5;
/** Tapping the speed button cycles through these. */
const SPEEDS = [1, 0.75, 0.5];

function speedLabel(rate: number): string {
  return `${String(rate).replace('.', ',')}×`;
}

function SkipButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'rewind-5' | 'fast-forward-5';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.skip, disabled && { opacity: 0.35 }, pressed && { transform: [{ scale: 0.9 }] }]}
    >
      <MaterialCommunityIcons name={icon} size={30} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    maxWidth: 560,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 17, marginBottom: 6, marginLeft: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  titleFlex: { flex: 1, marginBottom: 0 },
  speed: {
    minWidth: 54,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  speedActive: { borderColor: colors.text, boxShadow: glowShadow },
  speedText: { color: colors.text, fontFamily: fonts.bold, fontSize: 14, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, paddingBottom: 6 },
  skip: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  errorPanel: { borderColor: 'rgba(255,107,107,0.45)', paddingBottom: 14, gap: 10 },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  errorText: { flex: 1, color: 'rgba(255,255,255,0.8)', fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text,
    boxShadow: glowShadow,
  },
  retryText: { color: colors.text, fontFamily: fonts.bold, fontSize: 15 },
  play: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: '#000',
    boxShadow: glowShadow,
  },
});
