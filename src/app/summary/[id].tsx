import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { BerkkGhost } from '@/components/berkk/berkk-ghost';
import { finishFeedback, type GhostPulse } from '@/components/berkk/ghost-state';
import { workoutExit } from '@/components/berkk/workout-recorder';
import { useWorkoutMotion } from '@/components/berkk/workout-motion-provider';
import { WorkoutStorageStatus } from '@/components/berkk/workout-storage-status';
import { PRStrip } from '@/components/history/pr-strip';
import { LockIn as L } from '@/constants/lock-in';
import { Tokens as T } from '@/constants/theme';
import { trainingStreak } from '@/data/calendar';
import { useLocalDay } from '@/hooks/use-local-day';
import { feedback } from '@/lib/feedback';
import { formatTons, formatWorkoutDate, summarizeHistory } from '@/lib/history';
import { formatElapsed } from '@/store/workout-state';
import { workoutStore } from '@/store/workout';

export default function SummaryScreen() {
  const hydrated = useStore(workoutStore, (state) => state.hydrated);
  // Arrived: the workout route may redirect normally again.
  useEffect(() => { workoutExit.toSummary = false; }, []);
  return hydrated ? <Summary /> : <WorkoutStorageStatus />;
}

function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const history = useStore(workoutStore, (state) => state.history);
  const templates = useStore(workoutStore, (state) => state.templates);
  const { reduced } = useWorkoutMotion();
  const today = useLocalDay();
  const summary = useMemo(() => summarizeHistory(history).find((item) => String(item.workout.id) === id), [history, id]);
  const streakLine = useMemo(() => {
    const after = trainingStreak(history, today);
    const before = trainingStreak(history.filter((item) => String(item.id) !== id), today);
    return finishFeedback(before, after).detail;
  }, [history, id, today]);
  const [pulse] = useState<GhostPulse>(() => ({ reaction: summary?.prs.length ? 'pr' : 'success', id: 1 }));
  // Whether this workout already belonged to a saved workout (a VS run) when the screen opened.
  const [wasTemplateRun] = useState(() => !!summary?.workout.templateId);
  const savedTemplate = !wasTemplateRun && summary?.workout.templateId ? templates.find((item) => item.id === summary.workout.templateId && !item.deletedAt) : undefined;
  const [name, setName] = useState(() => summary?.title ?? '');
  const [declined, setDeclined] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = () => router.replace('/');

  const seconds = summary ? Math.max(0, (summary.workout.endedAt - summary.workout.startedAt - (summary.workout.pausedMs ?? 0)) / 1000) : 0;
  const time = useCountUp(seconds, reduced);
  const volume = useCountUp(summary?.volumeKg ?? 0, reduced);
  const stronger = useCountUp(summary?.stronger ?? 0, reduced);
  const xp = useCountUp(summary?.xp ?? 0, reduced);

  const save = async () => {
    if (!summary || saving) return;
    setSaving(true); setError(null);
    const result = await workoutStore.getState().saveTemplate(summary.workout.id, name);
    setSaving(false);
    if (result) { setError(result); feedback.error(); } else feedback.confirm();
  };

  return <LinearGradient colors={T.color.background} locations={[0, 0.3, 0.65, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.root}>
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!summary ? <Text style={styles.title}>Training nicht gefunden</Text> : <>
            <View style={styles.ghost}><BerkkGhost size={110} mood="strong" pulse={pulse} /></View>
            <Text accessibilityRole="header" style={styles.title}>Training gespeichert</Text>
            <Text style={styles.subtitle}>{summary.title} · {formatWorkoutDate(summary.workout, today)}</Text>
            {streakLine && <Text style={styles.streak}>{streakLine}</Text>}
            <View style={styles.tiles}>
              <Tile label="Zeit" value={formatElapsed(time)} />
              <Tile label="Volumen" value={formatTons(volume)} unit="t" />
              <Tile label="Stärker als zuletzt" value={String(Math.round(stronger))} unit={summary.stronger === 1 ? 'Satz' : 'Sätze'} />
              <Tile label="XP verdient" value={`+${Math.round(xp)}`} unit="XP" accent />
            </View>
            <View style={styles.block}><PRStrip prs={summary.prs} /></View>
            {summary.sets > 0 && !declined && !wasTemplateRun && (savedTemplate
              ? <View accessibilityLiveRegion="polite" style={styles.saved}><Text style={styles.boxTitle}>Gespeichert als „{savedTemplate.name}“</Text><Text style={styles.boxText}>Beim nächsten Start findest du es mit VS-Modus.</Text></View>
              : !summary.workout.templateId && <View style={styles.box}>
                <Text style={styles.boxTitle}>Als Workout speichern?</Text>
                <Text style={styles.boxText}>Dann trittst du beim nächsten Mal im VS-Modus gegen diesen Lauf an.</Text>
                <TextInput accessibilityLabel="Name des Workouts" value={name} onChangeText={(text) => { setName(text); setError(null); }} maxLength={100} placeholder="Name, z. B. Push A" placeholderTextColor={T.color.inkMuted} style={styles.input} />
                {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Nicht speichern" onPress={() => setDeclined(true)} style={styles.secondary}><Text style={styles.secondaryText}>Nicht jetzt</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Als Workout speichern" accessibilityState={{ disabled: saving }} disabled={saving} onPress={() => void save()} style={styles.primary}><Text style={styles.primaryText}>{saving ? 'Speichert …' : 'Speichern'}</Text></Pressable>
                </View>
              </View>)}
          </>}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fertig, zur Übersicht" onPress={done} style={styles.done}><Text style={styles.doneText}>Fertig</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </LinearGradient>;
}

