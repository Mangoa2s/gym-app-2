import { useSharedValue, type SharedValue } from 'react-native-reanimated';

export type WorldEvent = { x: number; y: number; count: number; flash: number };

/**
 * Shared values connecting the ghost and the Glut-Welt on the UI thread:
 * where the ghost rests and how far it is pulled/thrown, whether it is being
 * dragged (sparks get pushed away) or moving at all (full frame rate), queued
 * spark bursts, and the top edge of the tracking card (the floor for throws).
 */
export type WorldBridge = {
  homeX: SharedValue<number>; homeY: SharedValue<number>;
  offX: SharedValue<number>; offY: SharedValue<number>;
  dragging: SharedValue<boolean>; moving: SharedValue<boolean>;
  events: SharedValue<WorldEvent[]>; cardTop: SharedValue<number>;
  /** TEMPORARY debug readout (LockIn.debugWorld): mode text, canvas size, live particles, drawn frames. */
  debug: { mode: SharedValue<string>; width: SharedValue<number>; height: SharedValue<number>; particles: SharedValue<number>; frames: SharedValue<number> };
};

export function useWorldBridge(): WorldBridge {
  return {
    homeX: useSharedValue(0), homeY: useSharedValue(0),
    offX: useSharedValue(0), offY: useSharedValue(0),
    dragging: useSharedValue(false), moving: useSharedValue(false),
    events: useSharedValue<WorldEvent[]>([]), cardTop: useSharedValue(10_000),
    debug: { mode: useSharedValue('nicht gestartet'), width: useSharedValue(0), height: useSharedValue(0), particles: useSharedValue(0), frames: useSharedValue(0) },
  };
}

/** Queue a spark burst; the world consumes the queue on its next frame. Works from JS and UI thread. */
export function emitWorld(bridge: WorldBridge, event: WorldEvent) {
  'worklet';
  bridge.events.modify((list) => {
    'worklet';
    list.push(event);
    return list;
  });
}
