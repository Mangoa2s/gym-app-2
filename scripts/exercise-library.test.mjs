import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { EXERCISES } from '../src/data/exercises.ts';
import { recentExercises } from '../src/data/recent-exercises.ts';

const exercise = (id) => EXERCISES.find((item) => item.id === id);
const entry = (id, confirmed = true) => ({ exercise: exercise(id), sets: [{ id: id + '-set', confirmed, values: { reps: '8', weightKg: '20' } }] });
const history = (id, endedAt, entries) => ({ id, startedAt: endedAt - 1000, endedAt, exercises: entries });

test('recent exercises are absent with no completed saved history', () => {
  assert.deepEqual(recentExercises([], EXERCISES), []);
  assert.deepEqual(recentExercises([history(1, 10, [entry('barbell-bench', false)])], EXERCISES), []);
});

test('recent saved exercises use newest history, deduplicate and preserve catalog identity', () => {
  const input = [history(1, 10, [entry('plank'), entry('barbell-bench')]), history(2, 30, [entry('barbell-bench'), entry('cable-row')])];
  const before = structuredClone(input);
  const recent = recentExercises(input, EXERCISES);
  assert.deepEqual(recent.map((item) => item.id), ['barbell-bench', 'cable-row', 'plank']);
  assert.equal(recent[0], exercise('barbell-bench'));
  assert.deepEqual(input, before);
  assert.deepEqual(recentExercises(input, EXERCISES, 0), []);
});

test('custom saved exercises are included; unavailable IDs do not become invented catalog entries', () => {
  const custom = { ...exercise('plank'), id: 'custom-example', name: 'Meine Übung', custom: true };
  const input = [history(3, 40, [{ exercise: custom, sets: [{ confirmed: true }] }, entry('plank')])];
  assert.deepEqual(recentExercises(input, [...EXERCISES, custom]).map((item) => item.id), ['custom-example', 'plank']);
  assert.deepEqual(recentExercises(input, EXERCISES).map((item) => item.id), ['plank']);
});

test('illustration manifest accounts for each catalog ID and every accepted image is bundled locally', () => {
  const file = path.resolve('assets/images/exercises/manifest.json');
  assert.ok(existsSync(file), 'The reviewed illustration manifest must exist.');
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  const registry = readFileSync('src/data/exercise-illustrations.ts', 'utf8');
  const mappedIds = [...registry.matchAll(/^  '([^']+)':/gm)].map(match => match[1]);
  assert.deepEqual([...mappedIds].sort(), [...EXERCISES.map(item => item.id)].sort());
  assert.equal(manifest.exercises.length, EXERCISES.length);
  assert.deepEqual([...manifest.exercises.map((item) => item.id)].sort(), [...EXERCISES.map((item) => item.id)].sort());
  assert.equal(new Set(manifest.exercises.map((item) => item.id)).size, EXERCISES.length);
  for (const item of manifest.exercises) {
    if (item.status !== 'reviewed') {
      assert.equal(item.asset, null, item.id + ' must not falsely claim an image');
      assert.ok(registry.includes(`'${item.id}': null`), item.id + ' must disclose the same gap in the UI');
      continue;
    }
    assert.ok(item.asset.startsWith('assets/images/exercises/'), item.id);
    assert.ok(existsSync(item.asset), item.id + ' image is missing locally');
    const bytes = readFileSync(item.asset);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', item.id + ' must be a valid PNG');
    assert.ok(item.prompt && item.description, item.id + ' needs provenance and pose description');
    assert.ok(registry.includes(`'${item.id}': { source: require('../../${item.asset}')`), item.id + ' must resolve to its reviewed file');
  }
});
