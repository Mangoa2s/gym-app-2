import { useIsFocused } from 'expo-router';
import { memo, useEffect, useState, type RefObject } from 'react';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, type ScrollView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  clamp,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { GlassSurface } from '@/components/berkk/glass-surface';
import { Berkk, BerkkFonts } from '@/constants/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const ACCENT = '#E8632B';
const ACCENT_RGB = '232, 99, 43';
const CARD_HEIGHT = 196;
const A11Y_STEP = 5;
// Leftmost reach of the bolt, as a fraction of the card height measured from the right edge.
const BOLT_REACH = 0.63;
// Left edge of the liquid shape, just outside the bolt's leftmost curve so the clip hides it.
const LIQUID_REACH = 0.66;
// Glow at 100 %: blur radius and opacity. Both fall linearly to nothing at 0 %.
const GLOW_RADIUS = 12;
const GLOW_OPACITY = 0.9;
// Room around the number's glow copy. Text shadows (iOS) and blur (Android) are both clipped to the view's
// bounds, so leave 3σ for the glow to fade out before it reaches an edge.
const GLOW_PAD = GLOW_RADIUS * 3;
// iOS draws real shadows; Android and web blur a duplicate layer instead.
const IOS_SHADOW = Platform.OS === 'ios';
const WAVE_AMPLITUDE = 2;
const WAVE_HARMONIC = 0.3;
const WAVE_SEGMENTS = 28;
const WAVE_PERIOD_MS = 4200;
const TAU = Math.PI * 2;
const webDrag = Platform.OS === 'web' ? ({ cursor: 'ns-resize' } as unknown as ViewStyle) : undefined;

/** Lightning bolt in an h×h box flush with the card's right edge; it bleeds past top, right and bottom. */
function boltPath(width: number, h: number) {
  const p = (u: number, v: number) => `${(width - h + u * h).toFixed(2)} ${(v * h).toFixed(2)}`;
  return `M${p(0.83, -0.03)}L${p(0.935, -0.03)}L${p(0.8016, 0.38)}Q${p(0.79, 0.415)} ${p(0.83, 0.415)}`
    + `L${p(1.12, 0.415)}L${p(1.12, 0.459)}L${p(0.666, 1.03)}L${p(0.56, 1.03)}L${p(0.6888, 0.6482)}`
    + `Q${p(0.7, 0.615)} ${p(0.66, 0.615)}L${p(0.44, 0.615)}Q${p(0.35, 0.615)} ${p(0.405, 0.53)}Z`;
}

/** The wave flattens at both ends so an empty or full bolt shows no sliver. */
function waveAmplitude(level: number) {
  'worklet';
  return WAVE_AMPLITUDE * Math.min(1, level * 0.08, (100 - level) * 0.08);
}

