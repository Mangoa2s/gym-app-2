import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXERCISES } from '../src/data/exercises.ts';
import { localDay, trainingStreak } from '../src/data/calendar.ts';
import { createWorkoutStore } from '../src/store/workout-state.ts';
import { calendarGhost, finishFeedback, GHOST_POSES, ghostPose, workoutGhost } from '../src/components/berkk/ghost-state.ts';

const exercise = EXERCISES.find((item) => item.id === 'barbell-bench');

test('moods stay distinguishable through posture and eyes', () => {
  const { focused, weak, strong, calm, normal } = GHOST_POSES;
  assert.equal(normal, calm);
  // Focus: lidded eyes looking down toward the list, calmer breath.
  assert.ok(focused.eyeOpen < 1 && focused.eyeY > 0 && focused.breath < calm.breath);
  // Weak: sunk, flattened, heavy drooping lids.
  assert.ok(weak.lift > 0 && weak.scaleY < 1 && weak.scaleX > 1 && weak.eyeOpen < focused.eyeOpen && weak.eyeTilt !== 0);
  // Strong: raised and stretched (never flattened), wide eyes looking up.
  assert.ok(strong.lift < 0 && strong.scaleY > 1 && strong.scaleX < 1 && strong.eyeScale > 1 && strong.eyeY < 0);
  for (const pose of Object.values(GHOST_POSES)) assert.ok(pose.eyeOpen > 0 && pose.eyeOpen <= 1 && pose.breathHalfMs > 0 && pose.blinkEveryMs > 1000);
  assert.equal(ghostPose('weak'), weak);
});

test('streak glow and greetings only for a real streak', () => {
  assert.deepEqual(workoutGhost(0), { mood: 'focused', glow: false });
  assert.deepEqual(workoutGhost(4), { mood: 'focused', glow: true });
  assert.deepEqual(calendarGhost(0, false), { mood: 'calm', idle: false, glow: false, greet: false });
  assert.equal(calendarGhost(3, false).mood, 'calm');
  assert.equal(calendarGhost(3, true).mood, 'strong');
  assert.ok(calendarGhost(3, true).greet);
});

test('save feedback celebrates only an actual streak increase', () => {
  assert.deepEqual(finishFeedback(2, 2), { message: 'Training gespeichert', detail: undefined, reaction: 'success' });
  assert.deepEqual(finishFeedback(0, 1), { message: 'Training gespeichert', detail: 'Serie gestartet: 1×', reaction: 'streak' });
  assert.equal(finishFeedback(4, 5).detail, 'Serie: 5× in Folge');
  assert.equal(finishFeedback(5, 0).reaction, 'success');
});

test('finishing a real workout after yesterday reports the streak computed from stored history', async () => {
  const today = new Date(2026, 9, 15, 18, 0).getTime();
  const store = createWorkoutStore(() => today);
  const yesterday = localDay(new Date(2026, 9, 14, 12));
  assert.equal(await store.getState().saveHistory({ name: 'Gestern', localDate: yesterday, durationMinutes: 40, exercises: [{ exercise, sets: [{ id: 'a', values: { weightKg: '60', reps: '8' }, confirmed: true }] }] }), null);
  const day = localDay(today);
  const before = trainingStreak(store.getState().history, day);
  assert.equal(before, 1);
  assert.equal(store.getState().start(), true);
  store.getState().addExercise(exercise);
  const row = store.getState().session.exercises[0].sets[0];
  store.getState().editSet(exercise.id, row.id, 'weightKg', '62,5');
  store.getState().editSet(exercise.id, row.id, 'reps', '6');
  assert.equal(store.getState().confirmSet(exercise.id, row.id), null);
  assert.equal(await store.getState().end(), true);
  const feedback = finishFeedback(before, trainingStreak(store.getState().history, day));
  assert.equal(feedback.reaction, 'streak');
  assert.equal(feedback.detail, 'Serie: 2× in Folge');
  // A second workout the same day does not count as another streak day.
  assert.equal(store.getState().start(), true);
  store.getState().addExercise(exercise);
  const next = store.getState().session.exercises[0].sets[0];
  store.getState().editSet(exercise.id, next.id, 'weightKg', '50');
  store.getState().editSet(exercise.id, next.id, 'reps', '10');
  store.getState().confirmSet(exercise.id, next.id);
  const again = trainingStreak(store.getState().history, day);
  assert.equal(await store.getState().end(), true);
  assert.equal(finishFeedback(again, trainingStreak(store.getState().history, day)).reaction, 'success');
});
