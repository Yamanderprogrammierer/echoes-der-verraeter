import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAudio } from './AudioContext';
import { isOffline, Track } from './library';
import { colors } from './theme';

export default function LibraryScreen({ onOpenPlayer }: { onOpenPlayer: () => void }) {
  const { library, current, status, play, removeTrack, renameTrack, saveOffline, downloading } = useAudio();

  const openMenu = (track: Track) => {
    const offline = isOffline(track);
    const options = ['Rename', ...(track.url && !offline ? ['Save for offline'] : []), 'Delete', 'Cancel'];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: track.title,
        options,
        destructiveButtonIndex: options.indexOf('Delete'),
        cancelButtonIndex: options.length - 1,
      },
      (i) => {
        const choice = options[i];
        if (choice === 'Rename') {
          Alert.prompt('Rename', undefined, (t) => renameTrack(track, t ?? ''), 'plain-text', track.title);
        } else if (choice === 'Save for offline') {
          saveOffline(track);
        } else if (choice === 'Delete') {
          Alert.alert('Delete track?', track.title, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => removeTrack(track) },
          ]);
        }
      },
    );
  };

  if (!library.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="library-outline" size={56} color={colors.muted} />
        <Text style={styles.emptyTitle}>Your library is empty</Text>
        <Text style={styles.muted}>Tracks you scan or open appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={library}
      keyExtractor={(t) => t.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const active = current?.id === item.id;
        const offline = isOffline(item);
        return (
          <Pressable
            style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && { opacity: 0.75 }]}
            onPress={() => {
              play(item);
              onOpenPlayer();
            }}
            onLongPress={() => openMenu(item)}
          >
            <View style={styles.icon}>
              <Ionicons
                name={active && status.playing ? 'volume-high' : 'musical-note'}
                size={22}
                color={colors.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.muted} numberOfLines={1}>
                {offline ? 'On this device' : item.url}
              </Text>
            </View>
            {downloading[item.id] ? (
              <ActivityIndicator color={colors.accent} />
            ) : offline ? (
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            ) : null}
            <Pressable hitSlop={12} onPress={() => openMenu(item)} accessibilityLabel="More options">
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.muted} />
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10, width: '100%', maxWidth: 760, alignSelf: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowActive: { borderColor: colors.accent },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 2 },
});
