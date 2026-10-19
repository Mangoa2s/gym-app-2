import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createBodyWeightStore, formatWeight, formatWeightDate, localWeightDate, parseWeightInput, WEIGHT_STORAGE_KEY, weightHistory } from '../src/store/body-weight-state.ts';
import { initialWeightTenths, parsePickerInput, pickerText, wheelIndex } from '../src/components/berkk/weight-picker-state.ts';
import { weightChartData } from '../src/components/berkk/weight-chart-data.ts';

test('chart has no invented points and respects chronological calendar-day gaps', () => {
  assert.equal(weightChartData([], 320, 164), null);
  const single = weightChartData([{ date: '2026-09-27', weight: 82.4 }], 320, 164);
  assert.equal(single.points.length, 1);
  assert.equal(single.length, 0);
  const entries = [{ date: '2026-09-27', weight: 82 }, { date: '2026-09-20', weight: 82.45 }, { date: '2026-09-21', weight: 82.3 }];
  const chart = weightChartData(entries, 320, 164);
  assert.deepEqual(chart.points.map((point) => point.date), ['2026-09-20', '2026-09-21', '2026-09-27']);
  assert.ok(Math.abs((chart.points[1].x - chart.points[0].x) / (chart.points[2].x - chart.points[0].x) - 1 / 7) < 1e-10);
  assert.equal(entries[0].date, '2026-09-27');
  assert.equal(chart.points[0].weight, 82.45);
  assert.ok(chart.length > 0);
  const flat = weightChartData(entries.map((entry) => ({ ...entry, weight: 82 })), 320, 164);
  assert.ok(flat.points.every((point) => Number.isFinite(point.y) && point.y === flat.points[0].y));
});

test('development display is a draft only, never a persisted weight or history point', async () => {
  const storage = memoryStorage();
  const store = createBodyWeightStore(storage);
  await store.getState().hydrate();
  assert.equal(initialWeightTenths(store.getState().currentWeight), 824);
  assert.equal(store.getState().currentWeight, null);
  assert.deepEqual(store.getState().entries, []);
  assert.equal(storage.read(), null);
});

test('picker and keyboard use the same exact tenths, including decimal carry and range limits', () => {
  assert.equal(initialWeightTenths(null), 824);
  assert.equal(initialWeightTenths(85.4), 854);
  assert.equal(initialWeightTenths(85.99), 860);
  assert.equal(initialWeightTenths(999.99), 9999);
  assert.equal(pickerText(854), '85,4');
  assert.equal(pickerText(1000), '100,0');
  for (const text of ['85,4', '85.4', ' 85,4 ']) assert.equal(parsePickerInput(text), 854);
  assert.equal(parsePickerInput('0,1'), 1);
  assert.equal(parsePickerInput('999.9'), 9999);
  assert.equal(parsePickerInput('85'), 850);
  for (const text of ['', '0', '1000', '85,44', '85,', '-1', '85kg', '8e1']) assert.equal(parsePickerInput(text), null);
});

test('wheel snaps to the nearest row and clamps both endpoints', () => {
  assert.equal(wheelIndex(5111, 60, 999), 85);
  assert.equal(wheelIndex(5151, 60, 999), 86);
  assert.equal(wheelIndex(-60, 60, 9), 0);
  assert.equal(wheelIndex(660, 60, 9), 9);
  assert.equal(wheelIndex(193, 48, 9), 4);
});

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem: async (key) => { assert.equal(key, WEIGHT_STORAGE_KEY); return value; },
    setItem: async (key, next) => { assert.equal(key, WEIGHT_STORAGE_KEY); value = next; },
    read: () => value,
  };
}

test('comma and point input normalize to numbers; malformed and empty input is rejected', () => {
  for (const value of ['82,4', '82.4', ' 82,40 ']) assert.equal(parseWeightInput(value), 82.4);
  assert.equal(parseWeightInput('75'), 75);
  assert.equal(parseWeightInput('0,01'), 0.01);
  for (const value of ['', ' ', '0', '-2', 'NaN', 'Infinity', '82kg', '8e2', '1,2.3', '82,', '1.000', '1000', '82,444']) {
    assert.equal(parseWeightInput(value), null, value);
  }
});

