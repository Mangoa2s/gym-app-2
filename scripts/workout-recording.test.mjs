import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXERCISES, EQUIPMENT, MUSCLE_GROUPS, TRACKING_TYPES, searchExercises } from '../src/data/exercises.ts';
import { ENTRY_FIELDS, describeEntry, entryError } from '../src/data/workout-records.ts';
import { waitForSavedSet } from '../src/data/workout-feedback.ts';
import { createWorkoutStore, WORKOUT_STORAGE_KEY } from '../src/store/workout-state.ts';

const exercise = (id) => EXERCISES.find((item) => item.id === id);
const memory = () => {
  let value = null;
  return { getItem: async () => value, setItem: async (key, next) => { assert.equal(key, WORKOUT_STORAGE_KEY); value = next; }, read: () => JSON.parse(value) };
};

test('set feedback requires a completed durable write and never counts an unconfirmed draft', async () => {
  const disk = memory(); const store = createWorkoutStore(() => 1000, disk);
  await store.getState().hydrate(); store.getState().start();
  const id = fill(store, 'barbell-bench', { weightKg: '62,5', reps: '8' });
  const sessionId = store.getState().session.id;
  assert.equal(await waitForSavedSet(store, sessionId, 'barbell-bench', id), false);
  assert.equal(store.getState().confirmSet('barbell-bench', id), null);
  assert.equal(await waitForSavedSet(store, sessionId, 'barbell-bench', id), true);
  assert.equal(disk.read().state.session.exercises[0].sets[0].confirmed, true);
});

test('failed storage and edits during a slow write cannot produce saved-set feedback', async () => {
  let fail = false;
  const disk = { getItem: async () => null, setItem: async () => { if (fail) throw Error('disk full'); } };
  const store = createWorkoutStore(() => 1000, disk); await store.getState().hydrate(); store.getState().start();
  const id = fill(store, 'barbell-bench', { weightKg: '60', reps: '8' }); await store.getState().flush();
  store.getState().confirmSet('barbell-bench', id); fail = true;
  assert.equal(await waitForSavedSet(store, store.getState().session.id, 'barbell-bench', id), false);
  fail = false; await store.getState().flush();
  // Queue a single delayed persistence snapshot while the user corrects its values.
  let unlock; let started;
  const slow = { getItem: async () => null, setItem: async () => { if (started) { const notify = started; started = null; notify(); await new Promise((resolve) => { unlock = resolve; }); } } };
  const second = createWorkoutStore(() => 2000, slow); await second.getState().hydrate(); second.getState().start();
  const row = fill(second, 'barbell-bench', { weightKg: '60', reps: '8' }); await second.getState().flush();
  const waiting = new Promise((resolve) => { started = resolve; });
  second.getState().confirmSet('barbell-bench', row);
  const feedback = waitForSavedSet(second, second.getState().session.id, 'barbell-bench', row);
  await waiting; second.getState().editSet('barbell-bench', row, 'reps', '9'); unlock();
  assert.equal(await feedback, false);
});
function fill(store, id, values) {
  store.getState().addExercise(exercise(id));
  const row = store.getState().session.exercises.find((item) => item.exercise.id === id).sets[0];
  for (const [key, value] of Object.entries(values)) store.getState().editSet(id, row.id, key, value);
  return row.id;
}

