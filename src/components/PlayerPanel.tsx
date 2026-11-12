import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAudio } from '@/AudioContext';
import SeekBar from '@/components/SeekBar';
import { colors, fonts, glowShadow } from '@/theme';

/** Shown after a QR code was scanned: title, play/pause and the slider. */
export default function PlayerPanel() {
  const { current, status, togglePlay, seek, loadError, retry } = useAudio();
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

  return (
    <View style={styles.panel}>
      <Text style={styles.title} numberOfLines={1}>
        {current.title}
      </Text>
      <View style={styles.row}>
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
        <View style={{ flex: 1 }}>
          <SeekBar position={status.currentTime} duration={status.duration} onSeek={seek} />
        </View>
      </View>
    </View>
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
