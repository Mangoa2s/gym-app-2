import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Tokens as T } from '@/constants/theme';
import { FILTERS, type SplitFilter } from '@/lib/history';

/** Single choice: Alle, Push, Pull, Beine. Each chip is a full 44-pt touch target. */
export const FilterChips = memo(function FilterChips({ value, onChange }: { value: SplitFilter; onChange: (value: SplitFilter) => void }) {
  return <View accessibilityRole="radiogroup" accessibilityLabel="Trainings filtern" style={styles.row}>
    {FILTERS.map((filter) => {
      const selected = filter.key === value;
      // Static style arrays only: NativeWind's native interop drops Pressable style callbacks.
      return <Pressable key={filter.key} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={filter.label} onPress={() => onChange(filter.key)} style={[styles.chip, selected && styles.selected]}>
        <Text style={[styles.label, selected && styles.selectedLabel]}>{filter.label}</Text>
      </Pressable>;
    })}
  </View>;
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: T.space.s, flexWrap: 'wrap' },
  chip: { minHeight: T.touch, minWidth: 64, paddingHorizontal: T.space.l, borderRadius: T.radius.chip, borderWidth: T.border, borderColor: T.color.cardBorder, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: T.color.accent, borderColor: T.color.accent },
  label: { fontFamily: T.font.label, fontSize: 14, color: T.color.ink },
  selectedLabel: { color: T.color.onAccent },
});