/** Counts from 0 to the target once (ease-out). Reduced motion shows the final number at once. */
function useCountUp(target: number, reduced: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min(1, (Date.now() - start) / L.countUpMs);
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, target]);
  return reduced ? target : value;
}

function Tile({ label, value, unit, accent = false }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return <View accessible accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}`} style={[styles.tile, accent && styles.tileAccent]}>
    <Text style={[styles.tileLabel, accent && styles.onAccent]}>{label}</Text>
    <Text style={[styles.tileValue, accent && styles.onAccent]}>{value}{unit && <Text style={[styles.tileUnit, accent && styles.onAccent]}> {unit}</Text>}</Text>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: T.space.xl, paddingTop: T.space.xl, paddingBottom: T.space.xxl, width: '100%', maxWidth: 640, alignSelf: 'center' },
  ghost: { alignItems: 'center', marginBottom: T.space.l },
  title: { fontFamily: T.font.hero, fontSize: 30, lineHeight: 36, color: T.color.ink, textAlign: 'center' },
  subtitle: { fontFamily: T.font.meta, fontSize: 15, lineHeight: 21, color: T.color.inkSoft, textAlign: 'center', marginTop: T.space.xs },
  streak: { fontFamily: T.font.label, fontSize: 14, color: T.color.accentLight, textAlign: 'center', marginTop: T.space.s },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: T.space.m, marginTop: T.space.xxl },
  tile: { flexGrow: 1, flexBasis: '45%', padding: T.space.l, gap: T.space.xs, borderRadius: T.radius.tile, backgroundColor: T.color.cardFill, borderWidth: T.border, borderColor: T.color.cardBorder },
  tileAccent: { backgroundColor: T.color.accent, borderColor: T.color.accent },
  tileLabel: { fontFamily: T.font.meta, fontSize: 12, color: T.color.inkMuted },
  tileValue: { fontFamily: T.font.hero, fontSize: 28, lineHeight: 34, color: T.color.ink },
  tileUnit: { fontFamily: T.font.body, fontSize: 14, color: T.color.inkSoft },
  onAccent: { color: T.color.onAccent },
  block: { marginTop: T.space.l },
  box: { marginTop: T.space.xl, padding: T.space.l, gap: T.space.s, borderRadius: T.radius.card, backgroundColor: T.color.cardFill, borderWidth: T.border, borderColor: T.color.accentBorder },
  saved: { marginTop: T.space.xl, padding: T.space.l, gap: T.space.xs, borderRadius: T.radius.card, backgroundColor: T.color.accentWash },
  boxTitle: { fontFamily: T.font.title, fontSize: 17, color: T.color.ink },
  boxText: { fontFamily: T.font.meta, fontSize: 14, lineHeight: 20, color: T.color.inkSoft },
  input: { minHeight: 48, paddingHorizontal: T.space.m, borderRadius: T.radius.tile, backgroundColor: T.color.glass, borderWidth: T.border, borderColor: T.color.glassBorder, fontFamily: T.font.body, fontSize: 16, color: T.color.ink },
  error: { fontFamily: T.font.body, fontSize: 13, color: T.color.accentLight },
  actions: { flexDirection: 'row', gap: T.space.s, marginTop: T.space.xs },
  secondary: { flex: 1, minHeight: T.touch, alignItems: 'center', justifyContent: 'center', borderRadius: T.radius.pill, borderWidth: T.border, borderColor: T.color.glassBorder },
  secondaryText: { fontFamily: T.font.label, fontSize: 15, color: T.color.ink },
  primary: { flex: 1, minHeight: T.touch, alignItems: 'center', justifyContent: 'center', borderRadius: T.radius.pill, backgroundColor: T.color.accent },
  primaryText: { fontFamily: T.font.title, fontSize: 15, color: T.color.onAccent },
  footer: { paddingHorizontal: T.space.xl, paddingVertical: T.space.m },
  done: { minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: T.radius.card, backgroundColor: T.color.ink },
  doneText: { fontFamily: T.font.title, fontSize: 17, color: T.color.onAccent },
});