/** Liquid surface at `level` %: a gentle sine across the bolt that travels as `phase` runs 0 → 2π. */
function surfacePath(width: number, h: number, level: number, phase: number) {
  'worklet';
  const x0 = width - h * LIQUID_REACH;
  const w = width + 2 - x0;
  const k = (2 * TAU) / w; // two wavelengths across the bolt
  const s = h * (1 - level / 100);
  const a = waveAmplitude(level);
  let d = '';
  for (let i = 0; i <= WAVE_SEGMENTS; i++) {
    const x = x0 + (w * i) / WAVE_SEGMENTS;
    const t = k * (x - x0);
    // A smaller, faster harmonic keeps the travelling sine from looking mechanical.
    const y = s + a * (Math.sin(t - phase) + WAVE_HARMONIC * Math.sin(1.5 * t - 2 * phase));
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(2)}`;
  }
  return d;
}

/** Closes a surface line into a fill that runs past the bolt's bottom edge. */
function liquidPath(surface: string, width: number, h: number) {
  'worklet';
  return `${surface}L${width + 2} ${h + 4}L${width - h * LIQUID_REACH} ${h + 4}Z`;
}

/** Accent glow tied to the level: nothing when empty, strong when full. */
function glowAt(level: number) {
  'worklet';
  return {
    radius: interpolate(level, [0, 100], [0, GLOW_RADIUS], Extrapolation.CLAMP),
    opacity: interpolate(level, [0, 100], [0, GLOW_OPACITY], Extrapolation.CLAMP),
  };
}

/** Bolt glow. The SVG view is transparent, so an iOS layer shadow follows the liquid's pixels. */
function useBoltGlow(level: SharedValue<number>) {
  return useAnimatedStyle(() => {
    const { radius, opacity } = glowAt(level.value);
    return IOS_SHADOW
      ? { shadowRadius: radius, shadowOpacity: opacity }
      : { opacity, filter: `blur(${radius.toFixed(1)}px)` };
  });
}

/**
 * Number glow. A layer shadow on iOS Text takes the shape of its opaque inner text view — a hard-edged box —
 * so iOS draws a per-glyph text shadow instead.
 */
function useTextGlow(level: SharedValue<number>) {
  return useAnimatedStyle(() => {
    const { radius, opacity } = glowAt(level.value);
    return IOS_SHADOW
      ? { textShadowColor: `rgba(${ACCENT_RGB}, ${opacity.toFixed(3)})`, textShadowRadius: radius, textShadowOffset: { width: 0, height: 0 } }
      : { opacity, filter: `blur(${radius.toFixed(1)}px)` };
  });
}

/**
 * Glass bolt with accent liquid clipped inside. The glow underneath is a flat copy of the liquid at the
 * wave's trough, so the liquid always covers it and it only re-renders when the level moves, not per wave frame.
 */
const LiquidBolt = memo(function LiquidBolt({ width, h, level, phase }: {
  width: number;
  h: number;
  level: SharedValue<number>;
  phase: SharedValue<number>;
}) {
  const bolt = boltPath(width, h);
  const glowStyle = useBoltGlow(level);
  const glowProps = useAnimatedProps(() => {
    const y = h * (1 - level.value / 100) + (1 + WAVE_HARMONIC) * waveAmplitude(level.value);
    return { d: liquidPath(`M${width - h * LIQUID_REACH} ${y}L${width + 2} ${y}`, width, h) };
  });
  const liquidProps = useAnimatedProps(() => ({
    d: liquidPath(surfacePath(width, h, level.value, phase.value), width, h),
    // The highlight rides the surface; an empty or full bolt has none.
    strokeOpacity: level.value > 0 && level.value < 100 ? 0.75 : 0,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, IOS_SHADOW && styles.glowShadow, glowStyle]}>
        <Svg width={width} height={h}>
          <Defs>
            <ClipPath id="energyGlowClip"><Path d={bolt} /></ClipPath>
          </Defs>
          <AnimatedPath animatedProps={glowProps} fill={ACCENT} clipPath="url(#energyGlowClip)" />
        </Svg>
      </Animated.View>
      <Svg width={width} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <ClipPath id="energyBolt"><Path d={bolt} /></ClipPath>
          <LinearGradient id="energyEmpty" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F4EFE9" stopOpacity={0.2} />
            <Stop offset="1" stopColor="#F4EFE9" stopOpacity={0.07} />
          </LinearGradient>
        </Defs>
        <Path d={bolt} fill="url(#energyEmpty)" />
        <AnimatedPath animatedProps={liquidProps} fill={ACCENT} stroke="rgb(255,196,160)" strokeWidth={1.2} clipPath="url(#energyBolt)" />
      </Svg>
    </View>
  );
});

/**
 * "Wie fühlst du dich?" check-in: a bolt that fills like liquid; drag it vertically to set 0-100 %.
 * Inside a scroll view, pass its ref and turn scrolling off while `onDraggingChange(true)`, so the drag never scrolls the page.
 */
export function EnergyCard({ value, onChange, scrollRef, onDraggingChange }: {
  value: number;
  onChange: (n: number) => void;
  scrollRef?: RefObject<ScrollView | null>;
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? value;
  // Fill level in %, read on the UI thread by the wave and both glows.
  const level = useSharedValue(value);
  const phase = useSharedValue(0);
  const textGlow = useTextGlow(level);
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();

  const { width, height: h } = size;

  useEffect(() => {
    // A drag writes the level directly; anything else (VoiceOver steps, a parent reset) eases the liquid there.
    if (draft === null) level.set(withTiming(value, { duration: 320, easing: Easing.out(Easing.cubic) }));
  }, [draft, level, value]);

  useEffect(() => {
    // The surface drifts only while Home is on screen, and resumes where it stopped.
    if (!focused || reducedMotion) return;
    const from = phase.get() % TAU;
    phase.set(from);
    phase.set(withRepeat(withTiming(from + TAU, { duration: WAVE_PERIOD_MS, easing: Easing.linear }), -1));
    return () => cancelAnimation(phase);
  }, [focused, phase, reducedMotion]);

  const beginDrag = (next: number) => {
    setDraft(next);
    onDraggingChange?.(true);
  };
  const commit = (next: number) => {
    if (next !== value) onChange(next);
    setDraft(null);
    onDraggingChange?.(false);
  };
  // The drag area spans the card's full height, so y maps straight onto the level.
  const levelAt = (y: number) => {
    'worklet';
    return Math.round(clamp(1 - y / Math.max(1, h), 0, 1) * 100);
  };
  // Owns the touch from the first contact (a tap sets the level too) and makes the scroll view wait until it ends.
  const drag = Gesture.Pan()
    .minDistance(0)
    .maxPointers(1)
    .blocksExternalGesture(...(scrollRef ? [scrollRef] : []))
    .onBegin((event) => {
      const next = levelAt(event.y);
      level.set(next);
      scheduleOnRN(beginDrag, next);
    })
    .onUpdate((event) => {
      const next = levelAt(event.y);
      if (next === level.value) return;
      level.set(next);
      scheduleOnRN(setDraft, next);
    })
    .onFinalize(() => {
      scheduleOnRN(commit, level.value);
    });

  const number = (
    <>
      {shown}
      <Text style={styles.percent}>%</Text>
    </>
  );

  return (
    <GlassSurface radius={26} style={{ height: CARD_HEIGHT }}>
      <View style={styles.fill} onLayout={(event) => setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
        {width > 0 && <LiquidBolt width={width} h={h} level={level} phase={phase} />}

        <View pointerEvents="none" style={[styles.text, { marginRight: h * BOLT_REACH + 8 }]}>
          <View>
            <View>
              {/* Glow copy under the number: a text shadow on iOS, a blurred duplicate elsewhere. */}
              <Animated.Text aria-hidden style={[styles.value, styles.glowCopy, textGlow]}>{number}</Animated.Text>
              <Text style={styles.value}>{number}</Text>
            </View>
            <Text style={styles.label}>Energie heute</Text>
          </View>
          <View>
            <Text style={styles.question}>Wie fühlst du dich?</Text>
            <Text style={styles.hint}>Blitz hoch- oder runterziehen</Text>
          </View>
        </View>

        <GestureDetector gesture={drag} touchAction="none">
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Energie heute"
            accessibilityValue={{ min: 0, max: 100, now: shown, text: `${shown} Prozent` }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={({ nativeEvent }) => {
              if (nativeEvent.actionName === 'increment') onChange(Math.min(100, value + A11Y_STEP));
              else if (nativeEvent.actionName === 'decrement') onChange(Math.max(0, value - A11Y_STEP));
            }}
            style={[styles.drag, { width: h * BOLT_REACH + 8 }, webDrag]}
          />
        </GestureDetector>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  text: { flex: 1, justifyContent: 'space-between', paddingLeft: 20, paddingTop: 16, paddingBottom: 18 },
  value: { fontFamily: BerkkFonts.black, color: ACCENT, fontSize: 50, lineHeight: 54, letterSpacing: -2.2, fontVariant: ['tabular-nums'] },
  percent: { fontSize: 30, letterSpacing: -1 },
  glowShadow: { shadowColor: ACCENT, shadowOffset: { width: 0, height: 0 } },
  // The padding gives the glow room inside the copy's own bounds; the negative offset cancels it out.
  glowCopy: { position: 'absolute', top: -GLOW_PAD, left: -GLOW_PAD, padding: GLOW_PAD },
  label: { fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 14, marginTop: 2 },
  question: { fontFamily: BerkkFonts.semibold, color: Berkk.ink, fontSize: 16.5, letterSpacing: -0.15 },
  hint: { fontFamily: BerkkFonts.regular, color: Berkk.inkMuted, fontSize: 13, marginTop: 3 },
  drag: { position: 'absolute', top: 0, right: 0, bottom: 0 },
});
