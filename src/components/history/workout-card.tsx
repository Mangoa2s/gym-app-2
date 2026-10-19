import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Tokens as T } from '@/constants/theme';
import { formatTons, formatWorkoutDate, type WorkoutSummary } from '@/lib/history';
import { MuscleBar } from './muscle-bar';
import { PRStrip } from './pr-strip';

/** One past workout; the whole card opens the detail screen. */
export const WorkoutCard = memo(function WorkoutCard({ summary, today, onOpen }: { summary: WorkoutSummary; today: string; onOpen: (id: number) => void }) {
  const [pressed, setPressed] = useState(false);
  const date = formatWorkoutDate(summary.workout, today);
  const empty = summary.sets === 0;
  const label = `${summary.title}, ${date}. ${empty ? 'Keine Sätze geloggt' : `${summary.minutes} Minuten, ${formatTons(summary.volumeKg)} Tonnen, ${summary.sets} Sätze, ${summary.xp} XP`}${summary.prs.length ? ', neuer PR' : ''}. Details öffnen`;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => onOpen(summary.workout.id)} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={[styles.card, pressed && styles.pressed]}>
    <View style={styles.top}>
      <View style={styles.titles}>
        <Text numberOfLines={1} style={styles.title}>{summary.title}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      {summary.xp > 0 && <View style={styles.pill}><Text style={styles.pillText}>+{summary.xp} XP</Text></View>}
      <Ionicons accessible={false} name="chevron-forward" size={18} color={T.color.inkMuted} />
    </View>
    {empty ? <Text style={styles.empty}>Keine Sätze geloggt</Text> : <>
      <View style={styles.stats}>
        <Stat value={String(summary.minutes)} unit="min" label="Dauer" />
        <Stat value={formatTons(summary.volumeKg)} unit="t" label="Volumen" />
        <Stat value={String(summary.sets)} label="Sätze" />
      </View>
      <MuscleBar muscles={summary.muscles} />
    </>}
    <PRStrip prs={summary.prs} />
  </Pressable>;
});

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return <View style={styles.stat}>
    <Text style={styles.statValue}>{value}{unit && <Text style={styles.statUnit}> {unit}</Text>}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: T.radius.card, borderWidth: T.border, borderColor: T.color.cardBorder, backgroundColor: T.color.cardFill, padding: T.space.l, gap: T.space.m },
  pressed: { backgroundColor: T.color.pressed },
  top: { flexDirection: 'row', alignItems: 'center', gap: T.space.s, minHeight: T.touch },
  titles: { flex: 1, minWidth: 0 },
  title: { fontFamily: T.font.title, fontSize: 18, lineHeight: 23, color: T.color.ink },
  date: { fontFamily: T.font.meta, fontSize: 13, lineHeight: 18, color: T.color.inkMuted, marginTop: T.space.xxs },
  pill: { paddingHorizontal: T.space.s, paddingVertical: T.space.xs, borderRadius: T.radius.pill, backgroundColor: T.color.accentWash },
  pillText: { fontFamily: T.font.label, fontSize: 12, lineHeight: 16, color: T.color.accentLight, fontVariant: ['tabular-nums'] },
  stats: { flexDirection: 'row', gap: T.space.m },
  stat: { flex: 1 },
  statValue: { fontFamily: T.font.hero, fontSize: 22, lineHeight: 28, color: T.color.ink },
  statUnit: { fontFamily: T.font.body, fontSize: 13, color: T.color.inkSoft },
  statLabel: { fontFamily: T.font.meta, fontSize: 12, lineHeight: 16, color: T.color.inkMuted },
  empty: { fontFamily: T.font.body, fontSize: 14, lineHeight: 20, color: T.color.inkMuted },
});
