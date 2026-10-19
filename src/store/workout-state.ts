import { createStore } from 'zustand/vanilla';

import { EQUIPMENT, EXERCISES, MUSCLE_GROUPS, normalizeSearch, TRACKING_TYPES, type Exercise } from '../data/exercises.ts';
import { ENTRY_FIELDS, entryError, type FieldKey, type SetDraft, type SyncMeta } from '../data/workout-records.ts';
import { completedSetCount, dayDate, localDay } from '../data/calendar.ts';
import { isNewPr, suggestedValues, templateOpponent } from '../lib/lock-in.ts';

export type WorkoutOrigin = { x: number; y: number; width: number; height: number };
export type SessionExercise = { exercise: Exercise; sets: SetDraft[] };
export type WorkoutFeeling = 'weak' | 'normal' | 'strong';
/** `templateId` links a workout to the saved workout it was trained from (VS mode) or saved as. */
type JournalFields = { name?: string; localDate?: string; note?: string; feeling?: WorkoutFeeling; planId?: number; templateId?: string };
/** `free` = exercises added on the go, `vs` = trained from a saved workout against last time. Undefined = not chosen yet. */
export type WorkoutMode = 'free' | 'vs';
/** `pausedMs` sums finished pauses; `pausedAt` marks a pause in progress. */
type PauseFields = { pausedMs?: number; pausedAt?: number | null };
export type WorkoutSession = JournalFields & PauseFields & { id: number; startedAt: number; introPlayed: boolean; origin: WorkoutOrigin | null; exercises: SessionExercise[]; expandedId: string | null; mode?: WorkoutMode };
export type WorkoutHistory = JournalFields & { id: number; startedAt: number; endedAt: number; exercises: SessionExercise[]; pausedMs?: number } & Partial<SyncMeta>;
export type PlannedWorkout = { id: number; name: string; localDate: string; exercises: Exercise[]; source: 'manual'; programId?: string };
/** A saved workout ("Vorlage"): exercises with planned set values, reusable in VS mode. */
export type WorkoutTemplate = { id: string; name: string; exercises: { exercise: Exercise; sets: Partial<Record<FieldKey, string>>[] }[] } & SyncMeta;
export type HistoryInput = { id?: number; name: string; localDate: string; durationMinutes: number; exercises: SessionExercise[]; note?: string; feeling?: WorkoutFeeling };
type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<unknown> };
type WorkoutData = { session: WorkoutSession | null; history: WorkoutHistory[]; customExercises: Exercise[]; plans: PlannedWorkout[]; templates: WorkoutTemplate[] };
type WorkoutState = WorkoutData & {
  hydrated: boolean; loadError: boolean; saveError: boolean; saving: boolean;
  hydrate: () => Promise<void>; flush: () => Promise<boolean>;
  start: (planId?: number) => boolean;
  /** Choose free training or a saved workout for a fresh, still empty session; the clock starts now. */
  chooseMode: (templateId: string | null) => boolean;
  /** Pause or resume the training clock. */
  togglePause: () => void;
  /** Save a finished workout as a reusable template; that workout becomes the VS opponent. */
  saveTemplate: (workoutId: number, name: string) => Promise<string | null>;
  saveHistory: (input: HistoryInput) => Promise<string | null>;
  savePlan: (input: Omit<PlannedWorkout, 'id' | 'source'> & { id?: number }) => Promise<string | null>;
  removePlan: (id: number) => Promise<boolean>;
  setJournal: (fields: Pick<JournalFields, 'name' | 'note' | 'feeling'>) => void;
  setOrigin: (id: number, origin: WorkoutOrigin) => void;
  claimIntro: (id: number) => void;
  end: () => Promise<boolean>;
  addExercise: (exercise: Exercise) => void;
  createExercise: (exercise: Omit<Exercise, 'id' | 'custom'>) => Exercise | null;
  expand: (id: string | null) => void;
  addSet: (exerciseId: string) => void;
  editSet: (exerciseId: string, setId: string, key: FieldKey, text: string) => void;
  confirmSet: (exerciseId: string, setId: string) => string | null;
  removeSet: (exerciseId: string, setId: string, approved?: boolean) => boolean;
};
export const WORKOUT_STORAGE_KEY = 'berkk-workouts';

