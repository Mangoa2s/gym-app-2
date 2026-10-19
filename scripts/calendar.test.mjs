import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { EXERCISES } from '../src/data/exercises.ts';
import { calendarDay, calendarMonths, completedDays, dayDate, localDay, monthDays, shiftMonth, trainingStreak, workoutDay } from '../src/data/calendar.ts';
import { createWorkoutStore } from '../src/store/workout-state.ts';
import { calendarInset, calendarMetrics, calendarMonthLayouts, dayScrollOffset, spokenDay } from '../src/data/calendar-layout.ts';

const exercise = EXERCISES.find((item) => item.id === 'barbell-bench');
const sets = () => [{ exercise, sets: [{ id: 'first', values: { weightKg: '62,5', reps: '8' }, confirmed: true }, { id: 'second', values: { weightKg: '60', reps: '10' }, confirmed: true }] }];
const now = () => new Date(2026, 9, 1, 0, 15).getTime();
const entry = (day = '2026-09-30') => ({ name: 'Oberkörper', localDate: day, durationMinutes: 45, exercises: sets(), note: 'Saubere Wiederholungen.', feeling: 'strong' });
const memory = (initial = null) => { let value = initial; let fail = false; return { getItem: async () => value, setItem: async (_, next) => { if (fail) throw Error('disk full'); value = next; }, read: () => JSON.parse(value), fail: (next) => { fail = next; } }; };

