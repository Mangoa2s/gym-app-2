import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { useDetailSheet } from '@/components/berkk/detail-sheet';
import { ExerciseSearch } from '@/components/berkk/exercise-search';
import { LockIn as L } from '@/constants/lock-in';
import { Berkk, BerkkFonts, Tokens as T } from '@/constants/theme';
import { ENTRY_FIELDS, parseEntryNumber, type FieldKey, type SetDraft } from '@/data/workout-records';
import { waitForSavedSet } from '@/data/workout-feedback';
import { feedback } from '@/lib/feedback';
import { nextOpenExercise, previousSet, setOutcome, shortSet, speechFor, type SetOutcome, type Speech } from '@/lib/lock-in';
import { decimal } from '@/lib/set-compare';
import { workoutStore } from '@/store/workout';
import type { SessionExercise, WorkoutSession } from '@/store/workout-state';
import { FeelingPicker } from './feeling-picker';
import { DiaryAction } from './diary-action';
import { DiaryField } from './diary-field';

/** Set while a finished workout navigates to its summary, so the workout route does not redirect Home first. */
export const workoutExit = { toSummary: false };

/** What the screen needs to react to one durably saved set. */
export type SetResult = { outcome: { kind: SetOutcome; delta?: string }; speech: Speech; exerciseName: string; exerciseDone: boolean; nextName?: string; workoutDone: boolean };

/** One set row: 44 pt touch height plus its 4 pt gap. */
const LINE_HEIGHT = T.touch + T.space.xs;
const STEP: Record<FieldKey, number> = { weightKg: L.steps.kg, addedWeightKg: L.steps.kg, assistanceKg: L.steps.kg, reps: L.steps.reps, durationSeconds: L.steps.seconds, durationMinutes: L.steps.minutes, distanceKm: L.steps.km };

/**
 * The bottom card of the active training: exercise chips, the set table
 * (SATZ | VORHER | HEUTE | Status), steppers and one big confirm button.
 * Saving, confirmation and the closing diary keep their existing store flow.
 */
