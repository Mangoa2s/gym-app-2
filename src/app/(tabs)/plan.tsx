/** Latest user reference (Oct 2026): light streak head, near-black dot months with their own titles, docked dark glass day sheet. */
import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useIsFocused } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { CalendarDaySheet } from '@/components/berkk/calendar-day-sheet';
import { CalendarHead } from '@/components/berkk/calendar-head';
import { CalendarMonth } from '@/components/berkk/calendar-month';
import { CalendarAmbient, useCalendarReducedMotion } from '@/components/berkk/calendar-ambient';
import { FEELINGS } from '@/components/berkk/feeling-picker';
import { useWorkoutLauncher } from '@/components/berkk/workout-timer-overlay';
import { WorkoutStorageStatus } from '@/components/berkk/workout-storage-status';
import { CalendarAppearance as C } from '@/constants/calendar-appearance';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { calendarDay, calendarMonths, completedDays, completedSetCount, localDay, trainingStreak, workoutDay } from '@/data/calendar';
import { calendarInset, calendarMetrics, calendarMonthLayouts, dayScrollOffset, type CalendarMonthLayout } from '@/data/calendar-layout';
import { useLocalDay } from '@/hooks/use-local-day';
import { workoutStore } from '@/store/workout';

export default function PlanScreen() {
  const hydrated = useStore(workoutStore, (state) => state.hydrated);
  return hydrated ? <CalendarScreen /> : <WorkoutStorageStatus />;
}

