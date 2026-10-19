import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarAppearance as C } from '@/constants/calendar-appearance';
import { BerkkFonts } from '@/constants/theme';
import { MONTHS_SHORT, spokenDay, type CalendarMetrics, type CalendarMonthLayout } from '@/data/calendar-layout';

const WEEKDAYS = ['M', 'D', 'M', 'D', 'F', 'S', 'S'];
const WEEKDAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

/** One month: large title (plus the selected day), its own weekday row, then quiet dot weeks. */
export const CalendarMonth = memo(function CalendarMonth({ month, metrics, selected, today, done, planned, onSelect }: {
  month: CalendarMonthLayout; metrics: CalendarMetrics; selected: string | null; today: string;
  done: Set<string>; planned: Set<string>; onSelect: (day: string) => void;
}) {
  const monthIndex = Number(month.key.slice(5, 7)) - 1;
  const year = month.key.slice(0, 4);
  const current = today.startsWith(month.key.slice(0, 7));
  return <View testID={`calendar-month-${month.key}`} style={{ height: month.length, paddingBottom: metrics.bottomSpace }}>
    <View style={{ height: metrics.headerHeight }}>
      <View style={styles.heading}>
        {current && <View style={styles.currentMark} />}
        <Text accessibilityRole="header" accessibilityLabel={`${MONTHS_SHORT[monthIndex]} ${year}${selected ? `, ausgewählt: ${spokenDay(selected)}` : ''}`} maxFontSizeMultiplier={1.2} numberOfLines={1} style={styles.title}>
          {MONTHS_SHORT[monthIndex]}
          {year !== today.slice(0, 4) && <Text style={styles.year}> {year}</Text>}
          {selected && <Text testID="calendar-heading-day" style={styles.selectedDay}> {Number(selected.slice(-2))}</Text>}
        </Text>
      </View>
      <View style={styles.weekdays}>{WEEKDAYS.map((label, index) => <Text key={index} accessibilityLabel={WEEKDAY_NAMES[index]} maxFontSizeMultiplier={1.3} style={styles.weekday}>{label}</Text>)}</View>
    </View>
    {month.weeks.map((week, row) => <View key={`${month.key}-week-${row}`} testID={`calendar-week-${month.key}-${row}`} style={[styles.week, { height: metrics.cellHeight }]}>
      {week.map((day, column) => day
        ? <CalendarCell key={day} day={day} selected={day === selected} today={day === today} past={day < today} completed={done.has(day)} planned={planned.has(day)} onSelect={onSelect} />
        : <View key={`${month.key}-${row}-blank-${column}`} testID="calendar-placeholder" style={styles.slot} />)}
    </View>)}
  </View>;
});

/**
 * Point states, from quiet to loud: empty (small dim dot), planned (orange ring;
 * quieter once the day has passed without a completion), completed (orange
 * dot), today (cream), selected (thin ring around the point).
 */
const CalendarCell = memo(function CalendarCell({ day, selected, today, past, completed, planned, onSelect }: {
  day: string; selected: boolean; today: boolean; past: boolean; completed: boolean; planned: boolean; onSelect: (day: string) => void;
}) {
  const missed = planned && !completed && past;
  const state = completed ? 'Training abgeschlossen' : missed ? 'Geplant, nicht abgeschlossen' : planned ? 'Training geplant' : 'kein abgeschlossenes Training';
  // NativeWind 4's native interop flattens style functions to {}, dropping sizing.
  // Keep all geometry in static styles, including the seven equal flex slots.
  return <Pressable testID={`calendar-day-${day}`} accessibilityRole="button" accessibilityLabel={`${spokenDay(day)}${today ? ', heute' : ''}, ${state}${completed && planned ? ', auch geplant' : ''}`} accessibilityState={{ selected }} onPress={() => onSelect(day)} style={[styles.slot, styles.day]}>
    {selected && <View testID="calendar-selection" style={styles.selection} />}
    <View style={completed ? [styles.dot, styles.completed, today && styles.todayEdge]
      : planned ? [styles.dot, styles.planned, today && styles.plannedToday, missed && styles.missed]
      : [styles.dot, today && styles.today]} />
    {completed && planned && <View style={styles.alsoPlanned} />}
  </Pressable>;
});

const styles = StyleSheet.create({
  heading: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingBottom: 14 },
  currentMark: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.completed, marginBottom: 13 },
  title: { flexShrink: 1, fontFamily: BerkkFonts.black, fontSize: 36, lineHeight: 42, letterSpacing: -1, color: C.today },
  year: { fontFamily: BerkkFonts.bold, fontSize: 18, letterSpacing: -0.2, color: C.monthMuted },
  selectedDay: { color: C.monthMuted },
  weekdays: { flexDirection: 'row', minHeight: 30, alignItems: 'center' },
  weekday: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, textAlign: 'center', fontFamily: BerkkFonts.bold, fontSize: 13, lineHeight: 18, color: C.weekdayInk },
  week: { flexDirection: 'row' },
  slot: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  day: { alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.empty },
  completed: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.completed },
  planned: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.planned, backgroundColor: 'transparent' },
  missed: { opacity: C.missedOpacity },
  today: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.today },
  // Today on a completed day: cream rim around the orange dot.
  todayEdge: { width: 19, height: 19, borderRadius: 10, borderWidth: 2.5, borderColor: C.today },
  // Today on a planned day: the orange ring keeps a cream centre.
  plannedToday: { backgroundColor: C.today },
  selection: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.selectionRing },
  alsoPlanned: { position: 'absolute', marginLeft: 22, marginTop: 18, width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: C.planned, backgroundColor: C.background[1] },
});