test('first day, correction, second day and relaunch preserve exactly one entry per day', async () => {
  const storage = memoryStorage();
  let today = new Date(2026, 8, 27, 23, 59);
  const store = createBodyWeightStore(storage, () => today);
  await store.getState().hydrate();
  assert.equal(store.getState().currentWeight, null);
  assert.deepEqual(store.getState().entries, []);
  await store.getState().saveWeight(82.4);
  assert.deepEqual(weightHistory(store.getState().entries), [{ date: '2026-09-27', weight: 82.4, change: null }]);
  await store.getState().saveWeight(82.1);
  assert.equal(store.getState().entries.length, 1);
  today = new Date(2026, 8, 28, 0, 1);
  await store.getState().saveWeight(81.8);
  assert.deepEqual(weightHistory(store.getState().entries), [
    { date: '2026-09-28', weight: 81.8, change: -0.3 },
    { date: '2026-09-27', weight: 82.1, change: null },
  ]);
  await store.getState().saveWeight(82.2);
  assert.equal(store.getState().entries.length, 2);
  assert.equal(weightHistory(store.getState().entries)[0].change, 0.1);
  const relaunched = createBodyWeightStore(storage);
  await relaunched.getState().hydrate();
  assert.equal(relaunched.getState().currentWeight, 82.2);
  assert.deepEqual(relaunched.getState().entries, store.getState().entries);
  assert.equal(typeof JSON.parse(storage.read()).state.currentWeight, 'number');
});

test('local calendar day survives UTC offsets on both sides of midnight and DST', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'Pacific/Kiritimati';
    assert.equal(localWeightDate(new Date('2026-09-27T10:30:00Z')), '2026-09-28');
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(localWeightDate(new Date('2026-09-28T01:30:00Z')), '2026-09-27');
    process.env.TZ = 'Europe/Berlin';
    assert.equal(localWeightDate(new Date('2026-03-29T00:30:00Z')), '2026-03-29');
    assert.equal(localWeightDate(new Date('2026-03-29T01:30:00Z')), '2026-03-29');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('undated saved weight stays undated; unrelated saved fields survive a save', async () => {
  const storage = memoryStorage(JSON.stringify({ version: 1, state: { currentWeight: 79.3, note: 'keep me' } }));
  const store = createBodyWeightStore(storage, () => new Date(2026, 8, 27));
  await store.getState().hydrate();
  assert.equal(store.getState().currentWeight, 79.3);
  assert.deepEqual(store.getState().entries, []);
  await store.getState().saveWeight(79.1);
  assert.deepEqual(store.getState().entries, [{ date: '2026-09-27', weight: 79.1 }]);
  assert.equal(JSON.parse(storage.read()).state.note, 'keep me');
});

test('deltas follow chronological order even with gaps and unsorted source entries', () => {
  const entries = [{ date: '2026-09-28', weight: 81.8 }, { date: '2026-09-20', weight: 82.4 }, { date: '2026-09-22', weight: 82.4 }];
  assert.deepEqual(weightHistory(entries).map((entry) => entry.change), [-0.6, 0, null]);
  assert.equal(entries[0].date, '2026-09-28');
  assert.equal(formatWeight(82.4), '82,4');
  assert.equal(formatWeightDate('2026-09-07'), '07.09.2026');
});

test('failed storage write preserves prior current value and history and permits retry', async () => {
  const storage = memoryStorage();
  const store = createBodyWeightStore(storage);
  await store.getState().hydrate();
  await store.getState().saveWeight(82.4);
  const write = storage.setItem;
  storage.setItem = async () => { throw new Error('Disk full'); };
  await assert.rejects(store.getState().saveWeight(80));
  assert.equal(store.getState().currentWeight, 82.4);
  assert.equal(store.getState().saving, false);
  assert.equal(store.getState().entries[0].weight, 82.4);
  storage.setItem = write;
  await store.getState().saveWeight(80);
  assert.equal(store.getState().currentWeight, 80);
});

test('pending hydration and unreadable existing data cannot be overwritten', async () => {
  const storage = memoryStorage('broken JSON');
  const store = createBodyWeightStore(storage);
  await assert.rejects(store.getState().saveWeight(82));
  await store.getState().hydrate();
  assert.equal(store.getState().loadError, true);
  await assert.rejects(store.getState().saveWeight(82));
  assert.equal(storage.read(), 'broken JSON');
  await storage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify({ version: 1, state: { currentWeight: 80, entries: [] } }));
  await store.getState().hydrate();
  assert.equal(store.getState().loadError, false);
  assert.equal(store.getState().currentWeight, 80);
});

test('parallel save attempts cannot race and invalid numeric writes fail', async () => {
  const store = createBodyWeightStore(memoryStorage());
  await store.getState().hydrate();
  const first = store.getState().saveWeight(82);
  const second = store.getState().saveWeight(81);
  await assert.rejects(second);
  await first;
  assert.equal(store.getState().currentWeight, 82);
  for (const weight of [0, -1, NaN, Infinity, 1000]) await assert.rejects(store.getState().saveWeight(weight));
});
