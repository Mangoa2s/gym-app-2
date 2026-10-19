/**
 * Active training ("lock-in"). Top: pause · "{Name} · mm:ss" · hold-to-stop.
 * Below: today's total (free) or the VS race, the ghost reacting to every set,
 * the rest bar, and the nearly opaque set card. Modelled on Hevy/Strong set
 * tables with Duolingo-style character feedback; BERKK twist: the ghost races
 * last time's you in VS mode.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { cancelAnimation, Easing, ReduceMotion, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { useWorkoutMotion } from '@/components/berkk/workout-motion-provider';
import { GhostStage } from '@/components/lock-in/ghost-stage';
import { GlutWorld } from '@/components/lock-in/glut-world';
import { emitWorld, useWorldBridge } from '@/components/lock-in/world-bridge';
import { WorldDebug } from '@/components/lock-in/world-debug';
import type { Burst } from '@/components/lock-in/ghost-burst';
import { FreeLine, VsLine } from '@/components/lock-in/progress-line';
import { RestBar, type Rest } from '@/components/lock-in/rest-bar';
import { StartChooser } from '@/components/lock-in/start-chooser';
import { TopBar } from '@/components/lock-in/top-bar';
import { LockIn as L } from '@/constants/lock-in';
import { Tokens as T } from '@/constants/theme';
import { WorkoutFocus as F, WorkoutMotion as M } from '@/constants/workout-motion';
import { trainingStreak } from '@/data/calendar';
import { useLocalDay } from '@/hooks/use-local-day';
import { feedback } from '@/lib/feedback';
import { previousSet, shortSet, strongerStreak, templateOpponent, workoutHeat, type Leader, type Speech } from '@/lib/lock-in';
import { workoutStore } from '@/store/workout';
import type { WorkoutSession } from '@/store/workout-state';
import type { GhostPulse, GhostReaction } from './ghost-state';
import { WorkoutRecorder, type SetResult } from './workout-recorder';

export { useWorkoutLauncher } from './workout-motion-provider';

export function WorkoutTimerOverlay({ session }: { session: WorkoutSession }) {
  const { clock, overlayReady, reduced } = useWorkoutMotion();
  const [intro] = useState(() => !session.introPlayed);
  const today = useLocalDay();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const bridge = useWorldBridge();
  const focused = useIsFocused();
  const history = useStore(workoutStore, (state) => state.history);
  const templates = useStore(workoutStore, (state) => state.templates);
  const liveTemplates = useMemo(() => templates.filter((item) => !item.deletedAt), [templates]);
  const [ending, setEnding] = useState(false);
  const [pulse, setPulse] = useState<GhostPulse | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [reaction, setReaction] = useState<Speech | null>(null);
  const [rest, setRest] = useState<Rest | null>(null);
  const pulseId = useRef(0);
  const react = useCallback((next: GhostReaction) => setPulse({ reaction: next, id: ++pulseId.current }), []);
  const opponent = useMemo(() => session.templateId ? templateOpponent(history, session.templateId) : undefined, [history, session.templateId]);
  const choosing = !session.mode && session.exercises.length === 0 && liveTemplates.length > 0;
  const streak = useMemo(() => strongerStreak(session, history), [history, session]);
  const heat = useMemo(() => workoutHeat(session, L.world.heatFloor, L.world.heatMinSets), [session]);
  // TEMPORARY (debug only): a manual heat that replaces the real one while set.
  const [heatOverride, setHeatOverride] = useState<number | null>(null);
  const worldHeat = L.debugWorld && heatOverride !== null ? heatOverride : heat;
  // Top edge of the tracking card: the embers' floor and the throw floor.
  const [cardTop, setCardTop] = useState(height);
  // Small phones (height < 700, e.g. iPhone SE) get a smaller ghost and tighter rows.
  const compact = height < 700;
  const ghostSize = compact ? L.compactGhostSize : L.ghostSize;

  // Fresh start only: the ghost notices the workout, then greets a real day streak once.
  const [greetStreak] = useState(() => intro && trainingStreak(history, today) > 0);
  useEffect(() => {
    if (!intro || reduced) return;
    const notice = F.intro.streakAt + F.intro.entranceMs;
    const start = setTimeout(() => react('start'), notice);
    const greet = greetStreak ? setTimeout(() => react('streak'), notice + F.ghost.streakGreetDelayMs) : undefined;
    return () => { clearTimeout(start); clearTimeout(greet); };
  }, [greetStreak, intro, react, reduced]);

  useLayoutEffect(() => {
    overlayReady.set(true);
    // Keep the existing shared launch clock and one-time intro claim. Display
    // motion never owns the session timestamp or recorded data.
    const duration = reduced ? M.reducedDuration : M.duration;
    const elapsed = Math.min(duration, Date.now() - session.startedAt);
    if (intro && elapsed < duration) {
      clock.set((elapsed / duration) * M.duration);
      clock.set(withTiming(M.duration, { duration: duration - elapsed, easing: Easing.linear, reduceMotion: ReduceMotion.Never }));
    } else clock.set(M.duration);
    workoutStore.getState().claimIntro(session.id);
    return () => {
      overlayReady.set(false);
      cancelAnimation(clock);
      clock.set(M.duration);
    };
  }, [clock, intro, overlayReady, reduced, session.id, session.startedAt]);

  const leave = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  /** One set reaction: ghost, Glut-Welt sparks, haptics, line and rest. Real sets and debug buttons share it. */
  const celebrate = useCallback((kind: SetResult['outcome']['kind'], speech: Speech, startRest: boolean) => {
    react(kind === 'pr' ? 'pr' : kind === 'stronger' ? 'success' : 'nod');
    // Glut-Welt sparks from the ghost: normal 16, stronger 46 + brighten, PR 110 + strong flash.
    const W = L.world;
    emitWorld(bridge, { x: bridge.homeX.value + bridge.offX.value, y: bridge.homeY.value + bridge.offY.value,
      count: kind === 'pr' ? W.bursts.pr : kind === 'stronger' ? W.bursts.stronger : W.bursts.normal,
      flash: kind === 'pr' ? W.flash.pr : kind === 'stronger' ? W.flash.stronger : 0 });
    // The PR ring stays; small View sparks only where the Skia world is unavailable (web).
    setBurst(kind === 'pr' ? { kind: 'pr', id: Date.now() } : kind === 'stronger' && Platform.OS === 'web' ? { kind: 'sparks', id: Date.now() } : null);
    if (kind === 'pr') feedback.peak(); else if (kind === 'stronger') feedback.confirm(); else feedback.select();
    setReaction(speech);
    setRest(startRest ? { endsAt: Date.now() + L.restSeconds * 1000, total: L.restSeconds } : null);
  }, [bridge, react]);
  const onSetSaved = useCallback((result: SetResult) => {
    const subtitle = result.exerciseDone ? `${result.exerciseName} erledigt. ${result.nextName ? `Weiter mit ${result.nextName}.` : 'Alle Übungen geschafft.'}` : undefined;
    celebrate(result.outcome.kind, { title: result.speech.title, subtitle }, !result.workoutDone);
  }, [celebrate]);
  // TEMPORARY debug buttons: trigger each reaction without logging a set.
  const debugTrigger = useCallback((kind: 'same' | 'stronger' | 'pr') => celebrate(kind,
    kind === 'pr' ? { title: 'Neuer PR! 87,5 kg', subtitle: 'Debug' } : kind === 'stronger' ? { title: 'Stärker als letztes Mal! +2,5 kg', subtitle: 'Debug' } : { title: 'Genau wie letztes Mal. Solide.', subtitle: 'Debug' }, true), [celebrate]);
  const onLeadChange = useCallback((leader: Leader) => {
    if (leader === 'you') { react('success'); setReaction({ title: 'Geist überholt!', subtitle: 'Du liegst vor deinem letzten Mal.' }); }
    else { react('nod'); setReaction({ title: 'Der Geist zieht vorbei!', subtitle: 'Hol ihn dir mit dem nächsten Satz zurück.' }); }
  }, [react]);
  const endRest = useCallback(() => setRest(null), []);
  const addRest = useCallback(() => { feedback.select(); setRest((current) => current && { endsAt: current.endsAt + L.restAddSeconds * 1000, total: current.total + L.restAddSeconds }); }, []);
  const stop = useCallback(() => { feedback.confirm(); setRest(null); setEnding(true); }, []);
  const finished = useCallback((id: number) => router.replace({ pathname: '/summary/[id]', params: { id: String(id) } }), []);

  const name = session.name?.trim() || (session.mode === 'vs' ? 'VS-Modus' : 'Freies Training');
  const speech = reaction ?? idleSpeech(session, history, !!opponent);

  return <View testID="workout-screen" style={styles.screen} accessibilityViewIsModal>
    <LinearGradient pointerEvents="none" colors={T.color.background} locations={[0, 0.3, 0.65, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
    {!choosing && <GlutWorld bridge={bridge} heat={worldHeat} rest={!!rest} paused={!!session.pausedAt} reduced={reduced} active={focused && !ending} floorY={cardTop} />}
    {/* Transparent on purpose: an opaque background here covered the gradient and the Glut-Welt. */}
    <KeyboardAvoidingView style={[styles.content, { paddingTop: insets.top + T.space.s, paddingLeft: insets.left, paddingRight: insets.right }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {choosing ? <>
        <Pressable accessibilityRole="button" accessibilityLabel="Zur Übersicht" onPress={leave} style={styles.back}>
          <Ionicons accessible={false} name="chevron-back" size={20} color={T.color.ink} /><Text style={styles.backText}>Übersicht</Text>
        </Pressable>
        <StartChooser templates={liveTemplates} history={history} onChoose={(templateId) => { feedback.select(); workoutStore.getState().chooseMode(templateId); }} />
      </> : <>
        <TopBar name={name} startedAt={session.startedAt} pausedMs={session.pausedMs} pausedAt={session.pausedAt}
          onTogglePause={() => { feedback.select(); workoutStore.getState().togglePause(); }} onStop={stop} onOpenOverview={leave} />
        {!ending && (session.mode === 'vs' && opponent ? <VsLine session={session} opponent={opponent} compact={compact} onLeadChange={onLeadChange} /> : <FreeLine session={session} />)}
        {!ending && <GhostStage pulse={pulse} burst={burst} speech={speech} streak={streak} size={ghostSize} compact={compact} reduced={reduced} active={focused && !session.pausedAt}
          bridge={bridge} screenWidth={width} topLimit={insets.top} />}
        {!ending && rest && <RestBar rest={rest} compact={compact} onAdd={addRest} onDone={endRest} />}
        {/* The card yields space first: its set table scrolls, the ghost stage keeps its minimum. */}
        {/* Its top edge is the floor a thrown ghost bounces off. */}
        <View style={ending ? styles.cardFull : styles.cardSlot} onLayout={(event) => { const top = event.nativeEvent.layout.y; bridge.cardTop.set(top); setCardTop(top); }}>
          <WorkoutRecorder session={session} ending={ending} onEndingChange={setEnding} onFinish={finished} onSetSaved={onSetSaved} />
        </View>
      </>}
    </KeyboardAvoidingView>
    {/* TEMPORARY Glut-Welt diagnostics, drawn above everything. */}
    {L.debugWorld && !choosing && <WorldDebug bridge={bridge} heat={worldHeat} override={heatOverride} onOverride={setHeatOverride} onTrigger={debugTrigger} top={insets.top + 64} />}
  </View>;
}

/** What the ghost says before the first reaction of this screen visit. */
function idleSpeech(session: WorkoutSession, history: Parameters<typeof previousSet>[0], hasOpponent: boolean): Speech {
  const active = session.exercises.find((item) => item.exercise.id === session.expandedId) ?? session.exercises[0];
  if (!active) return { title: 'Bereit, wenn du es bist.', subtitle: 'Füge deine erste Übung hinzu.' };
  const index = active.sets.findIndex((entry) => !entry.confirmed);
  if (session.mode === 'vs' && !session.exercises.some((item) => item.sets.some((entry) => entry.confirmed))) {
    return { title: `VS-Modus: ${session.name ?? 'Workout'}`, subtitle: hasOpponent ? 'Dein Geist läuft dein letztes Mal noch einmal.' : 'Beim nächsten Mal läuft hier dein Geist mit.' };
  }
  if (index < 0) return { title: `${active.exercise.name} erledigt.`, subtitle: 'Weiter mit der nächsten Übung oder Training beenden.' };
  const previous = previousSet(history, active.exercise.id, index);
  return { title: `${active.exercise.name} · Satz ${index + 1}`, subtitle: previous ? `Vorher: ${shortSet(active.exercise.tracking, previous)}` : 'Neuer Satz. Leg einfach los.' };
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.color.background[3] },
  content: { flex: 1 },
  cardSlot: { flexShrink: 1, minHeight: 0 },
  cardFull: { flex: 1, marginTop: T.space.m },
  back: { flexDirection: 'row', alignItems: 'center', gap: T.space.xs, minHeight: T.touch, alignSelf: 'flex-start', paddingHorizontal: T.space.l },
  backText: { fontFamily: T.font.body, fontSize: 15, color: T.color.ink },
});
