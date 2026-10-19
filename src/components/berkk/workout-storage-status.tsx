import { Pressable, Text, View } from 'react-native';
import { useStore } from 'zustand';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { workoutStore } from '@/store/workout';

export function WorkoutStorageStatus() {
  const loadError = useStore(workoutStore, (state) => state.loadError);
  return <View style={{ flex: 1, backgroundColor: Berkk.backgroundGradient[5], justifyContent: 'center', padding: 24 }}>
    <Text accessibilityRole={loadError ? 'alert' : undefined} style={{ color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 18 }}>{loadError ? 'Training konnte nicht geladen werden. Deine gespeicherten Daten bleiben erhalten.' : 'Training wird geladen …'}</Text>
    {loadError && <Pressable accessibilityRole="button" onPress={() => void workoutStore.getState().hydrate()} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: Berkk.ink, fontFamily: BerkkFonts.bold }}>Erneut laden</Text></Pressable>}
  </View>;
}
