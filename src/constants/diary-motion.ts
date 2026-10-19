/** The diary has no idle animation. All times are milliseconds. */
export const DiaryMotion = {
  snap: { stiffness: 260, damping: 23, mass: 0.7 },
  velocityProjectionSeconds: 0.12,
  edgeResistance: 0.18,
  sideScale: 0.62,
  farScale: 0.48,
  sideOpacity: 0.42,
  reducedScale: 0.78,
  ghostSize: 144,
  labelMs: 100,
  // The confirm reaction lives in GhostMotion.confirm (berkk-ghost.tsx).
  pressMs: 100,
  pressedScale: 0.975,
  fieldMs: 200,
  savedVisibleMs: 1600,
  savedFadeMs: 160,
} as const;
