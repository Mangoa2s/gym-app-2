import { createStore } from 'zustand/vanilla';

export const SETTINGS_KEY = 'berkk-settings';
type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<unknown> };
export type Settings = { hapticsEnabled: boolean };
type State = Settings & { hydrated: boolean; hydrate: () => Promise<void>; setHapticsEnabled: (enabled: boolean) => void };

const DEFAULTS: Settings = { hapticsEnabled: true };

/** Small persisted app preferences. Unknown or broken saved values fall back to the defaults. */
export function createSettingsStore(storage?: Storage) {
  return createStore<State>((set, get) => ({
    ...DEFAULTS,
    hydrated: !storage,
    hydrate: async () => {
      if (get().hydrated || !storage) return;
      try {
        const raw = await storage.getItem(SETTINGS_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        if (saved && typeof saved.hapticsEnabled === 'boolean') set({ hapticsEnabled: saved.hapticsEnabled });
      } catch { /* Defaults stay active. */ }
      set({ hydrated: true });
    },
    setHapticsEnabled: (enabled) => {
      set({ hapticsEnabled: enabled });
      void storage?.setItem(SETTINGS_KEY, JSON.stringify({ hapticsEnabled: enabled })).catch(() => undefined);
    },
  }));
}