test('Monday grids: four, five and six weeks, leap years and year transitions', () => {
  assert.equal(monthDays('2021-02-01').length, 28);
  assert.equal(monthDays('2026-10-01').length, 35);
  const six = monthDays('2026-03-01'); assert.equal(six.length, 42); assert.equal(six[6], '2026-03-01'); assert.equal(six.filter(Boolean).length, 31);
  assert.equal(monthDays('2024-02-01').filter(Boolean).length, 29);
  assert.equal(monthDays('2100-02-01').filter(Boolean).length, 28);
  assert.equal(shiftMonth('2026-12-31', 1), '2027-01-31');
  assert.equal(shiftMonth('2026-01-31', 1), '2026-02-28');
  assert.equal(shiftMonth('2024-03-31', -1), '2024-02-29');
  assert.equal(dayDate('2026-02-30'), null); assert.equal(dayDate('2026-13-01'), null);
});
test('local midnight and DST use calendar days, not UTC or fixed 24-hour subtraction', () => {
  assert.equal(localDay(new Date(2026, 9, 1, 0, 15)), '2026-10-01');
  assert.equal(workoutDay({ startedAt: new Date(2026, 8, 30, 23, 59).getTime() }), '2026-09-30');
  const history = ['2026-03-28', '2026-03-29', '2026-03-30'].map((localDate) => ({ localDate, exercises: sets() }));
  assert.equal(trainingStreak(history, '2026-03-30'), 3);
  assert.equal(trainingStreak(history, '2026-03-31'), 3);
  assert.equal(trainingStreak(history, '2026-04-01'), 0);
});
test('yesterday entry, two workouts on one day, correction by ID, all fields survive restart', async () => {
  const disk = memory(); const store = createWorkoutStore(now, disk); await store.getState().hydrate();
  assert.equal(await store.getState().saveHistory(entry()), null);
  assert.equal(await store.getState().saveHistory({ ...entry(), name: 'Zweites Training' }), null);
  const [second, first] = store.getState().history; assert.notEqual(first.id, second.id);
  assert.equal(store.getState().session, null);
  assert.equal(await store.getState().saveHistory({ ...entry(), id: first.id, name: 'Korrigiert', note: 'Neue Notiz', feeling: 'weak', exercises: [{ exercise, sets: [{ id: 'first', confirmed: true, values: { weightKg: '65', reps: '8' } }] }] }), null);
  const reopened = createWorkoutStore(now, disk); await reopened.getState().hydrate();
  assert.equal(reopened.getState().history.length, 2);
  const edited = reopened.getState().history.find((item) => item.id === first.id);
  assert.equal(edited.exercises[0].sets[0].values.weightKg, '65');
  assert.equal(edited.note, 'Neue Notiz'); assert.equal(edited.feeling, 'weak'); assert.equal(workoutDay(edited), '2026-09-30');
  assert.equal(reopened.getState().history.find((item) => item.id === second.id).name, 'Zweites Training');
  assert.equal(completedDays(reopened.getState().history).size, 1);
  assert.equal(trainingStreak(reopened.getState().history, '2026-10-01'), 1);
});
test('plan next week, move, restart, start as blank template and finish exactly once', async () => {
  const disk = memory(); const store = createWorkoutStore(now, disk); await store.getState().hydrate();
  assert.equal(await store.getState().savePlan({ name: 'Push', localDate: '2026-10-08', exercises: [exercise] }), null);
  const id = store.getState().plans[0].id;
  assert.equal(await store.getState().savePlan({ id, name: 'Push', localDate: '2026-10-09', exercises: [exercise] }), null);
  assert.equal(completedDays(store.getState().history).size, 0); assert.equal(trainingStreak(store.getState().history), 0);
  const reopened = createWorkoutStore(now, disk); await reopened.getState().hydrate();
  assert.equal(reopened.getState().plans[0].localDate, '2026-10-09');
  assert.equal(reopened.getState().start(id), true); assert.equal(reopened.getState().start(id), false);
  assert.equal(reopened.getState().plans.length, 0); assert.equal(reopened.getState().history.length, 0);
  const row = reopened.getState().session.exercises[0].sets[0]; assert.equal(row.confirmed, false); assert.deepEqual(row.values, {});
  reopened.getState().editSet(exercise.id, row.id, 'weightKg', '50'); reopened.getState().editSet(exercise.id, row.id, 'reps', '10'); reopened.getState().confirmSet(exercise.id, row.id);
  reopened.getState().setJournal({ note: 'Live-Notiz', feeling: 'normal' });
  await reopened.getState().flush();
  const liveRestart = createWorkoutStore(now, disk); await liveRestart.getState().hydrate();
  assert.equal(liveRestart.getState().session.planId, id); assert.equal(liveRestart.getState().plans.length, 0);
  await liveRestart.getState().end(); await liveRestart.getState().end();
  const finished = createWorkoutStore(now, disk); await finished.getState().hydrate();
  assert.equal(finished.getState().history.length, 1); assert.equal(finished.getState().plans.length, 0);
  assert.equal(finished.getState().history[0].id, id); assert.equal(finished.getState().history[0].name, 'Push');
  assert.equal(finished.getState().history[0].note, 'Live-Notiz'); assert.equal(finished.getState().history[0].feeling, 'normal');
  assert.equal(workoutDay(finished.getState().history[0]), '2026-10-01');
});
test('version 1 migration retains IDs, custom exercises, active sets and original history', async () => {
  const old = { session: { id: 8, startedAt: now(), exercises: sets(), introPlayed: false, origin: null, expandedId: exercise.id }, history: [{ id: 7, startedAt: now() - 10000, endedAt: now(), exercises: sets() }], customExercises: [] };
  const disk = memory(JSON.stringify({ version: 1, state: old })); const store = createWorkoutStore(now, disk); await store.getState().hydrate();
  // Migration only adds optional sync metadata; every original field survives unchanged.
  const strip = (value) => JSON.parse(JSON.stringify(value, (key, item) => ['uuid', 'createdAt', 'updatedAt', 'deletedAt'].includes(key) ? undefined : item));
  assert.equal(store.getState().hydrated, true); assert.deepEqual(strip(store.getState().history), old.history); assert.deepEqual(strip(store.getState().session.exercises), old.session.exercises);
  const [workout] = store.getState().history;
  assert.match(workout.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/); assert.equal(workout.createdAt, old.history[0].endedAt); assert.equal(workout.deletedAt, null);
  assert.ok(workout.exercises[0].sets.every((entry) => entry.uuid && entry.createdAt === old.history[0].endedAt));
  assert.deepEqual(store.getState().plans, []); await store.getState().flush(); assert.equal(disk.read().version, 2);
  // Identities persist: a second launch keeps the same UUIDs.
  const again = createWorkoutStore(now, disk); await again.getState().hydrate();
  assert.equal(again.getState().history[0].uuid, workout.uuid);
});
test('unconfirmed suggestions, invalid dates, invalid duration and stale IDs never enter history', async () => {
  const store = createWorkoutStore(now);
  assert.ok(await store.getState().saveHistory({ ...entry(), exercises: [{ exercise, sets: sets()[0].sets.map((row) => ({ ...row, confirmed: false })) }] }));
  for (const localDate of ['2026-10-02', '2026-02-30']) assert.ok(await store.getState().saveHistory({ ...entry(), localDate }));
  for (const durationMinutes of [0, NaN, Infinity, -5, 1441]) assert.ok(await store.getState().saveHistory({ ...entry(), durationMinutes }));
  assert.ok(await store.getState().saveHistory({ ...entry(), id: 1234 })); assert.equal(store.getState().history.length, 0);
  store.getState().start(); await store.getState().end(); assert.equal(completedDays(store.getState().history).size, 0);
});
test('failed writes preserve old history and drafts can retry without duplicate entries', async () => {
  const disk = memory(); const store = createWorkoutStore(now, disk); await store.getState().hydrate();
  disk.fail(true); assert.ok(await store.getState().saveHistory(entry())); assert.equal(store.getState().history.length, 0);
  disk.fail(false); assert.equal(await store.getState().saveHistory(entry()), null); assert.equal(store.getState().history.length, 1);
  await store.getState().savePlan({ name: 'Beine', localDate: '2026-10-08', exercises: [] }); const id = store.getState().plans[0].id;
  disk.fail(true); assert.equal(await store.getState().removePlan(id), false); assert.equal(store.getState().plans.length, 1);
  disk.fail(false); assert.equal(await store.getState().removePlan(id), true); assert.equal(store.getState().plans.length, 0);
  const reload = createWorkoutStore(now, disk); await reload.getState().hydrate(); assert.equal(reload.getState().plans.length, 0);
});
test('concurrent diary saves cannot overwrite a completion or each other', async () => {
  let value; const disk = { getItem: async () => null, setItem: async (_, next) => { await new Promise((resolve) => setTimeout(resolve, 5)); value = next; } };
  const store = createWorkoutStore(now, disk); await store.getState().hydrate();
  const first = store.getState().saveHistory(entry()); const second = store.getState().saveHistory(entry());
  assert.equal(await first, null); assert.ok(await second); assert.equal(JSON.parse(value).state.history.length, 1);
});

