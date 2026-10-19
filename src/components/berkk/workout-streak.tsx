import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStore } from 'zustand';

import { Berkk, BerkkFonts } from '@/constants/theme';
import { trainingStreak } from '@/data/calendar';
import { workoutStore } from '@/store/workout';
import { BerkkGhost } from './berkk-ghost';
import { workoutGhost, type GhostPulse } from './ghost-state';

/** The same daily-completion calculation used by Home and Calendar. The ghost is the workout's companion. */
export const WorkoutStreak = memo(function WorkoutStreak({ today, pulse, active }: { today: string; pulse: GhostPulse | null; active: boolean }) {
  const history = useStore(workoutStore, (state) => state.history);
  const streak = useMemo(() => trainingStreak(history, today), [history, today]);
  const ghost = workoutGhost(streak);
  return <View testID="workout-streak" accessible accessibilityLabel={streak ? `${streak} Trainingstage in Folge` : 'Keine Serie. 0 Trainingstage in Folge'} style={styles.row}>
    <View testID="workout-streak-ghost"><BerkkGhost size={34} mood={ghost.mood} glow={ghost.glow} idle={active} pulse={pulse} /></View>
    <View><Text testID="workout-streak-count" maxFontSizeMultiplier={1.2} style={[styles.count, !streak && styles.idle]}>{streak}×</Text>{!streak && <Text maxFontSizeMultiplier={1.2} style={styles.empty}>Keine Serie</Text>}</View>
  </View>;
});

const styles = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontFamily: BerkkFonts.bold, color: Berkk.ink, fontSize: 20, lineHeight: 25, fontVariant: ['tabular-nums'] },
  idle: { color: Berkk.inkSecondary, fontSize: 17, lineHeight: 21 },
  empty: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.medium, fontSize: 10, lineHeight: 14 },
});