export function WorkoutRecorder({ session, ending, onEndingChange, onFinish, onSetSaved }: {
  session: WorkoutSession; ending: boolean; onEndingChange: (ending: boolean) => void;
  onFinish: (workoutId: number) => void; onSetSaved: (result: SetResult) => void;
}) {
  const { present } = useDetailSheet();
  const insets = useSafeAreaInsets();
  const history = useStore(workoutStore, (state) => state.history);
  const saveError = useStore(workoutStore, (state) => state.saveError);
  const [chosenSetId, setChosenSetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const active = session.exercises.find((item) => item.exercise.id === session.expandedId) ?? session.exercises[0];
  const activeSet = active?.sets.find((entry) => entry.id === chosenSetId) ?? active?.sets.find((entry) => !entry.confirmed);
  const activeIndex = active && activeSet ? active.sets.indexOf(activeSet) : -1;
  // Keep the active row in view when the table is shorter than its rows (small phones).
  const table = useRef<ScrollView>(null);
  useEffect(() => {
    if (activeIndex >= 0) table.current?.scrollTo({ y: Math.max(0, (activeIndex - 1) * LINE_HEIGHT), animated: true });
  }, [activeIndex, active?.exercise.id]);
  const allDone = session.exercises.length > 0 && session.exercises.every((item) => item.sets.length > 0 && item.sets.every((entry) => entry.confirmed));
  const nextOpen = active ? nextOpenExercise(session, active.exercise.id) : undefined;
  const confirmedCount = session.exercises.reduce((count, item) => count + item.sets.filter((entry) => entry.confirmed).length, 0);
  const drafts = session.exercises.reduce((count, item) => count + item.sets.filter((entry) => !entry.confirmed && Object.values(entry.values).some((text) => text?.trim())).length, 0);

  const choose = (exerciseId: string, setId: string | null) => {
    feedback.select();
    setError(null);
    if (exerciseId !== session.expandedId) workoutStore.getState().expand(exerciseId);
    setChosenSetId(setId);
  };
  const addExercise = () => {
    Keyboard.dismiss();
    present({ title: 'Übung hinzufügen', layout: 'full', content: <ExerciseSearch showLastTime onSelect={(exercise) => { workoutStore.getState().addExercise(exercise); setChosenSetId(null); }} /> });
  };
  const addSet = () => {
    if (!active) return;
    feedback.select();
    workoutStore.getState().addSet(active.exercise.id);
    setChosenSetId(workoutStore.getState().session?.exercises.find((row) => row.exercise.id === active.exercise.id)?.sets.at(-1)?.id ?? null);
  };
  const step = (key: FieldKey, direction: 1 | -1) => {
    if (!active || !activeSet) return;
    const current = parseEntryNumber(activeSet.values[key]) ?? 0;
    const next = Math.max(0, Math.round((current + direction * STEP[key]) * 100) / 100);
    feedback.select();
    workoutStore.getState().editSet(active.exercise.id, activeSet.id, key, decimal(next));
  };

  // Reaction data is computed only after the set is durably saved, from fresh store state.
  const confirmedSet = useCallback(async (exerciseId: string, setId: string) => {
    const saved = await waitForSavedSet(workoutStore, session.id, exerciseId, setId);
    const state = workoutStore.getState();
    const item = state.session?.exercises.find((row) => row.exercise.id === exerciseId);
    const index = item?.sets.findIndex((row) => row.id === setId) ?? -1;
    if (!saved || !alive.current || !item || index < 0 || !state.session) return;
    const entry = item.sets[index];
    const outcome = setOutcome(item.exercise.tracking, entry, previousSet(state.history, exerciseId, index));
    const exerciseDone = item.sets.every((row) => row.confirmed);
    const next = exerciseDone ? nextOpenExercise(state.session, exerciseId) : undefined;
    setChosenSetId(null);
    // A finished exercise hands over to the next open one.
    if (next) state.expand(next.exercise.id);
    const workoutDone = state.session.exercises.every((row) => row.sets.every((set) => set.confirmed));
    onSetSaved({ outcome, speech: speechFor(outcome, item.exercise.tracking, entry), exerciseName: item.exercise.name, exerciseDone, nextName: next?.exercise.name, workoutDone });
  }, [onSetSaved, session.id]);
  const confirm = () => {
    if (!active || !activeSet) return;
    Keyboard.dismiss();
    const nextError = workoutStore.getState().confirmSet(active.exercise.id, activeSet.id);
    setError(nextError);
    if (nextError) { feedback.error(); return; }
    void confirmedSet(active.exercise.id, activeSet.id);
  };
  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    // The summary screen reports time, volume, XP and a real streak increase.
    const id = session.id;
    workoutExit.toSummary = true;
    const saved = await workoutStore.getState().end();
    if (saved) { feedback.confirm(); onFinish(id); }
    else { workoutExit.toSummary = false; feedback.error(); setFinishing(false); }
  };

  if (ending) return <View style={[styles.card, styles.endingCard]}>
    <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'} showsVerticalScrollIndicator={false} contentContainerStyle={styles.journal}>
      <Text accessibilityRole="header" style={styles.exerciseName}>Dein Trainingstagebuch</Text>
      <DiaryField label="Workout-Name" value={session.name ?? ''} onChangeText={(name) => workoutStore.getState().setJournal({ name })} />
      <FeelingPicker value={session.feeling} onChange={(feeling) => workoutStore.getState().setJournal({ feeling })} />
      <DiaryField label="Private Notiz" multiline value={session.note ?? ''} onChangeText={(note) => workoutStore.getState().setJournal({ note })} />
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, T.space.m) }]}>
      {saveError && <SaveRetry />}
      <Text style={styles.finishTitle}>Training abschließen?</Text>
      <Text style={styles.meta}>{confirmedCount === 1 ? '1 bestätigter Satz wird gespeichert.' : `${confirmedCount} bestätigte Sätze werden gespeichert.`}{drafts > 0 ? (drafts === 1 ? ' 1 offener Satz wird verworfen.' : ` ${drafts} offene Sätze werden verworfen.`) : ''}</Text>
      <View style={styles.finishActions}>
        <DiaryAction disabled={finishing} label="Weitertrainieren" onPress={() => onEndingChange(false)} style={styles.grow} />
        <DiaryAction disabled={finishing} primary label={finishing ? 'Speichert …' : 'Training speichern'} onPress={() => void finish()} style={styles.grow} />
      </View>
    </View>
  </View>;

  if (!active) return <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, T.space.m) + T.space.s }]}>
    <Text style={styles.emptyTitle}>Noch keine Übung</Text>
    <Text style={styles.meta}>Füge deine erste Übung hinzu. Der Geist vergleicht jeden Satz mit deinem letzten Mal.</Text>
    <BigButton label="Übung hinzufügen" icon="add" onPress={addExercise} />
  </View>;

  const fields = ENTRY_FIELDS[active.exercise.tracking];
  const noun = active.exercise.tracking === 'cardio' ? 'Eintrag' : 'Satz';
  return <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, T.space.m) + T.space.xs }]}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
      {session.exercises.map((item) => {
        const done = item.sets.filter((entry) => entry.confirmed).length;
        const selected = item.exercise.id === active.exercise.id;
        return <Pressable key={item.exercise.id} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${item.exercise.name}, ${done} von ${item.sets.length} Sätzen`} onPress={() => choose(item.exercise.id, null)} style={[styles.chip, selected && styles.chipActive]}>
          <Text numberOfLines={1} style={styles.chipText}>{shortName(item.exercise.name)} <Text style={styles.chipCount}>{done}/{item.sets.length}</Text></Text>
        </Pressable>;
      })}
      <Pressable accessibilityRole="button" accessibilityLabel="Übung hinzufügen" onPress={addExercise} style={[styles.chip, styles.chipAdd]}>
        <Ionicons accessible={false} name="add" size={16} color={T.color.accentLight} /><Text style={[styles.chipText, styles.chipAddText]}>Übung</Text>
      </Pressable>
    </ScrollView>

    <Text accessibilityRole="header" numberOfLines={2} style={styles.exerciseName}>{active.exercise.name}</Text>
    <View style={styles.tableHead}>
      <Text style={[styles.headCell, styles.colSet]}>{noun.toUpperCase()}</Text>
      <Text style={[styles.headCell, styles.colValue]}>VORHER</Text>
      <Text style={[styles.headCell, styles.colValue]}>HEUTE</Text>
      <View style={styles.colStatus} />
    </View>
    <ScrollView ref={table} style={styles.table} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {active.sets.map((entry, index) => <SetLine key={entry.id} item={active} entry={entry} index={index} previous={previousSet(history, active.exercise.id, index)} active={entry.id === activeSet?.id}
        onPress={() => choose(active.exercise.id, entry.id)} onRemove={() => { if (!entry.confirmed) workoutStore.getState().removeSet(active.exercise.id, entry.id, true); }} />)}
      <Pressable accessibilityRole="button" accessibilityLabel={`${noun} hinzufügen`} onPress={addSet} style={styles.addSet}>
        <Ionicons accessible={false} name="add" size={18} color={T.color.accentLight} /><Text style={styles.addSetText}>{noun} hinzufügen</Text>
      </Pressable>
    </ScrollView>

    {activeSet && <View style={styles.steppers}>
      {fields.map((field) => <Stepper key={field.key} label={field.optional ? `${field.label} (optional)` : field.label} value={activeSet.values[field.key] ?? ''} integer={!!field.integer}
        onStep={(direction) => step(field.key, direction)} onChange={(text) => { setError(null); workoutStore.getState().editSet(active.exercise.id, activeSet.id, field.key, text); }} />)}
    </View>}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {saveError && <SaveRetry />}
    {activeSet ? <BigButton label={`${noun} ${activeIndex + 1} bestätigen`} icon="checkmark" onPress={confirm} />
      : allDone ? <BigButton label="Training beenden" icon="flag" onPress={() => { feedback.select(); onEndingChange(true); }} />
      : nextOpen ? <BigButton label={`Weiter mit ${shortName(nextOpen.exercise.name)}`} icon="arrow-forward" onPress={() => choose(nextOpen.exercise.id, null)} />
      : <BigButton label={`${noun} hinzufügen`} icon="add" onPress={addSet} />}
  </View>;
}

/** Chips stay short: "Langhantel-Bankdrücken" → "Bankdrücken". */
function shortName(name: string) {
  const parts = name.split('-');
  return parts.length > 1 && parts.at(-1)!.length > 4 ? parts.at(-1)![0].toUpperCase() + parts.at(-1)!.slice(1) : name.split(',')[0];
}

function SetLine({ item, entry, index, previous, active, onPress, onRemove }: { item: SessionExercise; entry: SetDraft; index: number; previous?: SetDraft; active: boolean; onPress: () => void; onRemove: () => void }) {
  const { tracking } = item.exercise;
  const outcome = entry.confirmed ? setOutcome(tracking, entry, previous) : null;
  const status = !outcome ? (active ? 'aktiv' : 'offen') : outcome.kind === 'pr' ? 'neuer Rekord' : outcome.kind === 'stronger' ? `stärker, ${outcome.delta}` : 'erledigt';
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Satz ${index + 1}, vorher ${shortSet(tracking, previous)}, heute ${shortSet(tracking, entry)}, ${status}`}
    accessibilityActions={entry.confirmed ? undefined : [{ name: 'remove', label: 'Satz entfernen' }]} onAccessibilityAction={(event) => { if (event.nativeEvent.actionName === 'remove') onRemove(); }}
    onPress={onPress} onLongPress={entry.confirmed ? undefined : onRemove} style={[styles.line, entry.confirmed && styles.lineDone, active && styles.lineActive]}>
    <Text style={[styles.cell, styles.colSet, styles.setNumber]}>{index + 1}</Text>
    <Text numberOfLines={1} style={[styles.cell, styles.colValue, styles.previous]}>{shortSet(tracking, previous)}</Text>
    <Text numberOfLines={1} style={[styles.cell, styles.colValue, styles.today]}>{shortSet(tracking, entry)}</Text>
    <View style={styles.colStatus}>
      {outcome?.kind === 'pr' ? <View style={[styles.tag, styles.prTag]}><Text style={[styles.tagText, styles.prTagText]}>PR</Text></View>
        : outcome?.kind === 'stronger' ? <View style={styles.tag}><Text numberOfLines={1} style={styles.tagText}>{outcome.delta}</Text></View>
        : outcome ? <Ionicons accessible={false} name="checkmark" size={18} color={T.color.accentLight} />
        : <Ionicons accessible={false} name={active ? 'radio-button-on' : 'ellipse-outline'} size={16} color={active ? T.color.accent : T.color.inkMuted} />}
    </View>
  </Pressable>;
}

function Stepper({ label, value, integer, onStep, onChange }: { label: string; value: string; integer: boolean; onStep: (direction: 1 | -1) => void; onChange: (text: string) => void }) {
  return <View style={styles.stepper}>
    <Text numberOfLines={1} style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} verringern`} onPress={() => onStep(-1)} style={styles.stepButton}><Ionicons accessible={false} name="remove" size={20} color={T.color.ink} /></Pressable>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChange} keyboardType={integer ? 'number-pad' : 'decimal-pad'} inputMode={integer ? 'numeric' : 'decimal'} selectTextOnFocus maxLength={8} placeholder="–" placeholderTextColor={T.color.inkMuted} style={styles.stepValue} />
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} erhöhen`} onPress={() => onStep(1)} style={styles.stepButton}><Ionicons accessible={false} name="add" size={20} color={T.color.ink} /></Pressable>
    </View>
  </View>;
}

