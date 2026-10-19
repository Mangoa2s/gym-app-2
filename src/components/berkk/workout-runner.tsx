import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Berkk } from '@/constants/theme';

// One continuous stride, two opposing sides. Only joint transforms change per frame;
// the coarse contours and their translucent edges are static vector geometry.
const STRIDE_MS = 1600;
const REST_PHASE = 0.8;
const TAU = Math.PI * 2;
const contours = {
  thigh: 'M25 0H44V8H47V29H43V49H27V40H23V15H25Z',
  shin: 'M27 0H42V13H40V34H37V49H26V34H24V12H27Z',
  upperArm: 'M28 0H42V9H45V26H41V37H28V29H25V10H28Z',
  forearm: 'M28 0H40V12H38V28H42V37H28V31H25V15H28Z',
  foot: 'M26 0H38V5H49V9H55V16H25V12H22V5H26Z',
};

function Block({ shape, color, height }: { shape: keyof typeof contours; color: string; height: number }) {
  return <Svg width={70} height={height} viewBox={`0 0 70 ${height}`}>
    <Path d={contours[shape]} fill={color} opacity={0.12} transform="translate(-3 1)" />
    <Path d={contours[shape]} fill={color} opacity={0.15} transform="translate(3 2)" />
    <Path d={contours[shape]} fill={color} />
    <Path d="M28 10H33V17H28ZM35 25H40V30H35Z" fill={Berkk.backgroundGradient[2]} opacity={0.16} />
  </Svg>;
}

function Leg({ phase, offset, rear = false }: { phase: SharedValue<number>; offset: number; rear?: boolean }) {
  const color = rear ? '#8E8885' : Berkk.ink;
  const thigh = useAnimatedStyle(() => ({ transform: [{ rotate: `${-8 - 43 * Math.sin(phase.value + offset)}deg` }] }));
  const shin = useAnimatedStyle(() => ({ transform: [{ rotate: `${58 - 48 * Math.sin(phase.value + offset - 0.65)}deg` }] }));
  const foot = useAnimatedStyle(() => ({ transform: [{ rotate: `${-34 + 28 * Math.sin(phase.value + offset)}deg` }] }));
  return <Animated.View style={[styles.joint, styles.hip, thigh]}>
    <Block shape="thigh" color={color} height={52} />
    <Animated.View style={[styles.joint, { top: 43 }, shin]}>
      <Block shape="shin" color={color} height={52} />
      <Animated.View style={[styles.joint, { top: 44 }, foot]}><Block shape="foot" color={color} height={18} /></Animated.View>
    </Animated.View>
  </Animated.View>;
}

function Arm({ phase, offset, rear = false }: { phase: SharedValue<number>; offset: number; rear?: boolean }) {
  const color = rear ? '#8E8885' : '#D8D2CC';
  const upper = useAnimatedStyle(() => ({ transform: [{ rotate: `${12 + 40 * Math.sin(phase.value + offset)}deg` }] }));
  const lower = useAnimatedStyle(() => ({ transform: [{ rotate: `${-85 - 13 * Math.cos(phase.value + offset)}deg` }] }));
  return <Animated.View style={[styles.joint, styles.shoulder, upper]}>
    <Block shape="upperArm" color={color} height={40} />
    <Animated.View style={[styles.joint, { top: 31 }, lower]}><Block shape="forearm" color={color} height={40} /></Animated.View>
  </Animated.View>;
}

export const WorkoutRunner = memo(function WorkoutRunner({ size, active, reduced }: { size: number; active: boolean; reduced: boolean }) {
  const phase = useSharedValue(REST_PHASE);
  useEffect(() => {
    cancelAnimation(phase);
    if (reduced) phase.value = REST_PHASE;
    else if (active) {
      // Keep position AND velocity continuous when the loop wraps or resumes.
      phase.value %= TAU;
      phase.value = withRepeat(withTiming(phase.value + TAU, { duration: STRIDE_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never }), -1, false);
    }
    return () => cancelAnimation(phase);
  }, [active, reduced, phase]);
  const body = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * Math.cos(phase.value * 2) }] }));
  return <View testID="workout-runner" pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    <View style={[styles.canvas, { transform: [{ scale: size / 240 }] }]}>
      <Animated.View style={[styles.canvas, body]}>
        <Arm phase={phase} offset={Math.PI} rear />
        <Leg phase={phase} offset={Math.PI} rear />
        <Svg width={240} height={240} style={StyleSheet.absoluteFill} viewBox="0 0 240 240">
          <Path d="M119 69H143V78H148V94H141V112H135V134H110V123H107V109H111V88H115V76H119Z" fill={Berkk.ink} opacity={0.12} transform="translate(-3 2)" />
          <Path d="M119 69H140V77H144V96H138V114H132V134H111V124H108V110H112V88H116V77H119Z" fill="#C3BCB5" />
          <Path d="M129 30H148V34H154V53H150V61H139V72H125V61H121V42H125V34H129Z" fill={Berkk.ink} />
          <Path d="M125 37H132V47H125ZM143 53H150V59H143ZM116 88H122V99H116ZM126 116H132V127H126Z" fill="#A9A19A" opacity={0.45} />
          <Path d="M112 126H130V132H111Z" fill="#8E8885" />
        </Svg>
        <Leg phase={phase} offset={0} />
        <Arm phase={phase} offset={0} />
      </Animated.View>
    </View>
  </View>;
});

const styles = StyleSheet.create({
  canvas: { position: 'absolute', width: 240, height: 240, transformOrigin: [0, 0, 0] },
  joint: { position: 'absolute', width: 70, height: 70, transformOrigin: [35, 0, 0] },
  hip: { left: 85, top: 126 },
  shoulder: { left: 96, top: 78 },
});
