import type { PlannedWorkout, WorkoutHistory, WorkoutSession } from '../store/workout-state.ts';

/** Calendar keys always describe a local day. Never slice a UTC ISO timestamp. */
export function localDay(value: Date | number = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayDate(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split('-').map(Number);
  if (year < 100 || year > 9999) return null;
  const date = new Date(year, month - 1, day, 12);
  return localDay(date) === key ? date : null;
}
export function monthDays(key: string): (string | null)[] {
  const date = dayDate(key);
  if (!date) return [];
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day < 1 || day > count ? null : localDay(new Date(date.getFullYear(), date.getMonth(), day, 12));
  });
}
export function shiftMonth(key: string, amount: number) {
  const date = dayDate(key)!;
  const next = new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
  next.setDate(Math.min(date.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  return localDay(next);
}
export const workoutDay = (workout: WorkoutHistory) => workout.localDate ?? localDay(workout.startedAt);
export const completedSetCount = (workout: Pick<WorkoutHistory, 'exercises'>) => workout.exercises.reduce((sum, item) => sum + item.sets.filter((entry) => entry.confirmed).length, 0);
export const completedDays = (history: WorkoutHistory[]) => new Set(history.filter((workout) => completedSetCount(workout) > 0).map(workoutDay));
/** Strict daily completion streak. No program/rest-day history exists to bridge gaps. */
export function trainingStreak(history: WorkoutHistory[], today = localDay()) {
  const days = completedDays(history);
  const date = dayDate(today)!;
  if (!days.has(localDay(date))) date.setDate(date.getDate() - 1);
  let count = 0;
  while (days.has(localDay(date))) { count++; date.setDate(date.getDate() - 1); }
  return count;
}

export type CalendarDayStatus = 'completed' | 'active' | 'planned' | 'recorded' | 'empty';
/** An absent entry never proves a rest day; programId alone contains no schedule. */
export function calendarDay(key: string, history: WorkoutHistory[], plans: PlannedWorkout[], session: WorkoutSession | null) {
  const workouts = history.filter((item) => workoutDay(item) === key).sort((a, b) => a.startedAt - b.startedAt);
  const dayPlans = plans.filter((item) => item.localDate === key);
  const active = session && (session.localDate ?? localDay(session.startedAt)) === key ? session : null;
  const completed = workouts.filter((item) => completedSetCount(item) > 0);
  const status: CalendarDayStatus = completed.length ? 'completed' : active ? 'active' : dayPlans.length ? 'planned' : workouts.length ? 'recorded' : 'empty';
  const labels: Record<CalendarDayStatus, string> = { completed: 'Abgeschlossen', active: 'Training läuft', planned: 'Geplant', recorded: 'Erfasst', empty: 'Kein Eintrag' };
  const title = status === 'completed' ? (completed.length > 1 ? `${completed.length} Workouts` : completed[0].name || 'Workout')
    : status === 'active' ? active?.name || 'Workout läuft'
    : status === 'planned' ? (dayPlans.length > 1 ? `${dayPlans.length} Planungen` : dayPlans[0].name)
    : status === 'recorded' ? workouts[0].name || 'Ohne Trainingssätze'
    : 'Kein Training erfasst';
  const minutes = completed.reduce((sum, item) => sum + Math.max(0, item.endedAt - item.startedAt) / 60000, 0);
  const sets = completed.reduce((sum, item) => sum + completedSetCount(item), 0);
  const summary = status === 'completed' ? `${Math.round(minutes)} Min. · ${sets} ${sets === 1 ? 'Satz' : 'Sätze'}${active ? ' · Training läuft' : dayPlans.length ? ' · Auch geplant' : ''}`
    : status === 'active' ? 'Dein laufendes Workout fortsetzen'
    : status === 'planned' ? 'Noch nicht abgeschlossen'
    : status === 'recorded' ? 'Keine abgeschlossenen Trainingssätze'
    : 'Nichts erfasst';
  return { workouts, plans: dayPlans, active, status, label: labels[status], title, summary };
}

/** Include actual stored dates and at least a year to either side of the current month. */
export function calendarMonths(today: string, keys: string[]) {
  const anchor = `${today.slice(0, 7)}-01`;
  let first = shiftMonth(anchor, -12);
  let last = shiftMonth(anchor, 12);
  for (const key of keys) {
    if (!dayDate(key)) continue;
    const month = `${key.slice(0, 7)}-01`;
    if (month < first) first = month;
    if (month > last) last = month;
  }
  const months: string[] = [];
  for (let month = first; month <= last; month = shiftMonth(month, 1)) months.push(month);
  return months;
}
export function formatDay(key: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const date = dayDate(key);
  return date ? date.toLocaleDateString('de-DE', options) : key;
}
