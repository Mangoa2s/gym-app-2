import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createOnboardingStore,
  freshDraft,
  manualWeight,
  ONBOARDING_KEY,
} from "../src/store/onboarding-state.ts";

function memory(saved = null) {
  const data = new Map(saved ? [[ONBOARDING_KEY, JSON.stringify(saved)]] : []);
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
  };
}
test("demo and day preferences never create workouts or weight entries; draft resumes", async () => {
  const storage = memory();
  const store = createOnboardingStore(storage);
  await store.getState().hydrate();
  store
    .getState()
    .update({
      step: 4,
      goal: "routine",
      experience: "new",
      demoDone: true,
      demoWeight: 42.5,
      demoReps: 9,
      days: [0, 2, 4],
    });
  await store.getState().flush();
  const reload = createOnboardingStore(storage);
  await reload.getState().hydrate();
  assert.equal(reload.getState().draft.step, 4);
  assert.equal(reload.getState().draft.demoWeight, 42.5);
  assert.deepEqual(reload.getState().draft.days, [0, 2, 4]);
  assert.equal(reload.getState().draft.weightKg, null);
  assert.deepEqual([...storage.data.keys()], [ONBOARDING_KEY]);
  await reload.getState().complete();
  const again = createOnboardingStore(storage);
  await again.getState().hydrate();
  assert.equal(again.getState().completed, true);
  assert.deepEqual(again.getState().profile, {
    goal: "routine",
    experience: "new",
    days: [0, 2, 4],
  });
});
test("skip, back, individual edits and restart retain appropriate data without deleting a profile", async () => {
  const storage = memory({
    version: 1,
    state: {
      futureField: "keep",
      profile: { nickname: "Test", goal: "strength", days: [1] },
      draft: freshDraft(),
      completed: true,
    },
  });
  const store = createOnboardingStore(storage);
  await store.getState().hydrate();
  store.getState().restart();
  assert.equal(store.getState().draft.goal, "strength");
  assert.deepEqual(store.getState().draft.days, [1]);
  store
    .getState()
    .update({
      experience: "regular",
      step: 6,
      weightKg: 79,
      weightConfirmed: true,
    });
  store.getState().update({ step: 5, returnTo: 6 });
  store
    .getState()
    .update({
      step: 6,
      returnTo: null,
      weightKg: null,
      weightConfirmed: false,
    });
  await store.getState().complete();
  assert.equal(store.getState().profile.nickname, "Test");
  assert.equal(store.getState().draft.weightKg, null);
  assert.equal(
    JSON.parse(storage.data.get(ONBOARDING_KEY)).state.futureField,
    "keep",
  );
});
test("delayed writes stay ordered and completion survives reload", async () => {
  let payload;
  const store = createOnboardingStore({
    getItem: async () => null,
    setItem: async (_, value) => {
      await new Promise((r) => setTimeout(r, 5));
      payload = value;
    },
  });
  await store.getState().hydrate();
  for (let i = 1; i <= 6; i++) store.getState().update({ step: i });
  store.getState().update({ goal: "muscle", experience: "returning" });
  await store.getState().complete();
  assert.equal(JSON.parse(payload).state.completed, true);
  assert.equal(JSON.parse(payload).state.draft.step, 6);
});
test("failed hydration preserves the original bytes and prohibits writes", async () => {
  let writes = 0;
  const store = createOnboardingStore({
    getItem: async () => "{bad",
    setItem: async () => {
      writes++;
    },
  });
  await store.getState().hydrate();
  store.getState().update({ step: 1 });
  await assert.rejects(store.getState().flush());
  assert.equal(store.getState().hydrated, false);
  assert.equal(writes, 0);
});
test("failed completion can be retried and never marks onboarding complete", async () => {
  let fail = true;
  const store = createOnboardingStore({
    getItem: async () => null,
    setItem: async () => {
      if (fail) throw new Error("disk");
    },
  });
  await store.getState().hydrate();
  store.getState().update({ goal: "strength", experience: "regular" });
  await assert.rejects(store.getState().complete());
  assert.equal(store.getState().completed, false);
  fail = false;
  await store.getState().complete();
  assert.equal(store.getState().completed, true);
});
test("manual input supports comma, kg/lb and rejects invalid or out of range values", () => {
  assert.equal(manualWeight("82,4", "kg"), 82.4);
  assert.equal(manualWeight("181.66", "lb"), 82.4);
  for (const value of ["abc", "", "12,3,4", "-80", "19.9", "350.1", "82.444"])
    assert.equal(manualWeight(value, "kg"), null);
  assert.equal(manualWeight("20", "kg"), 20);
  assert.equal(manualWeight("350", "kg"), 350);
});
