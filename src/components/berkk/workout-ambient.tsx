import { memo, useId } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { WorkoutFocus as F } from '@/constants/workout-motion';
import { useWorkoutOrbit } from '@/hooks/use-workout-drift';
import { useWorkoutMotion } from './workout-motion-provider';
import { WorkoutLight } from './workout-light';

/** Constant-speed rounded perimeter, including soft turns at all four corners. */
function edgePoint(phase: number, width: number, height: number) {
  'worklet';
  const r = Math.min(F.edge.cornerRadius, width / 2, height / 2);
  const horizontal = width - 2 * r;
  const vertical = height - 2 * r;
  const arc = Math.PI * r / 2;
  let distance = ((phase % 1 + 1) % 1) * (2 * horizontal + 2 * vertical + 4 * arc);
  if (distance <= horizontal) return { x: r + distance, y: 0 };
  distance -= horizontal;
  if (distance <= arc) { const a = distance / r; return { x: width - r + r * Math.sin(a), y: r - r * Math.cos(a) }; }
  distance -= arc;
  if (distance <= vertical) return { x: width, y: r + distance };
  distance -= vertical;
  if (distance <= arc) { const a = distance / r; return { x: width - r + r * Math.cos(a), y: height - r + r * Math.sin(a) }; }
  distance -= arc;
  if (distance <= horizontal) return { x: width - r - distance, y: height };
  distance -= horizontal;
  if (distance <= arc) { const a = distance / r; return { x: r - r * Math.sin(a), y: height - r + r * Math.cos(a) }; }
  distance -= arc;
  if (distance <= vertical) return { x: 0, y: height - r - distance };
  distance -= vertical;
  const a = distance / r;
  return { x: r - r * Math.cos(a), y: r - r * Math.sin(a) };
}

/** Static SVG glows; only their containing views move, behind all content. */
export const WorkoutAmbient = memo(function WorkoutAmbient({ reduced }: { reduced: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const { width, height } = useWindowDimensions();
  return <View testID="workout-background" pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, styles.clip]}>
    <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="none">
      <Defs><RadialGradient id={`base-${id}`}>
        <Stop offset="0" stopColor={F.edge.warmColor} stopOpacity={F.edge.baseStrength} />
        <Stop offset="0.4" stopColor={F.edge.warmShade} stopOpacity={F.edge.baseStrength} />
        <Stop offset="1" stopColor={F.edge.warmShade} stopOpacity={0} />
      </RadialGradient></Defs>
      <Ellipse cx="-38" cy="390" rx="166" ry="620" fill={`url(#base-${id})`} />
      <Ellipse cx="438" cy="540" rx="166" ry="620" fill={`url(#base-${id})`} />
      <Ellipse cx="145" cy="-62" rx="340" ry="240" fill={`url(#base-${id})`} />
      <Ellipse cx="260" cy="940" rx="340" ry="210" fill={`url(#base-${id})`} />
    </Svg>
    <EdgeZone name="warm" width={width} height={height} reduced={reduced} circuitMs={F.edge.circuitMs} initialPhase={0.08} launch />
    <EdgeZone name="ember" width={width} height={height} reduced={reduced} circuitMs={F.edge.secondCircuitMs} initialPhase={0.43} />
    <EdgeZone name="red" width={width} height={height} reduced={reduced} circuitMs={F.edge.thirdCircuitMs} initialPhase={0.82} />
    <View style={[styles.violet, { width: width * 0.9 }]}><WorkoutLight color={F.edge.violetColor} shade={F.edge.violetShade} strength={F.edge.violetStrength} /></View>
    {/* Fixed optical mask keeps the working center dark as lights pass the edges. */}
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="none">
      <Defs><RadialGradient id={`shade-${id}`}><Stop offset="0" stopColor="#09080B" stopOpacity={0.98} /><Stop offset="0.55" stopColor="#09080B" stopOpacity={0.92} /><Stop offset="1" stopColor="#09080B" stopOpacity={0} /></RadialGradient></Defs>
      <Ellipse cx="200" cy="430" rx="205" ry="490" fill={`url(#shade-${id})`} />
    </Svg>
  </View>;
});

const EdgeZone = memo(function EdgeZone({ name, width, height, reduced, circuitMs, initialPhase, launch = false }: {
  name: string; width: number; height: number; reduced: boolean; circuitMs: number; initialPhase: number; launch?: boolean;
}) {
  const phase = useWorkoutOrbit(circuitMs, reduced, initialPhase);
  const { clock } = useWorkoutMotion();
  const size = Math.min(width * 1.08, 440);
  const motion = useAnimatedStyle(() => {
    const entrance = reduced ? 1 : interpolate(clock.value, [0, F.intro.settleAt], [0, 1], Extrapolation.CLAMP);
    // A single stronger circuit on launch, then three unrelated slow periods.
    const p = edgePoint(phase.value + (launch ? entrance : 0), width + F.edge.outset * 2, height + F.edge.outset * 2);
    const breathing = (Math.sin(phase.value * Math.PI * 2) + 1) / 2;
    return { opacity: 0.72 + breathing * 0.28, transform: [{ translateX: p.x - F.edge.outset - size / 2 }, { translateY: p.y - F.edge.outset - size / 2 }, { scale: launch ? 1 + (1 - entrance) * 0.35 : 1 }] };
  });
  return <Animated.View testID={`workout-edge-${name}`} pointerEvents="none" shouldRasterizeIOS renderToHardwareTextureAndroid style={[styles.glow, { width: size, height: size }, motion]}>
    <WorkoutLight color={F.edge.warmColor} shade={F.edge.warmShade} strength={F.edge.warmStrength} />
  </Animated.View>;
});

const styles = StyleSheet.create({ clip: { overflow: 'hidden' }, glow: { position: 'absolute', top: 0, left: 0 }, violet: { position: 'absolute', left: -35, top: '25%', height: 400 } });
