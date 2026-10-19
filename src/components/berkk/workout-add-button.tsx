import { memo, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { Berkk, BerkkFonts } from '@/constants/theme';
import { WorkoutFocus as F } from '@/constants/workout-motion';
import { useWorkoutDrift } from '@/hooks/use-workout-drift';
import { WorkoutLight } from './workout-light';

export const WorkoutAddButton = memo(function WorkoutAddButton({ onPress, reduced }: { onPress: () => void; reduced: boolean }) {
  const pressure = useSharedValue(0);
  const impulse = useSharedValue(0);
  const drift = useWorkoutDrift(F.add.halfCycleMs, reduced);
  const feedback = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : 1 - pressure.value * (1 - F.add.pressScale) }],
  }));
  const light = useAnimatedStyle(() => ({
    opacity: 0.65 + drift.value * 0.18 + impulse.value * 0.35,
    transform: [{ translateX: reduced ? 0 : drift.value * 26 }, { translateY: reduced ? 0 : drift.value * 5 }],
  }));
  const pressLight = useAnimatedStyle(() => ({ opacity: pressure.value * 0.14 + impulse.value * 0.22 }));
  useEffect(() => () => { cancelAnimation(pressure); cancelAnimation(impulse); }, [pressure, impulse]);
  useEffect(() => { if (reduced) { cancelAnimation(impulse); impulse.set(0); } }, [impulse, reduced]);
  const press = (value: number) => {
    pressure.set(reduced ? value : withTiming(value, { duration: value ? 70 : F.add.pressMs, easing: Easing.bezier(0.23, 1, 0.32, 1), reduceMotion: ReduceMotion.System }));
    if (value && !reduced) impulse.set(withSequence(withTiming(1, { duration: 60 }), withTiming(0, { duration: 420 })));
  };
  return <Pressable testID="workout-add-action" accessibilityRole="button" accessibilityLabel="Übung hinzufügen" onPress={onPress}
    onPressIn={() => press(1)} onPressOut={() => press(0)}>
    <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.aura, light]}>
      <WorkoutLight color={F.add.glowColor} shade="#B33520" strength={0.65} />
    </Animated.View>
    <Animated.View testID="workout-add-feedback" style={feedback}>
      <LinearGradient colors={F.add.surface} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.surface}>
        <Animated.View pointerEvents="none" accessible={false} style={[styles.innerLight, light]}><WorkoutLight color={F.add.glowColor} strength={0.7} /></Animated.View>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.pressLight, pressLight]} />
        <View pointerEvents="none" style={styles.labelRow}>
          <View style={styles.plus}><Ionicons accessible={false} name="add" size={25} color={Berkk.linkPressed} /></View>
          <Text maxFontSizeMultiplier={1.4} style={styles.label}>Übung hinzufügen</Text>
          <Ionicons accessible={false} name="arrow-forward" size={19} color={Berkk.linkPressed} />
        </View>
      </LinearGradient>
    </Animated.View>
  </Pressable>;
});

const styles = StyleSheet.create({
  aura: { position: 'absolute', left: -34, right: -34, top: -58, height: 190 },
  surface: { minHeight: 70, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: F.add.border },
  innerLight: { position: 'absolute', left: -70, top: -55, width: 270, height: 150 },
  pressLight: { backgroundColor: Berkk.linkPressed },
  labelRow: { minHeight: 70, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  plus: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(26,14,7,0.55)' },
  label: { flex: 1, fontFamily: BerkkFonts.bold, fontSize: 17, lineHeight: 24, color: Berkk.ink, letterSpacing: -0.25 },
});
