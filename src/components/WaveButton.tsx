import React, { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type Props = { size: number; active: boolean; onPress: () => void; accessibilityLabel: string };

// Resting height of each bar (relative to the tallest), forming the symmetric waveform symbol.
const BARS = [0.16, 0.26, 0.4, 0.62, 0.88, 1, 0.82, 0.62, 0.4, 0.26, 0.16];
// While playing, each bar moves between these scales at its own speed so the wave looks alive.
const MOTION = BARS.map((_, i) => ({
  low: 0.3 + ((i * 37) % 25) / 100,
  high: 1.15 + ((i * 53) % 30) / 100,
  duration: 260 + ((i * 71) % 220),
  delay: (i * 97) % 300,
}));

/** The big round "echo" button. While audio plays, its waveform bars dance and a halo pulses out. */
export default function WaveButton({ size, active, onPress, accessibilityLabel }: Props) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [bars] = useState(() => BARS.map(() => new Animated.Value(1)));

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      // Settle back to the resting waveform.
      const settle = Animated.parallel(
        bars.map((v) => Animated.timing(v, { toValue: 1, duration: 250, useNativeDriver: true })),
      );
      settle.start();
      return () => settle.stop();
    }

    const halo = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    const wave = Animated.parallel(
      bars.map((v, i) => {
        const { low, high, duration, delay } = MOTION[i];
        const ease = Easing.inOut(Easing.sin);
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(v, { toValue: high, duration, easing: ease, useNativeDriver: true }),
              Animated.timing(v, { toValue: low, duration: duration * 1.3, easing: ease, useNativeDriver: true }),
              Animated.timing(v, { toValue: 1, duration: duration * 0.8, easing: ease, useNativeDriver: true }),
            ]),
          ),
        ]);
      }),
    );
    halo.start();
    wave.start();
    return () => {
      halo.stop();
      wave.stop();
    };
  }, [active, pulse, bars]);

  const haloStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
  };

  const maxBar = size * 0.36;
  const barWidth = Math.max(4, size * 0.026);

  return (
    <View style={{ width: size, height: size }}>
      {active && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.halo, { borderRadius: size / 2 }, haloStyle]}
        />
      )}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          pressed && { transform: [{ scale: 0.97 }] },
        ]}
      >
        <View style={[styles.bars, { gap: barWidth * 0.9, height: maxBar * 1.45 }]} pointerEvents="none">
          {BARS.map((h, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  height: maxBar * h,
                  borderRadius: barWidth / 2,
                  transform: [{ scaleY: bars[i] }],
                },
              ]}
            />
          ))}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3.5,
    borderColor: 'rgba(200,200,206,0.85)',
    backgroundImage: 'linear-gradient(150deg, #7a7b80 0%, #45464c 40%, #1c1d21 100%)',
    boxShadow: '0 0 60px 6px rgba(255,255,255,0.06)',
  },
  bars: { flexDirection: 'row', alignItems: 'center' },
  bar: { backgroundColor: '#FFFFFF' },
  halo: { borderWidth: 2, borderColor: colors.glow },
});
