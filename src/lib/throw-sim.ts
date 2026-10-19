/**
 * Ghost drag & throw physics as plain worklet functions (UI thread in the app,
 * plain JS in tests). Positions are offsets from the ghost's resting place.
 */

export type Flight = { x: number; y: number; vx: number; vy: number; spin: number; elapsed: number };
/** Allowed offsets: screen edges left/right/top, the top of the tracking card below. */
export type FlightBounds = { minX: number; maxX: number; minY: number; maxY: number };
export type ThrowParams = { bounce: number; dragPerSecond: number; spinPerPx: number; flightMs: number; settleSpeed: number; minSpeed: number; maxDrag: number };

/** Follow the finger, but beyond `max` the pull gets soft (rubber band). */
export function softDrag(dx: number, dy: number, max: number): [number, number] {
  'worklet';
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance <= max || distance === 0) return [dx, dy];
  const eased = max + (distance - max) * 0.25;
  return [(dx / distance) * eased, (dy / distance) * eased];
}

export function isThrow(vx: number, vy: number, params: ThrowParams) {
  'worklet';
  return Math.sqrt(vx * vx + vy * vy) > params.minSpeed;
}

/**
 * Advance one step. Air drag slows the ghost; a wall hit reflects the speed
 * component and keeps `bounce` of it (45 % loss). Returns the impacts of this step.
 */
export function stepFlight(flight: Flight, bounds: FlightBounds, dt: number, params: ThrowParams) {
  'worklet';
  flight.elapsed += dt;
  flight.x += flight.vx * dt;
  flight.y += flight.vy * dt;
  const drag = Math.pow(params.dragPerSecond, dt);
  flight.vx *= drag;
  flight.vy *= drag;
  flight.spin += flight.vx * dt * params.spinPerPx;
  let impacts = 0;
  if (flight.x < bounds.minX) { flight.x = bounds.minX; flight.vx = Math.abs(flight.vx) * params.bounce; impacts++; }
  if (flight.x > bounds.maxX) { flight.x = bounds.maxX; flight.vx = -Math.abs(flight.vx) * params.bounce; impacts++; }
  if (flight.y < bounds.minY) { flight.y = bounds.minY; flight.vy = Math.abs(flight.vy) * params.bounce; impacts++; }
  if (flight.y > bounds.maxY) { flight.y = bounds.maxY; flight.vy = -Math.abs(flight.vy) * params.bounce; impacts++; }
  return impacts;
}

/** The flight ends after ~0.9 s or when it has become slow. */
export function flightOver(flight: Flight, params: ThrowParams) {
  'worklet';
  return flight.elapsed * 1000 >= params.flightMs || Math.sqrt(flight.vx * flight.vx + flight.vy * flight.vy) < params.settleSpeed;
}
