import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Berkk, BerkkFonts } from '@/constants/theme';
import { exerciseIllustration } from '@/data/exercise-illustrations';
import type { Exercise } from '@/data/exercises';

export const EXERCISE_ROW_MOTION = { pressMs: 100, pressedScale: 0.985 } as const;

/** A fixed image and action column; names grow vertically inside the middle. */
export const ExerciseResultRow = memo(function ExerciseResultRow({ exercise, present, feedback, reduced, compact, onSelect, detail }: {
  exercise: Exercise; present: boolean; feedback?: 'added' | 'opened'; reduced: boolean; compact: boolean; onSelect: (exercise: Exercise) => void;
  /** Optional extra line, e.g. "Letztes Mal: 3 × 80 kg × 8". */
  detail?: string;
}) {
  const illustration = exerciseIllustration(exercise);
  const pressure = useSharedValue(0);
  const motion = useAnimatedStyle(() => ({
    opacity: 1 - pressure.value * 0.12,
    transform: [{ scale: reduced ? 1 : 1 - pressure.value * (1 - EXERCISE_ROW_MOTION.pressedScale) }],
  }));
  useEffect(() => () => cancelAnimation(pressure), [pressure]);
  const press = (value: number) => pressure.set(withTiming(value, {
    duration: EXERCISE_ROW_MOTION.pressMs, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System,
  }));
  return <Pressable accessibilityRole="button"
    accessibilityLabel={`${exercise.name}${detail ? `, ${detail}` : ''}${present ? ', bereits im Training, öffnen' : ', hinzufügen'}`}
    onPress={() => onSelect(exercise)} onPressIn={() => press(1)} onPressOut={() => press(0)}>
    <Animated.View testID={`exercise-row-${exercise.id}`} style={[styles.row, compact && styles.compactRow, motion]}>
      <View style={[styles.imageTile, compact && styles.compactTile]} pointerEvents="none">
        {illustration
          ? <Image testID={`exercise-image-${exercise.id}`} source={illustration.source} contentFit="contain" transition={0}
              recyclingKey={exercise.id} accessible={false} style={[styles.image, compact && styles.compactImage]} />
          : <Text style={styles.missing}>{exercise.custom ? 'Eigene\nÜbung' : 'Ohne\nBild'}</Text>}
      </View>
      <View style={styles.words}>
        <Text android_hyphenationFrequency="normal" lineBreakStrategyIOS="standard" style={[styles.name, compact && styles.compactName]}>{exercise.name}</Text>
        <Text style={[styles.category, feedback && styles.feedback]} accessibilityLiveRegion={feedback ? 'polite' : 'none'}>
          {feedback ? (feedback === 'opened' ? 'Geöffnet' : 'Hinzugefügt') : `${exercise.muscle} · ${exercise.equipment}${exercise.custom ? ' · Eigene' : ''}`}
        </Text>
        {detail && !feedback && <Text style={styles.detail}>{detail}</Text>}
      </View>
      <View pointerEvents="none" style={[styles.action, compact && styles.compactAction, feedback && styles.actionDone]}>
        <Ionicons accessible={false} name={feedback ? 'checkmark' : present ? 'arrow-forward' : 'add'} size={23} color={Berkk.linkPressed} />
      </View>
    </Animated.View>
  </Pressable>;
});

const styles = StyleSheet.create({
  row: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Berkk.divider },
  compactRow: { gap: 8 },
  imageTile: { flexShrink: 0, width: 72, height: 76, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(244,239,233,0.025)' },
  image: { width: 72, height: 76 },
  compactTile: { width: 64, height: 68 },
  compactImage: { width: 64, height: 68 },
  missing: { color: Berkk.inkMuted, fontSize: 11, lineHeight: 16, fontFamily: BerkkFonts.regular, textAlign: 'center' },
  words: { flex: 1, minWidth: 0 },
  name: { color: Berkk.ink, fontFamily: BerkkFonts.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  compactName: { fontSize: 15, lineHeight: 21 },
  category: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 12, lineHeight: 17, marginTop: 5 },
  feedback: { color: Berkk.linkPressed },
  detail: { color: Berkk.link, fontFamily: BerkkFonts.medium, fontSize: 12, lineHeight: 17, marginTop: 3, fontVariant: ['tabular-nums'] },
  action: { flexShrink: 0, width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(241,90,34,0.08)' },
  compactAction: { width: 44 },
  actionDone: { backgroundColor: 'rgba(241,90,34,0.2)' },
});