function BigButton({ label, icon, onPress }: { label: string; icon: 'add' | 'checkmark' | 'flag' | 'arrow-forward'; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.big}>
    <Text numberOfLines={1} style={styles.bigText}>{label}</Text>
    <Ionicons accessible={false} name={icon} size={20} color={T.color.onAccent} />
  </Pressable>;
}

function SaveRetry() {
  return <Pressable accessibilityRole="button" onPress={() => void workoutStore.getState().flush()} style={styles.warning}>
    <Text accessibilityRole="alert" style={styles.warningText}>Noch nicht gespeichert. Zum Wiederholen tippen.</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { flexShrink: 1, marginHorizontal: T.space.s, paddingTop: T.space.l, paddingHorizontal: T.space.l, borderTopLeftRadius: T.radius.card, borderTopRightRadius: T.radius.card, backgroundColor: T.color.surface, borderWidth: T.border, borderBottomWidth: 0, borderColor: T.color.cardBorder, gap: T.space.s },
  endingCard: { flex: 1 },
  grow: { flexGrow: 1 },
  // The chip row never shrinks; only the set table gives up height.
  chipRow: { flexGrow: 0, flexShrink: 0 },
  chips: { gap: T.space.s, paddingBottom: T.space.xs },
  chip: { minHeight: T.touch, flexDirection: 'row', alignItems: 'center', gap: T.space.xs, paddingHorizontal: T.space.m, borderRadius: T.radius.chip, borderWidth: 1.5, borderColor: T.color.cardBorder, backgroundColor: T.color.glass },
  chipActive: { borderColor: T.color.accent, backgroundColor: T.color.accentWash },
  chipText: { fontFamily: T.font.label, fontSize: 13, color: T.color.ink, maxWidth: 160 },
  chipCount: { fontFamily: T.font.body, color: T.color.inkSoft, fontVariant: ['tabular-nums'] },
  chipAdd: { borderStyle: 'dashed', borderColor: T.color.accentBorder, backgroundColor: 'transparent' },
  chipAddText: { color: T.color.accentLight },
  exerciseName: { fontFamily: T.font.title, fontSize: 20, lineHeight: 25, color: T.color.ink },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: T.space.s, marginTop: T.space.xs },
  headCell: { fontFamily: T.font.label, fontSize: 10, letterSpacing: 0.8, color: T.color.inkMuted },
  table: { flexGrow: 0, flexShrink: 1 },
  line: { flexDirection: 'row', alignItems: 'center', minHeight: T.touch, paddingHorizontal: T.space.s, marginBottom: T.space.xs, borderRadius: T.radius.tile, borderWidth: 1.5, borderColor: 'transparent' },
  lineDone: { backgroundColor: T.color.accentWash },
  lineActive: { borderColor: T.color.accent },
  cell: { fontFamily: T.font.body, fontSize: 15, color: T.color.ink, fontVariant: ['tabular-nums'] },
  colSet: { width: 44 },
  colValue: { flex: 1, minWidth: 0 },
  colStatus: { width: 76, alignItems: 'flex-end', justifyContent: 'center' },
  setNumber: { fontFamily: T.font.label, color: T.color.inkSoft },
  previous: { color: T.color.inkMuted },
  today: { fontFamily: T.font.label },
  tag: { maxWidth: 76, paddingHorizontal: T.space.s, paddingVertical: T.space.xxs, borderRadius: T.radius.pill, borderWidth: T.border, borderColor: T.color.accentBorder },
  tagText: { fontFamily: T.font.label, fontSize: 11, color: T.color.accentLight },
  prTag: { backgroundColor: T.color.accent, borderColor: T.color.accent },
  prTagText: { color: T.color.onAccent },
  addSet: { flexDirection: 'row', alignItems: 'center', gap: T.space.xs, minHeight: T.touch, paddingHorizontal: T.space.s },
  addSetText: { fontFamily: T.font.label, fontSize: 14, color: T.color.accentLight },
  steppers: { flexDirection: 'row', gap: T.space.m },
  stepper: { flex: 1, gap: T.space.xs },
  stepperLabel: { fontFamily: T.font.meta, fontSize: 12, color: T.color.inkSoft },
  stepperRow: { flexDirection: 'row', alignItems: 'center', borderRadius: T.radius.tile, backgroundColor: T.color.glass, borderWidth: T.border, borderColor: T.color.glassBorder },
  stepButton: { width: T.touch, height: T.touch + 4, alignItems: 'center', justifyContent: 'center' },
  stepValue: { flex: 1, minWidth: 0, textAlign: 'center', fontFamily: T.font.hero, fontSize: 20, color: T.color.ink, fontVariant: ['tabular-nums'], paddingVertical: 0 },
  big: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: T.space.s, borderRadius: T.radius.card, backgroundColor: T.color.accent, marginTop: T.space.xs, paddingHorizontal: T.space.l },
  bigText: { flexShrink: 1, fontFamily: T.font.title, fontSize: 17, color: T.color.onAccent },
  error: { fontFamily: T.font.body, fontSize: 13, color: T.color.accentLight },
  warning: { paddingVertical: T.space.s },
  warningText: { fontFamily: T.font.body, fontSize: 13, color: T.color.ink },
  emptyTitle: { fontFamily: T.font.title, fontSize: 20, color: T.color.ink },
  meta: { fontFamily: T.font.meta, fontSize: 13, lineHeight: 19, color: T.color.inkSoft },
  journal: { gap: T.space.l, paddingBottom: T.space.l },
  footer: { gap: T.space.xs, paddingTop: T.space.m, borderTopWidth: T.border, borderTopColor: T.color.cardBorder },
  finishTitle: { fontFamily: T.font.title, fontSize: 18, color: T.color.ink },
  finishActions: { flexDirection: 'row', flexWrap: 'wrap', gap: T.space.s, marginTop: T.space.s },
});

