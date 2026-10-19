import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Tokens as T } from '@/constants/theme';
import { formatPercent, formatTons, type WeekDay } from '@/lib/history';

const DAY_NAMES: Record<string, string> = { Mo: 'Montag', Di: 'Dienstag', Mi: 'Mittwoch', Do: 'Donnerstag', Fr: 'Freitag', Sa: 'Samstag', So: 'Sonntag' };

/** "DIESE WOCHE": goal progress, Mo–So circles, volume trend and the derived level. */
export const WeekCard = memo(function WeekCard({ days, done, goal, volumeKg, deltaPercent, level }: {
  days: WeekDay[]; done: number; goal: number; volumeKg: number; deltaPercent: number | null;
  level: { level: number; xpIntoLevel: number; xpForLevel: number };
}) {
  const progress = level.xpForLevel > 0 ? Math.min(1, level.xpIntoLevel / level.xpForLevel) : 0;
  const trend = deltaPercent === null ? null : deltaPercent > 0 ? 'arrow-up' : deltaPercent < 0 ? 'arrow-down' : 'remove';
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>DIESE WOCHE</Text>
    <View accessible accessibilityLabel={`${done} von ${goal} Trainings diese Woche`} style={styles.goalRow}>
      <Text style={styles.hero}>{done}</Text>
      <Text style={styles.goalText}>von {goal} {goal === 1 ? 'Training' : 'Trainings'}</Text>
    </View>
    <View style={styles.days}>
      {days.map((day) => <View key={day.key} accessible accessibilityLabel={`${DAY_NAMES[day.label]}${day.today ? ', heute' : ''}, ${day.trained ? 'trainiert' : 'nicht trainiert'}`} style={styles.day}>
        <View style={[styles.circle, day.trained ? styles.trained : day.today ? styles.today : styles.idle]}>
          {day.trained && <Ionicons accessible={false} name="checkmark" size={18} color={T.color.onAccent} />}
        </View>
        <Text style={[styles.dayLabel, day.today && styles.dayLabelToday]}>{day.label}</Text>
      </View>)}
    </View>
    <View style={styles.divider} />
    <View style={styles.footer}>
      <View style={styles.column} accessible accessibilityLabel={`Volumen diese Woche ${formatTons(volumeKg)} Tonnen${deltaPercent === null ? '' : `, ${formatPercent(deltaPercent)} zur Vorwoche`}`}>
        <Text style={styles.eyebrow}>VOLUMEN</Text>
        <Text style={styles.value}>{formatTons(volumeKg)} <Text style={styles.unit}>t</Text></Text>
        {trend
          ? <View style={styles.trendRow}><Ionicons accessible={false} name={trend} size={13} color={T.color.accentLight} /><Text style={styles.trend}>{formatPercent(deltaPercent!)} zur Vorwoche</Text></View>
          : <Text style={styles.meta}>Noch kein Vergleich</Text>}
      </View>
      <View style={styles.column} accessible accessibilityLabel={`Level ${level.level}, ${level.xpIntoLevel} von ${level.xpForLevel} XP`}>
        <Text style={styles.eyebrow}>LEVEL {level.level}</Text>
        <Text style={styles.value}>{level.xpIntoLevel} <Text style={styles.unit}>/ {level.xpForLevel} XP</Text></Text>
        <View style={styles.track}><View style={[styles.fill, { flex: progress }]} /><View style={{ flex: 1 - progress }} /></View>
      </View>
    </View>
  </View>;
});

const CIRCLE = 34;
const styles = StyleSheet.create({
  card: { borderRadius: T.radius.card, borderWidth: T.border, borderColor: T.color.cardBorder, backgroundColor: T.color.cardFill, padding: T.space.xl, gap: T.space.l },
  eyebrow: { fontFamily: T.font.label, fontSize: 11, lineHeight: 15, letterSpacing: 1.2, color: T.color.inkMuted },
  goalRow: { flexDirection: 'row', alignItems: 'baseline', gap: T.space.s, marginTop: -T.space.s },
  hero: { fontFamily: T.font.hero, fontSize: 52, lineHeight: 58, letterSpacing: -1.5, color: T.color.ink, fontVariant: ['tabular-nums'] },
  goalText: { fontFamily: T.font.title, fontSize: 18, lineHeight: 24, color: T.color.inkSoft },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: T.space.xs, minWidth: T.touch },
  circle: { width: CIRCLE, height: CIRCLE, borderRadius: T.radius.circle, alignItems: 'center', justifyContent: 'center' },
  trained: { backgroundColor: T.color.accent },
  today: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: T.color.accentLight },
  idle: { borderWidth: T.border, borderColor: T.color.idleRing },
  dayLabel: { fontFamily: T.font.body, fontSize: 12, lineHeight: 16, color: T.color.inkMuted },
  dayLabelToday: { color: T.color.ink, fontFamily: T.font.label },
  divider: { height: T.border, backgroundColor: T.color.cardBorder },
  footer: { flexDirection: 'row', gap: T.space.xl },
  column: { flex: 1, gap: T.space.xs },
  value: { fontFamily: T.font.hero, fontSize: 24, lineHeight: 30, color: T.color.ink },
  unit: { fontFamily: T.font.body, fontSize: 14, color: T.color.inkSoft },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: T.space.xs },
  trend: { fontFamily: T.font.body, fontSize: 12, lineHeight: 16, color: T.color.accentLight },
  meta: { fontFamily: T.font.meta, fontSize: 12, lineHeight: 16, color: T.color.inkMuted },
  track: { flexDirection: 'row', height: 6, borderRadius: T.radius.bar, backgroundColor: T.color.track, overflow: 'hidden', marginTop: T.space.xs },
  fill: { backgroundColor: T.color.accent, borderRadius: T.radius.bar },
});
