import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { DetailDragHeader, useDetailMotion, useDetailSheet } from '@/components/berkk/detail-sheet';
import { ExerciseFilterButton, ExerciseFilterOptions } from '@/components/berkk/exercise-filters';
import { ExerciseResultRow } from '@/components/berkk/exercise-result-row';
import { Berkk, BerkkFonts } from '@/constants/theme';
import { EQUIPMENT, EXERCISES, MUSCLE_GROUPS, searchExercises, TRACKING_TYPES, type Equipment, type Exercise, type MuscleGroup, type TrackingType } from '@/data/exercises';
import { recentExercises } from '@/data/recent-exercises';
import { lastTimeLabel } from '@/lib/lock-in';
import { useExerciseReducedMotion } from '@/hooks/use-exercise-reduced-motion';
import { workoutStore } from '@/store/workout';

export function ExerciseSearch({ onSelect, context = 'live', selectedIds = [], showLastTime = false }: { onSelect: (exercise: Exercise) => void; context?: 'live' | 'diary' | 'plan'; selectedIds?: string[]; showLastTime?: boolean }) {
  const { dismiss } = useDetailSheet();
  const { sheetHeight } = useDetailMotion();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useExerciseReducedMotion();
  const custom = useStore(workoutStore, (state) => state.customExercises);
  const session = useStore(workoutStore, (state) => state.session);
  const history = useStore(workoutStore, (state) => state.history);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [muscle, setMuscle] = useState<MuscleGroup>();
  const [equipment, setEquipment] = useState<Equipment>();
  const [filter, setFilter] = useState<'muscle' | 'equipment'>();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MuscleGroup>('Brust');
  const [gear, setGear] = useState<Equipment>('Langhantel');
  const [tracking, setTracking] = useState<TrackingType>('strength');
  const [feedback, setFeedback] = useState<{ id: string; kind: 'added' | 'opened' }>();
  const selecting = useRef(false);
  const catalog = useMemo(() => [...EXERCISES, ...custom], [custom]);
  const results = useMemo(() => searchExercises(catalog, query, muscle, equipment), [catalog, query, muscle, equipment]);
  const recent = useMemo(() => recentExercises(history, catalog), [history, catalog]);
  const showRecent = !query.trim() && !muscle && !equipment && recent.length > 0;
  const presentIds = useMemo(() => new Set(context === 'live' ? session?.exercises.map((entry) => entry.exercise.id) : selectedIds), [context, selectedIds, session?.exercises]);

  const select = useCallback((exercise: Exercise) => {
    if (selecting.current) return;
    selecting.current = true;
    const kind = presentIds.has(exercise.id) ? 'opened' : 'added';
    setFeedback({ id: exercise.id, kind });
    Keyboard.dismiss();
    // Same immediate selection and dismissal as before; feedback owns no data.
    onSelect(exercise);
    AccessibilityInfo.announceForAccessibility(`${exercise.name} ${kind === 'opened' ? 'geöffnet' : 'hinzugefügt'}`);
    dismiss();
  }, [dismiss, onSelect, presentIds]);
  const openFilter = (next: 'muscle' | 'equipment') => {
    Keyboard.dismiss();
    setFilter((current) => current === next ? undefined : next);
  };
  const row = (exercise: Exercise) => <ExerciseResultRow exercise={exercise} present={presentIds.has(exercise.id)} detail={showLastTime ? lastTimeLabel(history, exercise) : undefined}
    feedback={feedback?.id === exercise.id ? feedback.kind : undefined} reduced={reduced} compact={width < 360} onSelect={select} />;

  return (
    <KeyboardAvoidingView testID="exercise-search" style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={height - sheetHeight}>
      <LinearGradient colors={[Berkk.backgroundGradient[3], Berkk.detailGradient[2], Berkk.backgroundGradient[5]]}
        locations={[0, 0.25, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
      <DetailDragHeader>
        <View style={styles.handle} />
        <View style={styles.toolbar}>
          <Text accessibilityRole="header" style={styles.title}>{creating ? 'Eigene Übung' : 'Übung hinzufügen'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Übungssuche schließen" onPress={dismiss} style={styles.icon}>
            <Ionicons accessible={false} name="close" size={23} color={Berkk.ink} />
          </Pressable>
        </View>
      </DetailDragHeader>
      {creating ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable accessibilityRole="button" onPress={() => setCreating(false)} style={styles.action}><Text style={styles.meta}>Zurück zur Suche</Text></Pressable>
          <Text style={styles.label}>Name</Text>
          <TextInput accessibilityLabel="Name der eigenen Übung" value={name} onChangeText={setName} maxLength={100} placeholder="Wie heißt deine Übung?" placeholderTextColor={Berkk.inkSecondary} style={styles.input} />
          <Text style={styles.label}>Kategorie</Text>
          <Options values={MUSCLE_GROUPS} value={category} onChange={setCategory} wrap />
          <Text style={styles.label}>Equipment</Text>
          <Options values={EQUIPMENT} value={gear} onChange={setGear} wrap />
          <Text style={styles.label}>Erfassungstyp</Text>
          <View>{(Object.keys(TRACKING_TYPES) as TrackingType[]).map((type) => <Pressable key={type} accessibilityRole="radio" accessibilityState={{ checked: type === tracking }} onPress={() => setTracking(type)} style={[styles.type, type === tracking && styles.selected]}><Text style={styles.body}>{TRACKING_TYPES[type]}</Text></Pressable>)}</View>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !name.trim() }} disabled={!name.trim()} style={[styles.create, !name.trim() && { opacity: 0.4 }]} onPress={() => {
            const exercise = workoutStore.getState().createExercise({ name, englishName: '', aliases: [], muscle: category, secondaryMuscles: [], equipment: gear, tracking });
            if (exercise) select(exercise);
          }}><Text style={styles.body}>Erstellen und hinzufügen</Text></Pressable>
        </ScrollView>

      ) : <>
        <View style={styles.searchArea}>
          <View style={[styles.searchBox, searchFocused && styles.searchFocused]}>
            <Ionicons accessible={false} name="search" size={19} color={Berkk.inkSecondary} />
            <TextInput accessibilityLabel="Übungen suchen" value={query} onChangeText={setQuery} autoCorrect={false}
              placeholder="Übung suchen" placeholderTextColor={Berkk.inkSecondary} returnKeyType="search" onSubmitEditing={Keyboard.dismiss}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={[styles.searchInput, Platform.OS === 'web' && styles.webInput]} />
            {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Suche leeren" onPress={() => setQuery('')} style={styles.clear}>
              <Ionicons accessible={false} name="close-circle" size={19} color={Berkk.inkSecondary} />
            </Pressable>}
          </View>
          <View style={styles.filters}>
            <ExerciseFilterButton title="Muskelgruppe" value={muscle} open={filter === 'muscle'} reduced={reduced} onPress={() => openFilter('muscle')} />
            <ExerciseFilterButton title="Equipment" value={equipment} open={filter === 'equipment'} reduced={reduced} onPress={() => openFilter('equipment')} />
          </View>
          {filter === 'muscle' && <ExerciseFilterOptions title="Muskelgruppe" values={MUSCLE_GROUPS} value={muscle} reduced={reduced}
            onClose={() => setFilter(undefined)} onChange={(value) => { setMuscle(value); setFilter(undefined); }} />}
          {filter === 'equipment' && <ExerciseFilterOptions title="Equipment" values={EQUIPMENT} value={equipment} reduced={reduced}
            onClose={() => setFilter(undefined)} onChange={(value) => { setEquipment(value); setFilter(undefined); }} />}
          <View style={styles.resultsHeading}>
            <Text style={styles.meta}>{results.length} {results.length === 1 ? 'Übung' : 'Übungen'}</Text>
            <Pressable accessibilityRole="button" onPress={() => { setFilter(undefined); setName(query); setCreating(true); }} style={styles.action}>
              <Text style={styles.link}>Eigene Übung erstellen</Text>
            </Pressable>
          </View>
        </View>
        <FlatList testID="exercise-list" style={styles.flex} data={results} keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" initialNumToRender={8} maxToRenderPerBatch={6} windowSize={7}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 12) + 24 }}
          ListHeaderComponent={showRecent ? <View>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Zuletzt verwendet</Text>
            {recent.map((exercise) => <View key={exercise.id}>{row(exercise)}</View>)}
            <Text accessibilityRole="header" style={[styles.sectionTitle, styles.allTitle]}>Alle Übungen</Text>
          </View> : null}
          ListEmptyComponent={<Text style={styles.empty}>Keine passende Übung. Passe Suche oder Filter an oder erstelle eine eigene Übung.</Text>}
          renderItem={({ item }) => row(item)} />
      </>}
    </KeyboardAvoidingView>
  );
}

