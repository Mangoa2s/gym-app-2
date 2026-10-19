import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { WorkoutFocus as F } from '@/constants/workout-motion';

/** One local success beat, no stored animation flags and no repeating celebration. */
export function WorkoutSetFeedback({ setId, sequence, reduced, onSettled, children }: { setId: string; sequence: number; reduced: boolean; onSettled: (setId: string, sequence: number) => void; children: ReactNode }) {
  const sweep = useSharedValue(1);
  const settle = useSharedValue(1);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    cancelAnimation(sweep); cancelAnimation(settle);
    if (!sequence || reduced) { sweep.set(1); settle.set(1); }
    else {
      sweep.set(0); settle.set(0);
      settle.set(withTiming(1, { duration: F.savedSet.settleMs, easing: Easing.out(Easing.cubic) }));
      sweep.set(withTiming(1, { duration: F.savedSet.sweepMs, easing: Easing.out(Easing.cubic) }));
    }
    const timer = sequence ? setTimeout(() => onSettled(setId, sequence), F.savedSet.visibleMs) : undefined;
    return () => { clearTimeout(timer); cancelAnimation(sweep); cancelAnimation(settle); };
  }, [sequence, reduced, onSettled, setId, settle, sweep]);
  const row = useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : (1 - settle.value) * F.savedSet.offset }] }));
  const light = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : interpolate(sweep.value, [0, 0.15, 0.7, 1], [0, 1, 0.8, 0]),
    transform: [{ translateX: sweep.value * (width + F.savedSet.lightWidth) - F.savedSet.lightWidth }],
  }));
  return <Animated.View testID={sequence ? 'workout-set-saved' : undefined} onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.row, row]}>
    {children}
    <Animated.View pointerEvents="none" accessible={false} style={[styles.light, light]}><LinearGradient colors={F.savedSet.light} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} /></Animated.View>
  </Animated.View>;
}
const styles = StyleSheet.create({
  row: { overflow: 'hidden', borderRadius: 12 },
  light: { position: 'absolute', left: 0, top: 0, bottom: 0, width: F.savedSet.lightWidth },
});
