import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tokens as T } from '@/constants/theme';
import type { MuscleGroup } from '@/data/exercises';

/**
 * Share of sets per muscle group. The top three get their own colour; the rest
 * is one muted segment. The legend names the top three with set counts, so
 * colour is never the only signal.
 */
export const MuscleBar = memo(function MuscleBar({ muscles }: { muscles: { name: MuscleGroup; sets: number }[] }) {
  const top = muscles.slice(0, 3);
  const rest = muscles.slice(3).reduce((sum, item) => sum + item.sets, 0);
  const segments = [...top.map((item, index) => ({ key: item.name, sets: item.sets, color: T.color.muscle[index] })), ...(rest ? [{ key: 'rest', sets: rest, color: T.color.muscle[3] }] : [])];
  const label = `Muskelgruppen nach Sätzen: ${muscles.map((item) => `${item.name} ${item.sets}`).join(', ')}`;
  return <View accessible accessibilityLabel={label} style={styles.wrap}>
    <View style={styles.bar}>{segments.map((segment) => <View key={segment.key} style={{ flex: segment.sets, backgroundColor: segment.color }} />)}</View>
    <View style={styles.legend}>
      {top.map((item, index) => <View key={item.name} style={styles.entry}>
        <View style={[styles.swatch, { backgroundColor: T.color.muscle[index] }]} />
        <Text numberOfLines={1} style={styles.text}>{item.name} <Text style={styles.count}>{item.sets}</Text></Text>
      </View>)}
      {rest > 0 && <Text style={styles.more}>+{muscles.length - 3}</Text>}
    </View>
  </View>;
});

const styles = StyleSheet.create({
  wrap: { gap: T.space.s },
  bar: { flexDirection: 'row', height: 8, gap: T.space.xxs, borderRadius: T.radius.bar, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: T.space.m, rowGap: T.space.xs },
  entry: { flexDirection: 'row', alignItems: 'center', gap: T.space.xs, flexShrink: 1 },
  swatch: { width: 8, height: 8, borderRadius: T.radius.circle },
  text: { fontFamily: T.font.body, fontSize: 12, lineHeight: 16, color: T.color.inkSoft, flexShrink: 1 },
  count: { color: T.color.inkMuted, fontVariant: ['tabular-nums'] },
  more: { fontFamily: T.font.body, fontSize: 12, color: T.color.inkMuted },
});
