import { createStore } from 'zustand/vanilla';

export type WeightEntry = { date: string; weight: number };
type WeightData = { currentWeight: number | null; entries: WeightEntry[] };
type WeightStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};
type WeightState = WeightData & {
  hydrated: boolean;
  saving: boolean;
  loadError: boolean;
  hydrate: () => Promise<void>;
  saveWeight: (weight: number) => Promise<void>;
};

export const WEIGHT_STORAGE_KEY = 'berkk-body-weight';

/** Device calendar components, deliberately never an ISO/UTC timestamp. */
export function localWeightDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidWeight(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 1000;
}

export function parseWeightInput(input: string): number | null {
  const text = input.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) return null;
  const value = Number(text.replace(',', '.'));
  return isValidWeight(value) ? value : null;
}

export function formatWeight(value: number) {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export function formatWeightDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

export function weightHistory(entries: WeightEntry[]) {
  const chronological = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return chronological.map((entry, index) => ({
    ...entry,
    change: index === 0 ? null : Math.round((entry.weight - chronological[index - 1].weight) * 100) / 100,
  })).reverse();
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  return localWeightDate(new Date(year, month - 1, day)) === value;
}

/** Storage and clock are injectable so persistence and midnight can be tested. */
export function createBodyWeightStore(storage: WeightStorage, now = () => new Date()) {
  let hydration: Promise<void> | null = null;
  let retainedData: Record<string, unknown> = {};
  return createStore<WeightState>()((set, get) => ({
    currentWeight: null,
    entries: [],
    hydrated: false,
    saving: false,
    loadError: false,
    hydrate: () => {
      if (get().hydrated) return Promise.resolve();
      if (hydration) return hydration;
      hydration = (async () => {
        try {
          const raw = await storage.getItem(WEIGHT_STORAGE_KEY);
          let data: WeightData = { currentWeight: null, entries: [] };
          if (raw !== null) {
            const saved = JSON.parse(raw);
            if (saved.version !== 1 || !saved.state || typeof saved.state !== 'object') throw new Error('Unsupported weight data');
            const state = saved.state;
            if (state.currentWeight != null && !isValidWeight(state.currentWeight)) throw new Error('Invalid weight');
            const entries: WeightEntry[] = state.entries ?? [];
            if (!Array.isArray(entries) || entries.some((entry) => !entry || !isCalendarDate(entry.date) || !isValidWeight(entry.weight))) throw new Error('Invalid weight history');
            // A saved current value without history stays undated. Never backfill a day.
            retainedData = state;
            data = { currentWeight: state.currentWeight ?? null, entries };
          }
          set({ ...data, hydrated: true, loadError: false });
        } catch {
          // Keep the original storage intact and prohibit writes until loading succeeds.
          set({ loadError: true });
        } finally {
          hydration = null;
        }
      })();
      return hydration;
    },
    saveWeight: async (weight) => {
      if (!isValidWeight(weight)) throw new Error('Invalid weight');
      if (!get().hydrated || get().loadError) throw new Error('Weight data has not loaded');
      if (get().saving) throw new Error('A weight is already being saved');
      const date = localWeightDate(now());
      const next: WeightData = {
        currentWeight: weight,
        entries: [...get().entries.filter((entry) => entry.date !== date), { date, weight }]
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
      set({ saving: true });
      try {
        await storage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify({ version: 1, state: { ...retainedData, ...next } }));
        set(next);
      } finally {
        set({ saving: false });
      }
    },
  }));
}
