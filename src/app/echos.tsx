import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudio } from '@/AudioContext';
import { isOffline, Track } from '@/library';
import { backdrop, colors, fonts, glowShadow } from '@/theme';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/** "Gefundene Echos": every echo scanned so far; tap one to hear it again. */
export default function EchoesScreen() {
  const insets = useSafeAreaInsets();
  const { library, current, status, play, removeTrack, downloading } = useAudio();

  const confirmDelete = (track: Track) =>
    Alert.alert('Echo löschen?', track.title, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => removeTrack(track) },
    ]);

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, backdrop]} />

      <View style={[styles.header, { paddingTop: insets.top + 16, paddingLeft: insets.left + 20, paddingRight: insets.right + 20 }]}>
        <Text style={styles.title} accessibilityRole="header">
          Gefundene Echos
        </Text>
        <Pressable
          onPress={close}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Schließen"
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={library}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 24, paddingLeft: insets.left + 20, paddingRight: insets.right + 20 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Noch keine Echos</Text>
            <Text style={styles.emptyBody}>Gescannte QR-Codes erscheinen hier.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const active = current?.id === item.id;
          const saving = downloading[item.id];
          const offline = isOffline(item);
          return (
            <Pressable
              style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && { opacity: 0.75 }]}
              onPress={() => {
                play(item);
                close();
              }}
              onLongPress={() => confirmDelete(item)}
              accessibilityHint="Spielt dieses Echo ab"
            >
              <Ionicons
                name={active && status.playing ? 'volume-high' : 'play'}
                size={20}
                color={active ? colors.text : colors.muted}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {saving ? 'Wird gespeichert …' : offline ? 'Auch ohne Internet verfügbar' : 'Nur mit Internet'}
                </Text>
              </View>
              {saving ? (
                <ActivityIndicator color={colors.text} />
              ) : offline ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              ) : null}
              <Pressable hitSlop={12} onPress={() => confirmDelete(item)} accessibilityLabel="Echo löschen">
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 28,
    textShadowColor: 'rgba(190,240,255,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.text,
    boxShadow: glowShadow,
  },
  list: { gap: 10, width: '100%', maxWidth: 760, alignSelf: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 6 },
  emptyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 20 },
  emptyBody: { color: colors.muted, fontFamily: fonts.medium, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowActive: {
    borderColor: 'rgba(240,250,255,0.9)',
    backgroundImage: 'linear-gradient(90deg, #3a3c42 0%, #55585e 50%, #3a3c42 100%)',
    boxShadow: glowShadow,
  },
  rowTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  rowSub: { color: colors.muted, fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },
});
