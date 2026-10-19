import assert from 'node:assert/strict';
import test from 'node:test';
import { previewIndex, resistedPosition, snapIndex, FEELING_ORDER } from '../src/components/berkk/feeling-carousel-state.ts';

test('the three diary feelings have bounded continuous preview positions', () => {
  assert.deepEqual([...FEELING_ORDER], ['weak', 'normal', 'strong']);
  assert.equal(resistedPosition(0.42), 0.42);
  assert.equal(resistedPosition(1.76), 1.76);
  assert.equal(previewIndex(0.49), 0);
  assert.equal(previewIndex(0.51), 1);
  assert.equal(previewIndex(1.51), 2);
  assert.equal(previewIndex(-10), 0);
  assert.equal(previewIndex(10), 2);
});
test('dragging past either end meets resistance instead of wrapping moods', () => {
  assert.equal(resistedPosition(-0.5), -0.09);
  assert.equal(resistedPosition(2.5), 2.09);
  assert.equal(resistedPosition(-100), -0.18);
  assert.equal(resistedPosition(100), 2.18);
});
test('release velocity follows the finger direction and still lands on a valid feeling', () => {
  assert.equal(snapIndex(1, 600, 100), 0);
  assert.equal(snapIndex(1, -600, 100), 2);
  assert.equal(snapIndex(1.1, 0, 100), 1);
  assert.equal(snapIndex(0, 10000, 100), 0);
  assert.equal(snapIndex(2, -10000, 100), 2);
  assert.ok(Number.isFinite(snapIndex(1, 1, 0)));
});