test('empty days and optional program IDs never imply rest; plans do not complete days', () => {
  const key = '2026-10-01';
  const empty = calendarDay(key, [], [], null);
  assert.equal(empty.status, 'empty'); assert.equal(empty.label, 'Kein Eintrag');
  assert.equal(empty.title, 'Kein Training erfasst');
  const plans = [{ id: 4, name: 'Push', localDate: key, exercises: [exercise], source: 'manual', programId: 'not-a-schedule' }];
  assert.equal(calendarDay(key, [], plans, null).status, 'planned');
  assert.equal(calendarDay('2026-09-30', [], plans, null).status, 'empty');
  assert.equal(trainingStreak([], key), 0);
});

test('day summaries aggregate actual completions and retain all entries on mixed days', () => {
  const key = '2026-10-01'; const startedAt = now();
  const workout = { id: 1, localDate: key, startedAt, endedAt: startedAt + 30 * 60000, exercises: sets(), name: 'Push', feeling: 'strong' };
  const plan = { id: 3, localDate: key, name: 'Später', exercises: [], source: 'manual' };
  const active = { id: 4, localDate: key, startedAt, exercises: [], name: 'Aktiv' };
  const day = calendarDay(key, [workout, { ...workout, id: 2 }], [plan], active);
  assert.equal(day.status, 'completed'); assert.equal(day.title, '2 Workouts');
  assert.equal(day.summary, '60 Min. · 4 Sätze · Training läuft');
  assert.equal(day.workouts.length, 2); assert.equal(day.plans.length, 1); assert.equal(day.active.id, 4);
  assert.equal(trainingStreak(day.workouts, key), 1);
  assert.equal(calendarDay(key, [{ ...workout, name: undefined }], [plan], null).title, 'Workout');
  assert.equal(calendarDay(key, [], [plan], active).status, 'active');
});

test('empty saved sessions remain viewable without an orange completion or streak', () => {
  const key = '2026-10-01';
  const history = [{ id: 1, localDate: key, startedAt: now(), endedAt: now(), exercises: [] }];
  const day = calendarDay(key, history, [], null);
  assert.equal(day.status, 'recorded'); assert.equal(day.workouts.length, 1);
  assert.equal(completedDays(history).size, 0); assert.equal(trainingStreak(history, key), 0);
});

test('strict streak counts completed local dates only; today remains open and past gaps reset', () => {
  const history = ['2026-09-29', '2026-09-30', '2026-09-30'].map((localDate) => ({ localDate, exercises: sets() }));
  assert.equal(trainingStreak(history, '2026-10-01'), 2);
  assert.equal(trainingStreak(history, '2026-10-02'), 0);
  history.push({ localDate: '2026-10-01', exercises: sets() });
  assert.equal(trainingStreak(history, '2026-10-01'), 3);
  history.push({ localDate: '2026-10-02', exercises: [{ exercise, sets: [{ confirmed: false }] }] });
  assert.equal(trainingStreak(history, '2026-10-02'), 3);
});

test('vertical month range starts at the actual current month and includes older saved dates', () => {
  const months = calendarMonths('2026-10-12', ['2022-02-14', '2029-01-31', '2026-02-30']);
  assert.equal(months[0], '2022-02-01'); assert.equal(months.at(-1), '2029-01-01');
  assert.equal(months[months.indexOf('2026-10-01')], '2026-10-01');
  assert.equal(new Set(months).size, months.length);
  const normal = calendarMonths('2026-10-12', []);
  assert.equal(normal.length, 25); assert.equal(normal[12], '2026-10-01');
});

