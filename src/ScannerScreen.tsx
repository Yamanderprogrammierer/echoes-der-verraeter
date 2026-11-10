import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAudio } from './AudioContext';
import { importPickedFile, Track } from './library';
import { colors } from './theme';

type Props = { onOpenPlayer: () => void };

export function extractUrl(data: string): string | null {
  const trimmed = data.trim();
  const match = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : null;
}

export default function ScannerScreen({ onOpenPlayer }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const { addUrl, addTracks, play } = useAudio();
  const [importing, setImporting] = useState(false);
  const [torch, setTorch] = useState(false);
  const locked = useRef(false);

  const playUrl = useCallback(
    (url: string) => {
      const track = addUrl(url);
      play(track);
      onOpenPlayer();
    },
    [addUrl, play, onOpenPlayer],
  );

  const onScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (locked.current) return;
      locked.current = true;
      const url = extractUrl(data);
      const unlock = () => setTimeout(() => (locked.current = false), 800);
      if (!url) {
        Alert.alert('Not an audio link', `This QR code contains:\n\n${data}`, [{ text: 'OK', onPress: unlock }]);
        return;
      }
      playUrl(url);
      unlock();
    },
    [playUrl],
  );

  const pickFiles = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets.length) return;
      setImporting(true);
      const tracks: Track[] = [];
      for (const asset of result.assets) {
        tracks.push(await importPickedFile(asset.uri, asset.name));
      }
      addTracks(tracks);
      play(tracks[0]);
      onOpenPlayer();
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  }, [addTracks, play, onOpenPlayer]);

  const enterUrl = useCallback(() => {
    Alert.prompt(
      'Open MP3 link',
      'Paste the address of an MP3 file.',
      (text) => {
        const url = extractUrl(text ?? '');
        if (url) playUrl(url);
        else if (text) Alert.alert('Invalid link', 'The link must start with http:// or https://');
      },
      'plain-text',
      '',
      'url',
    );
  }, [playUrl]);

  const actions = (
    <View style={styles.actions}>
      <ActionButton icon="folder-open" label="Open MP3 from Files" onPress={pickFiles} busy={importing} />
      <ActionButton icon="link" label="Enter a link" onPress={enterUrl} />
    </View>
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="qr-code" size={64} color={colors.accent} />
        <Text style={styles.title}>Scan QR codes for audio</Text>
        <Text style={styles.body}>The app needs camera access to scan QR codes that link to MP3 files.</Text>
        <Pressable
          style={styles.primary}
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
        >
          <Text style={styles.primaryText}>{permission.canAskAgain ? 'Allow camera' : 'Open Settings'}</Text>
        </Pressable>
        {actions}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScanned}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.hint}>Point the camera at a QR code</Text>
        <View style={styles.frame} pointerEvents="none">
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Pressable style={styles.torch} onPress={() => setTorch((t) => !t)} accessibilityLabel="Toggle flashlight">
          <Ionicons name={torch ? 'flashlight' : 'flashlight-outline'} size={22} color={colors.text} />
        </Pressable>
        {actions}
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  busy,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]} onPress={onPress} disabled={busy}>
      {busy ? <ActivityIndicator color={colors.text} /> : <Ionicons name={icon} size={20} color={colors.text} />}
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const CORNER = 36;
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { color: colors.muted, fontSize: 15, textAlign: 'center', maxWidth: 420, lineHeight: 21 },
  primary: { backgroundColor: colors.accent, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  hint: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  frame: { width: '70%', maxWidth: 320, aspectRatio: 1 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  torch: {
    marginTop: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 24 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(26,28,35,0.88)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