// ---------- Diary set row (used by the journal screen; unchanged behaviour) ----------

type SetActions = Pick<ReturnType<typeof workoutStore.getState>, 'editSet' | 'confirmSet' | 'removeSet'>;
export function SetRow({ item, entry, index, onFocus, onConfirmed, actions = workoutStore.getState() }: { item: SessionExercise; entry: SetDraft; index: number; onFocus: (rowY: number) => void; onConfirmed?: () => void; actions?: SetActions }) {
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const rowY = useRef(0);
  return <View onLayout={(event) => { rowY.current = event.nativeEvent.layout.y; }}>
    <View style={[legacy.row, entry.confirmed && legacy.confirmed]}>
      <Text style={[legacy.setNumber, legacy.number]}>{index + 1}</Text>
      {ENTRY_FIELDS[item.exercise.tracking].map((field) => <TextInput key={field.key} accessibilityLabel={`${item.exercise.name}, ${item.exercise.tracking === 'cardio' ? 'Eintrag' : 'Satz'} ${index + 1}, ${field.key === 'assistanceKg' ? 'Unterstützung in kg' : field.label}${field.optional ? ', optional' : ''}`} value={entry.values[field.key] ?? ''} onChangeText={(value) => { setError(null); actions.editSet(item.exercise.id, entry.id, field.key, value); }} onFocus={() => onFocus(rowY.current)} keyboardType={field.integer ? 'number-pad' : 'decimal-pad'} inputMode={field.integer ? 'numeric' : 'decimal'} selectTextOnFocus maxLength={16} placeholder="–" placeholderTextColor={Berkk.inkMuted} style={legacy.value} />)}
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: entry.confirmed }} accessibilityLabel={`${item.exercise.tracking === 'cardio' ? 'Eintrag' : 'Satz'} ${index + 1} ${entry.confirmed ? 'Bestätigung zurücknehmen' : 'bestätigen'}`} onPress={() => {
        const nextError = actions.confirmSet(item.exercise.id, entry.id);
        setError(nextError);
        if (!nextError && !entry.confirmed) onConfirmed?.();
      }} style={({ pressed }) => [legacy.confirm, entry.confirmed && legacy.checked, pressed && { opacity: 0.7 }]}><Ionicons name="checkmark" size={22} color={entry.confirmed ? Berkk.ctaInk : Berkk.ink} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Zeile ${index + 1} entfernen`} style={legacy.remove} onPress={() => { if (!actions.removeSet(item.exercise.id, entry.id)) setRemoving(true); }}><Ionicons name="close" size={18} color={Berkk.inkSecondary} /></Pressable>
    </View>
    {error && <Text accessibilityRole="alert" style={legacy.error}>{error}</Text>}
    {removing && <View style={legacy.deletePrompt}><Text style={legacy.meta}>Erfasste Zeile wirklich entfernen?</Text><View style={legacy.finishActions}><Pressable accessibilityRole="button" onPress={() => setRemoving(false)} style={legacy.end}><Text style={legacy.buttonText}>Behalten</Text></Pressable><Pressable accessibilityRole="button" onPress={() => actions.removeSet(item.exercise.id, entry.id, true)} style={legacy.end}><Text style={legacy.buttonText}>Entfernen</Text></Pressable></View></View>}
  </View>;
}
const legacy = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  number: { width: 24, textAlign: 'center' },
  setNumber: { color: Berkk.inkSecondary, fontSize: 14, fontFamily: BerkkFonts.medium },
  value: { flex: 1, minWidth: 0, minHeight: 48, borderRadius: 10, textAlign: 'center', paddingHorizontal: 4, fontSize: 18, fontFamily: BerkkFonts.medium, color: Berkk.ink, backgroundColor: Berkk.glassGradient[2], fontVariant: ['tabular-nums'] },
  confirmed: { backgroundColor: Berkk.glassGradient[2], borderRadius: 12 },
  confirm: { width: 46, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Berkk.glassBorder },
  checked: { backgroundColor: Berkk.ink },
  remove: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  error: { color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 13, paddingVertical: 6 },
  deletePrompt: { padding: 12, borderBottomColor: Berkk.divider, borderBottomWidth: 1 },
  meta: { color: Berkk.inkSecondary, fontSize: 13, lineHeight: 19, fontFamily: BerkkFonts.regular, marginTop: 4 },
  finishActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  end: { minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  buttonText: { fontFamily: BerkkFonts.medium, fontSize: 14, color: Berkk.ink },
});
