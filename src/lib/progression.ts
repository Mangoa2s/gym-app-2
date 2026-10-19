/**
 * XP and level. The level is NEVER stored: it is always recomputed from the
 * workout history, so editing or deleting a workout corrects it automatically.
 *
 * TODO(progression): every number below is a placeholder until the real rules
 * are decided (XP per workout, stronger-set bonus, PR bonus, level curve).
 */

/** TODO(progression): placeholder XP for a workout with at least one logged set. */
export const XP_PER_WORKOUT = 100;
/** TODO(progression): placeholder bonus per set that beat the same set last time (a PR set counts here too). */
export const XP_PER_STRONGER_SET = 20;
/** TODO(progression): placeholder bonus per new personal record. */
export const XP_PER_PR = 40;
/** TODO(progression): each level needs this much more XP than the previous one (250, 500, 750 …). */
export const LEVEL_STEP_XP = 250;

/** 100 + 20 per stronger set + 40 per PR. Workouts without sets earn nothing. */
export function workoutXp(setCount: number, prCount: number, strongerCount = 0) {
  return setCount > 0 ? XP_PER_WORKOUT + XP_PER_STRONGER_SET * strongerCount + XP_PER_PR * prCount : 0;
}

/** Total XP needed to reach `level` (level 1 starts at 0): 0, 250, 750, 1500, 2500 … */
export function levelStartXp(level: number) {
  return (LEVEL_STEP_XP * level * (level - 1)) / 2;
}

export function levelForXp(totalXp: number) {
  let level = 1;
  while (levelStartXp(level + 1) <= totalXp) level++;
  const start = levelStartXp(level);
  return { level, totalXp, xpIntoLevel: totalXp - start, xpForLevel: levelStartXp(level + 1) - start };
}
