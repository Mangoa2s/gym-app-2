import { Ionicons } from '@expo/vector-icons';
import { useId } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { PlayIcon } from '@/components/berkk/icons';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { BerkkAction as A, WorkoutMotion as M } from '@/constants/workout-motion';
import { useWorkoutDrift } from '@/hooks/use-workout-drift';

/** Visual surface only. The existing buttons own presses and navigation. */
export function BerkkActionSurface({ variant, label, reduced, labelStyle }: {
  variant: 'add' | 'start'; label: string; reduced: boolean; labelStyle?: AnimatedStyle<ViewStyle>;
}) {
  const start = variant === 'start';
  const id = `action-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const drift = useWorkoutDrift(A.halfCycleMs, reduced);
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * A.driftX }, { translateY: drift.value * A.driftY }],
  }));
  return <View testID={`workout-${variant}-surface`} style={[styles.surface, start ? styles.start : styles.add]}>
    <Animated.View testID={`workout-${variant}-light`} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.light, motion]}>
      <Svg width="210" height="120" viewBox="0 0 210 120">
        <Defs><RadialGradient id={id}>
          <Stop offset="0" stopColor={A.warmColor} stopOpacity={start ? A.startStrength : A.addStrength} />
          <Stop offset="0.4" stopColor={A.warmColor} stopOpacity={(start ? A.startStrength : A.addStrength) * 0.55} />
          <Stop offset="1" stopColor={A.warmColor} stopOpacity={0} />
        </RadialGradient></Defs>
        <Ellipse cx="75" cy="60" rx="100" ry="58" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
    <Animated.View pointerEvents="none" style={[styles.label, start && styles.startLabel, labelStyle]}>
      <View style={[styles.symbol, start && styles.startSymbol]}>
        {start ? <PlayIcon size={22} color={A.symbolColor} /> : <Ionicons accessible={false} name="add" size={27} color={A.symbolColor} />}
      </View>
      <Text style={[styles.text, start && styles.startText]}>{label}</Text>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  surface: { overflow: 'hidden', borderWidth: 1, justifyContent: 'center' },
  add: { minHeight: 64, borderRadius: 18, backgroundColor: A.addSurface, borderColor: A.addBorder },
  start: { minHeight: 80, borderRadius: M.buttonRadius, backgroundColor: A.startSurface, borderColor: A.startBorder },
  light: { position: 'absolute', left: -24, top: -26, width: 210, height: 120 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 12 },
  startLabel: { paddingHorizontal: 20, paddingVertical: 15 },
  symbol: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Berkk.ctaInk, borderWidth: 1, borderColor: A.addBorder },
  startSymbol: { width: 46, height: 46, borderRadius: 15, borderColor: A.startBorder },
  text: { flexShrink: 1, color: Berkk.ink, fontFamily: BerkkFonts.bold, fontSize: 17, lineHeight: 23, letterSpacing: -0.3 },
  startText: { fontFamily: BerkkFonts.black, fontSize: 22, lineHeight: 28, letterSpacing: -0.8 },
});
