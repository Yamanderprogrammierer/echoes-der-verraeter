import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudio } from '@/AudioContext';
import { readCode, signedCodesOnly } from '@/codes';
import { BLOCKED_MESSAGE, colors, fonts, glowShadow } from '@/theme';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** Full-screen camera; it only runs while this screen is open. */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [permission, requestPermission] = useCameraPermissions();
  const { openEcho } = useAudio();
  const locked = useRef(false);
  const [torch, setTorch] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);

  // Sized to the smaller side so frame, text and buttons also fit when the phone is sideways.
  const frameSize = Math.round(Math.min(width * 0.6, height * 0.42, 340));

  const unlockAfterOk = useMemo(
    () => [{ text: 'OK', onPress: () => setTimeout(() => (locked.current = false), 800) }],
    [],
  );

  /** Handles the text of a QR code, from the camera or from a photo. Expects `locked` to be set. */
  const handleCode = useCallback(
    (data: string) => {
      const result = readCode(data);
      if (!result.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        if (result.reason === 'no-link' && !signedCodesOnly) {
          Alert.alert('Kein Audio-Link', `Dieser QR-Code enthält:\n\n${data}`, unlockAfterOk);
        } else {
          Alert.alert('Unbekannter QR-Code', BLOCKED_MESSAGE, unlockAfterOk);
        }
        return;
      }
      openEcho(result.url, result.title);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      close();
    },
    [openEcho, unlockAfterOk],
  );

  const onScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (locked.current) return;
      locked.current = true;
      handleCode(data);
    },
    [handleCode],
  );

  /** For QR codes someone received as a picture: read the code from a photo. */
  const scanFromPhotos = async () => {
    if (locked.current) return;
    locked.current = true;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (result.canceled || !result.assets[0]) {
        locked.current = false;
        return;
      }
      setReadingPhoto(true);
      const codes = await scanFromURLAsync(result.assets[0].uri, ['qr']);
      setReadingPhoto(false);
      if (!codes[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        Alert.alert('Kein QR-Code gefunden', 'Auf diesem Bild wurde kein QR-Code erkannt.', unlockAfterOk);
        return;
      }
      handleCode(codes[0].data);
    } catch {
      setReadingPhoto(false);
      Alert.alert('Foto konnte nicht gelesen werden', 'Bitte versuche es mit einem anderen Bild.', unlockAfterOk);
    }
  };

  const actions = (
    <View style={styles.actions}>
      {permission?.granted && (
        <RoundAction
          icon={torch ? 'flashlight' : 'flashlight-outline'}
          label="Licht"
          active={torch}
          onPress={() => setTorch((on) => !on)}
          accessibilityRole="switch"
          accessibilityLabel="Taschenlampe"
          checked={torch}
        />
      )}
      <RoundAction
        icon="images-outline"
        label="Fotos"
        busy={readingPhoto}
        onPress={scanFromPhotos}
        accessibilityRole="button"
        accessibilityLabel="QR-Code aus Fotos wählen"
      />
    </View>
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
        <Text style={styles.permBody}>
          Damit du QR-Codes scannen und Echos anhören kannst. Du kannst einen QR-Code auch aus deinen Fotos wählen.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.permButton, pressed && { opacity: 0.8 }]}
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
        >
          <Text style={styles.permButtonText}>
            {permission.canAskAgain ? 'Zugriff erlauben' : 'Einstellungen öffnen'}
          </Text>
        </Pressable>
        {actions}
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

      <View style={styles.center} pointerEvents="box-none">
        <View
          style={[styles.frame, { width: frameSize, height: frameSize, marginBottom: landscape ? 10 : 40 }]}
          pointerEvents="none"
        >
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <View style={styles.pill} pointerEvents="none">
          <Text style={styles.pillText}>Richte die Kamera auf einen QR-Code</Text>
        </View>
        {/* Under the scan frame, so they aren't hidden behind Expo Go's floating button in the corner. */}
        {actions}
      </View>

      {closeButton}
    </View>
  );
}

function RoundAction({
  icon,
  label,
  onPress,
  active,
  busy,
  checked,
  accessibilityRole,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  busy?: boolean;
  checked?: boolean;
  accessibilityRole: 'button' | 'switch';
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.actionItem}>
      <Pressable
        onPress={onPress}
        disabled={busy}
        hitSlop={8}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={checked === undefined ? undefined : { checked }}
        style={({ pressed }) => [styles.torch, active && styles.torchOn, pressed && { transform: [{ scale: 0.94 }] }]}
      >
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Ionicons name={icon} size={26} color={active ? '#000' : colors.text} />
        )}
      </Pressable>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

const CORNER = 46;
const CYAN = '#86E4F2';
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  shade: { backgroundColor: 'rgba(0,0,0,0.25)' },
  frame: {},
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
  actions: { flexDirection: 'row', gap: 32, marginTop: 10 },
  actionItem: { alignItems: 'center', gap: 6 },
  actionLabel: {
    color: colors.text,
    fontFamily: fonts.semibold,
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  torch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
