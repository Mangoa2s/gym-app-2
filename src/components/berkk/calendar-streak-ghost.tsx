import { memo, useEffect, useRef, useState } from 'react';

import { BerkkGhost } from './berkk-ghost';
import { calendarGhost, type GhostPulse } from './ghost-state';

/**
 * The ghost beside the calendar streak. It greets a real streak the first time
 * the calendar is seen and again only after the streak actually grows.
 */
export const CalendarStreakGhost = memo(function CalendarStreakGhost({ streak, todayDone, focused, size = 44, halo = true }: { streak: number; todayDone: boolean; focused: boolean; size?: number;
  /** Off on light surfaces, where a warm halo reads as a smudge. */
  halo?: boolean;
}) {
  const ghost = calendarGhost(streak, todayDone);
  const [pulse, setPulse] = useState<GhostPulse | null>(null);
  const greeted = useRef(0);
  useEffect(() => {
    if (!focused) return;
    if (ghost.greet && streak > greeted.current) setPulse((current) => ({ reaction: 'streak', id: (current?.id ?? 0) + 1 }));
    greeted.current = streak; // A broken streak resets silently.
  }, [focused, ghost.greet, streak]);
  return <BerkkGhost size={size}mood={ghost.mood} idle={focused && ghost.idle} glow={halo && ghost.glow}pulse={pulse} />;
});
