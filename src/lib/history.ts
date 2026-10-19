/**
 * Pure history calculations: volume, sets, muscle split, PRs, week groups and
 * German formatting. No React, no storage. Everything is derived from history.
 */
import { dayDate, localDay, workoutDay } from '../data/calendar.ts';
import type { MuscleGroup, TrackingType } from '../data/exercises.ts';
import { parseEntryNumber, type FieldKey, type SetDraft } from '../data/workout-records.ts';
import type { WorkoutHistory } from '../store/workout-state.ts';
import { levelForXp, workoutXp } from './progression.ts';
import { compareSet } from './set-compare.ts';

export type Split = 'push' | 'pull' | 'legs';
export type SplitFilter = 'all' | Split;
export const SPLIT_LABELS: Record<Split, string> = { push: 'Push', pull: 'Pull', legs: 'Beine' };
export const FILTERS: { key: SplitFilter; label: string }[] = [{ key: 'all', label: 'Alle' }, { key: 'push', label: 'Push' }, { key: 'pull', label: 'Pull' }, { key: 'legs', label: 'Beine' }];

/** Primary muscle → split. Core, full body and cardio belong to no split ("Alle" only). */
const SPLIT_OF: Partial<Record<MuscleGroup, Split>> = {
  Brust: 'push', Schultern: 'push', Trizeps: 'push',
  Rücken: 'pull', Bizeps: 'pull', Unterarme: 'pull',
  Quadrizeps: 'legs', 'Hintere Oberschenkel': 'legs', Gesäß: 'legs', Waden: 'legs',
};

/** Weight field that can set a PR. Assisted (less help = better), holds and cardio never do. */
export const PR_FIELD: Partial<Record<TrackingType, FieldKey>> = { strength: 'weightKg', bodyweight: 'addedWeightKg' };
/** The PR-relevant weight of a set, or null when this tracking type has no PRs or no weight. */
export function prWeight(tracking: TrackingType, entry: SetDraft) {
  const field = PR_FIELD[tracking];
  const weight = field ? parseEntryNumber(entry.values[field]) : null;
  return weight !== null && weight > 0 ? weight : null;
}

export type PR = { workoutId: number; exerciseId: string; exerciseName: string; setId: string; weightKg: number; reps: number };
export type WorkoutSummary = {
  workout: WorkoutHistory; title: string; split: Split | null; day: string;
  minutes: number; sets: number; volumeKg: number; muscles: { name: MuscleGroup; sets: number }[];
  prs: PR[]; stronger: number; xp: number;
};

/** Soft-deleted workouts never count anywhere. */
export const liveHistory = (history: readonly WorkoutHistory[]) => history.filter((workout) => !workout.deletedAt);

/** kg × reps for strength; added weight × reps for bodyweight. Other types add no tonnage. */
export function setVolumeKg(tracking: TrackingType, entry: SetDraft) {
  const reps = parseEntryNumber(entry.values.reps);
  const field = PR_FIELD[tracking];
  const weight = field ? parseEntryNumber(entry.values[field]) : null;
  return reps && weight ? weight * reps : 0;
}

function muscleCounts(workout: WorkoutHistory) {
  const counts = new Map<MuscleGroup, number>();
  for (const item of workout.exercises) counts.set(item.exercise.muscle, (counts.get(item.exercise.muscle) ?? 0) + item.sets.length);
  return [...counts].map(([name, sets]) => ({ name, sets })).sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name, 'de'));
}

/** The split with strictly the most sets; a tie or no split muscle gives null. */
export function splitOf(muscles: { name: MuscleGroup; sets: number }[]): Split | null {
  const totals: Record<Split, number> = { push: 0, pull: 0, legs: 0 };
  for (const item of muscles) { const split = SPLIT_OF[item.name]; if (split) totals[split] += item.sets; }
  const ranked = (Object.entries(totals) as [Split, number][]).sort((a, b) => b[1] - a[1]);
  return ranked[0][1] > 0 && ranked[0][1] > ranked[1][1] ? ranked[0][0] : null;
}

/** A name the user typed wins; the journal default "Workout" counts as no name. */
export function workoutTitle(workout: WorkoutHistory, split: Split | null) {
  const name = workout.name?.trim();
  return name && name !== 'Workout' ? name : split ? SPLIT_LABELS[split] : 'Training';
}

const chronological = (a: WorkoutHistory, b: WorkoutHistory) => a.startedAt - b.startedAt || a.id - b.id;

export type WorkoutAnalysis = { prs: PR[]; stronger: number };

/**
 * One chronological pass over the history.
 * PR = a weight heavier than anything ever logged before for that exercise; the
 * very first log of an exercise is a baseline. Live-recorded sets carry `isPr`
 * (decided at confirmation, so 85 then 87.5 kg are both celebrated); the history
 * still reports only the heaviest PR set per exercise and workout, so both
 * places agree without duplicate messages. Older sets without the flag are
 * computed the same way.
 * Stronger = a set that beat the same set number of the previous workout with
 * that exercise (see compareSet).
 */
