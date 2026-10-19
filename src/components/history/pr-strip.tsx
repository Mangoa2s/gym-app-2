import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tokens as T } from '@/constants/theme';
import { formatNumber, type PR } from '@/lib/history';

/** "Neuer PR · Bankdrücken 82,5 kg × 6". Only rendered when a real PR exists. */
export const PRStrip = memo(function PRStrip({ prs }: { prs: PR[] }) {
  if (!prs.length) return null;
  const [first] = prs;
  const text = `${first.exerciseName} ${formatNumber(first.weightKg)} kg${first.reps ? ` × ${first.reps}` : ''}`;
  const more = prs.length > 1 ? ` · +${prs.length - 1} weitere` : '';
  return <View accessible accessibilityLabel={`Neuer persönlicher Rekord: ${text}${more ? `, und ${prs.length - 1} weitere` : ''}`} style={styles.strip}>
    <Ionicons accessible={false} name="trophy" size={14} color={T.color.accentLight} />
    <Text numberOfLines={2} style={styles.text}><Text style={styles.strong}>Neuer PR</Text> · {text}{more}</Text>
  </View>;
});

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', gap: T.space.s, paddingVertical: T.space.s, paddingHorizontal: T.space.m, borderRadius: T.radius.tile, borderWidth: T.border, borderColor: T.color.accentBorder, backgroundColor: T.color.accentWash },
  text: { flex: 1, fontFamily: T.font.body, fontSize: 13, lineHeight: 18, color: T.color.accentLight },
  strong: { fontFamily: T.font.title },
});