function validExercise(exercise: Exercise) {
  return exercise && typeof exercise.id === 'string' && typeof exercise.name === 'string' && exercise.name.trim().length > 0 &&
    typeof exercise.englishName === 'string' && Array.isArray(exercise.aliases) && exercise.aliases.every((item) => typeof item === 'string') &&
    MUSCLE_GROUPS.includes(exercise.muscle) && EQUIPMENT.includes(exercise.equipment) && Object.hasOwn(TRACKING_TYPES, exercise.tracking) &&
    Array.isArray(exercise.secondaryMuscles) && exercise.secondaryMuscles.every((muscle) => MUSCLE_GROUPS.includes(muscle));
}
/** Sync fields are optional; when present they must be well-formed. */
function validMeta(item: Partial<SyncMeta>) {
  return item.uuid === undefined || (typeof item.uuid === 'string' && timestamp(item.createdAt) && timestamp(item.updatedAt) && (item.deletedAt === null || item.deletedAt === undefined || timestamp(item.deletedAt)));
}
/** RFC 4122 v4 shape for tests and environments without a crypto source; the app passes expo-crypto. */
export function fallbackUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random % 4) + 8).toString(16);
  });
}
function validExercises(items: SessionExercise[]) {
  return Array.isArray(items) && new Set(items.map((item) => item?.exercise?.id)).size === items.length && items.every((item) => validExercise(item.exercise) && Array.isArray(item.sets) &&
    new Set(item.sets.map((entry) => entry?.id)).size === item.sets.length && item.sets.every((entry) => entry && typeof entry.id === 'string' && typeof entry.confirmed === 'boolean' && validMeta(entry) &&
      (entry.completedAt === undefined || timestamp(entry.completedAt)) && (entry.isPr === undefined || typeof entry.isPr === 'boolean') && entry.values && typeof entry.values === 'object' &&
      Object.entries(entry.values).every(([key, value]) => ENTRY_FIELDS[item.exercise.tracking].some((field) => field.key === key) && typeof value === 'string') && (!entry.confirmed || !entryError(item.exercise.tracking, entry))));
}
const timestamp = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
function validJournal(item: JournalFields) {
  return (item.localDate === undefined || (typeof item.localDate === 'string' && !!dayDate(item.localDate))) &&
    (item.name === undefined || typeof item.name === 'string') && (item.note === undefined || typeof item.note === 'string') &&
    (item.feeling === undefined || ['weak', 'normal', 'strong'].includes(item.feeling)) && (item.planId === undefined || timestamp(item.planId)) &&
    (item.templateId === undefined || typeof item.templateId === 'string');
}
function validPause(item: PauseFields) {
  return (item.pausedMs === undefined || timestamp(item.pausedMs)) && (item.pausedAt === undefined || item.pausedAt === null || timestamp(item.pausedAt));
}
function validTemplate(template: WorkoutTemplate) {
  return template && typeof template.id === 'string' && typeof template.name === 'string' && !!template.name.trim() && validMeta(template) && Array.isArray(template.exercises) &&
    template.exercises.every((item) => item && validExercise(item.exercise) && Array.isArray(item.sets) && item.sets.every((values) => values && typeof values === 'object' &&
      Object.entries(values).every(([key, value]) => ENTRY_FIELDS[item.exercise.tracking].some((field) => field.key === key) && typeof value === 'string')));
}
function validData(data: WorkoutData) {
  return data && Array.isArray(data.customExercises) && data.customExercises.every(validExercise) &&
    (data.templates === undefined || (Array.isArray(data.templates) && data.templates.every(validTemplate))) &&
    Array.isArray(data.plans) && data.plans.every((plan) => timestamp(plan.id) && validJournal(plan) && typeof plan.name === 'string' && !!plan.name.trim() && !!dayDate(plan.localDate) && plan.source === 'manual' && Array.isArray(plan.exercises) && plan.exercises.every(validExercise) && new Set(plan.exercises.map((item) => item.id)).size === plan.exercises.length) &&
    Array.isArray(data.history) && data.history.every((workout) => validJournal(workout) && validMeta(workout) && validPause(workout) && timestamp(workout.id) && timestamp(workout.startedAt) && timestamp(workout.endedAt) && workout.endedAt >= workout.startedAt && validExercises(workout.exercises) && workout.exercises.every((item) => item.sets.every((entry) => entry.confirmed))) &&
    new Set([...data.history, ...data.plans, ...(data.session ? [data.session] : [])].map((item) => item.id)).size === data.history.length + data.plans.length + (data.session ? 1 : 0) &&
    (data.session === null || (validJournal(data.session) && validPause(data.session) && (data.session.mode === undefined || ['free', 'vs'].includes(data.session.mode)) && timestamp(data.session.id) && timestamp(data.session.startedAt) && validExercises(data.session.exercises) && (data.session.expandedId === null || data.session.exercises.some((item) => item.exercise.id === data.session!.expandedId))));
}

