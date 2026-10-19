import { useLocalSearchParams } from 'expo-router';
import { useStore } from 'zustand';
import { DetailSheetProvider } from '@/components/berkk/detail-sheet';
import { WorkoutJournal } from '@/components/berkk/workout-journal';
import { WorkoutStorageStatus } from '@/components/berkk/workout-storage-status';
import { workoutStore } from '@/store/workout';

export default function JournalScreen() {
  const params = useLocalSearchParams<{ mode?: string; id?: string; date?: string }>();
  const hydrated = useStore(workoutStore, (state) => state.hydrated);
  if (!hydrated) return <WorkoutStorageStatus />;
  return <DetailSheetProvider><WorkoutJournal key={`${params.mode}-${params.id}-${params.date}`} mode={params.mode === 'plan' ? 'plan' : 'history'} id={params.id === undefined ? undefined : Number(params.id)} date={params.date} /></DetailSheetProvider>;
}
