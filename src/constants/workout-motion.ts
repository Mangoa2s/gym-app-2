import { Berkk } from '@/constants/theme';

/** Milliseconds. One shared clock drives the complete entrance. */
export const WorkoutMotion = {
  duration: 1100,
  compressEnd: 120,
  travelEnd: 380,
  timerStart: 300,
  timerOpacityRamp: 40,
  surfaceFadeEnd: 440,
  timerSettle: 750,
  reducedDuration: 160,
  buttonScale: 0.96,
  buttonRadius: 26,
  surfaceFinalScaleX: 0.32,
  surfaceFinalScaleY: 0.6,
  timerScale: 1.3,
  timerFontSize: 100,
  timerInitialOpacity: 0.24,
  lightPeak: 0.48,
  lightRest: 0.035,
  lightSize: 420,
  lightInitialScale: 1.3,
  controlsOffset: 10,
  timerPosition: 0.43,
  ambient: {
    orangeCycle: 20000,
    purpleCycle: 24000,
    driftX: 18,
    driftY: 24,
    orangeOpacity: 0.15,
    purpleOpacity: 0.18,
    size: 560,
  },
} as const;

/** Tuning for the running screen only. Durations are milliseconds (1000 = 1s). */
export const WorkoutFocus = {
  intro: {
    settleAt: 1100,
    dateAt: 100,
    timerAt: 180,
    streakAt: 260,
    entranceMs: 340,
    contentOffset: 8,
  },
  savedSet: {
    settleMs: 180,
    sweepMs: 640,
    visibleMs: 1100,
    offset: 5,
    lightWidth: 110,
    light: ['rgba(255,122,60,0)', 'rgba(255,143,84,0.18)', 'rgba(255,122,60,0)'] as const,
  },
  edge: {
    circuitMs: 38000,
    secondCircuitMs: 53000,
    thirdCircuitMs: 67000,
    warmColor: Berkk.glowOrange,
    warmShade: '#A83228',
    violetColor: Berkk.glowPurple,
    violetShade: Berkk.detailGradient[1],
    outset: 24,
    cornerRadius: 84,
    warmStrength: 0.72,
    violetStrength: 0.07,
    baseStrength: 0.62,
  },
  add: {
    pressMs: 110,
    pressScale: 0.975,
    halfCycleMs: 7300,
    glowColor: Berkk.glowOrange,
    surface: ['#54251C', '#291714', '#1A1213'] as const,
    border: 'rgba(255,138,76,0.6)',
  },
  footer: {
    actionGap: 20,
    bottomAir: 20,
  },
  ghost: {
    // Pause between "workout noticed" and the streak greeting on a fresh start.
    streakGreetDelayMs: 900,
  },
} as const;

/** Shared light treatment for Home and the running workout; no session logic. */
export const BerkkAction = {
  halfCycleMs: 6500,
  driftX: 14,
  driftY: 5,
  addStrength: 0.3,
  startStrength: 0.52,
  warmColor: Berkk.glowOrange,
  symbolColor: Berkk.linkPressed,
  addSurface: Berkk.detailGradient[2],
  startSurface: Berkk.backgroundGradient[2],
  addBorder: 'rgba(241,90,34,0.32)',
  startBorder: 'rgba(241,90,34,0.52)',
} as const;
