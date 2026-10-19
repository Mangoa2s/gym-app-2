import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { View } from 'react-native';
import { useStore } from 'zustand';

import { WorkoutTimerOverlay } from '@/components/berkk/workout-timer-overlay';
import { workoutExit } from '@/components/berkk/workout-recorder';
import { Tokens as T } from '@/constants/theme';
import { workoutStore } from '@/store/workout';
import { DetailSheetProvider } from '@/components/berkk/detail-sheet';
import { WorkoutStorageStatus } from '@/components/berkk/workout-storage-status';

export default function WorkoutScreen() {
  // The display stays on while this screen is open; released automatically when it closes.
  useKeepAwake('berkk-workout');
  const session = useStore(workoutStore, (state) => state.session);
  const hydrated = useStore(workoutStore, (state) => state.hydrated);
  if (!hydrated) return <WorkoutStorageStatus />;
  // A just-saved workout is on its way to the summary; do not bounce to Home first.
  if (!session) return workoutExit.toSummary ? <View style={{ flex: 1, backgroundColor: T.color.background[3] }} /> : <Redirect href="/" />;
  return <DetailSheetProvider><StatusBar style="light" /><WorkoutTimerOverlay key={session.id} session={session} /></DetailSheetProvider>;
}
