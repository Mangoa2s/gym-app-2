import type { Exercise } from './exercises';
import type { WorkoutHistory } from '../store/workout-state';

/** Completed saved sessions only: no plans, active drafts or invented history. */
export function recentExercises(history: readonly WorkoutHistory[], catalog: readonly Exercise[], limit = 3) {
  if (limit <= 0) return [];
  const byId = new Map(catalog.map((exercise) => [exercise.id, exercise]));
  const seen = new Set<string>();
  const result: Exercise[] = [];
  for (const workout of [...history].sort((a, b) => b.endedAt - a.endedAt || b.id - a.id)) {
    for (const entry of workout.exercises) {
      const exercise = byId.get(entry.exercise.id);
      if (!exercise || seen.has(exercise.id) || !entry.sets.some((set) => set.confirmed)) continue;
      seen.add(exercise.id);
      result.push(exercise);
      if (result.length >= limit) return result;
    }
  }
  return result;
}
