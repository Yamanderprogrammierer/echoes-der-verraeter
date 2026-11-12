import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudio } from '@/AudioContext';
import Header from '@/components/Header';
import PlayerPanel from '@/components/PlayerPanel';
import WaveButton from '@/components/WaveButton';
import { backdrop, colors, fonts } from '@/theme';

/** "Lauschen": tap the echo to open the camera and scan a QR code. */
export default function ListenScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { current, status } = useAudio();
  const landscape = width > height;
  const openScanner = () => router.push('/scan');

  // Leave room for the title, the button row, the hint text and (after a scan) the player panel.
  const reserved = (landscape ? 230 : 330) + (current ? (landscape ? 80 : 130) : 0);
  const buttonSize = Math.round(Math.max(100, Math.min(width * 0.56, height - reserved, 300)));

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, backdrop]} />
      <Header mode="lauschen" compact={landscape} />

      <View style={styles.center}>
        <WaveButton
          size={buttonSize}
          active={status.playing}
          onPress={openScanner}
          accessibilityLabel="QR-Code scannen"
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + (landscape ? 8 : 20) }]}>
        <PlayerPanel />
        {/* In landscape there is only room for one of them. */}
        {!(landscape && current) && (
          <Pressable onPress={openScanner} hitSlop={10} accessibilityRole="button">
            <Text style={[styles.hint, status.playing && styles.hintActive]}>
              {status.playing ? 'Neuen QR Code scannen' : 'Tippe auf das Echo, um einen QR-Code zu scannen.'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { alignItems: 'center', paddingHorizontal: 20, gap: 14 },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 520,
  },
  hintActive: {
    color: colors.text,
    fontFamily: fonts.semibold,
    textShadowColor: 'rgba(190,240,255,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
