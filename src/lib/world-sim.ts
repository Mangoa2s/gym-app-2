/**
 * Glut-Welt particle simulation. Plain functions marked as worklets: they run on
 * the UI thread in the app and as normal JS in node tests. No React, no Skia here.
 */

export type Spark = { x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; burst: boolean; phase: number };
export type WorldState = { sparks: Spark[]; heat: number; flash: number; spawnDebt: number; time: number };
export type WorldParams = {
  maxParticles: number; sparkBase: number; sparkPerHeat: number; restFactor: number; heatEase: number; repelRadius: number;
};
export type StepInput = {
  /** `floorY`: where embers are born — the top edge of the tracking card, so they rise into view. */
  dt: number; width: number; height: number; floorY: number; heatTarget: number; rest: boolean;
  ghostX: number; ghostY: number; repel: boolean; random: () => number;
};

export function createWorld(heat: number): WorldState {
  'worklet';
  return { sparks: [], heat, flash: 0, spawnDebt: 0, time: 0 };
}

/** Room for one more spark: at the cap, the oldest ambient spark gives way (bursts win). */
function makeRoom(state: WorldState, max: number, forBurst: boolean) {
  'worklet';
  if (state.sparks.length < max) return true;
  if (!forBurst) return false;
  const index = state.sparks.findIndex((spark) => !spark.burst);
  if (index < 0) return false;
  state.sparks.splice(index, 1);
  return true;
}

/** Sparks flying out of a point (set feedback, wall impacts). */
export function spawnBurst(state: WorldState, x: number, y: number, count: number, flash: number, max: number, random: () => number) {
  'worklet';
  state.flash = Math.min(1, Math.max(state.flash, flash));
  for (let index = 0; index < count; index++) {
    if (!makeRoom(state, max, true)) break;
    const angle = random() * Math.PI * 2;
    const speed = 90 + random() * 260;
    state.sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40, age: 0, life: 0.6 + random() * 0.8, size: 1.5 + random() * 2.5, burst: true, phase: random() * 6.28 });
  }
}

/** One simulation step: ease heat, fade flash, spawn rising embers, move, repel, retire. */
export function stepWorld(state: WorldState, input: StepInput, params: WorldParams) {
  'worklet';
  const { dt, width, height, random } = input;
  state.time += dt;
  state.heat += (input.heatTarget - state.heat) * (1 - Math.exp(-dt / params.heatEase));
  state.flash *= Math.exp(-dt * 3);
  // Ambient embers rise from the bottom: 2 + heat × 16 per second, fewer while resting.
  const rate = (params.sparkBase + state.heat * params.sparkPerHeat) * (input.rest ? params.restFactor : 1);
  state.spawnDebt += rate * dt;
  while (state.spawnDebt >= 1) {
    state.spawnDebt -= 1;
    if (!makeRoom(state, params.maxParticles, false)) { state.spawnDebt = 0; break; }
    state.sparks.push({ x: width * (0.08 + random() * 0.84), y: Math.min(height, input.floorY) + 2, vx: 0, vy: -(40 + random() * 90 + state.heat * 60), age: 0, life: 3 + random() * 2.5, size: 1.2 + random() * 2.2, burst: false, phase: random() * 6.28 });
  }
  const radius = params.repelRadius;
  for (let index = state.sparks.length - 1; index >= 0; index--) {
    const spark = state.sparks[index];
    spark.age += dt;
    if (spark.burst) {
      const damping = Math.exp(-dt * 1.8);
      spark.vx *= damping;
      spark.vy = spark.vy * damping - 20 * dt;
    } else {
      // Gentle sideways sway.
      spark.x += Math.sin(state.time * 1.3 + spark.phase) * 14 * dt;
    }
    if (input.repel) {
      const dx = spark.x - input.ghostX;
      const dy = spark.y - input.ghostY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0.001 && distance < radius) {
        const push = ((radius - distance) / radius) * 900 * dt;
        spark.vx += (dx / distance) * push;
        spark.vy += (dy / distance) * push;
      }
    }
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    if (!spark.burst) spark.vx *= Math.exp(-dt * 2);
    if (spark.age >= spark.life || spark.y < -20 || spark.x < -40 || spark.x > width + 40) state.sparks.splice(index, 1);
  }
}

/** True while something needs full frame rate (bursts alive or a flash fading). */
export function worldBusy(state: WorldState) {
  'worklet';
  return state.flash > 0.02 || state.sparks.some((spark) => spark.burst);
}
