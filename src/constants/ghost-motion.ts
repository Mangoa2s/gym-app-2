/** BERKK ghost timing. Durations are milliseconds (1000 = 1s). */
export const GhostMotion = {
  /** Mood changes glide; reactions use their own steps below. */
  settle: { stiffness: 210, damping: 20, mass: 0.8 },
  moodMs: 420,
  blinkCloseMs: 70,
  blinkOpenMs: 130,
  /** Random spread around a pose's blink interval so it never feels mechanical. */
  blinkJitter: 0.45,
  /** Workout begins: attention (eyes widen) -> small hop -> calm focus. */
  start: { squashMs: 120, popMs: 180, holdMs: 260, squash: 0.94, widen: 1.16, lift: -10 },
  /** Confirmed set: anticipation -> jump with happy eyes -> landing -> settle. */
  success: { squashMs: 110, jumpMs: 200, landMs: 140, happyMs: 520, happyFadeMs: 160, squash: 0.91, stretch: 1.07, lift: -16 },
  /** New PR, the one loud moment: deep squash, high jump with a full turn, long happy eyes. */
  pr: { squashMs: 140, jumpMs: 300, landMs: 160, happyMs: 1100, squash: 0.84, stretch: 1.14, lift: -44, spinDeg: 360 },
  /** Real streak: warm light swells once, a proud rise, happy eyes. */
  streak: { riseMs: 260, holdMs: 520, fallMs: 700, lift: -7, stretch: 1.04, glowPeak: 1 },
  /** Feeling confirmed in the diary: weak sighs, normal nods, strong hops. */
  confirm: { sighMs: 380, recoverMs: 460, nodMs: 140, hopMs: 170 },
  /** One rise of the annoyed steam puffs (played twice). */
  steamMs: 950,
  /** Reduced motion keeps only the expression, no movement. */
  reducedHappyMs: 700,
  /** Extra reading time when the save toast shows a streak line. */
  toastDetailExtraMs: 900,
  glowBase: 0.42,
} as const;
