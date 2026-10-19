import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Extrapolation, FadeIn, interpolate, ReduceMotion, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { BerkkGhost } from './berkk-ghost';
import { DiaryAction } from './diary-action';
import type { GhostPulse } from './ghost-state';
import { FEELING_ORDER, previewIndex, resistedPosition, snapIndex } from './feeling-carousel-state';
import { useWorkoutMotion } from './workout-motion-provider';
import { DiaryMotion as M } from '@/constants/diary-motion';
import { Berkk, BerkkFonts } from '@/constants/theme';
import type { WorkoutFeeling } from '@/store/workout-state';

export const FEELINGS: Record<WorkoutFeeling, string> = { weak: 'Schwach', normal: 'Normal', strong: 'Stark' };

/** The BERKK ghost in its feeling pose: sunk and heavy-lidded, at rest, or tall and bright-eyed. Grey when nothing is chosen. */
export function FeelingGhost({ feeling, selected = false, prominent = false, size = 64, pulse = null }: { feeling: WorkoutFeeling; selected?: boolean; prominent?: boolean; size?: number; pulse?: GhostPulse | null }) {
  return <BerkkGhost size={size} mood={feeling} muted={!selected && !prominent} pulse={pulse} />;
}
export function FeelingPicker({ value, onChange }: { value?: WorkoutFeeling; onChange: (value?: WorkoutFeeling) => void }) {
  const { reduced } = useWorkoutMotion();
  const initial = value ? FEELING_ORDER.indexOf(value) : 1;
  const [preview, setPreview] = useState<number>(initial);
  const [width, setWidth] = useState(300);
  const step = Math.max(80, Math.min(118, width * 0.32));
  const position = useSharedValue(initial);
  const origin = useSharedValue(initial);
  const dragging = useSharedValue(false);
  const [confirmed, setConfirmed] = useState<{ index: number; pulse: GhostPulse } | null>(null);
  const confirmId = useRef(0);
  const previousValue = useRef(value);
  // Only crossing the middle updates React text; every animation frame stays on the UI thread.
  useAnimatedReaction(() => previewIndex(position.value), (next, previous) => {
    if (next !== previous) scheduleOnRN(setPreview, next);
  });
  const settle = useCallback((index: number) => {
    cancelAnimation(position);
    position.set(reduced ? index : withSpring(index, { ...M.snap, reduceMotion: ReduceMotion.System }));
  }, [position, reduced]);
  useEffect(() => {
    if (value !== previousValue.current && value !== undefined) settle(FEELING_ORDER.indexOf(value));
    previousValue.current = value;
  }, [settle, value]);
  useEffect(() => {
    if (reduced) { cancelAnimation(position); position.set(previewIndex(position.get())); }
  }, [position, reduced]);
  useEffect(() => () => cancelAnimation(position), [position]);
  const pan = useMemo(() => Gesture.Pan().maxPointers(1).activeOffsetX([-8, 8]).failOffsetY([-12, 12])
    .onStart(() => { cancelAnimation(position); origin.set(position.get()); dragging.set(true); })
    .onUpdate((event) => { position.set(resistedPosition(origin.get() - event.translationX / step)); })
    .onEnd((event) => {
      const target = snapIndex(position.value, event.velocityX, step);
      position.set(reduced ? target : withSpring(target, { ...M.snap, velocity: -event.velocityX / step, reduceMotion: ReduceMotion.System }));
    })
    .onFinalize((_event, success) => {
      if (dragging.get() && !success) { const target = previewIndex(position.value); position.set(reduced ? target : withSpring(target, { ...M.snap, reduceMotion: ReduceMotion.System })); }
      dragging.set(false);
    }), [dragging, origin, position, reduced, step]);
  const confirm = () => {
    const index = previewIndex(position.get());
    settle(index);
    // The chosen ghost answers in its own way: weak sighs, normal nods, strong hops.
    setConfirmed({ index, pulse: { reaction: 'confirm', id: ++confirmId.current } });
    // Swiping and tapping a side ghost never write the diary. Only this action confirms it.
    onChange(FEELING_ORDER[index]);
    AccessibilityInfo.announceForAccessibility(`${FEELINGS[FEELING_ORDER[index]]} ausgewählt`);
  };
  const current = FEELING_ORDER[preview];
  const selected = value === current;
  return <View style={styles.picker}>
    <Text style={styles.title}>Wie hat es sich angefühlt?</Text>
    <GestureDetector gesture={pan}><View testID="feeling-carousel" collapsable={false} style={styles.stage} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {FEELING_ORDER.map((feeling, index) => <GhostSlot key={feeling} feeling={feeling} index={index} width={width} step={step} position={position} pulse={confirmed?.index === index ? confirmed.pulse : null} selected={value === feeling} reduced={reduced} onPress={() => settle(index)} />)}
    </View></GestureDetector>
    <View style={styles.caption}>
      <Animated.Text key={current} entering={reduced ? undefined : FadeIn.duration(M.labelMs)} testID="feeling-preview" style={styles.name}>{FEELINGS[current]}</Animated.Text>
      <Text style={styles.hint}>{selected ? 'Ausgewählt' : 'Vorschau · Wischen oder antippen'}</Text>
    </View>
    <DiaryAction label={selected ? 'Ausgewählt' : 'Auswählen'} icon={selected ? 'checkmark' : 'add'} primary
      accessibilityLabel={`${FEELINGS[current]} auswählen`} onPress={confirm} testID="feeling-confirm" style={styles.select} />
    <View style={styles.status}>
      <Text style={[styles.hint, styles.flex]}>{value ? `Bestätigt: ${FEELINGS[value]}` : 'Optional · Noch keine Stimmung bestätigt.'}</Text>
      {value && <DiaryAction label="Entfernen" accessibilityLabel="Stimmung entfernen" onPress={() => onChange(undefined)} />}
    </View>
  </View>;
}
function GhostSlot({ feeling, index, width, step, position, pulse, selected, reduced, onPress }: {
  feeling: WorkoutFeeling; index: number; width: number; step: number; position: SharedValue<number>; pulse: GhostPulse | null; selected: boolean; reduced: boolean; onPress: () => void;
}) {
  const motion = useAnimatedStyle(() => {
    const distance = Math.abs(index - position.value);
    const scale = reduced ? M.reducedScale : interpolate(distance, [0, 1, 2], [1, M.sideScale, M.farScale], Extrapolation.CLAMP);
    return {
      opacity: reduced ? (distance < 0.5 ? 1 : M.sideOpacity) : interpolate(distance, [0, 1, 2], [1, M.sideOpacity, 0.16], Extrapolation.CLAMP),
      transform: [{ translateX: (index - position.value) * step }, { scale }],
    };
  });
  return <Animated.View testID={`feeling-ghost-${feeling}`} style={[styles.ghost, { left: (width - M.ghostSize) / 2 }, motion]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${FEELINGS[feeling]} ansehen`} onPress={onPress} style={styles.ghostTarget}>
      <FeelingGhost feeling={feeling} selected={selected} prominent size={M.ghostSize} pulse={pulse} />
    </Pressable>
  </Animated.View>;
}
const styles = StyleSheet.create({
  picker: { gap: 12 }, flex: { flex: 1 },
  title: { color: Berkk.ink, fontFamily: BerkkFonts.semibold, fontSize: 18 },
  stage: { height: 160, overflow: 'hidden' }, ghost: { position: 'absolute', top: 8, width: M.ghostSize, height: M.ghostSize },
  ghostTarget: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  caption: { alignItems: 'center', gap: 5, minHeight: 56 }, name: { color: Berkk.ink, fontFamily: BerkkFonts.bold, fontSize: 24, lineHeight: 30 },
  hint: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 12, lineHeight: 18 },
  select: { alignSelf: 'center', minWidth: 168 }, status: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
