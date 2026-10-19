import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { activeElapsedMs } from '@/lib/lock-in';
import { elapsedSeconds } from '@/store/workout-state';
export { formatElapsed } from '@/store/workout-state';

/**
 * Active training milliseconds (pauses excluded). Ticks only while the app is
 * active and the clock is running; a paused clock renders once and stays still.
 */
export function useActiveElapsed(startedAt: number, pausedMs = 0, pausedAt: number | null = null, tickMs = 250) {
  const read = useCallback(() => activeElapsedMs({ startedAt, pausedMs, pausedAt }), [pausedAt, pausedMs, startedAt]);
  const [ms, setMs] = useState(read);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const update = (active: boolean) => {
      clearInterval(interval);
      setMs(read());
      if (active && !pausedAt) interval = setInterval(() => setMs(read()), tickMs);
    };
    update(AppState.currentState !== 'background');
    const subscription = AppState.addEventListener('change', (state) => update(state === 'active'));
    return () => { clearInterval(interval); subscription.remove(); };
  }, [pausedAt, read, tickMs]);
  return ms;
}

/** Intervals only refresh the display. The session timestamp is the clock. */
export function useWorkoutTimer(startedAt: number, enabled = true) {
  const [seconds, setSeconds] = useState(() => elapsedSeconds(startedAt));
  useEffect(() => {
    if (!enabled) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const refresh = () => setSeconds(elapsedSeconds(startedAt));
    const update = (active: boolean) => {
      clearInterval(interval);
      refresh();
      if (active) interval = setInterval(refresh, 200);
    };
    update(AppState.currentState !== 'background');
    const subscription = AppState.addEventListener('change', (state) => update(state === 'active'));
    return () => { clearInterval(interval); subscription.remove(); };
  }, [startedAt, enabled]);
  return seconds;
}
