import {
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
  useFonts,
} from '@expo-google-fonts/quicksand';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AudioProvider } from '@/AudioContext';
import { colors } from '@/theme';

// Keep the splash screen up until the fonts are ready, so the title never flashes in the wrong font.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <AudioProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="echos" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </AudioProvider>
    </SafeAreaProvider>
  );
}
