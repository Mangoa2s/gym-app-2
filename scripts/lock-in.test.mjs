import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXERCISES } from '../src/data/exercises.ts';
import { activeMinutes, findPRs, summarizeHistory } from '../src/lib/history.ts';
import { activeElapsedMs, lastTimeLabel, previousSet, sessionOutcomes, speechFor, strongerStreak, vsProgress, templateOpponent } from '../src/lib/lock-in.ts';
import { compareSet } from '../src/lib/set-compare.ts';
import { workoutXp } from '../src/lib/progression.ts';
import { createWorkoutStore } from '../src/store/workout-state.ts';

const bench = EXERCISES.find((item) => item.id === 'barbell-bench');
const values = (kg, reps) => ({ weightKg: kg, reps: String(reps) });

/** Records one live workout through the real store actions. */
async function train(store, clock, sets) {
  assert.equal(store.getState().start(), true);
  store.getState().chooseMode(null);
  store.getState().addExercise(bench);
  for (let index = 0; index < sets.length; index++) {
    if (index > 0) store.getState().addSet(bench.id);
    const row = store.getState().session.exercises[0].sets[index];
    store.getState().editSet(bench.id, row.id, 'weightKg', sets[index][0]);
    store.getState().editSet(bench.id, row.id, 'reps', String(sets[index][1]));
    clock.now += 90000;
    assert.equal(store.getState().confirmSet(bench.id, row.id), null);
  }
  clock.now += 60000;
  assert.equal(await store.getState().end(), true);
  return store.getState().history[0];
}

test('completedAt only on confirmation; the first log is a baseline, later heavier sets are live PRs', async () => {
  const clock = { now: new Date(2026, 9, 10, 18).getTime() };
  const store = createWorkoutStore(() => clock.now);
  const first = await train(store, clock, [['80', 8], ['82,5', 6]]);
  assert.ok(first.exercises[0].sets.every((entry) => entry.completedAt && entry.isPr === false));
  clock.now = new Date(2026, 9, 17, 18).getTime();
  const second = await train(store, clock, [['85', 5], ['87,5', 3], ['80', 8]]);
  assert.deepEqual(second.exercises[0].sets.map((entry) => entry.isPr), [true, true, false]);
  // History reports one PR per exercise and workout: the heaviest flagged set.
  const [pr] = findPRs(store.getState().history).get(second.id);
  assert.deepEqual([pr.weightKg, pr.reps], [87.5, 3]);
  assert.equal(findPRs(store.getState().history).has(first.id), false);
});

test('editing or undoing a confirmed set removes its time and PR verdict', () => {
  const clock = { now: 1_000_000 };
  const store = createWorkoutStore(() => clock.now);
  store.getState().start(); store.getState().addExercise(bench);
  const row = store.getState().session.exercises[0].sets[0];
  store.getState().editSet(bench.id, row.id, 'weightKg', '60'); store.getState().editSet(bench.id, row.id, 'reps', '10');
  store.getState().confirmSet(bench.id, row.id);
  assert.equal(store.getState().session.exercises[0].sets[0].completedAt, 1_000_000);
  store.getState().editSet(bench.id, row.id, 'reps', '9');
  const edited = store.getState().session.exercises[0].sets[0];
  assert.equal(edited.confirmed, false); assert.equal('completedAt' in edited, false); assert.equal('isPr' in edited, false);
});

test('stronger, same, less and extra; more reps at the same weight is stronger but not a PR', () => {
  const set = (kg, reps) => ({ id: 'x', confirmed: true, values: values(kg, reps) });
  assert.deepEqual(compareSet('strength', set('82,5', 6), set('80', 8)), { kind: 'stronger', delta: '+2,5 kg' });
  assert.deepEqual(compareSet('strength', set('80', 10), set('80', 8)), { kind: 'stronger', delta: '+2 Wdh.' });
  assert.equal(compareSet('strength', set('80', 8), set('80', 8)).kind, 'same');
  assert.equal(compareSet('strength', set('77,5', 10), set('80', 8)).kind, 'less');
  assert.equal(compareSet('strength', set('80', 8), undefined).kind, 'extra');
  assert.equal(compareSet('assisted', { id: 'a', confirmed: true, values: { assistanceKg: '20', reps: '8' } }, { id: 'b', confirmed: true, values: { assistanceKg: '25', reps: '8' } }).kind, 'stronger');
  // The ghost never scolds.
  assert.equal(speechFor({ kind: 'less' }, 'strength', set('70', 8)).title, 'Zählt trotzdem. Weiter so.');
  assert.equal(speechFor({ kind: 'pr' }, 'strength', set('87,5', 3)).title, 'Neuer PR! 87,5 kg');
  assert.equal(speechFor({ kind: 'extra' }, 'strength', set('80', 8)).title, 'Extra-Satz! Das zählt.');
});

