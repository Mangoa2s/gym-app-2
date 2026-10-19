import { SchibstedGrotesk_800ExtraBold, SchibstedGrotesk_900Black } from '@expo-google-fonts/schibsted-grotesk';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { WorkoutMotionProvider } from '@/components/berkk/workout-motion-provider';
import { WorkoutSaveFeedbackProvider } from '@/components/berkk/workout-save-feedback';
import '@/lib/nativewind-interop';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    SchibstedGrotesk_800ExtraBold,
    SchibstedGrotesk_900Black,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <WorkoutMotionProvider>
          <WorkoutSaveFeedbackProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
            <Stack.Screen name="journal" options={{ animation: 'fade' }} />
            <Stack.Screen name="workout" options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
          </Stack>
          </WorkoutSaveFeedbackProvider>
        </WorkoutMotionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
