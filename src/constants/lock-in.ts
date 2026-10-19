/** Active training ("lock-in") timings and sizes. Durations are milliseconds. Colors live in Tokens. */
export const LockIn = {
  /** Hold the stop button this long to end a workout; a ring fills meanwhile. */
  stopHoldMs: 1200,
  /** Default rest after a confirmed set, and the "+15 s" step. */
  restSeconds: 120,
  restAddSeconds: 15,
  /** Stepper steps. */
  steps: { kg: 2.5, reps: 1, seconds: 5, minutes: 1, km: 0.5 },
  /** Ghost size on tall and on small phones (height < 700). */
  ghostSize: 112,
  compactGhostSize: 64,
  /** Space the ghost's line needs below it; the stage never shrinks below ghost + line. */
  speechSpace: 76,
  compactSpeechSpace: 40,
  /** Show the "n× stärker in Folge" chip from this many stronger sets in a row. */
  streakChipFrom: 2,
  burst: { ringMs: 700, echoDelayMs: 120, sparkMs: 520, sparks: 6 },
  /** TEMPORARY: shows "Glut: …" diagnostics on the training screen. Set to false (or remove) once the world is confirmed on device. */
  debugWorld: true,
  /** Glut-Welt simulation. Battery first: ≤ 30 fps when calm, ≤ 150 particles, stopped in background. */
  world: {
    idleFrameMs: 33,
    maxParticles: 150,
    /** The ember bed glows upward from the top edge of the tracking card ("the card stands in the embers"). */
    bedRadius: 260,
    bedRadiusHeat: 420,
    /** Bed opacity = base + heat × perHeat. Base is ~3× the first version so a fresh workout already glows. */
    bedAlphaBase: 0.5,
    bedAlphaPerHeat: 0.4,
    /** Glow around the ghost: opacity and radius, each base + heat × perHeat. */
    glowAlphaBase: 0.4,
    glowAlphaPerHeat: 0.35,
    glowRadius: 110,
    glowRadiusHeat: 120,
    /** Ambient sparks per second: base + heat × perHeat; rest multiplies by restFactor. */
    sparkBase: 2,
    sparkPerHeat: 16,
    restFactor: 0.4,
    heatFloor: 0.08,
    /** Sets that count as a "full" workout when fewer are planned. */
    heatMinSets: 8,
    /** Seconds to close ~63 % of the gap to a new heat target. */
    heatEase: 1.2,
    bursts: { normal: 16, stronger: 46, pr: 110 },
    flash: { stronger: 0.35, pr: 1 },
    /** Dragging pushes sparks away within this radius (px). */
    repelRadius: 80,
  },
  /** Ghost drag and throw. */
  throw: {
    /** Release speed (px/s) above which the ghost flies. */
    minSpeed: 700,
    /** Max drag distance from home (px); beyond it the pull is soft. */
    maxDrag: 140,
    /** Speed kept per wall hit (45 % energy loss). */
    bounce: 0.55,
    /** Velocity kept per second of flight (air drag). */
    dragPerSecond: 0.18,
    flightMs: 900,
    settleSpeed: 140,
    spinPerPx: 0.6,
    impactSparks: 8,
    annoyedMs: 2000,
  },
  /** Summary count-up length. */
  countUpMs: 900,
} as const;
