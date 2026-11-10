import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AudioProvider, useAudio } from './src/AudioContext';
import LibraryScreen from './src/LibraryScreen';
import PlayerScreen from './src/PlayerScreen';
import ScannerScreen from './src/ScannerScreen';
import { colors } from './src/theme';

type Tab = 'scan' | 'player' | 'library';

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'scan', label: 'Scan', icon: 'qr-code' },
  { key: 'player', label: 'Now Playing', icon: 'play-circle' },
  { key: 'library', label: 'Library', icon: 'library' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <AudioProvider>
        <StatusBar style="light" />
        <Main />
      </AudioProvider>
    </SafeAreaProvider>
  );
}

function Main() {
  const [tab, setTab] = useState<Tab>('scan');
  const openPlayer = () => setTab('player');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{TABS.find((t) => t.key === tab)?.label}</Text>
      </View>
      <View style={styles.content}>
        {/* The camera is only mounted while the Scan tab is open, so it isn't running in the background. */}
        {tab === 'scan' && <ScannerScreen onOpenPlayer={openPlayer} />}
        {tab === 'player' && <PlayerScreen onScan={() => setTab('scan')} />}
        {tab === 'library' && <LibraryScreen onOpenPlayer={openPlayer} />}
      </View>
      {tab !== 'player' && <MiniPlayer onPress={openPlayer} />}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)} accessibilityRole="tab">
              <Ionicons
                name={active ? t.icon : (`${t.icon}-outline` as keyof typeof Ionicons.glyphMap)}
                size={24}
                color={active ? colors.accent : colors.muted}
              />
              <Text style={[styles.tabLabel, active && { color: colors.accent }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function MiniPlayer({ onPress }: { onPress: () => void }) {
  const { current, status, togglePlay } = useAudio();
  if (!current) return null;
  const pct = status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0;
  return (
    <Pressable style={styles.mini} onPress={onPress}>
      <View style={[styles.miniProgress, { width: `${pct}%` }]} />
      <Ionicons name="musical-note" size={20} color={colors.accent} />
      <Text style={styles.miniTitle} numberOfLines={1}>
        {current.title}
      </Text>
      <Pressable hitSlop={12} onPress={togglePlay} accessibilityLabel={status.playing ? 'Pause' : 'Play'}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={26} color={colors.text} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingVertical: 10 },
  headerText: { color: colors.text, fontSize: 28, fontWeight: '800' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 2 },
  tabLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '94%',
    maxWidth: 760,
  },
  miniProgress: { position: 'absolute', left: 0, bottom: 0, height: 3, backgroundColor: colors.accent },
  miniTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
});
