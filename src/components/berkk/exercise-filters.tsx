import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Berkk, BerkkFonts } from '@/constants/theme';

export const EXERCISE_FILTER_MOTION = { changeMs: 140 } as const;

export function ExerciseFilterButton({ title, value, open, onPress, reduced }: {
  title: string; value?: string; open: boolean; onPress: () => void; reduced: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${value ?? 'Alle'}`}
    accessibilityState={{ expanded: open }} onPress={onPress} style={styles.buttonTarget}>
    <View style={[styles.button, !!value && styles.active, open && styles.open]}>
      <View style={styles.buttonWords}>
        <Text style={styles.caption}>{title}</Text>
        <Animated.View key={value ?? 'all'} entering={reduced ? undefined : FadeIn.duration(EXERCISE_FILTER_MOTION.changeMs)}>
          <Text style={styles.value}>{value ?? 'Alle'}</Text>
        </Animated.View>
      </View>
      <Ionicons accessible={false} name={open ? 'chevron-up' : 'chevron-down'} size={16} color={value ? Berkk.linkPressed : Berkk.inkSecondary} />
    </View>
  </Pressable>;
}

export function ExerciseFilterOptions<T extends string>({ title, values, value, onChange, onClose, reduced }: {
  title: string; values: readonly T[]; value?: T; onChange: (value?: T) => void; onClose: () => void; reduced: boolean;
}) {
  return <Animated.View testID="exercise-filter-options" entering={reduced ? undefined : FadeIn.duration(EXERCISE_FILTER_MOTION.changeMs)} style={styles.panel}>
    <View style={styles.panelHeading}>
      <Text accessibilityRole="header" style={styles.panelTitle}>{title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Filterauswahl schließen" onPress={onClose} style={styles.close}>
        <Ionicons accessible={false} name="close" size={20} color={Berkk.ink} />
      </Pressable>
    </View>
    <ScrollView style={styles.options} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
      <View style={styles.wrap}>
        {[undefined, ...values].map((choice) => <Pressable key={choice ?? 'all'} accessibilityRole="radio"
          accessibilityLabel={choice ?? 'Alle'} accessibilityState={{ checked: value === choice }} onPress={() => onChange(choice)}
          style={[styles.choice, value === choice && styles.chosen]}>
          <Text style={[styles.choiceText, value === choice && styles.chosenText]}>{choice ?? 'Alle'}</Text>
          {value === choice && <Ionicons accessible={false} name="checkmark" size={17} color={Berkk.linkPressed} />}
        </Pressable>)}
      </View>
    </ScrollView>
  </Animated.View>;
}

const styles = StyleSheet.create({
  buttonTarget: { flex: 1, minWidth: 0 },
  button: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: Berkk.glassBorder, backgroundColor: Berkk.glassGradient[2] },
  active: { borderColor: 'rgba(241,90,34,0.5)', backgroundColor: 'rgba(241,90,34,0.1)' },
  open: { borderColor: Berkk.inkSecondary },
  buttonWords: { flex: 1, minWidth: 0 },
  caption: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 11, lineHeight: 15 },
  value: { color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 13, lineHeight: 18, marginTop: 2 },
  panel: { marginTop: 10, paddingHorizontal: 10, paddingBottom: 10, borderRadius: 14, backgroundColor: Berkk.detailGradient[2], borderWidth: 1, borderColor: Berkk.glassBorder },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { color: Berkk.ink, fontFamily: BerkkFonts.semibold, fontSize: 14 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  options: { maxHeight: 150 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choice: { width: '48%', minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4, padding: 10, borderRadius: 10, backgroundColor: Berkk.glassGradient[2] },
  chosen: { backgroundColor: 'rgba(241,90,34,0.13)' },
  choiceText: { flex: 1, color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 12, lineHeight: 17 },
  chosenText: { color: Berkk.linkPressed },
});