/** An unconfirmed copy without confirmation time or PR verdict (keys removed, not set to undefined, so reloads match). */
function reopen(entry: SetDraft): SetDraft {
  const next = { ...entry, confirmed: false };
  delete next.completedAt;
  delete next.isPr;
  return next;
}

/** Synchronous mutations, ordered async snapshots. Draft strings survive partial decimal input. */
export function createWorkoutStore(now = Date.now, storage?: Storage, uuid: () => string = fallbackUuid) {
  let nextId = 0;
  let entryId = 0;
  let hydration: Promise<void> | null = null;
  let pending: Promise<boolean> = Promise.resolve(true);
  let revision = 0;
  let finishing = false;
  const meta = (at = now()): SyncMeta => ({ uuid: uuid(), createdAt: at, updatedAt: at, deletedAt: null });
  const newSet = (): SetDraft => ({ id: `${now()}-${++entryId}`, values: {}, confirmed: false, ...meta() });
  // Keep a set's identity across edits; only a real change bumps updatedAt.
  const stampSets = (sets: SetDraft[], previous: SetDraft[] = [], at = now()) => sets.map((entry): SetDraft => {
    const old = previous.find((row) => row.id === entry.id);
    const known = entry.uuid ? entry : old?.uuid ? { ...entry, uuid: old.uuid, createdAt: old.createdAt, updatedAt: old.updatedAt, deletedAt: old.deletedAt ?? null } : { ...entry, ...meta(at) };
    const changed = !!old && (old.confirmed !== entry.confirmed || JSON.stringify(old.values) !== JSON.stringify(entry.values));
    return changed ? { ...known, updatedAt: at } : known;
  });
  const stampExercises = (items: SessionExercise[], previous: SessionExercise[] = [], at = now()) =>
    items.map((item) => ({ ...item, sets: stampSets(item.sets, previous.find((old) => old.exercise.id === item.exercise.id)?.sets, at) }));
  /** Older saved workouts get metadata once, dated to when they ended. */
  const backfill = (workout: WorkoutHistory): WorkoutHistory => workout.uuid && workout.exercises.every((item) => item.sets.every((entry) => entry.uuid)) ? workout
    : { ...workout, ...(workout.uuid ? {} : meta(workout.endedAt)), exercises: stampExercises(workout.exercises, [], workout.endedAt) };
  return createStore<WorkoutState>((set, get) => {
    const persist = () => {
      if (!storage || !get().hydrated || finishing) return pending;
      const { session, history, customExercises, plans, templates } = get();
      const snapshot = JSON.stringify({ version: 2, state: { session, history, customExercises, plans, templates } });
      const current = ++revision;
      set({ saving: true });
      pending = pending.then(async () => {
        try {
          await storage.setItem(WORKOUT_STORAGE_KEY, snapshot);
          if (current === revision) set({ saveError: false, saving: false });
          return true;
        } catch {
          if (current === revision) set({ saveError: true, saving: false });
          return false;
        }
      });
      return pending;
    };
    // Diary writes commit only after durable storage succeeds; retry cannot duplicate a new entry.
    const commit = async (data: WorkoutData) => {
      if (!get().hydrated || finishing) return false;
      if (!storage) { set(data); return true; }
      finishing = true;
      set({ saving: true });
      await pending;
      try {
        await storage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify({ version: 2, state: data }));
        set({ ...data, saving: false, saveError: false });
        return true;
      } catch { set({ saving: false, saveError: true }); return false; }
      finally { finishing = false; }
    };
    const data = (): WorkoutData => { const { session, history, customExercises, plans, templates } = get(); return { session, history, customExercises, plans, templates }; };
    /** A new set pre-filled with last time's same set (or today's previous set). */
    const suggestedSet = (exerciseId: string, current: SetDraft[]): SetDraft => ({ ...newSet(), values: suggestedValues(get().history, current, exerciseId, current.length) });
    const updateSession = (change: (session: WorkoutSession) => WorkoutSession) => {
      const session = get().session;
      if (!session || !get().hydrated || finishing) return;
      set({ session: change(session) });
      void persist();
    };
    const updateSets = (id: string, change: (sets: SetDraft[]) => SetDraft[]) => updateSession((session) => ({ ...session, exercises: session.exercises.map((item) => item.exercise.id === id ? { ...item, sets: change(item.sets) } : item) }));
    return {
      session: null, history: [], customExercises: [], plans: [], templates: [], hydrated: !storage, loadError: false, saveError: false, saving: false,
      hydrate: () => {
        if (get().hydrated) return Promise.resolve();
        if (hydration) return hydration;
        hydration = (async () => {
          try {
            const raw = await storage!.getItem(WORKOUT_STORAGE_KEY);
            if (raw) {
              const saved = JSON.parse(raw);
              const data: WorkoutData = saved.version === 1 ? { ...saved.state, plans: [] } : saved.state;
              if (![1, 2].includes(saved.version) || !validData(data)) throw new Error('Invalid workout data');
              nextId = Math.max(0, data.session?.id ?? 0, ...data.history.map((item) => item.id), ...data.plans.map((item) => item.id));
              entryId = Math.max(0, ...[...data.customExercises.map((item) => item.id), ...(data.session?.exercises.flatMap((item) => item.sets.map((entry) => entry.id)) ?? [])].map((id) => Number(id.split('-').at(-1)) || 0));
              const history = data.history.map(backfill);
              const session = data.session ? { ...data.session, exercises: stampExercises(data.session.exercises) } : null;
              const migrated = history.some((item, index) => item !== data.history[index]) || JSON.stringify(session?.exercises) !== JSON.stringify(data.session?.exercises);
              // Reload resumes quietly, even if the app was killed during its entrance.
              set({ ...data, templates: data.templates ?? [], history, session: session ? { ...session, introPlayed: true, origin: null } : null });
              set({ hydrated: true, loadError: false });
              // Persist new identities once so they stay stable across launches. Still format version 2.
              if (migrated) void persist();
              return;
            }
            set({ hydrated: true, loadError: false });
          } catch { set({ loadError: true }); }
          finally { hydration = null; }
        })();
        return hydration;
      },
      flush: () => persist(),
      start: (planId) => {
        if (!get().hydrated || get().session || finishing) return false;
        const plan = planId === undefined ? undefined : get().plans.find((item) => item.id === planId);
        if (planId !== undefined && !plan) return false;
        const startedAt = now();
        nextId = Math.max(nextId + 1, startedAt);
        const exercises = plan?.exercises.map((exercise) => ({ exercise, sets: [suggestedSet(exercise.id, [])] })) ?? [];
        // A plan already decides the content; a plain start lets the screen offer free vs. saved workouts.
        set({ session: { id: plan?.id ?? nextId, startedAt, localDate: localDay(startedAt), name: plan?.name, planId: plan?.id, introPlayed: false, origin: null, exercises, expandedId: exercises[0]?.exercise.id ?? null, mode: plan ? 'free' : undefined, pausedMs: 0, pausedAt: null }, plans: get().plans.filter((item) => item.id !== planId) });
        void persist();
        return true;
      },
      chooseMode: (templateId) => {
        const session = get().session;
        if (!session || !get().hydrated || finishing || session.mode || session.exercises.length) return false;
        const startedAt = now();
        if (templateId === null) {
          updateSession((current) => ({ ...current, mode: 'free', startedAt, localDate: localDay(startedAt), pausedMs: 0, pausedAt: null }));
          return true;
        }
        const template = get().templates.find((item) => item.id === templateId && !item.deletedAt);
        if (!template) return false;
        // Sets start from last time's VS run when there is one, else from the saved plan.
        const opponent = templateOpponent(get().history, template.id);
        const exercises = template.exercises.map(({ exercise, sets }) => {
          const last = opponent?.exercises.find((item) => item.exercise.id === exercise.id)?.sets;
          const planned = last?.length ? last.map((entry) => entry.values) : sets.length ? sets : [{}];
          return { exercise, sets: planned.map((values) => ({ ...newSet(), values: { ...values } })) };
        });
        updateSession((current) => ({ ...current, mode: 'vs', templateId: template.id, name: template.name, startedAt, localDate: localDay(startedAt), exercises, expandedId: exercises[0]?.exercise.id ?? null, pausedMs: 0, pausedAt: null }));
        return true;
      },
      togglePause: () => updateSession((session) => session.pausedAt
        ? { ...session, pausedMs: (session.pausedMs ?? 0) + Math.max(0, now() - session.pausedAt), pausedAt: null }
        : { ...session, pausedAt: now() }),
      saveTemplate: async (workoutId, name) => {
        if (!get().hydrated || finishing) return 'Daten werden gerade gespeichert. Bitte erneut versuchen.';
        const workout = get().history.find((item) => item.id === workoutId && !item.deletedAt);
        if (!workout) return 'Training nicht gefunden.';
        if (!name.trim()) return 'Gib deinem Workout einen Namen.';
        if (!workout.exercises.some((item) => item.sets.length)) return 'Dieses Training hat keine Sätze.';
        if (workout.templateId && get().templates.some((item) => item.id === workout.templateId && !item.deletedAt)) return 'Dieses Training ist schon gespeichert.';
        const template: WorkoutTemplate = { ...meta(), name: name.trim().slice(0, 100), id: uuid(), exercises: workout.exercises.filter((item) => item.sets.length).map((item) => ({ exercise: item.exercise, sets: item.sets.map((entry) => ({ ...entry.values })) })) };
        // The saved workout itself becomes the first VS opponent.
        const history = get().history.map((item) => item.id === workoutId ? { ...item, templateId: template.id, updatedAt: now() } : item);
        return await commit({ ...data(), history, templates: [...get().templates, template] }) ? null : 'Speichern fehlgeschlagen. Bitte erneut versuchen.';
      },
      saveHistory: async (input) => {
        if (!get().hydrated || finishing) return 'Daten werden gerade gespeichert. Bitte erneut versuchen.';
        const existing = input.id === undefined ? undefined : get().history.find((item) => item.id === input.id);
        if (input.id !== undefined && !existing) return 'Workout nicht gefunden.';
        const date = dayDate(input.localDate);
        if (!date || input.localDate > localDay(now())) return 'Wähle heute oder einen vergangenen Tag.';
        if (!input.name.trim()) return 'Gib deinem Workout einen Namen.';
        if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0 || input.durationMinutes > 1440) return 'Dauer: 1 bis 1440 Minuten eingeben.';
        if (!validJournal(input) || !validExercises(input.exercises) || input.exercises.some((item) => item.sets.some((entry) => !entry.confirmed)) || completedSetCount(input) === 0) return 'Bestätige mindestens einen vollständig erfassten Satz. Offene Sätze bitte bestätigen oder entfernen.';
        nextId = Math.max(nextId + 1, now());
        const startedAt = existing && input.localDate === (existing.localDate ?? localDay(existing.startedAt)) ? existing.startedAt : date.getTime();
        const at = now();
        const sync: SyncMeta = existing?.uuid ? { uuid: existing.uuid, createdAt: existing.createdAt ?? at, updatedAt: at, deletedAt: existing.deletedAt ?? null } : meta(at);
        const workout: WorkoutHistory = { ...existing, ...sync, id: existing?.id ?? nextId, startedAt, endedAt: startedAt + input.durationMinutes * 60000, localDate: input.localDate, name: input.name.trim().slice(0, 100), note: input.note?.trim().slice(0, 4000), feeling: input.feeling, exercises: stampExercises(input.exercises.filter((item) => item.sets.length > 0), existing?.exercises, at) };
        return await commit({ ...data(), history: existing ? get().history.map((item) => item.id === existing.id ? workout : item) : [workout, ...get().history] }) ? null : 'Speichern fehlgeschlagen. Deine Eingaben bleiben hier. Bitte erneut speichern.';
      },
      savePlan: async (input) => {
        if (!get().hydrated || finishing) return 'Daten werden gerade gespeichert. Bitte erneut versuchen.';
        if (!input.name.trim()) return 'Gib deiner Planung einen Namen.';
        if (!dayDate(input.localDate) || input.localDate < localDay(now())) return 'Wähle heute oder einen zukünftigen Tag.';
        if (!Array.isArray(input.exercises) || !input.exercises.every(validExercise) || new Set(input.exercises.map((item) => item.id)).size !== input.exercises.length) return 'Bitte die ausgewählten Übungen prüfen.';
        const existing = input.id === undefined ? undefined : get().plans.find((item) => item.id === input.id);
        if (input.id !== undefined && !existing) return 'Planung wurde bereits gestartet oder entfernt.';
        nextId = Math.max(nextId + 1, now());
        const plan: PlannedWorkout = { ...existing, id: existing?.id ?? nextId, name: input.name.trim().slice(0, 100), localDate: input.localDate, exercises: input.exercises, source: 'manual' };
        return await commit({ ...data(), plans: existing ? get().plans.map((item) => item.id === existing.id ? plan : item) : [...get().plans, plan] }) ? null : 'Speichern fehlgeschlagen. Bitte erneut speichern.';
      },
      removePlan: async (id) => {
        if (!get().plans.some((item) => item.id === id)) return false;
        return commit({ ...data(), plans: get().plans.filter((item) => item.id !== id) });
      },
      setJournal: (fields) => { if (validJournal(fields)) updateSession((session) => ({ ...session, ...fields })); },
      setOrigin: (id, origin) => { if (get().session?.id === id) updateSession((session) => ({ ...session, origin })); },
      claimIntro: (id) => { if (get().session?.id === id && !get().session?.introPlayed) updateSession((session) => ({ ...session, introPlayed: true })); },
      end: async () => {
        const session = get().session;
        if (!session || finishing) return false;
        const endedAt = Math.max(now(), session.startedAt);
        const pausedMs = Math.min(endedAt - session.startedAt, (session.pausedMs ?? 0) + (session.pausedAt ? Math.max(0, endedAt - session.pausedAt) : 0));
        const workout: WorkoutHistory = { ...meta(), id: session.id, startedAt: session.startedAt, endedAt, pausedMs, localDate: session.localDate ?? localDay(session.startedAt), name: session.name, note: session.note, feeling: session.feeling, planId: session.planId, templateId: session.templateId, exercises: stampExercises(session.exercises.map((item) => ({ ...item, sets: item.sets.filter((entry) => entry.confirmed) })).filter((item) => item.sets.length > 0)) };
        const oldHistory = get().history;
        // For real storage, keep the active screen mounted until the write succeeds.
        if (!storage) { set({ session: null, history: [workout, ...oldHistory] }); return true; }
        finishing = true;
        set({ saving: true });
        await pending;
        try {
          await storage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify({ version: 2, state: { session: null, history: [workout, ...oldHistory], customExercises: get().customExercises, plans: get().plans, templates: get().templates } }));
          set({ session: null, history: [workout, ...oldHistory], saving: false, saveError: false });
          return true;
        } catch { set({ saving: false, saveError: true }); return false; }
        finally { finishing = false; }
      },
      addExercise: (exercise) => {
        if (!validExercise(exercise)) return;
        // Adding the first exercise also settles an undecided session as free training.
        updateSession((session) => ({ ...session, mode: session.mode ?? 'free', expandedId: exercise.id, exercises: session.exercises.some((item) => item.exercise.id === exercise.id) ? session.exercises : [...session.exercises, { exercise, sets: [suggestedSet(exercise.id, [])] }] }));
      },
      createExercise: (input) => {
        if (!get().hydrated || finishing) return null;
        const name = input.name.trim().slice(0, 100);
        if (!name) return null;
        const existing = [...EXERCISES, ...get().customExercises].find((item) => [item.name, item.englishName].some((value) => normalizeSearch(value) === normalizeSearch(name)));
        if (existing) return existing;
        const exercise: Exercise = { ...input, name, id: `custom-${now()}-${++entryId}`, custom: true };
        if (!validExercise(exercise)) return null;
        set({ customExercises: [...get().customExercises, exercise] });
        void persist();
        return exercise;
      },
      expand: (id) => updateSession((session) => ({ ...session, expandedId: id })),
      addSet: (id) => updateSets(id, (sets) => [...sets, suggestedSet(id, sets)]),
      editSet: (exerciseId, setId, key, text) => {
        const item = get().session?.exercises.find((exercise) => exercise.exercise.id === exerciseId);
        if (!item || !ENTRY_FIELDS[item.exercise.tracking].some((field) => field.key === key)) return;
        // Changing a value reopens the set: its confirmation time and PR verdict no longer apply.
        updateSets(exerciseId, (sets) => sets.map((entry) => entry.id === setId ? { ...reopen(entry), values: { ...entry.values, [key]: text.slice(0, 16) }, updatedAt: now() } : entry));
      },
      confirmSet: (exerciseId, setId) => {
        const item = get().session?.exercises.find((exercise) => exercise.exercise.id === exerciseId);
        const entry = item?.sets.find((row) => row.id === setId);
        if (!item || !entry) return 'Eintrag nicht gefunden.';
        const error = entry.confirmed ? null : entryError(item.exercise.tracking, entry);
        if (error) return error;
        const at = now();
        // PR is judged once, at confirmation, against everything before (today's earlier sets included).
        const isPr = !entry.confirmed && isNewPr(get().history, item.sets, item.exercise, entry);
        updateSets(exerciseId, (sets) => sets.map((row) => row.id !== setId ? row : row.confirmed
          ? { ...reopen(row), updatedAt: at }
          : { ...row, confirmed: true, completedAt: at, isPr, updatedAt: at }));
        return null;
      },
      removeSet: (exerciseId, setId, approved = false) => {
        const entry = get().session?.exercises.find((item) => item.exercise.id === exerciseId)?.sets.find((row) => row.id === setId);
        if (!entry || (!approved && (entry.confirmed || Object.values(entry.values).some((text) => text?.trim())))) return false;
        updateSets(exerciseId, (sets) => sets.filter((row) => row.id !== setId));
        return true;
      },
    };
  });
}

export function elapsedSeconds(startedAt: number, now = Date.now()) {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}
export function formatElapsed(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 60) return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