function Options<T extends string>({ values, value, onChange, all, wrap }: { values: readonly T[]; value?: T; onChange: (value: T) => void; all?: string; wrap?: boolean }) {
  const choices = <>{all && <Pressable accessibilityRole="button" accessibilityState={{ selected: !value }} onPress={() => (onChange as (value: T | undefined) => void)(undefined)} style={[styles.chip, !value && styles.selected]}><Text style={styles.chipText}>{all}</Text></Pressable>}{values.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === value }} onPress={() => onChange(item)} style={[styles.chip, value === item && styles.selected]}><Text style={styles.chipText}>{item}</Text></Pressable>)}</>;
  return wrap ? <View style={styles.wrap}>{choices}</View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chips}>{choices}</ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 }, flex: { flex: 1, minHeight: 0 },
  handle: { width: 32, height: 3, borderRadius: 2, alignSelf: 'center', marginTop: 8, backgroundColor: Berkk.inkFaint },
  toolbar: { paddingLeft: 20, paddingRight: 12, paddingTop: 4, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, minWidth: 0, fontFamily: BerkkFonts.bold, fontSize: 22, lineHeight: 28, color: Berkk.ink, letterSpacing: -0.4 },
  icon: { flexShrink: 0, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  searchArea: { paddingHorizontal: 20 },
  searchBox: { minHeight: 52, paddingLeft: 14, paddingRight: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Berkk.glassGradient[2], borderWidth: 1, borderColor: Berkk.glassBorder },
  searchInput: { flex: 1, minWidth: 0, minHeight: 50, color: Berkk.ink, fontSize: 16, fontFamily: BerkkFonts.regular },
  searchFocused: { borderColor: Berkk.linkPressed },
  webInput: { outlineStyle: 'solid', outlineWidth: 0 },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 4 },
  action: { minHeight: 44, justifyContent: 'center' }, link: { color: Berkk.linkPressed, fontFamily: BerkkFonts.semibold, fontSize: 12, lineHeight: 18 },
  meta: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 12, lineHeight: 17 },
  sectionTitle: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.medium, fontSize: 13, lineHeight: 18, paddingTop: 4, paddingBottom: 4 },
  allTitle: { paddingTop: 20 },
  empty: { color: Berkk.inkSecondary, fontFamily: BerkkFonts.regular, fontSize: 16, lineHeight: 24, paddingVertical: 24 },
  input: { minHeight: 50, borderRadius: 12, paddingHorizontal: 14, color: Berkk.ink, backgroundColor: Berkk.glassGradient[2], borderColor: Berkk.glassBorder, borderWidth: 1, fontSize: 16, fontFamily: BerkkFonts.regular },
  chips: { gap: 6 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, justifyContent: 'center', backgroundColor: Berkk.glassGradient[2] },
  chipText: { color: Berkk.ink, fontSize: 13, fontFamily: BerkkFonts.medium }, selected: { backgroundColor: Berkk.glassGradient[0] },
  form: { paddingHorizontal: 20 }, label: { color: Berkk.ink, fontFamily: BerkkFonts.semibold, fontSize: 16, marginTop: 20, marginBottom: 10 },
  type: { minHeight: 48, justifyContent: 'center', padding: 12, borderRadius: 12, marginBottom: 6 },
  body: { color: Berkk.ink, fontFamily: BerkkFonts.medium, fontSize: 16 },
  create: { minHeight: 54, borderRadius: 14, backgroundColor: Berkk.glassGradient[0], justifyContent: 'center', alignItems: 'center', marginTop: 24 },
});
