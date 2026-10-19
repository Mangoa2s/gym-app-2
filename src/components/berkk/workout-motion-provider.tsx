import { router, usePathname } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, AppState, type View } from 'react-native';
import { cancelAnimation, Easing, ReduceMotion, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useStore } from 'zustand';

import { WorkoutMotion as M } from '@/constants/workout-motion';
import { workoutStore } from '@/store/workout';

type MotionContext = {
  clock: SharedValue<number>;
  overlayReady: SharedValue<boolean>;
  reduced: boolean;
  start: (node: View | null, planId?: number) => void;
};
const Context = createContext<MotionContext | null>(null);

export function WorkoutMotionProvider({ children }: PropsWithChildren) {
  const clock = useSharedValue<number>(M.duration);
  const overlayReady = useSharedValue(false);
  const initialReduced = useReducedMotion();
  const [reduced, setReduced] = useState(initialReduced);
  const opening = useRef(false);
  const pathname = usePathname();

  useEffect(() => { opening.current = false; }, [pathname]);
  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (reduced) { cancelAnimation(clock); clock.set(M.duration); }
  }, [clock, reduced]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        cancelAnimation(clock);
        clock.set(M.duration);
        const session = workoutStore.getState().session;
        if (session) workoutStore.getState().claimIntro(session.id);
        void workoutStore.getState().flush();
      }
    });
    return () => subscription.remove();
  }, [clock]);

  const start = (node: View | null, planId?: number) => {
    if (opening.current) return;
    if (!workoutStore.getState().hydrated) {
      router.navigate('/workout');
      return;
    }
    opening.current = true;
    const fresh = workoutStore.getState().start(planId); // Before measuring/navigation.
    if (!fresh) {
      clock.set(M.duration);
      router.navigate('/workout');
      return;
    }
    overlayReady.set(false);
    clock.set(0);
    clock.set(withTiming(M.duration, {
      duration: reduced ? M.reducedDuration : M.duration,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.Never, // Explicit short crossfade in reduced mode.
    }));
    const id = workoutStore.getState().session!.id;
    let navigated = false;
    const show = () => {
      if (navigated || workoutStore.getState().session?.id !== id) return;
      navigated = true;
      if (planId !== undefined) router.replace('/workout');
      else router.navigate('/workout');
    };
    // Window coordinates include safe-area/scroll offsets.
    node?.measureInWindow((x, y, width, height) => {
      if (navigated) return;
      if (width > 0 && height > 0) workoutStore.getState().setOrigin(id, { x, y, width, height });
      show();
    });
    // A detached view must not strand an active session on Home.
    setTimeout(show, 80);
  };

  return <Context.Provider value={{ clock, overlayReady, reduced, start }}>{children}</Context.Provider>;
}

export function useWorkoutMotion() {
  const context = useContext(Context);
  if (!context) throw new Error('WorkoutMotionProvider is missing');
  return context;
}

export function useWorkoutLauncher() {
  const session = useStore(workoutStore, (state) => state.session);
  const { start } = useWorkoutMotion();
  return { phase: session ? 'running' : 'idle', resumable: session?.introPlayed ?? false, start } as const;
}
