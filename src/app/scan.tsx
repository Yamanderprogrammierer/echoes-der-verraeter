import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudio } from '@/AudioContext';
import { BLOCKED_MESSAGE, colors, extractUrl, fonts, glowShadow } from '@/theme';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Full-screen camera; it only runs while this screen is open. */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const { openLink } = useAudio();
  const locked = useRef(false);
  const [torch, setTorch] = useState(false);

  const onScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (locked.current) return;
      locked.current = true;
      const unlockAfterOk = [{ text: 'OK', onPress: () => setTimeout(() => (locked.current = false), 800) }];
      const url = extractUrl(data);
      if (!url) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        Alert.alert('Kein Audio-Link', `Dieser QR-Code enthält:\n\n${data}`, unlockAfterOk);
        return;
      }
      if (openLink(url) === 'blocked') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        Alert.alert('Unbekannter QR-Code', BLOCKED_MESSAGE, unlockAfterOk);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      close();
    },
    [openLink],
  );

  const closeButton = (
    <Pressable
      onPress={close}
      style={({ pressed }) => [styles.close, { top: insets.top + 12, left: insets.left + 16 }, pressed && { opacity: 0.7 }]}
      accessibilityLabel="Schließen"
      hitSlop={8}
    >
      <Ionicons name="close" size={26} color={colors.text} />
    </Pressable>
  );

  if (!permission) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.permTitle}>Kamera erlauben</Text>
        <Text style={styles.permBody}>Damit du QR-Codes scannen und Echos anhören kannst.</Text>
        <Pressable
          style={({ pressed }) => [styles.permButton, pressed && { opacity: 0.8 }]}
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
        >
          <Text style={styles.permButtonText}>
            {permission.canAskAgain ? 'Zugriff erlauben' : 'Einstellungen öffnen'}
          </Text>
        </Pressable>
        {closeButton}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScanned}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shade]} />

      <View style={styles.center} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Richte die Kamera auf einen QR-Code</Text>
        </View>
      </View>

      {closeButton}
      <Pressable
        onPress={() => setTorch((on) => !on)}
        style={({ pressed }) => [
          styles.close,
          { top: insets.top + 12, right: insets.right + 16 },
          torch && styles.torchOn,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityRole="switch"
        accessibilityLabel="Taschenlampe"
        accessibilityState={{ checked: torch }}
        hitSlop={8}
      >
        <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={22} color={torch ? '#000' : colors.text} />
      </Pressable>
    </View>
  );
}

const CORNER = 46;
const CYAN = '#86E4F2';
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  shade: { backgroundColor: 'rgba(0,0,0,0.25)' },
  frame: { width: '58%', maxWidth: 340, aspectRatio: 1, marginBottom: 50 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: CYAN },
  tl: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 12 },
  pill: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.62)',
    maxWidth: '100%',
  },
  pillText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, textAlign: 'center' },
  close: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: 'rgba(0,0,0,0.5)',
    boxShadow: glowShadow,
  },
  torchOn: { backgroundColor: '#E8F9FF', borderColor: '#E8F9FF' },
  permTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 24 },
  permBody: { color: colors.muted, fontFamily: fonts.medium, fontSize: 15, textAlign: 'center', maxWidth: 380 },
  permButton: {
    marginTop: 8,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(240,250,255,0.95)',
    backgroundImage: 'linear-gradient(90deg, #4a4c52 0%, #6b6e74 50%, #44464c 100%)',
    boxShadow: glowShadow,
  },
  permButtonText: { color: colors.text, fontFamily: fonts.bold, fontSize: 17 },
});
