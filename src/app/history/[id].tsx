import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { PRStrip } from '@/components/history/pr-strip';
import { WorkoutStorageStatus } from '@/components/berkk/workout-storage-status';
import { Tokens as T } from '@/constants/theme';
import { useLocalDay } from '@/hooks/use-local-day';
import { formatSet, formatTons, formatWorkoutDate, summarizeHistory } from '@/lib/history';
import { workoutStore } from '@/store/workout';

export default function HistoryDetailScreen() {
  const hydrated = useStore(workoutStore, (state) => state.hydrated);
  return hydrated ? <Detail /> : <WorkoutStorageStatus />;
}

function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const history = useStore(workoutStore, (state) => state.history);
  const today = useLocalDay();
  const insets = useSafeAreaInsets();
  // PRs depend on everything logged before, so summarize the whole history.
  const summary = useMemo(() => summarizeHistory(history).find((item) => String(item.workout.id) === id), [history, id]);
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/progress'); };

  return <LinearGradient colors={T.color.background} locations={[0, 0.3, 0.65, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.root}>
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + T.space.xxxl }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Zurück zur Historie" onPress={back} hitSlop={T.space.s} style={styles.back}>
          <Ionicons accessible={false} name="chevron-back" size={22} color={T.color.ink} />
          <Text style={styles.backText}>Historie</Text>
        </Pressable>
        {!summary ? <View style={styles.missing}>
          <Text style={styles.title}>Training nicht gefunden</Text>
          <Text style={styles.date}>Es wurde vielleicht gelöscht.</Text>
        </View> : <>
          <Text accessibilityRole="header" style={styles.title}>{summary.title}</Text>
          <Text style={styles.date}>{formatWorkoutDate(summary.workout, today, true)}</Text>
          <View style={styles.tiles}>
            <Tile label="Dauer" value={String(summary.minutes)} unit="min" />
            <Tile label="Volumen" value={formatTons(summary.volumeKg)} unit="t" />
            <Tile label="Sätze" value={String(summary.sets)} />
            <Tile label="XP verdient" value={summary.xp ? `+${summary.xp}` : '0'} unit="XP" accent={summary.xp > 0} />
          </View>
          <View style={styles.prs}><PRStrip prs={summary.prs} /></View>
          {summary.sets === 0 && <Text style={styles.noSets}>Keine Sätze geloggt. Dieses Training zählt nicht für Volumen und XP.</Text>}
          {summary.workout.exercises.map((item) => <View key={item.exercise.id} style={styles.group}>
            <Text style={styles.exercise}>{item.exercise.name}</Text>
            <Text style={styles.exerciseMeta}>{item.exercise.muscle} · {item.sets.length} {item.sets.length === 1 ? 'Satz' : 'Sätze'}</Text>
            <View style={styles.rows}>
              {item.sets.map((entry, index) => {
                const pr = summary.prs.some((record) => record.setId === entry.id && record.exerciseId === item.exercise.id);
                const line = `Satz ${index + 1} · ${formatSet(item.exercise.tracking, entry)}`;
                return <View key={entry.id} accessible accessibilityLabel={pr ? `${line}, neuer persönlicher Rekord` : line} style={[styles.row, pr && styles.prRow]}>
                  <Text style={[styles.rowText, pr && styles.prText]}>{line}</Text>
                  {pr && <View style={styles.tag}><Text style={styles.tagText}>PR</Text></View>}
                </View>;
              })}
            </View>
          </View>)}
        </>}
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

function Tile({ label, value, unit, accent = false }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return <View accessible accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`} style={styles.tile}>
    <Text style={styles.tileLabel}>{label}</Text>
    <Text style={[styles.tileValue, accent && styles.tileAccent]}>{value}{unit && <Text style={styles.tileUnit}> {unit}</Text>}</Text>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: T.space.xl, width: '100%', maxWidth: 640, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: T.space.xs, minHeight: T.touch, alignSelf: 'flex-start', paddingRight: T.space.m, marginLeft: -T.space.xs, marginTop: T.space.xs },
  backText: { fontFamily: T.font.body, fontSize: 15, color: T.color.ink },
  missing: { gap: T.space.s, paddingTop: T.space.xxl },
  title: { fontFamily: T.font.hero, fontSize: 32, lineHeight: 38, letterSpacing: -0.6, color: T.color.ink, marginTop: T.space.m },
  date: { fontFamily: T.font.meta, fontSize: 15, lineHeight: 21, color: T.color.inkSoft, marginTop: T.space.xs },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: T.space.m, marginTop: T.space.xxl },
  tile: { flexGrow: 1, flexBasis: '45%', borderRadius: T.radius.tile, borderWidth: T.border, borderColor: T.color.cardBorder, backgroundColor: T.color.cardFill, padding: T.space.l, gap: T.space.xs },
  tileLabel: { fontFamily: T.font.meta, fontSize: 12, lineHeight: 16, color: T.color.inkMuted },
  tileValue: { fontFamily: T.font.hero, fontSize: 26, lineHeight: 32, color: T.color.ink },
  tileAccent: { color: T.color.accentLight },
  tileUnit: { fontFamily: T.font.body, fontSize: 14, color: T.color.inkSoft },
  prs: { marginTop: T.space.l },
  noSets: { fontFamily: T.font.meta, fontSize: 14, lineHeight: 21, color: T.color.inkMuted, marginTop: T.space.l },
  group: { marginTop: T.space.xxl, borderRadius: T.radius.card, borderWidth: T.border, borderColor: T.color.cardBorder, backgroundColor: T.color.cardFill, padding: T.space.l },
  exercise: { fontFamily: T.font.title, fontSize: 17, lineHeight: 22, color: T.color.ink },
  exerciseMeta: { fontFamily: T.font.meta, fontSize: 13, lineHeight: 18, color: T.color.inkMuted, marginTop: T.space.xxs },
  rows: { marginTop: T.space.m, gap: T.space.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40, paddingHorizontal: T.space.m, borderRadius: T.radius.tile },
  prRow: { backgroundColor: T.color.accentWash, borderWidth: T.border, borderColor: T.color.accentBorder },
  rowText: { fontFamily: T.font.body, fontSize: 15, lineHeight: 20, color: T.color.inkSoft, fontVariant: ['tabular-nums'] },
  prText: { color: T.color.accentLight },
  tag: { paddingHorizontal: T.space.s, paddingVertical: T.space.xxs, borderRadius: T.radius.pill, backgroundColor: T.color.accent },
  tagText: { fontFamily: T.font.title, fontSize: 11, lineHeight: 15, color: T.color.onAccent },
});