test('catalog has unique IDs, names, complete metadata and all requested categories', () => {
  assert.equal(new Set(EXERCISES.map((item) => item.id)).size, EXERCISES.length);
  assert.equal(new Set(EXERCISES.map((item) => item.name)).size, EXERCISES.length);
  assert.ok(EXERCISES.length >= 100);
  for (const muscle of MUSCLE_GROUPS) assert.ok(EXERCISES.some((item) => item.muscle === muscle), muscle);
  for (const equipment of EQUIPMENT) assert.ok(EXERCISES.some((item) => item.equipment === equipment), equipment);
  for (const tracking of Object.keys(TRACKING_TYPES)) assert.ok(EXERCISES.some((item) => item.tracking === tracking), tracking);
  for (const item of EXERCISES) { assert.ok(item.englishName); assert.ok(Array.isArray(item.aliases)); assert.ok(Array.isArray(item.secondaryMuscles)); }
});
test('German, English, case, umlaut spellings, aliases and intersected filters', () => {
  for (const term of ['Bankdrücken', 'BANKDRÜCKEN', 'bankdruecken', 'bench press', 'flachbank']) assert.ok(searchExercises(EXERCISES, term).some((item) => item.id === 'barbell-bench'), term);
  assert.ok(searchExercises(EXERCISES, 'plank').some((item) => item.id === 'plank'));
  assert.deepEqual(searchExercises(EXERCISES, 'bench press', 'Brust', 'Kurzhantel').map((item) => item.id), ['dumbbell-bench', 'dumbbell-incline']);
  assert.equal(searchExercises(EXERCISES, 'not an exercise').length, 0);
});
test('duplicate selection expands the existing exercise and preserves entered values', () => {
  const store = createWorkoutStore(() => 1000); store.getState().start();
  const row = fill(store, 'barbell-bench', { weightKg: '62,5', reps: '8' });
  store.getState().expand(null);
  for (let i = 0; i < 20; i++) store.getState().addExercise(exercise('barbell-bench'));
  assert.equal(store.getState().session.exercises.length, 1);
  assert.equal(store.getState().session.expandedId, 'barbell-bench');
  assert.equal(store.getState().session.exercises[0].sets[0].id, row);
  assert.equal(store.getState().session.exercises[0].sets[0].values.weightKg, '62,5');
});
const samples = [
  ['barbell-bench', { weightKg: '62,5', reps: '8' }],
  ['pull-up', { reps: '7', addedWeightKg: '2.5' }],
  ['assisted-pull-up', { assistanceKg: '15,5', reps: '9' }],
  ['plank', { durationSeconds: '45', addedWeightKg: '' }],
  ['treadmill', { durationMinutes: '20,5', distanceKm: '3.2' }],
];
for (const [id, values] of samples) test(`${id}: blank, fill, confirm, edit, reconfirm, undo`, () => {
  const store = createWorkoutStore(() => 1000); store.getState().start(); store.getState().addExercise(exercise(id));
  const first = store.getState().session.exercises[0].sets[0];
  assert.deepEqual(first.values, {});
  assert.ok(store.getState().confirmSet(id, first.id));
  const row = fill(store, id, values);
  assert.equal(store.getState().confirmSet(id, row), null);
  assert.equal(store.getState().session.exercises[0].sets[0].confirmed, true);
  const key = Object.keys(values)[0];
  store.getState().editSet(id, row, key, '10');
  assert.equal(store.getState().session.exercises[0].sets[0].confirmed, false);
  assert.equal(store.getState().confirmSet(id, row), null);
  store.getState().confirmSet(id, row);
  assert.equal(store.getState().session.exercises[0].sets[0].confirmed, false);
});
test('input validation rejects nonfinite, negative, fractional reps, zero durations and incomplete decimals', () => {
  for (const value of ['NaN', 'Infinity', '-2', '1,2,3', '1e3', '10kg', '2,']) assert.ok(entryError('strength', { id: 'x', confirmed: false, values: { weightKg: value, reps: '8' } }));
  assert.ok(entryError('bodyweight', { id: 'x', values: { reps: '1.5' } }));
  assert.ok(entryError('hold', { id: 'x', values: { durationSeconds: '0' } }));
  assert.equal(entryError('bodyweight', { id: 'x', values: { reps: '5' } }), null);
  assert.equal(entryError('cardio', { id: 'x', values: { durationMinutes: '5' } }), null);
  assert.equal(ENTRY_FIELDS.assisted.some((field) => field.key === 'weightKg'), false);
  assert.match(describeEntry('assisted', { values: { assistanceKg: '20', reps: '8' } }), /20 kg Unterstützung/);
});
test('reload restores drafts, confirmed sets, custom catalog and timestamp without replaying intro', async () => {
  const storage = memory(); const store = createWorkoutStore(() => 1000, storage);
  assert.equal(store.getState().start(), false);
  await store.getState().hydrate(); store.getState().start();
  for (const [id, values] of samples) { const row = fill(store, id, values); store.getState().confirmSet(id, row); }
  store.getState().addSet('barbell-bench');
  const draft = store.getState().session.exercises[0].sets[1];
  store.getState().editSet('barbell-bench', draft.id, 'weightKg', '65,');
  const custom = store.getState().createExercise({ name: 'Meine Übung', englishName: '', aliases: [], muscle: 'Ganzkörper', secondaryMuscles: [], equipment: 'Widerstandsband', tracking: 'hold' });
  store.getState().addExercise(custom); await store.getState().flush();
  const reopened = createWorkoutStore(() => 5000, storage); await reopened.getState().hydrate();
  assert.deepEqual(reopened.getState().session.exercises, store.getState().session.exercises);
  assert.deepEqual(reopened.getState().customExercises, [custom]);
  assert.equal(reopened.getState().session.startedAt, 1000);
  assert.equal(reopened.getState().session.introPlayed, true);
  assert.equal(reopened.getState().session.expandedId, custom.id);
  assert.equal(reopened.getState().session.exercises[0].sets[1].values.weightKg, '65,');
  await reopened.getState().end();
  const final = createWorkoutStore(() => 8000, storage); await final.getState().hydrate();
  assert.equal(final.getState().session, null);
  assert.equal(final.getState().history.length, 1);
  assert.equal(final.getState().history[0].exercises.length, samples.length);
  assert.ok(final.getState().history[0].exercises.every((item) => item.sets.length === 1 && item.sets[0].confirmed));
  assert.equal(final.getState().history[0].endedAt, 5000);
  assert.equal(final.getState().customExercises.length, 1);
});
test('filled and confirmed rows require explicit deletion approval', () => {
  const store = createWorkoutStore(() => 1000); store.getState().start();
  const row = fill(store, 'plank', { durationSeconds: '30' });
  assert.equal(store.getState().removeSet('plank', row), false);
  store.getState().confirmSet('plank', row);
  assert.equal(store.getState().removeSet('plank', row), false);
  assert.equal(store.getState().removeSet('plank', row, true), true);
  assert.equal(store.getState().session.exercises[0].sets.length, 0);
});
test('slow writes serialize; rapid finish saves history exactly once', async () => {
  let value; let active = 0; let maxActive = 0;
  const storage = { getItem: async () => null, setItem: async (_, data) => { active++; maxActive = Math.max(maxActive, active); await new Promise((resolve) => setTimeout(resolve, 2)); value = data; active--; } };
  const store = createWorkoutStore(() => 1000, storage); await store.getState().hydrate(); store.getState().start();
  const row = fill(store, 'plank', { durationSeconds: '40' }); store.getState().confirmSet('plank', row);
  const first = store.getState().end(); const duplicate = store.getState().end(); await store.getState().flush();
  assert.equal(await first, true); assert.equal(await duplicate, false);
  assert.equal(maxActive, 1); assert.equal(JSON.parse(value).state.history.length, 1); assert.equal(JSON.parse(value).state.session, null);
});
test('failed finish retains active data and can retry; corrupt storage is never overwritten', async () => {
  let fail = true; let written = null;
  const storage = { getItem: async () => null, setItem: async (_, value) => { if (fail) throw Error('disk full'); written = value; } };
  const store = createWorkoutStore(() => 1000, storage); await store.getState().hydrate(); store.getState().start();
  const row = fill(store, 'plank', { durationSeconds: '30' }); store.getState().confirmSet('plank', row);
  assert.equal(await store.getState().end(), false);
  assert.ok(store.getState().session); assert.equal(store.getState().history.length, 0); assert.equal(store.getState().saveError, true);
  fail = false; assert.equal(await store.getState().end(), true); assert.equal(JSON.parse(written).state.history.length, 1);
  let writes = 0; const corrupt = createWorkoutStore(() => 1000, { getItem: async () => '{broken', setItem: async () => writes++ });
  await corrupt.getState().hydrate(); assert.equal(corrupt.getState().loadError, true); assert.equal(corrupt.getState().start(), false); await corrupt.getState().flush(); assert.equal(writes, 0);
});
test('custom names cannot silently duplicate built-in or own exercises', () => {
  const store = createWorkoutStore(() => 1000);
  const input = { name: 'Meine Übung', englishName: '', aliases: [], muscle: 'Ganzkörper', secondaryMuscles: [], equipment: 'Körpergewicht', tracking: 'bodyweight' };
  const first = store.getState().createExercise(input);
  assert.equal(store.getState().createExercise({ ...input, name: ' MEINE ÜBUNG ' }).id, first.id);
  assert.equal(store.getState().customExercises.length, 1);
  assert.equal(store.getState().createExercise({ ...input, name: 'Plank' }).id, 'plank');
});
