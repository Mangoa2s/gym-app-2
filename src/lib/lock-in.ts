/**
 * Pure logic for the active training ("lock-in") screen: last time's values, set
 * outcomes, the ghost's lines, the stronger streak and the VS opponent timeline.
 * No React and no storage, so every rule here is covered by node tests.
 */
import type { Exercise, TrackingType } from '../data/exercises.ts';
import { parseEntryNumber, type FieldKey, type SetDraft } from '../data/workout-records.ts';
import type { SessionExercise, WorkoutHistory, WorkoutSession } from '../store/workout-state.ts';
import { liveHistory, prWeight, setVolumeKg } from './history.ts';
import { compareSet, decimal, type SetComparison } from './set-compare.ts';

export type SetOutcome = SetComparison['kind'] | 'pr';
export type Speech = { title: string; subtitle?: string };

const newestFirst = (a: WorkoutHistory, b: WorkoutHistory) => b.startedAt - a.startedAt || b.id - a.id;

/** The newest finished workout that logged this exercise ("letztes Mal"). */
export function lastWorkoutWith(history: readonly WorkoutHistory[], exerciseId: string) {
  return liveHistory(history).sort(newestFirst).find((workout) => workout.exercises.some((item) => item.exercise.id === exerciseId && item.sets.length > 0));
}
export function lastTimeSets(history: readonly WorkoutHistory[], exerciseId: string): SetDraft[] {
  return lastWorkoutWith(history, exerciseId)?.exercises.find((item) => item.exercise.id === exerciseId)?.sets ?? [];
}
/** "Vorher" = the same set number in the last finished workout with this exercise. */
export const previousSet = (history: readonly WorkoutHistory[], exerciseId: string, index: number): SetDraft | undefined => lastTimeSets(history, exerciseId)[index];

/** Values to pre-fill a new set: last time's same set, else the set before it today. */
export function suggestedValues(history: readonly WorkoutHistory[], current: SetDraft[], exerciseId: string, index: number): Partial<Record<FieldKey, string>> {
  return { ...(previousSet(history, exerciseId, index)?.values ?? current[index - 1]?.values ?? {}) };
}

/**
 * Best PR weight logged so far for this exercise: all finished workouts plus the
 * other confirmed sets of today. null = no finished workout has this exercise
 * yet: the whole first workout is the baseline, so warm-up ramps (40 → 60 → 80)
 * are never celebrated as a string of PRs.
 */
export function bestWeightBefore(history: readonly WorkoutHistory[], todaySets: SetDraft[], exercise: Exercise, excludeSetId: string) {
  let best: number | null = null;
  const consider = (entry: SetDraft) => { const weight = prWeight(exercise.tracking, entry); if (weight !== null && (best === null || weight > best)) best = weight; };
  for (const workout of liveHistory(history)) for (const item of workout.exercises) if (item.exercise.id === exercise.id) item.sets.forEach(consider);
  if (best === null) return null;
  todaySets.filter((entry) => entry.confirmed && entry.id !== excludeSetId).forEach(consider);
  return best;
}
/** PR = heavier than every earlier log (today included). The first-ever log is never a PR. */
export function isNewPr(history: readonly WorkoutHistory[], todaySets: SetDraft[], exercise: Exercise, entry: SetDraft) {
  const weight = prWeight(exercise.tracking, entry);
  const best = bestWeightBefore(history, todaySets, exercise, entry.id);
  return weight !== null && best !== null && weight > best;
}

export function setOutcome(tracking: TrackingType, entry: SetDraft, previous?: SetDraft): { kind: SetOutcome; delta?: string } {
  if (entry.isPr) return { kind: 'pr' };
  return compareSet(tracking, entry, previous);
}

const weightText = (tracking: TrackingType, entry: SetDraft) => {
  const weight = prWeight(tracking, entry);
  return weight === null ? '' : `${decimal(weight)} kg`;
};