export function analyzeHistory(history: readonly WorkoutHistory[]) {
  const best = new Map<string, number>();
  const lastSets = new Map<string, SetDraft[]>();
  const result = new Map<number, WorkoutAnalysis>();
  for (const workout of [...liveHistory(history)].sort(chronological)) {
    const analysis: WorkoutAnalysis = { prs: [], stronger: 0 };
    for (const item of workout.exercises) {
      const { tracking, id: exerciseId } = item.exercise;
      const previousSets = lastSets.get(exerciseId);
      if (previousSets) analysis.stronger += item.sets.filter((entry, index) => compareSet(tracking, entry, previousSets[index]).kind === 'stronger').length;
      if (item.sets.length) lastSets.set(exerciseId, item.sets);
      let top: { entry: SetDraft; weight: number } | null = null;
      for (const entry of item.sets) {
        const weight = prWeight(tracking, entry);
        if (weight !== null && (!top || weight > top.weight)) top = { entry, weight };
      }
      if (!top) continue;
      const previous = best.get(exerciseId);
      const recorded = item.sets.some((entry) => entry.isPr !== undefined);
      // Live flags win; the heaviest flagged set is the one reported.
      const flagged = item.sets.filter((entry) => entry.isPr).map((entry) => ({ entry, weight: prWeight(tracking, entry) ?? 0 })).sort((a, b) => b.weight - a.weight)[0];
      const pr = recorded ? flagged : previous !== undefined && top.weight > previous ? top : undefined;
      if (pr) analysis.prs.push({ workoutId: workout.id, exerciseId, exerciseName: item.exercise.name, setId: pr.entry.id, weightKg: pr.weight, reps: parseEntryNumber(pr.entry.values.reps) ?? 0 });
      if (previous === undefined || top.weight > previous) best.set(exerciseId, top.weight);
    }
    result.set(workout.id, analysis);
  }
  return result;
}

/** PRs per workout id (only workouts that have one). */
export function findPRs(history: readonly WorkoutHistory[]) {
  return new Map([...analyzeHistory(history)].filter(([, analysis]) => analysis.prs.length).map(([id, analysis]) => [id, analysis.prs]));
}

/** Active minutes: wall-clock span minus recorded pauses. */
export const activeMinutes = (workout: Pick<WorkoutHistory, 'startedAt' | 'endedAt' | 'pausedMs'>) =>
  Math.max(0, Math.round((workout.endedAt - workout.startedAt - (workout.pausedMs ?? 0)) / 60000));

export function summarize(workout: WorkoutHistory, analysis: Map<number, WorkoutAnalysis>): WorkoutSummary {
  const muscles = muscleCounts(workout);
  const split = splitOf(muscles);
  const sets = workout.exercises.reduce((sum, item) => sum + item.sets.length, 0);
  const volumeKg = workout.exercises.reduce((sum, item) => sum + item.sets.reduce((total, entry) => total + setVolumeKg(item.exercise.tracking, entry), 0), 0);
  const own = analysis.get(workout.id);
  const prs = sets ? own?.prs ?? [] : [];
  const stronger = sets ? own?.stronger ?? 0 : 0;
  return {
    workout, split, muscles, sets, volumeKg, prs, stronger, xp: workoutXp(sets, prs.length, stronger),
    title: workoutTitle(workout, split), day: workoutDay(workout), minutes: activeMinutes(workout),
  };
}

/** Every live workout, newest first, with PRs and stronger sets computed across the whole history. */
export function summarizeHistory(history: readonly WorkoutHistory[]) {
  const analysis = analyzeHistory(history);
  return liveHistory(history).sort((a, b) => chronological(b, a)).map((workout) => summarize(workout, analysis));
}

/** Level is derived, never stored. */
export const historyLevel = (summaries: WorkoutSummary[]) => levelForXp(summaries.reduce((sum, item) => sum + item.xp, 0));

// ---------- Weeks (Monday start) ----------

export function weekStart(day: string) {
  const date = dayDate(day)!;
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return localDay(date);
}
function addDays(day: string, amount: number) {
  const date = dayDate(day)!;
  date.setDate(date.getDate() + amount);
  return localDay(date);
}
/** ISO 8601 week number (weeks start Monday; week 1 holds the year's first Thursday). */
export function isoWeek(day: string) {
  const date = dayDate(day)!;
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const firstThursday = new Date(date.getFullYear(), 0, 4, 12);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  return { week: 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000)), year: date.getFullYear() };
}
export function weekTitle(weekKey: string, today: string) {
  const weeks = Math.round(((dayDate(weekStart(today))!.getTime()) - dayDate(weekKey)!.getTime()) / (7 * 86400000));
  if (weeks === 0) return 'Diese Woche';
  if (weeks === 1) return 'Letzte Woche';
  if (weeks === 2) return 'Vor 2 Wochen';
  const { week, year } = isoWeek(weekKey);
  return year === isoWeek(today).year ? `KW ${week}` : `KW ${week} · ${year}`;
}

