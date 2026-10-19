import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { useDetailSheet } from './detail-sheet';
import { DiaryAction } from './diary-action';
import { DiaryField } from './diary-field';
import { useWorkoutSaveFeedback } from './workout-save-feedback';
import { ExerciseSearch } from './exercise-search';
import { FEELINGS, FeelingGhost, FeelingPicker } from './feeling-picker';
import { finishFeedback } from './ghost-state';
import { SetRow } from './workout-recorder';
import { useWorkoutLauncher } from './workout-timer-overlay';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { completedSetCount, dayDate, formatDay, localDay, trainingStreak, workoutDay } from '@/data/calendar';
import type { Exercise } from '@/data/exercises';
import { describeEntry, ENTRY_FIELDS, entryError, parseEntryNumber, type SetDraft } from '@/data/workout-records';
import { workoutStore } from '@/store/workout';
import type { SessionExercise, WorkoutFeeling } from '@/store/workout-state';

const toDateText = (date: string) => date.split('-').reverse().join('.');
let draftSequence = 0;
const blank = (): SetDraft => ({ id: `diary-${Date.now()}-${++draftSequence}`, values: {}, confirmed: false });
const fromDateText = (text: string) => {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text.trim());
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : '';
};
export function WorkoutJournal({ mode, id, date }: { mode: 'history' | 'plan'; id?: number; date?: string }) {
  const planning = mode === 'plan';
  const history = useStore(workoutStore, (state) => state.history);
  const plans = useStore(workoutStore, (state) => state.plans);
  const session = useStore(workoutStore, (state) => state.session);
  const existingHistory = planning ? undefined : history.find((item) => item.id === id);
  const existingPlan = planning ? plans.find((item) => item.id === id) : undefined;
  const existing = existingHistory ?? existingPlan;
  const initialDate = existingHistory ? workoutDay(existingHistory) : existingPlan?.localDate ?? (date && dayDate(date) ? date : localDay());
  const [editing, setEditing] = useState(id === undefined);
  const [name, setName] = useState(existing?.name || (planning ? '' : 'Workout'));
  const [dateText, setDateText] = useState(toDateText(initialDate));
  const [duration, setDuration] = useState(existingHistory ? String(Math.max(1, Math.round((existingHistory.endedAt - existingHistory.startedAt) / 60000))) : '');
  const [note, setNote] = useState(existingHistory?.note ?? '');
  const [feeling, setFeeling] = useState<WorkoutFeeling | undefined>(existingHistory?.feeling);
  const [exercises, setExercises] = useState<SessionExercise[]>(existingHistory?.exercises ?? existingPlan?.exercises.map((exercise) => ({ exercise, sets: [] })) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeExercise, setRemoveExercise] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const focusedY = useRef(0);
  const keyboardShown = useRef(false);
  const [nativeKeyboardOpen, setNativeKeyboardOpen] = useState(false);
  const fieldY = useRef<Record<string, number>>({});
  const journalY = useRef(0);
  const notifySaved = useWorkoutSaveFeedback();
  const focusField = (field: string) => {
    focusedY.current = Math.max(0, (field === 'note' ? journalY.current : 0) + (fieldY.current[field] ?? 0) - 12);
    if (Platform.OS !== 'web' && keyboardShown.current) scroll.current?.scrollTo({ y: focusedY.current, animated: false });
  };
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => { keyboardShown.current = true; setNativeKeyboardOpen(true); scroll.current?.scrollTo({ y: focusedY.current, animated: false }); });
    const hide = Keyboard.addListener('keyboardDidHide', () => { keyboardShown.current = false; setNativeKeyboardOpen(false); });
    return () => { show.remove(); hide.remove(); };
  }, []);
  const navigation = useNavigation();
  const launcher = useWorkoutLauncher();
  const { present } = useDetailSheet();
  const close = () => { if (router.canGoBack()) router.back(); else router.replace('/plan'); };
  usePreventRemove(dirty && !saved, ({ data }) => setLeave(() => () => navigation.dispatch(data.action)));
  const change = () => { setDirty(true); setError(null); };
  const changeSets = (exerciseId: string, transform: (sets: SetDraft[]) => SetDraft[]) => {
    change(); setExercises((items) => items.map((item) => item.exercise.id === exerciseId ? { ...item, sets: transform(item.sets) } : item));
  };
  const addExercise = (exercise: Exercise) => {
    change(); setExercises((items) => items.some((item) => item.exercise.id === exercise.id) ? items : [...items, { exercise, sets: planning ? [] : [blank()] }]);
  };
  const recent = [...history].sort((a, b) => b.startedAt - a.startedAt).flatMap((item) => item.exercises).filter((item, index, all) => all.findIndex((other) => other.exercise.id === item.exercise.id) === index).slice(0, 5);
  const search = () => { Keyboard.dismiss(); present({ title: 'Übung hinzufügen', layout: 'full', content: <ExerciseSearch context={planning ? 'plan' : 'diary'} selectedIds={exercises.map((item) => item.exercise.id)} onSelect={addExercise} /> }); };
  const save = async () => {
    if (busy.current) return;
    Keyboard.dismiss(); busy.current = true; setSaving(true); setError(null);
    const day = fromDateText(dateText);
    if (!dayDate(day)) { setError('Datum bitte als TT.MM.JJJJ eingeben.'); setSaving(false); busy.current = false; return; }
    const today = localDay();
    const streakBefore = trainingStreak(workoutStore.getState().history, today);
    const result = planning
      ? await workoutStore.getState().savePlan({ id, name, localDate: day, exercises: exercises.map((item) => item.exercise) })
      : await workoutStore.getState().saveHistory({ id, name, localDate: day, durationMinutes: parseEntryNumber(duration) ?? 0, exercises, note, feeling });
    setSaving(false); busy.current = false;
    if (result) setError(result);
    // A backfilled day can really extend the streak; a plan never does.
    else { notifySaved(planning ? { message: 'Planung gespeichert', reaction: 'confirm' } : finishFeedback(streakBefore, trainingStreak(workoutStore.getState().history, today))); setSaved(true); setDirty(false); setTimeout(close, 0); }
  };
  const deletePlan = async () => {
    if (id === undefined || busy.current) return;
    busy.current = true; setSaving(true);
    const ok = await workoutStore.getState().removePlan(id);
    busy.current = false; setSaving(false);
    if (ok) { setSaved(true); setDirty(false); setTimeout(close, 0); }
    else setError('Entfernen fehlgeschlagen. Bitte erneut versuchen.');
  };
  const header = <View style={styles.toolbar}>
    <Pressable accessibilityRole="button" accessibilityLabel="Zurück zum Kalender" disabled={saving} onPress={close} style={styles.icon}><Ionicons accessible={false} aria-hidden name="chevron-back" color={Berkk.ink} size={24} /></Pressable>
    <Text accessibilityRole="header" style={styles.toolbarTitle}>{planning ? (id === undefined ? 'Workout planen' : 'Deine Planung') : (id === undefined ? 'Workout nachtragen' : 'Trainingstagebuch')}</Text>
    {id !== undefined && !editing && <Pressable accessibilityRole="button" onPress={() => setEditing(true)} style={styles.edit}><Text style={styles.link}>Bearbeiten</Text></Pressable>}
  </View>;
  return <LinearGradient colors={Berkk.detailGradient} locations={[0, 0.4, 1]} style={styles.root}><SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}><KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    {header}
    {id !== undefined && !existing && !saved ? <View style={styles.content}><Text style={styles.title}>Eintrag nicht mehr verfügbar.</Text><Text style={styles.meta}>Die Planung wurde möglicherweise bereits gestartet oder entfernt.</Text></View> : <>
      <ScrollView ref={scroll} style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
        onLayout={() => { if (keyboardShown.current) scroll.current?.scrollTo({ y: focusedY.current, animated: false }); }}>
        {editing ? <>
          <DiaryField label="Workout-Name" value={name} onChangeText={(value) => { change(); setName(value); }} placeholder={planning ? 'z. B. Oberkörper' : 'Name deines Workouts'}
            onLayout={(event) => { fieldY.current.name = event.nativeEvent.layout.y; }} onFocus={() => focusField('name')} />
          <View style={styles.fields}><View style={styles.root}><Field label="Datum"><TextInput accessibilityLabel="Datum, TT.MM.JJJJ" value={dateText} onChangeText={(value) => { change(); setDateText(value); }} style={styles.input} placeholder="TT.MM.JJJJ" placeholderTextColor={Berkk.inkSecondary} keyboardType="numbers-and-punctuation" maxLength={10} /></Field></View>{!planning && <View style={styles.root}><Field label="Dauer, ca. Minuten"><TextInput accessibilityLabel="Dauer in Minuten" value={duration} onChangeText={(value) => { change(); setDuration(value); }} style={styles.input} placeholder="z. B. 45" placeholderTextColor={Berkk.inkSecondary} keyboardType="decimal-pad" maxLength={6} /></Field></View>}</View>
        </> : <View style={styles.summary}>
          <Text style={styles.title}>{existing?.name || 'Workout'}</Text>
          <Text style={styles.meta}>{formatDay(initialDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          <Text style={styles.summaryMeta}>{planning ? 'Geplant' : `${Math.round((existingHistory!.endedAt - existingHistory!.startedAt) / 60000)} Minuten · ${completedSetCount(existingHistory!)} ${completedSetCount(existingHistory!) === 1 ? 'Satz' : 'Sätze'}`}</Text>
        </View>}
        <View style={styles.sectionHeader}><Text accessibilityRole="header" style={styles.sectionTitle}>Übungen{planning && editing ? ' · optional' : ''}</Text><Text style={styles.meta}>{exercises.length}</Text></View>
        {editing && !planning && <Text style={styles.hint}>Trage deine tatsächlichen Werte ein und bestätige jeden absolvierten Satz.</Text>}
        {exercises.map((item) => <View key={item.exercise.id} style={styles.exercise}>
          <View style={styles.exerciseHeader}><View style={styles.root}><Text style={styles.exerciseName}>{item.exercise.name}</Text><Text style={styles.meta}>{item.exercise.muscle} · {item.exercise.equipment}</Text></View>{editing && <Pressable accessibilityRole="button" accessibilityLabel={`${item.exercise.name} entfernen`} style={styles.icon} onPress={() => { if (item.sets.some((entry) => entry.confirmed || Object.values(entry.values).some(Boolean))) setRemoveExercise(item.exercise.id); else { change(); setExercises((items) => items.filter((row) => row.exercise.id !== item.exercise.id)); } }}><Ionicons accessible={false} aria-hidden name="close" color={Berkk.inkSecondary} size={20} /></Pressable>}</View>
          {!planning && (editing ? <>
            <View style={styles.columnLabels}><Text style={[styles.hint, { width: 24 }]}>Nr.</Text>{ENTRY_FIELDS[item.exercise.tracking].map((field) => <Text key={field.key} style={[styles.hint, { flex: 1, textAlign: 'center' }]}>{field.label}</Text>)}<Text style={[styles.hint, { width: 46, textAlign: 'center' }]}>Fertig</Text><View style={{ width: 44 }} /></View>
            {item.sets.map((entry, index) => <SetRow key={entry.id} item={item} entry={entry} index={index} onFocus={() => {}} actions={{
              editSet: (exerciseId, setId, key, value) => changeSets(exerciseId, (sets) => sets.map((row) => row.id === setId ? { ...row, values: { ...row.values, [key]: value }, confirmed: false } : row)),
              confirmSet: (exerciseId, setId) => { const row = item.sets.find((value) => value.id === setId)!; const error = row.confirmed ? null : entryError(item.exercise.tracking, row); if (error) return error; changeSets(exerciseId, (sets) => sets.map((value) => value.id === setId ? { ...value, confirmed: !value.confirmed } : value)); return null; },
              removeSet: (exerciseId, setId, approved) => { const row = item.sets.find((value) => value.id === setId); if (!row || (!approved && (row.confirmed || Object.values(row.values).some(Boolean)))) return false; changeSets(exerciseId, (sets) => sets.filter((value) => value.id !== setId)); return true; },
            }} />)}
            <Pressable accessibilityRole="button" accessibilityLabel={`${item.exercise.name}: Satz hinzufügen`} onPress={() => changeSets(item.exercise.id, (sets) => [...sets, blank()])} style={styles.action}><Ionicons accessible={false} aria-hidden name="add" size={19} color={Berkk.link} /><Text style={styles.link}>Satz hinzufügen</Text></Pressable>
            {item.sets.every((entry) => !entry.confirmed && !Object.values(entry.values).some(Boolean)) && (() => {
              const previous = recent.find((row) => row.exercise.id === item.exercise.id);
              return previous?.sets.length ? <Pressable accessibilityRole="button" onPress={() => changeSets(item.exercise.id, () => previous.sets.map((entry) => ({ ...blank(), values: { ...entry.values } })))} style={styles.suggestion}><Text style={styles.link}>Letzte Werte als Vorschlag</Text><Text style={styles.hint}>{previous.sets.length} Sätze · {describeEntry(item.exercise.tracking, previous.sets[0])} · Danach einzeln bestätigen.</Text></Pressable> : null;
            })()}
          </> : item.sets.map((entry, index) => <View key={entry.id} style={styles.savedSet}><Text style={styles.setNumber}>{index + 1}</Text><Text style={styles.setText}>{describeEntry(item.exercise.tracking, entry)}</Text><Ionicons accessible={false} aria-hidden name="checkmark" size={17} color={Berkk.link} /></View>))}
          {removeExercise === item.exercise.id && <View style={styles.prompt}><Text style={styles.meta}>Übung mit allen Sätzen entfernen?</Text><View style={styles.fields}><Pressable accessibilityRole="button" style={styles.action} onPress={() => setRemoveExercise(null)}><Text style={styles.link}>Behalten</Text></Pressable><Pressable accessibilityRole="button" style={styles.action} onPress={() => { change(); setExercises((items) => items.filter((row) => row.exercise.id !== item.exercise.id)); setRemoveExercise(null); }}><Text style={styles.link}>Entfernen</Text></Pressable></View></View>}
        </View>)}
        {!exercises.length && <Text style={styles.meta}>{planning ? 'Du kannst deine Übungen auch beim Training auswählen.' : 'Hier finden deine Übungen und Sätze Platz.'}</Text>}
        {editing && <><Pressable accessibilityRole="button" onPress={search} style={styles.addExercise}><Ionicons accessible={false} aria-hidden name="add" size={22} color={Berkk.link} /><Text style={styles.link}>Übung hinzufügen</Text></Pressable>
          {!!recent.length && <View><Text style={styles.hint}>Zuletzt verwendet</Text><ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recent}>{recent.filter((item) => !exercises.some((row) => row.exercise.id === item.exercise.id)).map((item) => <Pressable key={item.exercise.id} accessibilityRole="button" onPress={() => addExercise(item.exercise)} style={styles.recentItem}><Text style={styles.small}>{item.exercise.name}</Text></Pressable>)}</ScrollView></View>}
        </>}
        {!planning && <View style={styles.journal} onLayout={(event) => { journalY.current = event.nativeEvent.layout.y; }}>
          {editing ? <FeelingPicker value={feeling} onChange={(value) => { change(); setFeeling(value); }} /> : <View style={styles.feeling}><FeelingGhost feeling={feeling ?? 'normal'} selected={!!feeling} size={56} /><View><Text style={styles.sectionTitle}>{feeling ? FEELINGS[feeling] : 'Kein Gefühl eingetragen'}</Text><Text style={styles.meta}>Dein Gefühl nach dem Training</Text></View></View>}
          {editing ? <DiaryField label="Private Notiz" multiline value={note} onChangeText={(value) => { change(); setNote(value); }}
            onLayout={(event) => { fieldY.current.note = event.nativeEvent.layout.y; }} onFocus={() => focusField('note')} /> : <Field label="Private Notiz"><Text style={styles.noteText}>{note || 'Keine Notiz hinterlegt.'}</Text></Field>}
          <Text style={styles.hint}>Nur für dich · auf diesem Gerät gespeichert.</Text>
        </View>}
        {planning && id !== undefined && !editing && <>
          {session ? <Text style={styles.meta}>Ein Workout läuft bereits. Beende es, bevor du diese Planung startest.</Text> : <Pressable accessibilityRole="button" onPress={() => launcher.start(null, id)} style={styles.addExercise}><Ionicons accessible={false} aria-hidden name="play-outline" size={22} color={Berkk.link} /><Text style={styles.link}>Jetzt als Workout starten</Text></Pressable>}
          <Pressable accessibilityRole="button" onPress={() => setRemoving(true)} style={styles.action}><Ionicons accessible={false} aria-hidden name="trash-outline" size={18} color={Berkk.inkSecondary} /><Text style={styles.small}>Planung entfernen</Text></Pressable>
          {removing && <View style={styles.prompt}><Text style={styles.sectionTitle}>Planung entfernen?</Text><Text style={styles.meta}>{existingPlan?.name} am {formatDay(initialDate)}</Text><View style={styles.fields}><Pressable accessibilityRole="button" disabled={saving} onPress={() => setRemoving(false)} style={styles.action}><Text style={styles.link}>Behalten</Text></Pressable><Pressable accessibilityRole="button" disabled={saving} onPress={() => void deletePlan()} style={styles.action}><Text style={styles.link}>Endgültig entfernen</Text></Pressable></View></View>}
        </>}
      </ScrollView>
      {leave ? <View style={styles.footer}><Text style={styles.sectionTitle}>Änderungen verwerfen?</Text><Text style={styles.meta}>Deine letzten Eingaben sind noch nicht gespeichert.</Text><View style={styles.fields}><Pressable accessibilityRole="button" onPress={() => setLeave(null)} style={styles.action}><Text style={styles.link}>Weiter bearbeiten</Text></Pressable><Pressable accessibilityRole="button" onPress={leave} style={styles.action}><Text style={styles.link}>Verwerfen</Text></Pressable></View></View> : !nativeKeyboardOpen && <View style={styles.footer}>
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {editing && <DiaryAction disabled={saving} label={planning ? 'Planung speichern' : 'Workout speichern'} onPress={() => void save()} surfaceStyle={{ padding: 0 }}><LinearGradient colors={Berkk.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.35 }} style={[styles.save, { flex: 1 }]}><Text style={styles.saveText}>{saving ? 'Speichert …' : planning ? 'Planung speichern' : 'Workout speichern'}</Text><Ionicons accessible={false} aria-hidden name="arrow-forward" size={22} color={Berkk.ctaInk} /></LinearGradient></DiaryAction>}
      </View>}
    </>}
  </KeyboardAvoidingView></SafeAreaView></LinearGradient>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ gap: 9 }}><Text style={styles.label}>{label}</Text>{children}</View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, page: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' }, toolbar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12 }, toolbarTitle: { flex: 1, fontFamily: BerkkFonts.semibold, fontSize: 17, color: Berkk.ink }, icon: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' }, edit: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 10 },
  content: { padding: 24, paddingTop: 18, paddingBottom: 40, gap: 20 }, title: { color: Berkk.ink, fontFamily: BerkkFonts.black, fontSize: 32, letterSpacing: -0.8 }, summary: { paddingVertical: 12, gap: 6 }, summaryMeta: { fontFamily: BerkkFonts.medium, color: Berkk.link, fontSize: 15, marginTop: 10 },
  fields: { flexDirection: 'row', gap: 16, justifyContent: 'space-between' }, label: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.medium, fontSize: 13 }, input: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Berkk.glassBorder, backgroundColor: Berkk.glassGradient[2], color: Berkk.ink, fontFamily: BerkkFonts.regular, fontSize: 16 }, note: { minHeight: 110, textAlignVertical: 'top' }, noteText: { color: Berkk.ink, fontFamily: BerkkFonts.regular, fontSize: 15, lineHeight: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }, sectionTitle: { color: Berkk.ink, fontFamily: BerkkFonts.semibold, fontSize: 18 }, meta: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 13, lineHeight: 20, marginTop: 4 }, hint: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 12, lineHeight: 18 }, small: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.medium, fontSize: 13 },
  exercise: { paddingBottom: 14, borderBottomColor: Berkk.divider, borderBottomWidth: 1 }, exerciseHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 12 }, exerciseName: { color: Berkk.ink, fontFamily: BerkkFonts.semibold, fontSize: 17 }, columnLabels: { flexDirection: 'row', gap: 6 }, action: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }, link: { color: Berkk.link, fontFamily: BerkkFonts.semibold, fontSize: 14 }, addExercise: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10 }, suggestion: { paddingVertical: 12, gap: 4 }, recent: { gap: 8, paddingVertical: 8 }, recentItem: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: Berkk.glassGradient[2] },
  savedSet: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 }, setNumber: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.medium, fontSize: 13, width: 22 }, setText: { flex: 1, color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 15 }, journal: { gap: 24, paddingTop: 12 }, feeling: { flexDirection: 'row', alignItems: 'center', gap: 14 }, prompt: { paddingVertical: 12, gap: 8 },
  footer: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12, backgroundColor: Berkk.detailGradient[2] }, save: { minHeight: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }, saveText: { color: Berkk.ctaInk, fontFamily: BerkkFonts.bold, fontSize: 17 }, error: { color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 13, lineHeight: 20, paddingBottom: 12 },
});
