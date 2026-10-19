import { useIsFocused } from 'expo-router/react-navigation';
import { memo, useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { CalendarAppearance as C } from '@/constants/calendar-appearance';
import { GlowBlobSvg } from './glow-blob';

/** Read both startup preference and live native accessibility changes. */
export function useCalendarReducedMotion() {
  const initial = useReducedMotion();
  const [reduced, setReduced] = useState(initial);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive) setReduced(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { alive = false; listener.remove(); };
  }, []);
  return reduced;
}

/** Two static SVG lights; only their container transforms run on the UI thread. */
export const CalendarAmbient = memo(function CalendarAmbient({ reduced }: { reduced: boolean }) {
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  const drift = useSharedValue(0);
  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => listener.remove();
  }, []);
  useEffect(() => {
    cancelAnimation(drift);
    if (reduced) drift.set(0);
    else if (focused && active) drift.set(withRepeat(withTiming(drift.get() >= 0 ? -1 : 1, {
      duration: C.ambient.halfCycleMs,
      easing: Easing.inOut(Easing.sin),
      reduceMotion: ReduceMotion.System,
    }), -1, true));
    return () => cancelAnimation(drift);
  }, [active, focused, reduced, drift]);
  const warm = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * C.ambient.driftX }, { translateY: drift.value * C.ambient.driftY }] }));
  const violet = useAnimatedStyle(() => ({ transform: [{ translateX: -drift.value * C.ambient.driftX }, { translateY: drift.value * C.ambient.driftY }] }));
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, styles.clip]}>
    <Animated.View testID="calendar-ambient-warm" style={[styles.light, { left: -220, top: -140 }, warm]}><GlowBlobSvg color={C.ambient.warmColor} size={C.ambient.size} opacity={C.ambient.warmOpacity} /></Animated.View>
    <Animated.View testID="calendar-ambient-violet" style={[styles.light, { right: -220, bottom: 30 }, violet]}><GlowBlobSvg color={C.ambient.violetColor} size={C.ambient.size} opacity={C.ambient.violetOpacity} /></Animated.View>
  </View>;
});
const styles = StyleSheet.create({ clip: { overflow: 'hidden' }, light: { position: 'absolute', width: C.ambient.size, height: C.ambient.size } });