/** The ghost never scolds: weaker sets still count. */
export function speechFor(outcome: { kind: SetOutcome; delta?: string }, tracking: TrackingType, entry: SetDraft): Speech {
  switch (outcome.kind) {
    case 'pr': return { title: `Neuer PR! ${weightText(tracking, entry)}`.trim() };
    case 'stronger': return { title: `Stärker als letztes Mal! ${outcome.delta ?? ''}`.trim() };
    case 'same': return { title: 'Genau wie letztes Mal. Solide.' };
    case 'less': return { title: 'Zählt trotzdem. Weiter so.' };
    case 'extra': return { title: 'Extra-Satz! Das zählt.' };
  }
}

/** Confirmed sets of the session in the order they were confirmed. */
function confirmedInOrder(session: Pick<WorkoutSession, 'exercises'>) {
  return session.exercises.flatMap((item) => item.sets.map((entry, index) => ({ item, entry, index })))
    .filter(({ entry }) => entry.confirmed).sort((a, b) => (a.entry.completedAt ?? 0) - (b.entry.completedAt ?? 0));
}

/** How many of the most recent confirmed sets in a row were stronger (or a PR). */
export function strongerStreak(session: Pick<WorkoutSession, 'exercises'>, history: readonly WorkoutHistory[]) {
  let streak = 0;
  for (const { item, entry, index } of confirmedInOrder(session).reverse()) {
    const kind = setOutcome(item.exercise.tracking, entry, previousSet(history, item.exercise.id, index)).kind;
    if (kind !== 'stronger' && kind !== 'pr') break;
    streak++;
  }
  return streak;
}

/** Stronger sets and PR sets of a session (for the summary and XP). */
export function sessionOutcomes(session: Pick<WorkoutSession, 'exercises'>, history: readonly WorkoutHistory[]) {
  let stronger = 0; let prs = 0;
  for (const { item, entry, index } of confirmedInOrder(session)) {
    const kind = setOutcome(item.exercise.tracking, entry, previousSet(history, item.exercise.id, index)).kind;
    if (kind === 'pr') prs++;
    if (kind === 'stronger' || kind === 'pr') stronger++;
  }
  return { stronger, prs };
}

export function exerciseVolumeKg(item: SessionExercise, onlyConfirmed = true) {
  return item.sets.filter((entry) => !onlyConfirmed || entry.confirmed).reduce((sum, entry) => sum + setVolumeKg(item.exercise.tracking, entry), 0);
}
export function sessionTotals(session: Pick<WorkoutSession, 'exercises'>) {
  return {
    volumeKg: session.exercises.reduce((sum, item) => sum + exerciseVolumeKg(item), 0),
    sets: session.exercises.reduce((sum, item) => sum + item.sets.filter((entry) => entry.confirmed).length, 0),
  };
}

/** Training time without pauses (a running pause counts as paused). */
export function activeElapsedMs(session: Pick<WorkoutSession, 'startedAt' | 'pausedMs' | 'pausedAt'>, now = Date.now()) {
  const pausedNow = session.pausedAt ? Math.max(0, now - session.pausedAt) : 0;
  return Math.max(0, now - session.startedAt - (session.pausedMs ?? 0) - pausedNow);
}

/** The last finished workout of a saved workout: the VS opponent ("Geist"). */
export function templateOpponent(history: readonly WorkoutHistory[], templateId: string) {
  return liveHistory(history).sort(newestFirst).find((workout) => workout.templateId === templateId);
}

/**
 * VS race on a Start → Ziel bar. The goal is last time's volume (or its set count
 * when it had no tonnage). The ghost advances by when each set was confirmed last
 * time (completedAt), measured from that workout's start.
 */
