import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { cancelAnimation, Easing, ReduceMotion, useFrameCallback, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** A visual clock only; the workout's elapsed time never depends on it. */
export function useWorkoutDrift(halfCycleMs: number, reduced: boolean) {
  const visible = useVisualActive();
  const drift = useSharedValue(-1);
  useEffect(() => {
    cancelAnimation(drift);
    if (reduced) drift.set(0);
    else if (visible) {
      const target = drift.get() >= 0 ? -1 : 1;
      drift.set(withRepeat(withTiming(target, {
        duration: halfCycleMs,
        easing: Easing.inOut(Easing.sin),
        reduceMotion: ReduceMotion.System,
      }), -1, true));
    }
    return () => cancelAnimation(drift);
  }, [drift, halfCycleMs, reduced, visible]);
  return drift;
}

/** Continuous perimeter progress, independent of the workout timer. */
export function useWorkoutOrbit(circuitMs: number, reduced: boolean, initialPhase = 0.86) {
  const visible = useVisualActive();
  const phase = useSharedValue(initialPhase);
  const frame = useFrameCallback(({ timeSincePreviousFrame }) => {
    // Cap long gaps so returning from background cannot jump the light.
    phase.value = (phase.value + Math.min(timeSincePreviousFrame ?? 0, 64) / circuitMs) % 1;
  }, false);
  useEffect(() => {
    frame.setActive(visible && !reduced);
    if (reduced) phase.set(initialPhase);
    return () => frame.setActive(false);
  }, [frame, initialPhase, phase, reduced, visible]);
  return phase;
}

function useVisualActive() {
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  return focused && active;
}
