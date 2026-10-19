import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXERCISES } from '../src/data/exercises.ts';
import { findPRs, formatNumber, formatSet, formatTons, formatWorkoutDate, historySections, isoWeek, splitOf, summarizeHistory, weekOverview, weekStart, weekTitle } from '../src/lib/history.ts';
import { levelForXp, levelStartXp, workoutXp } from '../src/lib/progression.ts';

const ex = (id) => EXERCISES.find((item) => item.id === id);
const bench = ex('barbell-bench');
const row = ex('barbell-row');
let setId = 0;
const set = (weightKg, reps) => ({ id: `s${++setId}`, values: { weightKg: String(weightKg).replace('.', ','), reps: String(reps) }, confirmed: true });
const at = (day, hour = 18, minute = 25) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, hour, minute, 7, 123).getTime(); };
let id = 1000;
const workout = (day, exercises, extra = {}) => { const startedAt = at(day); return { id: ++id, localDate: day, startedAt, endedAt: startedAt + 48 * 60000, exercises, ...extra }; };

test('first log of an exercise is a baseline; only a heavier weight later is a PR', () => {
  const first = workout('2026-10-05', [{ exercise: bench, sets: [set(80, 8), set(82.5, 5)] }]);
  const same = workout('2026-10-07', [{ exercise: bench, sets: [set(82.5, 6)] }]);
  const heavier = workout('2026-10-09', [{ exercise: bench, sets: [set(80, 8), set(85, 4), set(85, 3)] }]);
  const prs = findPRs([heavier, same, first]);
  assert.equal(prs.has(first.id), false);
  assert.equal(prs.has(same.id), false);
  const [pr] = prs.get(heavier.id);
  assert.deepEqual([pr.exerciseName, pr.weightKg, pr.reps, pr.setId], [bench.name, 85, 4, heavier.exercises[0].sets[1].id]);
  // Soft-deleted workouts never set a baseline or a PR.
  assert.equal(findPRs([{ ...first, deletedAt: 1 }, same]).size, 0);
});

test('volume, sets, muscle shares, split and XP; empty workouts count for nothing', () => {
  const push = workout('2026-10-16', [{ exercise: bench, sets: [set(80, 8), set(80, 8)] }, { exercise: ex('barbell-row'), sets: [set(60, 10)] }]);
  const empty = workout('2026-10-15', []);
  const [a, b] = summarizeHistory([empty, push]);
  assert.equal(a.workout.id, push.id);
  assert.equal(a.volumeKg, 80 * 8 * 2 + 600); assert.equal(formatTons(a.volumeKg), '1,9');
  assert.equal(a.sets, 3); assert.equal(a.split, 'push'); assert.equal(a.title, 'Push');
  assert.deepEqual(a.muscles.map((item) => [item.name, item.sets]), [['Brust', 2], ['Rücken', 1]]);
  assert.equal(a.xp, 100);
  assert.deepEqual([b.sets, b.volumeKg, b.xp, b.title], [0, 0, 0, 'Training']);
  assert.equal(splitOf([{ name: 'Brust', sets: 2 }, { name: 'Rücken', sets: 2 }]), null);
  assert.equal(summarizeHistory([{ ...push, name: 'Oberkörper schwer' }])[0].title, 'Oberkörper schwer');
});

test('Monday weeks, labels and filtered sections with tonnage', () => {
  const today = '2026-10-17'; // Saturday
  assert.equal(weekStart(today), '2026-10-12');
  assert.equal(weekStart('2026-10-12'), '2026-10-12');
  assert.equal(weekStart('2026-10-18'), '2026-10-12'); // Sunday belongs to the same week
  assert.equal(weekTitle('2026-10-12', today), 'Diese Woche');
  assert.equal(weekTitle('2026-10-05', today), 'Letzte Woche');
  assert.equal(weekTitle('2026-09-28', today), 'Vor 2 Wochen');
  assert.equal(weekTitle('2026-09-21', today), 'KW 39');
  assert.deepEqual(isoWeek('2026-01-01'), { week: 1, year: 2026 });
  assert.deepEqual(isoWeek('2027-01-01'), { week: 53, year: 2026 });
  const history = [workout('2026-10-16', [{ exercise: bench, sets: [set(100, 10)] }]), workout('2026-10-13', [{ exercise: row, sets: [set(50, 10)] }]), workout('2026-10-01', [{ exercise: bench, sets: [set(60, 10)] }])];
  const summaries = summarizeHistory(history);
  const all = historySections(summaries, 'all', today);
  assert.deepEqual(all.map((section) => [section.title, section.count, formatTons(section.volumeKg)]), [['Diese Woche', 2, '1,5'], ['Vor 2 Wochen', 1, '0,6']]);
  assert.deepEqual(historySections(summaries, 'pull', today).map((section) => section.count), [1]);
  const week = weekOverview(summaries, today, 3);
  assert.deepEqual(week.days.map((day) => day.trained), [false, true, false, false, true, false, false]);
  assert.equal(week.days[5].today, true); assert.equal(week.done, 2); assert.equal(week.deltaPercent, null);
});

test('German formatting and backfilled workouts without a fake clock time', () => {
  assert.equal(formatNumber(82.5), '82,5'); assert.equal(formatNumber(12480), '12.480'); assert.equal(formatTons(12480), '12,5');
  assert.equal(formatSet('strength', set(80, 8)), '80 kg × 8');
  assert.equal(formatSet('bodyweight', { id: 'x', confirmed: true, values: { reps: '12', addedWeightKg: '10' } }), '12 Wdh. · +10 kg');
  const live = workout('2026-10-16', []);
  assert.equal(formatWorkoutDate(live, '2026-10-17'), 'Fr, 16. Okt · 18:25');
  const noon = new Date(2026, 9, 16, 12).getTime();
  assert.equal(formatWorkoutDate({ ...live, startedAt: noon, endedAt: noon + 60000 }, '2026-10-17'), 'Fr, 16. Okt');
  assert.equal(formatWorkoutDate(live, '2027-01-02', true), 'Freitag, 16. Oktober 2026 · 18:25');
});

test('level is derived from XP with rising thresholds (placeholder rules)', () => {
  assert.equal(workoutXp(0, 3), 0); assert.equal(workoutXp(5, 2), 180);
  assert.deepEqual([levelStartXp(1), levelStartXp(2), levelStartXp(3), levelStartXp(4)], [0, 250, 750, 1500]);
  assert.deepEqual(levelForXp(0), { level: 1, totalXp: 0, xpIntoLevel: 0, xpForLevel: 250 });
  assert.deepEqual(levelForXp(900), { level: 3, totalXp: 900, xpIntoLevel: 150, xpForLevel: 750 });
});
