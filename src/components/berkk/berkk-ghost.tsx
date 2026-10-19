import { memo, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { GhostMotion as M } from '@/constants/ghost-motion';
import { Berkk, Tokens } from '@/constants/theme';
import { ghostPose, type GhostMood, type GhostPose, type GhostPulse } from './ghost-state';
import { useWorkoutMotion } from './workout-motion-provider';
import { WorkoutLight } from './workout-light';

// Geometry from assets/characters/berkk-geist.svg (512 units), cropped to a
// 392-unit square around the body so small sizes keep the character readable.
const VIEW = 392;
const ORIGIN_X = 60;
const ORIGIN_Y = 41;
const BODY = 'M112 143 C99 94 124 56 168 52 C207 48 220 81 247 82 C277 83 292 48 333 53 C383 60 409 99 398 144 C388 184 379 206 388 250 C397 290 424 315 410 362 C399 402 369 422 335 420 C297 418 279 386 257 385 C234 383 222 418 181 420 C141 422 106 400 101 362 C94 319 116 292 122 250 C130 208 121 178 112 143 Z';
const EYES = [{ cx: 214, cy: 218, side: 1 }, { cx: 293, cy: 218, side: -1 }] as const;
const EYE_W = 38;
const EYE_H = 68;
const never = { reduceMotion: ReduceMotion.Never };

type Values = Record<'lift' | 'scaleX' | 'scaleY' | 'lean' | 'eyeOpen' | 'eyeScale' | 'eyeX' | 'eyeY' | 'eyeTilt' | 'breath', SharedValue<number>>;

/**
 * Eye variants: `normal` (ovals with lids; "fröhlich" happy arcs come from reactions),
 * `squint` (> < while thrown), `annoyed` (half-closed lids, pink cheeks, pout, steam).
 */
export type GhostExpression = 'normal' | 'squint' | 'annoyed';
/** Colour variant. Default comes from Tokens.ghost; a shop variant swaps these values only. */
export type GhostPalette = { body: readonly [string, string, string, string]; eye: string; cheek: string; steam: string };
/**
 * Outfit slots, drawn in the ghost's own SVG coordinates (viewBox 60 41 392 392:
 * head top ≈ y 52–110, eyes at y 218 (x 214 / 293), neck ≈ y 300–330). Layers move
 * with every animation because they sit inside the same transforms as the body.
 */
export type GhostOutfit = { neck?: ReactNode; eyes?: ReactNode; head?: ReactNode };

/**
 * The recurring BERKK character. `mood` is the pose it holds; `pulse` plays one
 * reaction and returns to that pose. Feeling comes from posture, eyes and timing.
 * Purely decorative: no touches, hidden from screen readers (parents carry labels).
 */
export const BerkkGhost = memo(function BerkkGhost({ size, mood = 'calm', pulse = null, idle = false, glow = false, muted = false, expression = 'normal', palette = Tokens.ghost, outfit }: {
  size: number; mood?: GhostMood; pulse?: GhostPulse | null;
  /** Breathing and blinking. Off in lists, carousels and toasts. */
  idle?: boolean;
  /** Warm light behind the ghost, reserved for a real streak. */
  glow?: boolean;
  /** Grey silhouette for "nothing chosen yet". */
  muted?: boolean;
  expression?: GhostExpression;
  palette?: GhostPalette;
  outfit?: GhostOutfit;
}) {
  const { reduced } = useWorkoutMotion();
  const appActive = useAppActive();
  const pose = ghostPose(mood);
  const poseRef = useRef(pose);
  const moodRef = useRef(mood);
  const busyUntil = useRef(0);
  const values: Values = {
    lift: useSharedValue(pose.lift), scaleX: useSharedValue(pose.scaleX), scaleY: useSharedValue(pose.scaleY), lean: useSharedValue(pose.lean),
    eyeOpen: useSharedValue(pose.eyeOpen), eyeScale: useSharedValue(pose.eyeScale), eyeX: useSharedValue(pose.eyeX), eyeY: useSharedValue(pose.eyeY),
    eyeTilt: useSharedValue(pose.eyeTilt), breath: useSharedValue(pose.breath),
  };
  const wave = useSharedValue(0);
  const happy = useSharedValue(0);
  /** Extra turn in degrees, used only by the PR jump. */
  const spin = useSharedValue(0);
  /** 0..1 blends for the eye variants and the rising steam puffs. */
  const squint = useSharedValue(expression === 'squint' ? 1 : 0);
  const annoyed = useSharedValue(expression === 'annoyed' ? 1 : 0);
  const steam = useSharedValue(0);
  const light = useSharedValue(glow ? M.glowBase : 0);
  const k = size / VIEW;
  // Body travel scales with the square root of size: a 34-pt header ghost still
  // visibly hops, a 144-pt diary ghost does not leap out of its stage.
  const travel = Math.sqrt(k);
  const gradient = `berkk-ghost-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Mood change: glide every pose value to its new target.
  useEffect(() => {
    poseRef.current = pose;
    moodRef.current = mood;
    for (const key of Object.keys(values) as (keyof Values)[]) {
      values[key].set(reduced ? pose[key] : withSpring(pose[key], { ...M.settle, ...never }));
    }
    // `values` holds stable shared values; the pose object is static per mood.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, reduced]);

  useEffect(() => {
    light.set(reduced ? (glow ? M.glowBase : 0) : withTiming(glow ? M.glowBase : 0, { duration: M.moodMs, ...never }));
  }, [glow, light, reduced]);

  // Eye variants. Annoyed adds a short head shake and two rising steam puffs.
  useEffect(() => {
    const quick = (to: number, duration: number) => (reduced ? to : withTiming(to, { duration, ...never }));
    squint.set(quick(expression === 'squint' ? 1 : 0, 90));
    annoyed.set(quick(expression === 'annoyed' ? 1 : 0, 200));
    if (expression === 'annoyed' && !reduced) {
      const t = (to: number, duration: number) => withTiming(to, { duration, easing: Easing.inOut(Easing.quad), ...never });
      values.lean.set(withSequence(t(-9, 90), t(9, 120), t(-6, 110), t(4, 100), withSpring(poseRef.current.lean, { ...M.settle, ...never })));
      steam.set(0);
      steam.set(withRepeat(withTiming(1, { duration: M.steamMs, easing: Easing.linear, ...never }), 2, false));
    }
    // `values` holds stable shared values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annoyed, expression, reduced, squint, steam]);

  // Breathing and blinking only while visible, foregrounded and allowed to move.
  const breathing = idle && appActive && !reduced;
  useEffect(() => {
    cancelAnimation(wave);
    if (!breathing) { wave.set(reduced ? 0 : withTiming(0, { duration: M.moodMs, ...never })); return; }
    // Ease into the full -1..1 swing from wherever the last loop stopped.
    const half = { duration: pose.breathHalfMs, easing: Easing.inOut(Easing.sin), ...never };
    wave.set(withSequence(withTiming(-1, half), withRepeat(withTiming(1, half), -1, true)));
    let timer: ReturnType<typeof setTimeout>;
    const blinkLater = () => {
      const every = poseRef.current.blinkEveryMs;
      timer = setTimeout(() => {
        if (Date.now() >= busyUntil.current) {
          values.eyeOpen.set(withSequence(withTiming(0, { duration: M.blinkCloseMs, ...never }), withTiming(poseRef.current.eyeOpen, { duration: M.blinkOpenMs, ...never })));
        }
        blinkLater();
      }, every * (1 - M.blinkJitter / 2 + Math.random() * M.blinkJitter));
    };
    blinkLater();
    return () => { clearTimeout(timer); cancelAnimation(wave); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breathing, pose.breathHalfMs]);

  // One reaction per new pulse id, including a pulse present at mount (toast, calendar greeting).
  const played = useRef<number | null>(null);
  useEffect(() => {
    if (!pulse || pulse.id === played.current) return;
    played.current = pulse.id;
    busyUntil.current = Date.now() + 1400;
    react(pulse.reaction, poseRef.current, moodRef.current, values, happy, light, spin, glow, reduced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse]);

  useEffect(() => () => {
    for (const value of [...Object.values(values), wave, happy, light, spin, squint, annoyed, steam]) cancelAnimation(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const body = useAnimatedStyle(() => ({
    transform: [
      { translateY: (values.lift.value + wave.value * values.breath.value) * travel },
      { rotate: `${values.lean.value}deg` },
      { scaleX: values.scaleX.value },
      { scaleY: values.scaleY.value * (1 + wave.value * values.breath.value * 0.0022) },
    ],
  }));
  // Clean swap, never both shapes at once: ovals leave in the first half, arcs arrive in the second.
  const happyEyes = useAnimatedStyle(() => ({ opacity: Math.max(0, happy.value * 2 - 1) * (1 - squint.value) }));
  const squintEyes = useAnimatedStyle(() => ({ opacity: squint.value }));
  const grumpy = useAnimatedStyle(() => ({ opacity: annoyed.value }));
  const halo = useAnimatedStyle(() => ({ opacity: light.value }));
  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const eyeColor = muted ? Berkk.ctaInk : palette.eye;
  const layer = (children: ReactNode, style?: object) => <Animated.View style={[StyleSheet.absoluteFill, style]}>
    <Svg width={size} height={size} viewBox={`${ORIGIN_X} ${ORIGIN_Y} ${VIEW} ${VIEW}`}>{children}</Svg>
  </Animated.View>;

  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    {glow && <Animated.View style={[styles.halo, { width: size * 2.1, height: size * 1.9, left: -size * 0.55, top: -size * 0.42 }, halo]}>
      <WorkoutLight color={Tokens.world.glow} strength={0.65} />
    </Animated.View>}
    <Animated.View style={[StyleSheet.absoluteFill, styles.body, body]}>
      {/* The PR turn spins around the ghost's centre, inside the bottom-anchored squash. */}
      <Animated.View style={[StyleSheet.absoluteFill, turn]}>
      <Svg width={size} height={size} viewBox={`${ORIGIN_X} ${ORIGIN_Y} ${VIEW} ${VIEW}`}>
        <Defs><LinearGradient id={gradient} x1="0.08" y1="0.04" x2="0.88" y2="1">
          {palette.body.map((color, index) => <Stop key={index} offset={[0, 0.35, 0.68, 1][index]} stopColor={color} />)}
        </LinearGradient></Defs>
        <Path d={BODY} fill={muted ? Berkk.inkSecondary : `url(#${gradient})`} />
        {outfit?.neck}
      </Svg>
      {EYES.map((eye) => <Eye key={eye.side} {...eye} k={k} values={values} happy={happy} squint={squint} annoyed={annoyed} color={eyeColor} />)}
      {/* Fröhlich: closed upward arcs. */}
      {layer(EYES.map((eye) => <Path key={eye.side} d={`M${eye.cx - 22} ${eye.cy + 8} Q${eye.cx} ${eye.cy - 24} ${eye.cx + 22} ${eye.cy + 8}`} stroke={eyeColor} strokeWidth={11} strokeLinecap="round" fill="none" />), happyEyes)}
      {/* Zugekniffen: > < */}
      {layer(EYES.map((eye) => <Path key={eye.side} d={`M${eye.cx - eye.side * 16} ${eye.cy - 18} L${eye.cx + eye.side * 14} ${eye.cy} L${eye.cx - eye.side * 16} ${eye.cy + 18}`} stroke={eyeColor} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" />), squintEyes)}
      {/* Genervt: pink cheeks and a small pout (the lids close halfway in Eye). */}
      {layer(<>
        <Ellipse cx={178} cy={262} rx={21} ry={12} fill={palette.cheek} opacity={0.85} />
        <Ellipse cx={329} cy={262} rx={21} ry={12} fill={palette.cheek} opacity={0.85} />
        <Path d="M243 282 Q253 270 263 282 Q253 291 243 282 Z" fill={eyeColor} />
      </>, grumpy)}
      {outfit?.eyes && layer(outfit.eyes)}
      {outfit?.head && layer(outfit.head)}
      </Animated.View>
    </Animated.View>
    <Steam progress={steam} annoyed={annoyed} k={k} offset={0} x={(150 - ORIGIN_X) * k} color={palette.steam} />
    <Steam progress={steam} annoyed={annoyed} k={k} offset={0.45} x={(350 - ORIGIN_X) * k} color={palette.steam} />
  </View>;
});

/** One small steam puff rising from the head while annoyed. */
function Steam({ progress, annoyed, k, offset, x, color }: { progress: SharedValue<number>; annoyed: SharedValue<number>; k: number; offset: number; x: number; color: string }) {
  const diameter = Math.max(8, 38 * k);
  const style = useAnimatedStyle(() => {
    const phase = (progress.value + offset) % 1;
    return { opacity: annoyed.value * Math.sin(phase * Math.PI) * (progress.value > 0 && progress.value < 1 ? 1 : 0), transform: [{ translateY: -phase * 70 * k }, { scale: 0.6 + phase * 0.6 }] };
  });
  return <Animated.View style={[styles.steam, { left: x - diameter / 2, top: (60 - ORIGIN_Y) * k, width: diameter, height: diameter, borderRadius: diameter, backgroundColor: color }, style]} />;
}

/** Lid = a clip box moved down while the oval moves up by the same amount: the top flattens, the eye stays put. */
function Eye({ cx, cy, side, k, values, happy, squint, annoyed, color }: { cx: number; cy: number; side: number; k: number; values: Values; happy: SharedValue<number>; squint: SharedValue<number>; annoyed: SharedValue<number>; color: string }) {
  const w = EYE_W * k;
  const h = EYE_H * k;
  const look = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - happy.value * 2) * (1 - squint.value),
    transform: [{ translateX: values.eyeX.value * k }, { translateY: values.eyeY.value * k }, { rotate: `${side * values.eyeTilt.value}deg` }, { scale: values.eyeScale.value }],
  }));
  // Annoyed closes the lids halfway on top of whatever the pose wants.
  const shut = () => {
    'worklet';
    return 1 - Math.min(1, Math.max(0, Math.min(values.eyeOpen.value, 1 - annoyed.value * 0.55)));
  };
  const lid = useAnimatedStyle(() => ({ transform: [{ translateY: shut() * h }] }));
  const ball = useAnimatedStyle(() => ({ transform: [{ translateY: -shut() * h }] }));
  return <Animated.View style={[styles.eye, { left: (cx - ORIGIN_X - EYE_W / 2) * k, top: (cy - ORIGIN_Y - EYE_H / 2) * k, width: w, height: h }, look]}>
    <Animated.View style={[styles.clip, lid]}>
      <Animated.View style={[{ width: w, height: h, borderRadius: w / 2, backgroundColor: color }, ball]} />
    </Animated.View>
  </Animated.View>;
}

/** Reactions are short sequences on the UI thread that always end on the mood's pose. */
function react(reaction: GhostPulse['reaction'], p: GhostPose, mood: GhostMood, v: Values, happy: SharedValue<number>, light: SharedValue<number>, spin: SharedValue<number>, glow: boolean, reduced: boolean) {
  const t = (to: number, duration: number, easing = Easing.out(Easing.cubic)) => withTiming(to, { duration, easing, ...never });
  const back = (to: number) => withSpring(to, { ...M.settle, ...never });
  const base = glow ? M.glowBase : 0;
  const joyful = reaction === 'success' || reaction === 'streak' || reaction === 'pr' || (reaction === 'confirm' && mood === 'strong');

  if (reduced) {
    // Expression only: no travel, no scaling. The text feedback stays the primary signal.
    if (joyful) happy.set(withSequence(t(1, 0), withDelay(M.reducedHappyMs, t(0, 0))));
    if (reaction === 'streak' && glow) light.set(withSequence(t(1, 0), withDelay(M.reducedHappyMs, t(base, 0))));
    return;
  }

  if (reaction === 'start') {
    const S = M.start;
    v.scaleY.set(withSequence(t(p.scaleY * S.squash, S.squashMs), t(p.scaleY * 1.04, S.popMs), back(p.scaleY)));
    v.scaleX.set(withSequence(t(p.scaleX * 1.04, S.squashMs), t(p.scaleX * 0.97, S.popMs), back(p.scaleX)));
    v.lift.set(withSequence(t(p.lift + 3, S.squashMs), t(p.lift + S.lift, S.popMs), back(p.lift)));
    // Attention first (wide, open, looking up), then the lids settle into focus.
    v.eyeScale.set(withSequence(t(S.widen, S.squashMs), withDelay(S.popMs + S.holdMs, back(p.eyeScale))));
    v.eyeOpen.set(withSequence(t(1, S.squashMs), withDelay(S.popMs + S.holdMs, t(p.eyeOpen, 300, Easing.inOut(Easing.quad)))));
    v.eyeY.set(withSequence(t(p.eyeY - 6, S.squashMs), withDelay(S.popMs + S.holdMs, back(p.eyeY))));
    return;
  }
  if (reaction === 'pr') {
    // The loudest beat: deep anticipation, a high jump with one full turn, a firm landing.
    const S = M.pr;
    v.scaleY.set(withSequence(t(p.scaleY * S.squash, S.squashMs), t(p.scaleY * S.stretch, S.jumpMs), t(p.scaleY * 0.9, S.landMs), back(p.scaleY)));
    v.scaleX.set(withSequence(t(p.scaleX * 1.1, S.squashMs), t(p.scaleX * 0.92, S.jumpMs), t(p.scaleX * 1.08, S.landMs), back(p.scaleX)));
    v.lift.set(withSequence(t(p.lift + 6, S.squashMs), t(p.lift + S.lift, S.jumpMs, Easing.out(Easing.quad)), t(p.lift, S.landMs, Easing.in(Easing.quad)), back(p.lift)));
    spin.set(withSequence(t(0, S.squashMs), t(S.spinDeg, S.jumpMs + S.landMs, Easing.inOut(Easing.cubic)), t(0, 0)));
    happy.set(withSequence(withDelay(S.squashMs, t(1, 90)), withDelay(S.happyMs, t(0, 200))));
    if (glow) light.set(withSequence(t(1, S.jumpMs), withDelay(S.happyMs, t(base, 600))));
    return;
  }
  if (reaction === 'nod') {
    // Same, fewer or extra: a calm blink and an agreeing nod. Never a scolding pose.
    const C = M.confirm;
    v.eyeOpen.set(withSequence(t(0, M.blinkCloseMs), t(p.eyeOpen, M.blinkOpenMs)));
    v.eyeY.set(withSequence(t(p.eyeY + 8, C.nodMs), back(p.eyeY)));
    v.lift.set(withSequence(t(p.lift + 4, C.nodMs), back(p.lift)));
    return;
  }
  if (reaction === 'success' || (reaction === 'confirm' && mood === 'strong')) {
    const S = M.success;
    const scale = reaction === 'success' ? 1 : 0.6;
    v.scaleY.set(withSequence(t(p.scaleY * (1 - (1 - S.squash) * scale), S.squashMs), t(p.scaleY * (1 + (S.stretch - 1) * scale), S.jumpMs), t(p.scaleY * 0.96, S.landMs), back(p.scaleY)));
    v.scaleX.set(withSequence(t(p.scaleX * (1 + 0.06 * scale), S.squashMs), t(p.scaleX * (1 - 0.05 * scale), S.jumpMs), t(p.scaleX * 1.03, S.landMs), back(p.scaleX)));
    v.lift.set(withSequence(t(p.lift + 3, S.squashMs), t(p.lift + S.lift * scale, S.jumpMs, Easing.out(Easing.quad)), t(p.lift, S.landMs, Easing.in(Easing.quad)), back(p.lift)));
    happy.set(withSequence(withDelay(S.squashMs, t(1, 90)), withDelay(S.happyMs, t(0, S.happyFadeMs))));
    return;
  }
  if (reaction === 'streak') {
    const S = M.streak;
    light.set(withSequence(t(S.glowPeak, S.riseMs), withDelay(S.holdMs, t(base, S.fallMs, Easing.inOut(Easing.quad)))));
    v.lift.set(withSequence(t(p.lift + S.lift, S.riseMs), withDelay(S.holdMs, back(p.lift))));
    v.scaleY.set(withSequence(t(p.scaleY * S.stretch, S.riseMs), withDelay(S.holdMs, back(p.scaleY))));
    happy.set(withSequence(t(1, 120), withDelay(S.riseMs + S.holdMs, t(0, 220))));
    return;
  }
  const C = M.confirm;
  if (mood === 'weak') {
    // A slow sigh: sink, sag, heavy blink, then recover to the tired pose.
    v.lift.set(withSequence(t(p.lift + 10, C.sighMs, Easing.inOut(Easing.quad)), t(p.lift, C.recoverMs, Easing.inOut(Easing.quad))));
    v.scaleY.set(withSequence(t(p.scaleY * 0.92, C.sighMs, Easing.inOut(Easing.quad)), t(p.scaleY, C.recoverMs, Easing.inOut(Easing.quad))));
    v.eyeOpen.set(withSequence(t(0.08, C.sighMs, Easing.inOut(Easing.quad)), t(p.eyeOpen, C.recoverMs, Easing.inOut(Easing.quad))));
    return;
  }
  // Normal: one blink and a small agreeing nod.
  v.eyeOpen.set(withSequence(t(0, M.blinkCloseMs), t(p.eyeOpen, M.blinkOpenMs)));
  v.eyeY.set(withSequence(t(p.eyeY + 8, C.nodMs), back(p.eyeY)));
  v.lift.set(withSequence(t(p.lift + 4, C.nodMs), back(p.lift)));
}

function useAppActive() {
  const [active, setActive] = useState(AppState.currentState !== 'background' && AppState.currentState !== 'inactive');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  return active;
}

const styles = StyleSheet.create({
  halo: { position: 'absolute' },
  steam: { position: 'absolute' },
  body: { transformOrigin: ['50%', '92%', 0] },
  eye: { position: 'absolute', alignItems: 'center' },
  clip: { overflow: 'hidden', width: '100%', height: '100%' },
});