export function vsProgress(session: Pick<WorkoutSession, 'exercises'>, opponent: WorkoutHistory, activeMs: number) {
  const opponentSets = opponent.exercises.flatMap((item) => item.sets.map((entry) => ({ entry, kg: setVolumeKg(item.exercise.tracking, entry) })));
  const goalKg = opponentSets.reduce((sum, set) => sum + set.kg, 0);
  const byVolume = goalKg > 0;
  const goal = byVolume ? goalKg : opponentSets.length;
  const reached = opponentSets.filter(({ entry }) => entry.completedAt !== undefined && entry.completedAt - opponent.startedAt <= activeMs);
  const ghost = byVolume ? reached.reduce((sum, set) => sum + set.kg, 0) : reached.length;
  const totals = sessionTotals(session);
  const you = byVolume ? totals.volumeKg : totals.sets;
  const share = (value: number) => (goal > 0 ? Math.min(1, value / goal) : 0);
  return { you: share(you), ghost: share(ghost), youValue: you, ghostValue: ghost, goal, byVolume, timed: opponentSets.some(({ entry }) => entry.completedAt !== undefined) };
}
export type Leader = 'you' | 'ghost' | 'tie';
export const leaderOf = (you: number, ghost: number): Leader => (you > ghost ? 'you' : ghost > you ? 'ghost' : 'tie');

/** "Letztes Mal: 3 × 80 kg × 8" (heaviest set), or the set count for other types. */
export function lastTimeLabel(history: readonly WorkoutHistory[], exercise: Exercise) {
  const sets = lastTimeSets(history, exercise.id);
  if (!sets.length) return undefined;
  const top = [...sets].sort((a, b) => (prWeight(exercise.tracking, b) ?? 0) - (prWeight(exercise.tracking, a) ?? 0))[0];
  const weight = prWeight(exercise.tracking, top);
  const reps = parseEntryNumber(top.values.reps);
  if (weight !== null && reps !== null) return `Letztes Mal: ${sets.length} × ${decimal(weight)} kg × ${reps}`;
  return `Letztes Mal: ${sets.length} ${sets.length === 1 ? 'Satz' : 'Sätze'}`;
}

/** Short "Vorher" cell text: "80 × 8", "12 Wdh.", "45 s" … */
export function shortSet(tracking: TrackingType, entry?: SetDraft) {
  if (!entry) return '–';
  const value = (key: FieldKey) => { const number = parseEntryNumber(entry.values[key]); return number === null ? null : decimal(number); };
  switch (tracking) {
    case 'strength': return value('weightKg') && value('reps') ? `${value('weightKg')} × ${value('reps')}` : '–';
    case 'bodyweight': return value('reps') ? `${value('addedWeightKg') ? `+${value('addedWeightKg')} × ` : ''}${value('reps')} Wdh.` : '–';
    case 'assisted': return value('reps') ? `−${value('assistanceKg') ?? 0} × ${value('reps')}` : '–';
    case 'hold': return value('durationSeconds') ? `${value('durationSeconds')} s` : '–';
    case 'cardio': return value('durationMinutes') ? `${value('durationMinutes')} min${value('distanceKm') ? ` · ${value('distanceKm')} km` : ''}` : '–';
  }
}

/**
 * Training heat for the Glut-Welt: 0.08 + 0.92 × done / max(planned, 8).
 * "Planned" = every set row in the session (open and done).
 */
export function workoutHeat(session: Pick<WorkoutSession, 'exercises'>, floor = 0.08, minSets = 8) {
  const planned = session.exercises.reduce((sum, item) => sum + item.sets.length, 0);
  const done = session.exercises.reduce((sum, item) => sum + item.sets.filter((entry) => entry.confirmed).length, 0);
  return Math.min(1, floor + (1 - floor) * (done / Math.max(planned, minSets)));
}

/** The next exercise that still has open sets, after the given one. */
export function nextOpenExercise(session: Pick<WorkoutSession, 'exercises'>, currentId: string) {
  const start = session.exercises.findIndex((item) => item.exercise.id === currentId);
  const ordered = [...session.exercises.slice(start + 1), ...session.exercises.slice(0, Math.max(0, start))];
  return ordered.find((item) => item.sets.some((entry) => !entry.confirmed));
}
