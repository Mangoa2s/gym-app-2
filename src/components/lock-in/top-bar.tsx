import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { LockIn as L } from '@/constants/lock-in';
import { Tokens as T } from '@/constants/theme';
import { formatElapsed, useActiveElapsed } from '@/hooks/use-workout-timer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const BUTTON = 48;

/** Pause (left), "{Name} · mm:ss" (centre), hold-to-stop (right). */
export const TopBar = memo(function TopBar({ name, startedAt, pausedMs, pausedAt, onTogglePause, onStop, onOpenOverview }: {
  name: string; startedAt: number; pausedMs?: number; pausedAt?: number | null; onTogglePause: () => void; onStop: () => void;
  /** Back to the home overview; the workout keeps running. */
  onOpenOverview: () => void;
}) {
  const paused = !!pausedAt;
  return <View style={styles.bar}>
    <Pressable accessibilityRole="button" accessibilityLabel={paused ? 'Training fortsetzen' : 'Training pausieren'} onPress={onTogglePause} style={styles.round}>
      <Ionicons accessible={false} name={paused ? 'play' : 'pause'} size={20} color={T.color.ink} />
    </Pressable>
    <TimerPill name={name} startedAt={startedAt} pausedMs={pausedMs} pausedAt={pausedAt} onPress={onOpenOverview} />
    <StopHold onStop={onStop} />
  </View>;
});

/** Only this leaf re-renders every tick. Tapping it opens the overview without ending the workout. */
const TimerPill = memo(function TimerPill({ name, startedAt, pausedMs, pausedAt, onPress }: { name: string; startedAt: number; pausedMs?: number; pausedAt?: number | null; onPress: () => void }) {
  const label = formatElapsed(useActiveElapsed(startedAt, pausedMs, pausedAt) / 1000);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${name}, Trainingszeit ${label}${pausedAt ? ', pausiert' : ''}`} accessibilityHint="Zur Übersicht, das Training läuft weiter" onPress={onPress} style={[styles.pill, !!pausedAt && styles.pillPaused]}>
    <Text numberOfLines={1} style={styles.pillName}>{name}</Text>
    <Text style={styles.pillDot}>·</Text>
    <Text style={styles.pillTime}>{label}</Text>
    {pausedAt ? <Ionicons accessible={false} name="pause" size={12} color={T.color.accentLight} /> : <Ionicons accessible={false} name="chevron-down" size={12} color={T.color.inkMuted} />}
  </Pressable>;
});

/** Ends the workout only after a deliberate 1.2 s hold; releasing early drains the ring. */
function StopHold({ onStop }: { onStop: () => void }) {
  const progress = useSharedValue(0);
  const radius = BUTTON / 2 - 2;
  const length = 2 * Math.PI * radius;
  const ring = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.value) }));
  useEffect(() => () => cancelAnimation(progress), [progress]);
  const begin = () => {
    progress.set(withTiming(1, { duration: L.stopHoldMs * (1 - progress.get()), easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (finished) => {
      if (finished) { progress.set(0); scheduleOnRN(onStop); }
    }));
  };
  const release = () => { if (progress.get() < 1) progress.set(withTiming(0, { duration: 180, reduceMotion: ReduceMotion.Never })); };
  return <Pressable accessibilityRole="button" accessibilityLabel="Training beenden" accessibilityHint="Zum Beenden gedrückt halten"
    accessibilityActions={[{ name: 'activate', label: 'Training beenden' }]} onAccessibilityAction={(event) => { if (event.nativeEvent.actionName === 'activate') onStop(); }}
    onPressIn={begin} onPressOut={release} style={styles.round}>
    <Svg width={BUTTON} height={BUTTON} style={StyleSheet.absoluteFill} pointerEvents="none">
      <AnimatedCircle cx={BUTTON / 2} cy={BUTTON / 2} r={radius} stroke={T.color.accent} strokeWidth={3} fill="none" strokeLinecap="round" strokeDasharray={`${length} ${length}`} animatedProps={ring} transform={`rotate(-90 ${BUTTON / 2} ${BUTTON / 2})`} />
    </Svg>
    <Ionicons accessible={false} name="stop" size={18} color={T.color.ink} />
  </Pressable>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: T.space.m, paddingHorizontal: T.space.xl, minHeight: BUTTON },
  round: { width: BUTTON, height: BUTTON, borderRadius: T.radius.circle, backgroundColor: T.color.glass, borderWidth: T.border, borderColor: T.color.glassBorder, alignItems: 'center', justifyContent: 'center' },
  pill: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: T.space.s, minHeight: 40, paddingHorizontal: T.space.l, borderRadius: T.radius.pill, backgroundColor: T.color.glass, borderWidth: T.border, borderColor: T.color.glassBorder },
  pillPaused: { borderColor: T.color.accentBorder },
  pillName: { flexShrink: 1, fontFamily: T.font.label, fontSize: 14, color: T.color.ink },
  pillDot: { fontFamily: T.font.body, fontSize: 14, color: T.color.inkMuted },
  pillTime: { fontFamily: T.font.label, fontSize: 14, color: T.color.ink, fontVariant: ['tabular-nums'] },
});