test('native grids contain seven equal slots in every explicit week including placeholders', () => {
  for (const month of ['2026-05-01', '2026-06-01', '2026-07-01', '2026-03-01', '2027-02-01']) {
    const [layout] = calendarMonthLayouts([month], calendarMetrics(1));
    assert.ok(layout.weeks.every((week) => week.length === 7));
    assert.deepEqual(layout.weeks.flat(), monthDays(month));
  }
  const [march] = calendarMonthLayouts(['2026-03-01'], calendarMetrics(1));
  assert.equal(march.weeks.length, 6); assert.equal(march.weeks[0][6], '2026-03-01');
  const [july] = calendarMonthLayouts(['2026-07-01'], calendarMetrics(1));
  assert.deepEqual(july.weeks[0].slice(0, 2), [null, null]); assert.equal(july.weeks[0][2], '2026-07-01');
});

test('virtualized offsets exactly match explicit month heights across font scales', () => {
  const months = calendarMonths('2027-02-03', []);
  for (const scale of [1, 1.2, 1.4, 2]) {
    const metrics = calendarMetrics(scale);
    const layouts = calendarMonthLayouts(months, metrics);
    let offset = 0;
    for (const item of layouts) {
      assert.equal(item.offset, offset);
      assert.equal(item.length, metrics.headerHeight + item.weeks.length * metrics.cellHeight + metrics.bottomSpace);
      offset += item.length;
    }
    assert.equal(layouts[12].key, '2027-02-01');
  }
});

test('header and grid insets leave at least 44-point targets at 320, 375 and 430 widths', () => {
  for (const width of [320, 375, 390, 420, 430]) assert.ok((width - 2 * calendarInset(width)) / 7 >= 44);
  for (const compact of [false, true]) assert.ok(calendarMetrics(1, compact).cellHeight >= 44);
});

test('opening keeps the selected week in view: month top when it fits, minimal scroll otherwise', () => {
  const metrics = calendarMetrics(1, true);
  const layouts = calendarMonthLayouts(calendarMonths('2026-10-15', []), metrics);
  const october = layouts.find((item) => item.key === '2026-10-01');
  // Week 3 of October fits in a tall list: the month title stays at the top.
  assert.equal(dayScrollOffset(layouts, '2026-10-15', metrics, 600), october.offset);
  // A short list (small iPhone with the sheet) scrolls just enough for the last week.
  const viewport = 260;
  const offset = dayScrollOffset(layouts, '2026-10-31', metrics, viewport);
  const rowBottom = october.offset + metrics.headerHeight + october.weeks.length * metrics.cellHeight;
  assert.ok(offset > october.offset && rowBottom - offset <= viewport && rowBottom - offset > viewport - metrics.cellHeight);
  assert.equal(dayScrollOffset(layouts, '1999-01-01', metrics, viewport), null);
});

test('cell labels are German and built without Intl', () => {
  assert.equal(spokenDay('2026-10-15'), 'Donnerstag, 15. Oktober 2026');
  assert.equal(spokenDay('2027-03-01'), 'Montag, 1. März 2027');
  const component = readFileSync(new URL('../src/components/berkk/calendar-month.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(component, /formatDay|toLocale/);
});

test('installed NativeWind native runtime drops callback styles but preserves static geometry', () => {
  // Reproduce the actual installed native applyRules path, not browser CSS or a mock renderer.
  const require = createRequire(import.meta.url);
  const source = readFileSync(require.resolve('react-native-css-interop/dist/runtime/native/native-interop.js'), 'utf8');
  const ast = require('@babel/parser').parse(source);
  const node = ast.program.body.find((item) => item.type === 'FunctionDeclaration' && item.id.name === 'applyRules');
  assert.ok(node, 'NativeWind runtime path changed: re-check this native regression');
  const applyRules = runInNewContext(`(${source.slice(node.start, node.end)})`, { shared_1: require('react-native-css-interop/dist/shared.js') });
  const nativeState = () => ({ props: {}, config: { target: ['style'] } });
  let called = false;
  const broken = nativeState();
  applyRules(broken, {}, [() => { called = true; return { width: '14.285714%', height: 44 }; }], []);
  assert.equal(called, false); assert.equal(broken.props.style.width, undefined); assert.equal(broken.props.style.height, undefined);
  const fixed = nativeState();
  applyRules(fixed, {}, [{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }], []);
  assert.equal(fixed.props.style.flexGrow, 1); assert.equal(fixed.props.style.flexBasis, 0);
  const component = readFileSync(new URL('../src/components/berkk/calendar-month.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(component, /style=\{\s*\(?\s*\{\s*pressed/);
});