export type HistorySection = { key: string; title: string; count: number; volumeKg: number; data: WorkoutSummary[] };
/** Filtered summaries grouped into Monday weeks, newest first. */
export function historySections(summaries: WorkoutSummary[], filter: SplitFilter, today: string): HistorySection[] {
  const sections: HistorySection[] = [];
  for (const item of summaries) {
    if (filter !== 'all' && item.split !== filter) continue;
    const key = weekStart(item.day);
    let section = sections.at(-1);
    if (section?.key !== key) { section = { key, title: weekTitle(key, today), count: 0, volumeKg: 0, data: [] }; sections.push(section); }
    section.data.push(item); section.count++; section.volumeKg += item.volumeKg;
  }
  return sections;
}

export type WeekDay = { key: string; label: string; trained: boolean; today: boolean };
/** The current Monday–Sunday week, its completed workouts and volume against last week. */
export function weekOverview(summaries: WorkoutSummary[], today: string, goal: number) {
  const start = weekStart(today);
  const lastStart = addDays(start, -7);
  const thisWeek = summaries.filter((item) => item.sets > 0 && weekStart(item.day) === start);
  const lastWeek = summaries.filter((item) => item.sets > 0 && weekStart(item.day) === lastStart);
  const trainedDays = new Set(thisWeek.map((item) => item.day));
  const days: WeekDay[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((label, index) => {
    const key = addDays(start, index);
    return { key, label, trained: trainedDays.has(key), today: key === today };
  });
  const volumeKg = thisWeek.reduce((sum, item) => sum + item.volumeKg, 0);
  const lastVolumeKg = lastWeek.reduce((sum, item) => sum + item.volumeKg, 0);
  return { days, done: thisWeek.length, goal, volumeKg, lastVolumeKg, deltaPercent: lastVolumeKg > 0 ? Math.round(((volumeKg - lastVolumeKg) / lastVolumeKg) * 100) : null };
}

/** One set line without the "Satz n" prefix: "80 kg × 8", "12 Wdh. · +10 kg", "45 s". */
export function formatSet(tracking: TrackingType, entry: SetDraft) {
  const value = (key: FieldKey) => { const number = parseEntryNumber(entry.values[key]); return number === null ? null : formatNumber(number); };
  const reps = value('reps');
  switch (tracking) {
    case 'strength': return `${value('weightKg') ?? '–'} kg × ${reps ?? '–'}`;
    case 'bodyweight': return `${reps ?? '–'} Wdh.${value('addedWeightKg') ? ` · +${value('addedWeightKg')} kg` : ''}`;
    case 'assisted': return `${reps ?? '–'} Wdh. · ${value('assistanceKg') ?? '–'} kg Hilfe`;
    case 'hold': return `${value('durationSeconds') ?? '–'} s${value('addedWeightKg') ? ` · +${value('addedWeightKg')} kg` : ''}`;
    case 'cardio': return `${value('durationMinutes') ?? '–'} min${value('distanceKm') ? ` · ${value('distanceKm')} km` : ''}`;
  }
}

// ---------- German formatting (no Intl: cheap on Hermes, identical everywhere) ----------

/** 82.5 → "82,5"; whole numbers stay whole. */
export function formatNumber(value: number, decimals = 1) {
  const fixed = Number.isInteger(value) ? String(value) : value.toFixed(decimals).replace(/\.?0+$/, '');
  const [whole, fraction] = fixed.split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${fraction ? `,${fraction}` : ''}`;
}
/** Volume in tonnes with exactly one decimal: 12480 kg → "12,5". */
export const formatTons = (kg: number) => (kg / 1000).toFixed(1).replace('.', ',');
export const formatPercent = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : '±'}${Math.abs(value)} %`;

const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WEEKDAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS_SHORT = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sept', 'Okt', 'Nov', 'Dez'];
const MONTHS_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/**
 * Backfilled diary workouts are stored at exactly 12:00:00.000 local time and
 * have no real clock time; recorded sessions carry millisecond timestamps.
 */
export function hasClockTime(workout: WorkoutHistory) {
  const date = new Date(workout.startedAt);
  return !(date.getHours() === 12 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0);
}
const clock = (time: number) => { const date = new Date(time); return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };

/** "Fr, 16. Okt · 18:25" (time omitted for backfilled workouts; year added if not this year). */
export function formatWorkoutDate(workout: WorkoutHistory, today: string, long = false) {
  const day = workoutDay(workout);
  const date = dayDate(day)!;
  const year = day.slice(0, 4) !== today.slice(0, 4) ? ` ${date.getFullYear()}` : '';
  const text = long
    ? `${WEEKDAYS_LONG[date.getDay()]}, ${date.getDate()}. ${MONTHS_LONG[date.getMonth()]}${year}`
    : `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()}. ${MONTHS_SHORT[date.getMonth()]}${year}`;
  return hasClockTime(workout) ? `${text} · ${clock(workout.startedAt)}` : text;
}
