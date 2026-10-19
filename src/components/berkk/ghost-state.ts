/**
 * Pure character logic for the BERKK ghost: which pose a mood holds and which
 * one-shot reaction an actual app event earns. No React, no animation code.
 */

/** Persistent states. `calm` and `normal` share a pose; `normal` is the diary wording. */
export type GhostMood = 'calm' | 'focused' | 'weak' | 'normal' | 'strong';
/**
 * One-shot reactions. Each returns to the current mood afterwards.
 * Training scale, loudest to quietest: `pr` (big jump + full spin) > `success`
 * (stronger than last time: smaller hop, happy eyes) > `nod` (same, less, extra).
 */
export type GhostReaction = 'start' | 'success' | 'streak' | 'confirm' | 'pr' | 'nod';
/** A new `id` replays the reaction; the same id never replays on re-render. */
export type GhostPulse = { reaction: GhostReaction; id: number };

/**
 * Units: `eyeX` and `eyeY` are units of the ghost's 392-unit drawing. `lift` and
 * `breath` are body travel, multiplied by sqrt(size / 392) so small ghosts still
 * visibly move (positive lift sinks). `lean` and `eyeTilt` are degrees. `eyeOpen` is
 * the visible part of each eye from the bottom (1 open, 0 shut); below 1 the top
 * reads as a heavy lid. `eyeScale` widens both eyes.
 */
export type GhostPose = {
  lift: number; scaleX: number; scaleY: number; lean: number;
  eyeOpen: number; eyeScale: number; eyeX: number; eyeY: number; eyeTilt: number;
  breath: number; breathHalfMs: number; blinkEveryMs: number;
};

const calm: GhostPose = { lift: 0, scaleX: 1, scaleY: 1, lean: 0, eyeOpen: 1, eyeScale: 1, eyeX: 0, eyeY: 0, eyeTilt: 0, breath: 6, breathHalfMs: 1900, blinkEveryMs: 4200 };

export const GHOST_POSES: Record<GhostMood, GhostPose> = {
  calm,
  normal: calm,
  // Flat-topped eyes looking slightly down toward the list; slower, smaller breath.
  focused: { ...calm, scaleY: 0.985, eyeOpen: 0.68, eyeY: 7, breath: 3, breathHalfMs: 2600, blinkEveryMs: 6000 },
  // Sunk, sagging, heavy lids drooping outward. Not sad, just spent.
  weak: { ...calm, lift: 16, scaleX: 1.05, scaleY: 0.92, lean: -4, eyeOpen: 0.42, eyeY: 12, eyeTilt: -9, breath: 4, breathHalfMs: 2800, blinkEveryMs: 3600 },
  // Taller, narrower, raised; wide eyes looking up. Stretch, never a flattened puff.
  strong: { ...calm, lift: -10, scaleX: 0.97, scaleY: 1.05, eyeScale: 1.1, eyeY: -8, breath: 7, breathHalfMs: 1500, blinkEveryMs: 4800 },
};

export function ghostPose(mood: GhostMood): GhostPose {
  return GHOST_POSES[mood];
}

/** The workout header ghost's state. A zero streak never glows or greets. */
export function workoutGhost(streak: number) {
  return { mood: 'focused' as GhostMood, glow: streak > 0 };
}

/** Calendar: proud only when today actually counts; otherwise calm and still at 0. */
export function calendarGhost(streak: number, todayDone: boolean) {
  return { mood: (todayDone ? 'strong' : 'calm') as GhostMood, idle: streak > 0, glow: streak > 0, greet: streak > 0 };
}

/** Message and reaction after a durably saved workout. Only a real streak increase celebrates the streak. */
export function finishFeedback(streakBefore: number, streakAfter: number) {
  const grew = streakAfter > streakBefore && streakAfter > 0;
  return {
    message: 'Training gespeichert',
    detail: grew ? (streakAfter === 1 ? 'Serie gestartet: 1×' : `Serie: ${streakAfter}× in Folge`) : undefined,
    reaction: (grew ? 'streak' : 'success') as GhostReaction,
  };
}
