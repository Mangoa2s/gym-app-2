/**
 * Compare one set with the same set number last time. Shared by the live
 * training screen and the history (XP for "stronger" sets) so both count alike.
 */
import type { TrackingType } from '../data/exercises.ts';
import { parseEntryNumber, type FieldKey, type SetDraft } from '../data/workout-records.ts';

export type SetComparison = { kind: 'stronger' | 'same' | 'less' | 'extra'; delta?: string };

/** German decimal without Intl: 2.5 → "2,5". */
export const decimal = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')).replace('.', ',');

type Metric = { key: FieldKey; better: 'higher' | 'lower'; unit: string; optionalZero?: boolean };
/** Most important metric first; later ones only decide when the earlier ones are equal. */
const METRICS: Record<TrackingType, Metric[]> = {
  strength: [{ key: 'weightKg', better: 'higher', unit: 'kg' }, { key: 'reps', better: 'higher', unit: 'Wdh.' }],
  bodyweight: [{ key: 'addedWeightKg', better: 'higher', unit: 'kg', optionalZero: true }, { key: 'reps', better: 'higher', unit: 'Wdh.' }],
  assisted: [{ key: 'assistanceKg', better: 'lower', unit: 'kg Hilfe' }, { key: 'reps', better: 'higher', unit: 'Wdh.' }],
  hold: [{ key: 'addedWeightKg', better: 'higher', unit: 'kg', optionalZero: true }, { key: 'durationSeconds', better: 'higher', unit: 's' }],
  cardio: [{ key: 'distanceKm', better: 'higher', unit: 'km', optionalZero: true }, { key: 'durationMinutes', better: 'higher', unit: 'min' }],
};

/**
 * "stronger": the first differing metric improved (more weight, or same weight
 * and more reps). "less": it got worse. "same": identical. "extra": nothing to
 * compare with (a set number that did not exist last time).
 */
export function compareSet(tracking: TrackingType, today: SetDraft, previous?: SetDraft): SetComparison {
  if (!previous) return { kind: 'extra' };
  for (const metric of METRICS[tracking]) {
    const read = (entry: SetDraft) => parseEntryNumber(entry.values[metric.key]) ?? (metric.optionalZero ? 0 : null);
    const now = read(today);
    const before = read(previous);
    if (now === null || before === null || now === before) continue;
    const improved = metric.better === 'higher' ? now > before : now < before;
    const sign = metric.better === 'higher' ? (improved ? '+' : '−') : (improved ? '−' : '+');
    return { kind: improved ? 'stronger' : 'less', delta: `${sign}${decimal(Math.abs(now - before))} ${metric.unit}` };
  }
  return { kind: 'same' };
}
