import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudio } from '@/AudioContext';
import { readCode, signedCodesOnly } from '@/codes';
import { BLOCKED_MESSAGE, colors, fonts, glowShadow, MISSING_MESSAGE } from '@/theme';

type Mode = 'lauschen' | 'loesen';

/** "Echoes" title plus the row with play button, Lauschen/Lösen switch and keyboard button. */
export default function Header({ mode, compact }: { mode: Mode; compact?: boolean }) {
  const insets = useSafeAreaInsets();
  const { current, status, togglePlay, openEcho } = useAudio();

  // With signed codes on, this takes a copied Echoes code (e.g. sent in a message); otherwise a plain MP3 link.
  const enterLink = () => {
    Alert.prompt(
      signedCodesOnly ? 'Code eingeben' : 'Link eingeben',
      signedCodesOnly ? 'Füge einen Echoes-Code ein.' : 'Füge die Adresse einer MP3-Datei ein.',
      (text) => {
        if (!text?.trim()) return;
        const result = readCode(text);
        if (result.ok) openEcho(result.source, result.title);
        else if (result.reason === 'missing') Alert.alert('Echo noch nicht verfügbar', MISSING_MESSAGE);
        else if (result.reason === 'no-link' && !signedCodesOnly)
          Alert.alert('Ungültiger Link', 'Der Link muss mit http:// oder https:// beginnen.');
        else Alert.alert(signedCodesOnly ? 'Ungültiger Code' : 'Unbekannter Link', BLOCKED_MESSAGE);
      },
      'plain-text',
      '',
      signedCodesOnly ? 'default' : 'url',
    );
  };

  const goTo = (target: Mode) => {
    if (target !== mode) router.replace(target === 'lauschen' ? '/' : '/loesen');
  };

  return (
    <View style={{ paddingTop: insets.top + (compact ? 4 : 16), paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }}>
      <Text style={[styles.title, compact && styles.titleCompact]} accessibilityRole="header">
        Echoes
      </Text>

      <View style={styles.row}>
        <Pressable
          onPress={togglePlay}
          disabled={!current}
          style={({ pressed }) => [styles.circle, current ? styles.circleOn : styles.circleOff, pressed && styles.pressed]}
          accessibilityLabel={status.playing ? 'Pause' : 'Abspielen'}
        >
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={26}
            color={current ? colors.text : 'rgba(255,255,255,0.4)'}
            style={!status.playing && { marginLeft: 4 }}
          />
        </Pressable>

        <View style={styles.segment} accessibilityRole="tablist">
          <Segment label="Lauschen" active={mode === 'lauschen'} onPress={() => goTo('lauschen')} />
          <Segment label="Lösen" active={mode === 'loesen'} onPress={() => goTo('loesen')} />
        </View>

        <Pressable
          onPress={enterLink}
          style={({ pressed }) => [styles.circle, styles.circleOn, pressed && styles.pressed]}
          accessibilityLabel="Link eingeben"
        >
          <MaterialCommunityIcons name="keyboard-outline" size={26} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentItem, active && styles.segmentActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={styles.segmentText} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </Text>
    </Pressable>
  );
}

const CIRCLE = 54;
const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 58,
    letterSpacing: 9,
    textAlign: 'center',
    textShadowColor: 'rgba(190,240,255,0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    marginBottom: 14,
  },
  titleCompact: { fontSize: 40, letterSpacing: 6, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 640,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    backgroundColor: '#000',
  },
  circleOn: { borderColor: colors.text, boxShadow: glowShadow },
  circleOff: { borderColor: 'rgba(255,255,255,0.3)' },
  pressed: { transform: [{ scale: 0.94 }] },
  segment: {
    flex: 1,
    flexDirection: 'row',
    padding: 3,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  segmentItem: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  segmentActive: {
    borderColor: 'rgba(240,250,255,0.95)',
    backgroundImage: 'linear-gradient(90deg, #4a4c52 0%, #6b6e74 50%, #44464c 100%)',
    boxShadow: glowShadow,
  },
  segmentText: { color: colors.text, fontFamily: fonts.bold, fontSize: 21, letterSpacing: 0.3 },
});
