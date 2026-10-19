import type { TrackingType } from './exercises';

export type FieldKey = 'weightKg' | 'reps' | 'addedWeightKg' | 'assistanceKg' | 'durationSeconds' | 'durationMinutes' | 'distanceKm';
/** Sync-ready metadata (no sync is built). Optional so older saved data and older code stay compatible. */
export type SyncMeta = { uuid: string; createdAt: number; updatedAt: number; deletedAt: number | null };
/**
 * `completedAt` is set only when a set is confirmed (cleared when it is reopened).
 * `isPr` is decided at that moment against everything logged before, including
 * earlier sets today. Both are optional so older saved sets stay valid.
 */
export type SetDraft = { id: string; values: Partial<Record<FieldKey, string>>; confirmed: boolean; completedAt?: number; isPr?: boolean } & Partial<SyncMeta>;
type Field = { key: FieldKey; label: string; optional?: boolean; integer?: boolean };
export const ENTRY_FIELDS: Record<TrackingType, Field[]> = {
  strength: [{ key: 'weightKg', label: 'kg' }, { key: 'reps', label: 'Wdh.', integer: true }],
  bodyweight: [{ key: 'reps', label: 'Wdh.', integer: true }, { key: 'addedWeightKg', label: 'Zusatz kg', optional: true }],
  assisted: [{ key: 'assistanceKg', label: 'Hilfe kg' }, { key: 'reps', label: 'Wdh.', integer: true }],
  hold: [{ key: 'durationSeconds', label: 'Sekunden' }, { key: 'addedWeightKg', label: 'Zusatz kg', optional: true }],
  cardio: [{ key: 'durationMinutes', label: 'Minuten' }, { key: 'distanceKm', label: 'km', optional: true }],
};
export function parseEntryNumber(text: string | undefined) {
  if (!text || !/^\d+(?:[.,]\d+)?$/.test(text.trim())) return null;
  const number = Number(text.trim().replace(',', '.'));
  return Number.isFinite(number) && number >= 0 ? number : null;
}
export function entryError(type: TrackingType, entry: SetDraft): string | null {
  for (const field of ENTRY_FIELDS[type]) {
    const text = entry.values[field.key];
    if (field.optional && !text?.trim()) continue;
    const value = parseEntryNumber(text);
    if (value === null || (field.integer && !Number.isInteger(value))) return `${field.label}: ${field.integer ? 'ganze Zahl' : 'gültige Zahl'} eingeben.`;
    if (['reps', 'durationSeconds', 'durationMinutes', 'distanceKm'].includes(field.key) && value <= 0) return `${field.label} muss größer als 0 sein.`;
  }
  return null;
}
export function describeEntry(type: TrackingType, entry: SetDraft) {
  return ENTRY_FIELDS[type].filter((field) => entry.values[field.key]?.trim()).map((field) => {
    const value = entry.values[field.key]!.replace('.', ',');
    if (field.key === 'assistanceKg') return `${value} kg Unterstützung`;
    if (field.key === 'addedWeightKg') return `${value} kg Zusatzgewicht`;
    return `${value} ${field.label}`;
  }).join(' · ');
}