function CalendarScreen() {
  const focused = useIsFocused();
  const today = useLocalDay();
  const [selected, setSelected] = useState(today);
  const [expanded, setExpanded] = useState(false);
  const { height, width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useCalendarReducedMotion();
  const history = useStore(workoutStore, (state) => state.history);
  const plans = useStore(workoutStore, (state) => state.plans);
  const session = useStore(workoutStore, (state) => state.session);
  const saving = useStore(workoutStore, (state) => state.saving);
  const saveError = useStore(workoutStore, (state) => state.saveError);
  const launcher = useWorkoutLauncher();
  const list = useRef<FlatList<CalendarMonthLayout>>(null);
  const background = useRef<View>(null);
  const returnFromDetails = useRef(false);
  const sessionDay = session ? session.localDate ?? localDay(session.startedAt) : null;
  const months = useMemo(() => calendarMonths(today, [...history.map(workoutDay), ...plans.map((item) => item.localDate), ...(sessionDay ? [sessionDay] : [])]), [today, history, plans, sessionDay]);
  // Small iPhones (SE, mini) get a shorter head and rows so a month still fits above the sheet.
  const compact = height < 700;
  const metrics = useMemo(() => calendarMetrics(fontScale, compact), [fontScale, compact]);
  const layouts = useMemo(() => calendarMonthLayouts(months, metrics), [months, metrics]);
  const layoutRef = useRef({ layouts, metrics });
  useEffect(() => { layoutRef.current = { layouts, metrics }; }, [layouts, metrics]);
  const listReady = useRef(false);
  const listHeight = useRef(0);
  const pendingScroll = useRef<{ day: string; animated: boolean } | null>(null);
  // Month top when the day's week fits; otherwise just enough for that week to show.
  const scrollToDay = useCallback((day: string, animated = false) => {
    pendingScroll.current = { day, animated };
    if (!listReady.current) return;
    const offset = dayScrollOffset(layoutRef.current.layouts, day, layoutRef.current.metrics, listHeight.current);
    if (offset !== null) list.current?.scrollToOffset({ offset, animated });
    pendingScroll.current = null;
  }, []);
  const currentMonthIndex = months.indexOf(`${today.slice(0, 7)}-01`);
  const done = useMemo(() => completedDays(history), [history]);
  const planned = useMemo(() => new Set(plans.map((item) => item.localDate)), [plans]);
  const day = useMemo(() => calendarDay(selected, history, plans, session), [selected, history, plans, session]);
  const streak = useMemo(() => trainingStreak(history, today), [history, today]);
  const todayDone = done.has(today);
  const bottom = insets.bottom + C.tabClearance;
  const [pageHeight, setPageHeight] = useState(height - insets.top);
  const [headerHeight, setHeaderHeight] = useState(200);
  const collapsedHeight = 120 + Math.max(0, Math.min(fontScale, 1.4) - 1) * 62;
  const maxSheetHeight = Math.max(collapsedHeight, Math.min(height * 0.5, pageHeight - headerHeight - bottom - 12 - 96));
  const sheetHeight = expanded ? maxSheetHeight : collapsedHeight;
  const horizontalInset = calendarInset(Math.min(420, width - insets.left - insets.right));
  const collapse = useCallback(() => setExpanded(false), []);
  const expand = useCallback(() => setExpanded(true), []);
  const select = useCallback((key: string) => { setSelected(key); setExpanded(false); }, []);
  // Returning from the journal preserves the day. A fresh tab visit selects today.
  useFocusEffect(useCallback(() => {
    if (returnFromDetails.current) { returnFromDetails.current = false; return; }
    setSelected(today);
    setExpanded(false);
    scrollToDay(today);
  }, [today, scrollToDay]));
  const renderMonth = useCallback(({ item }: { item: CalendarMonthLayout }) => <CalendarMonth month={item} metrics={metrics} selected={selected.startsWith(item.key.slice(0, 7)) ? selected : null} today={today} done={done} planned={planned} onSelect={select} />, [metrics, selected, today, done, planned, select]);
  const goToday = useCallback(() => { select(today); scrollToDay(today, !reduced); }, [reduced, scrollToDay, select, today]);
  const listData = useMemo(() => ({ selected, today, done, planned }), [selected, today, done, planned]);
  const getItemLayout = useCallback((_: unknown, index: number) => layouts[index], [layouts]);
  const edit = (mode: 'history' | 'plan', id?: number) => {
    returnFromDetails.current = true;
    setExpanded(false);
    router.push({ pathname: '/journal', params: { mode, date: selected, ...(id !== undefined ? { id: String(id) } : {}) } });
  };
  const resume = () => { returnFromDetails.current = true; setExpanded(false); router.navigate('/workout'); };
  const start = () => { returnFromDetails.current = true; setExpanded(false); launcher.start(null); };
  return <View style={styles.root}>
    {/* Dark icons on the light head. */}
    {focused && <StatusBar style="dark" />}
    <BlurTargetView ref={background} pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={C.background} locations={[0, 0.35, 0.7, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <CalendarAmbient reduced={reduced} />
    </BlurTargetView>
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <View style={styles.root} onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}>
          <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
            <CalendarHead streak={streak} todayDone={todayDone} focused={focused} topInset={insets.top} compact={compact} onPress={goToday} />
          </View>
          <View style={styles.page}>
          {/* Months scroll; no blur, glow or animation runs inside a day cell. */}
          <FlatList ref={list} testID="calendar-months" data={layouts} initialScrollIndex={currentMonthIndex} getItemLayout={getItemLayout} keyExtractor={(month) => month.key} showsVerticalScrollIndicator={false} initialNumToRender={2} maxToRenderPerBatch={2} windowSize={5} style={[styles.months, { marginHorizontal: horizontalInset }]} contentContainerStyle={styles.monthContent} extraData={listData} renderItem={renderMonth} onLayout={(event) => {
            listHeight.current = event.nativeEvent.layout.height;
            listReady.current = true;
            const target = pendingScroll.current;
            if (target) scrollToDay(target.day, target.animated);
          }} />
          <View pointerEvents="none" style={{ height: bottom + sheetHeight + 12 }} />
          </View>
        </View>
      </SafeAreaView>
    <SafeAreaView pointerEvents="box-none" edges={['left', 'right']} style={StyleSheet.absoluteFill}>
      <View pointerEvents="box-none" style={styles.page}>
        <CalendarDaySheet date={selected} today={today} reduced={reduced} day={day} expanded={expanded} onExpand={expand} onCollapse={collapse} bottom={bottom} collapsedHeight={collapsedHeight} maxHeight={maxSheetHeight} blurTarget={background}>
          {saveError && <DayAction label="Speichern fehlgeschlagen · Erneut versuchen" onPress={() => void workoutStore.getState().flush()} />}
          {day.active && <DayAction label={day.active.name || 'Laufendes Workout'} meta="Weitertrainieren" onPress={resume} />}
          {day.workouts.map((workout) => <DayAction key={workout.id} label={workout.name || 'Workout'} meta={`${Math.round((workout.endedAt - workout.startedAt) / 60000)} Min. · ${workout.exercises.length} ${workout.exercises.length === 1 ? 'Übung' : 'Übungen'} · ${completedSetCount(workout)} ${completedSetCount(workout) === 1 ? 'Satz' : 'Sätze'}${workout.feeling ? ` · ${FEELINGS[workout.feeling]}` : ''}`} onPress={() => edit('history', workout.id)} />)}
          {day.plans.map((plan) => <DayAction key={plan.id} label={plan.name} meta={`${plan.exercises.length} ${plan.exercises.length === 1 ? 'Übung' : 'Übungen'} · Geplant${selected < today ? ' · Noch offen' : ''}`} onPress={() => edit('plan', plan.id)} />)}
          {day.status === 'empty' && <Text style={styles.empty}>{selected > today ? 'Plane hier dein nächstes Workout.' : selected === today ? 'Starte dein Training oder trage es später ein.' : 'Trainiert? Trage dein Workout nach.'}</Text>}
          {selected === today && <DayAction label={session ? 'Laufendes Workout fortsetzen' : 'Workout starten'} accent disabled={!session && saving} onPress={session ? resume : start} />}
          <DayAction label={selected > today ? 'Workout planen' : 'Workout nachtragen'} accent onPress={() => edit(selected > today ? 'plan' : 'history')} />
          {selected === today && <DayAction label="Für heute planen" accent onPress={() => edit('plan')} />}
        </CalendarDaySheet>
      </View>
    </SafeAreaView>
  </View>;
}

function DayAction({ label, meta, onPress, accent = false, disabled = false }: { label: string; meta?: string; onPress: () => void; accent?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.action, disabled && { opacity: 0.55 }]}>
    <View style={styles.actionCopy}><Text style={[styles.actionTitle, accent && { color: Berkk.link }]}>{label}</Text>{meta && <Text style={styles.actionMeta}>{meta}</Text>}</View><Ionicons accessible={false} name="chevron-forward" size={16} color={accent ? Berkk.link : Berkk.inkSecondary} />
  </Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 }, page: { flex: 1, minHeight: 0, width: '100%', maxWidth: 420, alignSelf: 'center' },
  months: { flex: 1, minHeight: 0 }, monthContent: { paddingBottom: 20 },
  empty: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 13, lineHeight: 20, paddingVertical: 10 }, action: { minHeight: 48, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Berkk.glassBorder },
  actionCopy: { flex: 1 }, actionTitle: { color: Berkk.ink, fontFamily: BerkkFonts.semibold, fontSize: 14, lineHeight: 20 }, actionMeta: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 11, lineHeight: 17, marginTop: 3 },
});
