import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWorkoutStore, elapsedSeconds, formatElapsed } from '../src/store/workout-state.ts';

test('rapid duplicate taps preserve one session and the original tap timestamp', () => {
  let now = 1000;
  const store = createWorkoutStore(() => now);
  assert.equal(store.getState().start(), true);
  const first = store.getState().session;
  now += 30;
  for (let i = 0; i < 10; i++) assert.equal(store.getState().start(), false);
  assert.equal(store.getState().session, first);
  assert.equal(first.startedAt, 1000);
});

test('clock includes entrance, background time and lock time without interval ticks', () => {
  const start = 100000;
  assert.equal(elapsedSeconds(start, start + 1100), 1);
  assert.equal(elapsedSeconds(start, start + 90500), 90);
  assert.equal(elapsedSeconds(start, start + 3605500), 3605);
  assert.equal(formatElapsed(3605), '1:00:05');
  assert.equal(formatElapsed(59), '00:59');
  assert.equal(formatElapsed(60), '01:00');
  assert.equal(elapsedSeconds(start, start - 1), 0);
});

test('returning preserves the session and consumed entrance; ending allows a fresh entrance', () => {
  let now = 1000;
  const store = createWorkoutStore(() => now);
  store.getState().start();
  const firstId = store.getState().session.id;
  store.getState().claimIntro(firstId);
  now = 50000;
  assert.equal(store.getState().start(), false);
  assert.equal(store.getState().session.introPlayed, true);
  assert.equal(elapsedSeconds(store.getState().session.startedAt, now), 49);
  store.getState().end();
  store.getState().end();
  assert.equal(store.getState().session, null);
  assert.equal(store.getState().start(), true);
  assert.notEqual(store.getState().session.id, firstId);
  assert.equal(store.getState().session.startedAt, 50000);
  assert.equal(store.getState().session.introPlayed, false);
  // Late native measurement/intro callbacks cannot change the next session.
  store.getState().setOrigin(firstId, { x: 10, y: 100, width: 300, height: 80 });
  store.getState().claimIntro(firstId);
  assert.equal(store.getState().session.origin, null);
  assert.equal(store.getState().session.introPlayed, false);
});
