import { createStore } from "zustand/vanilla";

export const ONBOARDING_KEY = "berkk-onboarding";
export type Goal = "strength" | "muscle" | "routine";
export type Experience = "new" | "returning" | "regular";
export type Draft = {
  step: number;
  goal: Goal | null;
  experience: Experience | null;
  days: number[];
  weightKg: number | null;
  weightConfirmed: boolean;
  unit: "kg" | "lb";
  demoWeight: number;
  demoReps: number;
  demoDone: boolean;
  returnTo: number | null;
};
export type Profile = {
  goal?: Goal;
  experience?: Experience;
  days?: number[];
  [key: string]: unknown;
};
type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};
export const freshDraft = (): Draft => ({
  step: 0,
  goal: null,
  experience: null,
  days: [],
  weightKg: null,
  weightConfirmed: false,
  unit: "kg",
  demoWeight: 40,
  demoReps: 8,
  demoDone: false,
  returnTo: null,
});
type State = {
  draft: Draft;
  profile: Profile;
  completed: boolean;
  hydrated: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Draft>) => void;
  flush: () => Promise<void>;
  complete: () => Promise<void>;
  restart: () => void;
};
export function validStartWeight(kg: number) {
  return Number.isFinite(kg) && kg >= 20 && kg <= 350;
}
export function manualWeight(text: string, unit: "kg" | "lb") {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text.trim())) return null;
  const value =
    Number(text.trim().replace(",", ".")) / (unit === "lb" ? 2.2046226218 : 1);
  return validStartWeight(value) ? Math.round(value * 100) / 100 : null;
}

/** Only preferences live here. This store has no workout/streak dependency. */
export function createOnboardingStore(storage: Storage) {
  let queue: Promise<unknown> = Promise.resolve();
  let loading: Promise<void> | null = null;
  let retained: Record<string, unknown> = {};
  return createStore<State>()((set, get) => {
    const write = () => {
      if (!get().hydrated)
        return Promise.reject(new Error("Onboarding has not loaded"));
      const { draft, profile, completed } = get();
      const payload = JSON.stringify({
        version: 1,
        state: { ...retained, draft, profile, completed },
      });
      queue = queue
        .catch(() => {})
        .then(() => storage.setItem(ONBOARDING_KEY, payload))
        .then(
          () => {
            set({ error: null });
          },
          () => {
            set({
              error:
                "Deine Angaben konnten nicht gespeichert werden. Bitte versuche es erneut.",
            });
            throw new Error("Onboarding storage failed");
          },
        );
      void queue.catch(() => {});
      return queue;
    };
    return {
      draft: freshDraft(),
      profile: {},
      completed: false,
      hydrated: false,
      error: null,
      hydrate: () => {
        if (get().hydrated) return Promise.resolve();
        if (loading) return loading;
        loading = (async () => {
          try {
            const raw = await storage.getItem(ONBOARDING_KEY);
            if (raw) {
              const saved = JSON.parse(raw);
              if (
                saved.version !== 1 ||
                !saved.state ||
                typeof saved.state !== "object"
              )
                throw new Error("Unsupported onboarding");
              const s = saved.state;
              const d = { ...freshDraft(), ...s.draft } as Draft;
              if (
                !Number.isInteger(d.step) ||
                d.step < 0 ||
                d.step > 6 ||
                !Array.isArray(d.days) ||
                d.days.some((n) => !Number.isInteger(n) || n < 0 || n > 6) ||
                ![null, "strength", "muscle", "routine"].includes(d.goal) ||
                ![null, "new", "returning", "regular"].includes(d.experience) ||
                !["kg", "lb"].includes(d.unit) ||
                (d.weightKg !== null && !validStartWeight(d.weightKg)) ||
                !Number.isFinite(d.demoWeight) ||
                d.demoWeight < 0 ||
                d.demoWeight > 300 ||
                !Number.isInteger(d.demoReps) ||
                d.demoReps < 1 ||
                d.demoReps > 100 ||
                typeof d.weightConfirmed !== "boolean" ||
                typeof d.demoDone !== "boolean" ||
                ![null, 6].includes(d.returnTo)
              )
                throw new Error("Invalid draft");
              if (
                s.profile !== undefined &&
                (!s.profile ||
                  typeof s.profile !== "object" ||
                  Array.isArray(s.profile))
              )
                throw new Error("Invalid profile");
              retained = s;
              set({
                draft: d,
                profile: s.profile ?? {},
                completed: s.completed === true,
              });
            }
            set({ hydrated: true, error: null });
          } catch {
            set({
              error:
                "Gespeicherte Angaben konnten nicht geladen werden. Bitte erneut versuchen.",
            });
          } finally {
            loading = null;
          }
        })();
        return loading;
      },
      update: (patch) => {
        if (!get().hydrated) return;
        set({ draft: { ...get().draft, ...patch } });
        void write();
      },
      flush: async () => {
        await write();
      },
      complete: async () => {
        const { draft, profile, completed } = get();
        if (!get().hydrated || !draft.goal || !draft.experience)
          throw new Error("Missing preferences");
        set({
          profile: {
            ...profile,
            goal: draft.goal,
            experience: draft.experience,
            days: [...draft.days],
          },
          completed: true,
        });
        try {
          await write();
        } catch (error) {
          set({ profile, completed });
          throw error;
        }
      },
      // Restart the experience, never delete the saved profile or real training data.
      restart: () => {
        const { profile } = get();
        set({
          draft: {
            ...freshDraft(),
            goal: profile.goal ?? null,
            experience: profile.experience ?? null,
            days: profile.days ?? [],
          },
        });
        void write();
      },
    };
  });
}
