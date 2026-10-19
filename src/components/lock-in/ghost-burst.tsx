import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

import { LockIn as L } from '@/constants/lock-in';
import { Tokens as T } from '@/constants/theme';

export type Burst = { kind: 'pr' | 'sparks'; id: number };

/**
 * Decorative effects around the ghost. PR: two expanding rings (the loud beat).
 * Stronger: a few short sparks (clearly smaller). Nothing with reduced motion.
 */
export const GhostBurst = memo(function GhostBurst({ burst, size, reduced }: { burst: Burst | null; size: number; reduced: boolean }) {
  const progress = useSharedValue(1);
  const echo = useSharedValue(1);
  useEffect(() => {
    if (!burst || reduced) return;
    progress.set(0); echo.set(0);
    const duration = burst.kind === 'pr' ? L.burst.ringMs : L.burst.sparkMs;
    progress.set(withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
    if (burst.kind === 'pr') echo.set(withDelay(L.burst.echoDelayMs, withTiming(1, { duration, easing: Easing.out(Easing.cubic) })));
    return () => { cancelAnimation(progress); cancelAnimation(echo); };
  }, [burst, echo, progress, reduced]);
  if (!burst || reduced) return null;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.stage, { width: size * 2.6, height: size * 2.6, marginLeft: -size * 1.3, marginTop: -size * 1.3 }]}>
    {burst.kind === 'pr'
      ? <><Ring progress={progress} size={size} color={T.color.accent} /><Ring progress={echo} size={size} color={T.color.accentLight} /></>
      : Array.from({ length: L.burst.sparks }, (_, index) => <Spark key={index} progress={progress} angle={(index / L.burst.sparks) * Math.PI * 2 - Math.PI / 2} distance={size * 0.85} />)}
  </View>;
});

function Ring({ progress, size, color }: { progress: SharedValue<number>; size: number; color: string }) {
  const style = useAnimatedStyle(() => ({ opacity: 1 - progress.value, transform: [{ scale: 0.55 + progress.value * 1.6 }] }));
  return <Animated.View style={[styles.ring, { width: size * 1.2, height: size * 1.2, borderRadius: size, borderColor: color }, style]} />;
}

function Spark({ progress, angle, distance }: { progress: SharedValue<number>; angle: number; distance: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 1 ? 1 - progress.value : 0,
    transform: [{ translateX: Math.cos(angle) * distance * progress.value }, { translateY: Math.sin(angle) * distance * progress.value }, { scale: 1 - progress.value * 0.5 }],
  }));
  return <Animated.View style={[styles.spark, style]} />;
}

const styles = StyleSheet.create({
  stage: { position: 'absolute', left: '50%', top: '50%', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 3 },
  spark: { position: 'absolute', width: 7, height: 7, borderRadius: T.radius.circle, backgroundColor: T.color.accentLight },
});
