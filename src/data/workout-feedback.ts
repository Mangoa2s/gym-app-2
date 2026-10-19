import type { createWorkoutStore } from '../store/workout-state.ts';

type Store = Pick<ReturnType<typeof createWorkoutStore>, 'getState'>;

/** Feedback belongs to an unchanged, durably saved confirmation, never a reload. */
export async function waitForSavedSet(store: Store, sessionId: number, exerciseId: string, setId: string) {
  const session = store.getState().session;
  const snapshot = session?.exercises.find((item) => item.exercise.id === exerciseId)?.sets.find((entry) => entry.id === setId);
  if (session?.id !== sessionId || !snapshot?.confirmed) return false;
  const saved = await store.getState().flush();
  const current = store.getState().session;
  const entry = current?.exercises.find((item) => item.exercise.id === exerciseId)?.sets.find((row) => row.id === setId);
  return saved && current?.id === sessionId && entry === snapshot && entry.confirmed;
}