test('new sets are pre-filled from last time; streak, outcomes and XP follow the same comparison', async () => {
  const clock = { now: new Date(2026, 9, 10, 18).getTime() };
  const store = createWorkoutStore(() => clock.now);
  await train(store, clock, [['80', 8], ['80', 8], ['80', 6]]);
  clock.now = new Date(2026, 9, 17, 18).getTime();
  store.getState().start(); store.getState().chooseMode(null); store.getState().addExercise(bench);
  assert.deepEqual(store.getState().session.exercises[0].sets[0].values, values('80', 8));
  store.getState().addSet(bench.id); store.getState().addSet(bench.id); store.getState().addSet(bench.id);
  assert.deepEqual(store.getState().session.exercises[0].sets.map((entry) => entry.values.reps), ['8', '8', '6', '6']);
  const confirm = (index, kg, reps) => { const row = store.getState().session.exercises[0].sets[index]; store.getState().editSet(bench.id, row.id, 'weightKg', kg); store.getState().editSet(bench.id, row.id, 'reps', String(reps)); clock.now += 60000; store.getState().confirmSet(bench.id, row.id); };
  confirm(0, '80', 9); confirm(1, '82,5', 8);
  const history = store.getState().history;
  assert.equal(strongerStreak(store.getState().session, history), 2);
  confirm(2, '80', 6);
  assert.equal(strongerStreak(store.getState().session, history), 0);
  assert.equal(previousSet(history, bench.id, 3), undefined);
  assert.deepEqual(sessionOutcomes(store.getState().session, history), { stronger: 2, prs: 1 });
  assert.equal(workoutXp(3, 1, 2), 100 + 2 * 20 + 40);
  assert.equal(lastTimeLabel(history, bench), 'Letztes Mal: 3 × 80 kg × 8');
  await store.getState().end();
  const [latest] = summarizeHistory(store.getState().history);
  assert.deepEqual([latest.stronger, latest.prs.length, latest.xp], [2, 1, 180]);
});

test('pause stops the clock and is excluded from the saved duration', async () => {
  const clock = { now: 1_000_000 };
  const store = createWorkoutStore(() => clock.now);
  store.getState().start(); store.getState().chooseMode(null);
  clock.now += 10 * 60000; store.getState().togglePause();
  clock.now += 5 * 60000;
  assert.equal(activeElapsedMs(store.getState().session, clock.now), 10 * 60000);
  store.getState().togglePause(); clock.now += 20 * 60000;
  assert.equal(activeElapsedMs(store.getState().session, clock.now), 30 * 60000);
  await store.getState().end();
  const [workout] = store.getState().history;
  assert.equal(workout.pausedMs, 5 * 60000); assert.equal(activeMinutes(workout), 30);
});

test('save as workout → VS mode pre-fills sets and the ghost follows last time\'s completedAt', async () => {
  const clock = { now: new Date(2026, 9, 10, 18).getTime() };
  const store = createWorkoutStore(() => clock.now);
  const first = await train(store, clock, [['80', 8], ['80', 8]]);
  assert.equal(await store.getState().saveTemplate(first.id, 'Push A'), null);
  const [template] = store.getState().templates;
  assert.equal(template.name, 'Push A'); assert.ok(template.uuid && template.createdAt);
  assert.equal(templateOpponent(store.getState().history, template.id).id, first.id);
  assert.ok(await store.getState().saveTemplate(first.id, 'Doppelt'), 'saving the same workout twice is refused');
  clock.now = new Date(2026, 9, 17, 18).getTime();
  store.getState().start();
  assert.equal(store.getState().chooseMode(template.id), true);
  const session = store.getState().session;
  assert.deepEqual([session.mode, session.name, session.startedAt], ['vs', 'Push A', clock.now]);
  assert.deepEqual(session.exercises[0].sets.map((entry) => [entry.values.weightKg, entry.confirmed]), [['80', false], ['80', false]]);
  // Last time: set 1 after 90 s, set 2 after 180 s. Goal = 1280 kg.
  const before = vsProgress(session, templateOpponent(store.getState().history, template.id), 100000);
  assert.deepEqual([before.goal, before.ghostValue, before.youValue, before.you], [1280, 640, 0, 0]);
  const after = vsProgress(session, templateOpponent(store.getState().history, template.id), 200000);
  assert.equal(after.ghost, 1);
});
