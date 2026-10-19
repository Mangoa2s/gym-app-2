import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LockIn as L } from '../src/constants/lock-in.ts';
import { Tokens } from '../src/constants/tokens.ts';
import { workoutHeat } from '../src/lib/lock-in.ts';
import { flightOver, isThrow, softDrag, stepFlight } from '../src/lib/throw-sim.ts';
import { createWorld, spawnBurst, stepWorld, worldBusy } from '../src/lib/world-sim.ts';

const P = { ...L.world };
const T = { ...L.throw };
const seeded = () => { let seed = 7; return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; };
const input = (extra = {}) => ({ dt: 1 / 30, width: 390, height: 844, floorY: 520, heatTarget: 0.08, rest: false, ghostX: 195, ghostY: 300, repel: false, random: seeded(), ...extra });
const set = (confirmed) => ({ id: String(Math.random()), confirmed, values: {} });

test('heat = 0.08 + 0.92 × done / max(planned, 8)', () => {
  assert.equal(workoutHeat({ exercises: [] }), 0.08);
  assert.ok(Math.abs(workoutHeat({ exercises: [{ sets: [set(true), set(true), set(false)] }] }) - (0.08 + 0.92 * 2 / 8)) < 1e-9);
  const twelve = Array.from({ length: 12 }, () => set(true));
  assert.equal(workoutHeat({ exercises: [{ sets: twelve }] }), 1);
});

test('heat eases instead of jumping; spawn rate grows with heat and drops while resting', () => {
  const state = createWorld(0.08);
  stepWorld(state, input({ heatTarget: 1 }), P);
  assert.ok(state.heat > 0.08 && state.heat < 0.15, `first step ${state.heat}`);
  // Two seconds: embers live ≥ 3 s, so every spawned one is still alive.
  const count = (heat, rest) => { const world = createWorld(heat); const random = seeded(); for (let i = 0; i < 60; i++) stepWorld(world, input({ heatTarget: heat, rest, random }), { ...P, maxParticles: 10_000 }); return world.sparks.length; };
  assert.ok(Math.abs(count(0, false) - 4) <= 1); // 2 per second at zero heat
  assert.ok(Math.abs(count(1, false) - 36) <= 1); // (2 + 16) per second at full heat
  assert.ok(count(1, true) < count(1, false) / 2);
});

test('particles stay capped at ~150; bursts replace ambient embers', () => {
  const state = createWorld(1);
  const random = seeded();
  for (let i = 0; i < 600; i++) stepWorld(state, input({ heatTarget: 1, random, dt: 1 / 30 }), P);
  assert.ok(state.sparks.length <= P.maxParticles);
  spawnBurst(state, 195, 300, P.bursts.pr, P.flash.pr, P.maxParticles, random);
  assert.ok(state.sparks.length <= P.maxParticles);
  assert.ok(state.sparks.filter((spark) => spark.burst).length >= 100);
  assert.equal(state.flash, 1); assert.equal(worldBusy(state), true);
});

test('embers are born at the top edge of the tracking card, not behind it', () => {
  const state = createWorld(1);
  stepWorld(state, input({ heatTarget: 1, dt: 0.5 }), P);
  assert.ok(state.sparks.length > 0);
  assert.ok(state.sparks.every((spark) => spark.y <= 520 + 2 && spark.y > 400));
});

test('85 % card keeps every text colour at ≥ 4.5:1, even with the brightest ember fully behind it', () => {
  const parse = (color) => color.startsWith('#') ? [...[1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)), 1] : color.match(/[\d.]+/g).map(Number);
  const over = ([r, g, b, a], [br, bg, bb]) => [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)];
  const luminance = (rgbValue) => rgbValue.map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  for (const behind of [Tokens.world.sparkHot, Tokens.world.emberHot, Tokens.color.background[3]]) {
    const card = over(parse(Tokens.color.surface), parse(behind));
    for (const text of [Tokens.color.ink, Tokens.color.inkSoft, Tokens.color.inkMuted, Tokens.color.accentLight]) {
      const ratio = contrast(over(parse(text), card), card);
      assert.ok(ratio >= 4.5, `${text} on card over ${behind}: ${ratio.toFixed(2)}`);
    }
  }
});

test('dragging pushes sparks out of an 80 px circle around the ghost', () => {
  const state = createWorld(0.5);
  state.sparks.push({ x: 215, y: 300, vx: 0, vy: 0, age: 0, life: 9, size: 2, burst: false, phase: 0 });
  stepWorld(state, input({ repel: true, ghostX: 195, ghostY: 300 }), { ...P, sparkBase: 0, sparkPerHeat: 0 });
  assert.ok(state.sparks[0].x > 215 && state.sparks[0].vx > 0);
});

test('throw: speed threshold, 45 % energy loss on impact, soft drag, flight ends', () => {
  assert.equal(isThrow(500, 400, T), false); // ≈ 640 px/s
  assert.equal(isThrow(700, 300, T), true);
  const flight = { x: 0, y: 0, vx: 2000, vy: 0, spin: 0, elapsed: 0 };
  const bounds = { minX: -150, maxX: 150, minY: -300, maxY: 120 };
  let impacts = 0;
  for (let i = 0; i < 6; i++) impacts += stepFlight(flight, bounds, 1 / 60, T);
  assert.ok(impacts >= 1); assert.equal(flight.x <= bounds.maxX, true); assert.ok(flight.vx < 0);
  assert.ok(Math.abs(flight.vx) < 2000 * T.bounce + 1);
  assert.ok(flight.spin > 0);
  const [x] = softDrag(400, 0, T.maxDrag);
  assert.ok(x > T.maxDrag && x < 400);
  while (!flightOver(flight, T)) stepFlight(flight, bounds, 1 / 60, T);
  assert.ok(flight.elapsed <= T.flightMs / 1000 + 1 / 60);
});
