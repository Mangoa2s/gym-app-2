// Picker drafts are tenths of a kilogram; storage and existing history stay untouched.
export const DEVELOPMENT_WEIGHT = 82.4;
export function initialWeightTenths(weight: number | null) {
  return Math.max(1, Math.min(9999, Math.round((weight ?? DEVELOPMENT_WEIGHT) * 10)));
}

export function parsePickerInput(text: string): number | null {
  if (!/^\d+(?:[.,]\d)?$/.test(text.trim())) return null;
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) && value > 0 && value < 1000 ? Math.round(value * 10) : null;
}

export function pickerText(tenths: number) {
  return `${Math.floor(tenths / 10)},${tenths % 10}`;
}

export function wheelIndex(offset: number, rowHeight: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(offset / rowHeight)));
}
