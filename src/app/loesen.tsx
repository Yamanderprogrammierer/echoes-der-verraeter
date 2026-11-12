import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import Header from '@/components/Header';
import { backdrop, colors, fonts, glowShadow } from '@/theme';

/** "Lösen": asks whether to solve the riddle; solving itself is not available yet. */
export default function SolveScreen() {
  const { width, height } = useWindowDimensions();
  const [answeredYes, setAnsweredYes] = useState(false);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, backdrop]} />
      <Header mode="loesen" compact={width > height} />

      <View style={styles.center}>
        {answeredYes ? (
          <>
            <Text style={styles.title}>Lösen</Text>
            <Text style={styles.body}>Bald verfügbar.</Text>
          </>
        ) : (
          <>
            <Text style={styles.question}>Willst du das Rätsel lösen?</Text>
            <View style={styles.buttons}>
              <Pressable
                style={({ pressed }) => [styles.button, styles.yes, pressed && styles.pressed]}
                onPress={() => setAnsweredYes(true)}
              >
                <Text style={styles.buttonText}>Ja</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.button, styles.no, pressed && styles.pressed]}
                onPress={() => router.replace('/')}
              >
                <Text style={styles.buttonText}>Nein</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 30 },
  body: { color: 'rgba(255,255,255,0.55)', fontFamily: fonts.medium, fontSize: 20 },
  question: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 26,
    textAlign: 'center',
    maxWidth: 420,
    marginBottom: 18,
  },
  buttons: { flexDirection: 'row', gap: 16 },
  button: {
    width: 130,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  yes: {
    borderColor: 'rgba(240,250,255,0.95)',
    backgroundImage: 'linear-gradient(90deg, #4a4c52 0%, #6b6e74 50%, #44464c 100%)',
    boxShadow: glowShadow,
  },
  no: { borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.08)' },
  pressed: { transform: [{ scale: 0.96 }] },
  buttonText: { color: colors.text, fontFamily: fonts.bold, fontSize: 21 },
});
